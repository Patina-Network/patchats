# Increment 1 — Async send pipeline (backend core)

**Prerequisites:** none (greenfield). **Delivers:** enqueue an async send and have a background runner
actually deliver it — fully functional and testable via API + dev-profile logging, **no UI yet**.
See [00-overview.md](00-overview.md) for full context and the decision table.

## Decisions that apply here
- **DB-as-queue (outbox), no SQS** (#1) — the `emails` table *is* the queue.
- **Render at send-time** (#4) — store `template_id` + `template_values`; the runner renders `subject`/`body` per
  row just before sending (rendered text is **not** stored).
- **Single instance** (#5) — no row-locking needed; deploys must be **stop-then-start**.
- **On-demand runner, no polling** (#6) — started only by an explicit kick (`POST /api/email/process`, called by
  the frontend after a send / by ops) and by a startup drain. **No auto-trigger on enqueue.**
- **Sequential small batch** (#7) — claim ≤50, send one-at-a-time.
- **No auto-retry** (#8) — a failed send → terminal `ERROR`.
- **At-most-once crash recovery** (#9) — orphaned `PROCESSING` → `ERROR` on boot.
- **All sends via a `templateId`** (#16); templates **seeded read-only** here (#15).
- **`JdbcClient`, not `JdbcTemplate`** (#19). **Two scalar recipient columns** (#18).

---

## 1a. Data model — `db/migration/V0004__Create_email_tables.sql`

All three tables are created here (the FKs require it). `email_templates` is **seeded and read-only** until
Increment 5. Follow the existing style in [db/migration/](../../db/migration/) (`UUID` PKs, `TIMESTAMPTZ`,
named FK constraints).

```sql
CREATE TABLE IF NOT EXISTS "email_templates" (
    id         UUID PRIMARY KEY,
    name       TEXT UNIQUE NOT NULL,
    subject    TEXT NOT NULL,                              -- ${} template
    body       TEXT NOT NULL,                              -- ${} template
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "email_requests" (
    id           UUID PRIMARY KEY,                         -- requestId
    label        TEXT,
    sender_email TEXT,
    source       TEXT NOT NULL,                            -- 'MANUAL' | 'MATCHING'
    template_id  UUID,
    total_count  INT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_request_template FOREIGN KEY (template_id) REFERENCES email_templates(id)
);

CREATE TABLE IF NOT EXISTS "emails" (
    id              UUID PRIMARY KEY,                       -- emailId
    request_id      UUID NOT NULL,
    matches_id      UUID,                                   -- nullable; future FK to matches
    recipient_1     TEXT NOT NULL,                          -- per1 (always present)
    recipient_2     TEXT,                                   -- per2; NULL for a solo email, set for a pair
    reply_to        TEXT,
    template_id     UUID NOT NULL,                          -- load-bearing: runner renders subject/body from this
    template_values JSONB NOT NULL,                         -- variables merged into the template at send-time
    status          TEXT NOT NULL DEFAULT 'PENDING',        -- PENDING | PROCESSING | SENT | ERROR
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,
    CONSTRAINT fk_email_request  FOREIGN KEY (request_id)  REFERENCES email_requests(id),
    CONSTRAINT fk_email_template FOREIGN KEY (template_id) REFERENCES email_templates(id)
);

CREATE INDEX IF NOT EXISTS idx_emails_status_created ON emails (status, created_at);                          -- claim query
CREATE INDEX IF NOT EXISTS idx_emails_request        ON emails (request_id);                                 -- progress (Inc 2)
CREATE INDEX IF NOT EXISTS idx_emails_matches        ON emails (matches_id);                                 -- dedup (Inc 4)
CREATE INDEX IF NOT EXISTS idx_emails_recipient_1    ON emails (recipient_1);
CREATE INDEX IF NOT EXISTS idx_emails_recipient_2    ON emails (recipient_2) WHERE recipient_2 IS NOT NULL;   -- partial
```

Also **seed ≥1 template** in the migration (include a pairing template for Increment 4).
Recipient search later: `WHERE recipient_1 = :x OR recipient_2 = :x`; solo emails: `recipient_2 IS NULL`.

## 1b. Persistence (net-new — first DAOs in the repo)

Use Spring's fluent **`JdbcClient`** (auto-configured; inject directly — do **not** use `JdbcTemplate`
except where noted). Create `@Repository` classes:

- `EmailRepo` — insert children, claim batch, update status per row, boot reset.
- `EmailRequestRepo` — insert the parent session row.
- `EmailTemplateRepo` — **read/list only** here (`findById`, `findAll`); writes arrive in Increment 5.

Pattern:
```java
jdbcClient.sql("SELECT * FROM email_templates WHERE id = :id")
          .param("id", id)
          .query(new EmailTemplateRowMapper())
          .optional();
```
Map `JSONB` (`template_values`) ↔ Java via a small Jackson helper. For the **N-child batch insert**, drop to
the underlying `JdbcTemplate.batchUpdate(...)` (JdbcClient has no batch API yet) — inject `JdbcTemplate`
only in `EmailRepo` for that one method.

## 1c. Enqueue path (producer)

- **DTO** `EnqueueEmailRequest { UUID templateId, String source, String replyTo?, List<Message> messages }`,
  where each `Message` carries recipients + variable maps (built by the frontend from CSV; later the DB).
  Reuse the shape of the existing
  [SendEmailRequest.Message/Recipient](../../src/main/java/org/patinanetwork/patchats/email/dto/SendEmailRequest.java).
- **`EmailEnqueueService.enqueue(request)`** — in **one `@Transactional` method**:
  1. Validate `templateId` exists (`EmailTemplateRepo.findById`; `400` if unknown). **Do not render here.**
  2. Per message: build the variable map with
     [`EmailService.mergeVariables`](../../src/main/java/org/patinanetwork/patchats/email/EmailService.java:83)
     (no rendering).
  3. Insert one `email_requests` row (`total_count = messages.size()`) + N `emails` rows (`status='PENDING'`,
     `recipient_1`/`recipient_2` from the message, `template_id`, `template_values` = the merged map). Rendering
     happens later, in the runner (1e).
  - **The service does not start the runner.** After the `202` returns (transaction committed), the **caller**
    kicks the drain via `POST /api/email/process` (see below). This is the "manual/frontend kick only" model (#6).
- *(Optional)* dry-run render at enqueue for **early validation only** — reject a template that can't render up
  front. Only the *values* are stored, never the output. Skip it for the minimal path; otherwise render errors
  surface asynchronously as `ERROR` rows.
- **Endpoints** (new `EmailAsyncController` or extend the existing controller):
  - `POST /api/email/send/async` → `enqueue(...)` with `source=MANUAL` → **`202 Accepted`** `{ requestId, accepted }`.
  - `POST /api/email/process` → `EmailDrainer.trigger()`. **This is the primary way sending starts** — the
    frontend calls it right after a `202` (the enqueue tx has committed by then, so there is no visibility race),
    and ops can call it manually. Returns `202`/`200` immediately (the drain runs on the executor thread).
  - `GET /api/email/templates` → read-only list (so seeded templates are usable + verifiable now).
- **Update `/preview`** in
  [EmailController](../../src/main/java/org/patinanetwork/patchats/email/EmailController.java) to accept a
  `templateId`, load the template + render via a **shared render helper that the runner (1e) also calls** — so
  preview matches what the runner will actually send. (This shared helper is the guard against preview/runner
  drift; do not duplicate render logic.) Keep the existing sync `/send` untouched for now.

## 1d. Recipient/pair source port

Define `interface RecipientSource` and a CSV-backed implementation for v1. In practice the frontend already
parses CSV ([parseCSV.ts](../../js/src/features/emails/api/parseCSV.ts)) and posts structured messages, so the
"port" is mostly the request-DTO shape plus a clear seam; the point is that a future `DbRecipientSource`
(reading `members`/`matches`) is a **one-file swap**. Keep `matches_id` optional until then.

## 1e. Runner (`EmailDrainer`) — on-demand kick, no polling

- **Bean:** a single-thread `ThreadPoolTaskExecutor` named `emailDrainExecutor` (core=max=1 so drains
  serialize and overlapping triggers coalesce), configured with `setWaitForTasksToCompleteOnShutdown(true)`
  + an await timeout. `@EnableAsync` is already present on
  [PatChatsApplication](../../src/main/java/org/patinanetwork/patchats/PatChatsApplication.java); **no**
  `@EnableScheduling` / `TaskScheduler` is needed (there are no timed retries).
- **`EmailDrainer.trigger()`** submits a drain job to `emailDrainExecutor` **only if one isn't already
  running** — guard with an `AtomicBoolean` via `compareAndSet`; if `trigger()` fires while a drain is
  running, set a `rerun` flag so the current drain loops again instead of exiting.
- **Triggers (the only things that start a runner):**
  1. **Explicit kick** — `POST /api/email/process` calls `trigger()`. The frontend issues it right after a send's
     `202` (and after a resend); ops can call it manually. Because it happens after the request's transaction has
     committed, the rows are already visible — no `AFTER_COMMIT` event is needed. **There is no automatic
     enqueue-time trigger** (the accepted tradeoff of #6: if the kick is never issued, the batch waits for the next
     kick or a restart).
- **Drain job** (runs on the executor thread, loops until no rows, then the thread idles):
  1. **Claim** up to 50 `PENDING` rows atomically:
     ```sql
     UPDATE emails SET status='PROCESSING', updated_at=now()
      WHERE id IN (SELECT id FROM emails WHERE status='PENDING' ORDER BY created_at LIMIT 50)
     RETURNING *;
     ```
  2. For each claimed row **sequentially**: load its template (`template_id`) and **render** `subject`/`body`
     from `template_values` via the shared render helper (the same one `/preview` uses —
     [`TemplateRenderer`](../../src/main/java/org/patinanetwork/patchats/email/TemplateRenderer.java)); then build
     `OutgoingEmail([recipient_1(, recipient_2)], subject, body, replyTo)` (drop a null `recipient_2`) and call
     [`EmailSender.send`](../../src/main/java/org/patinanetwork/patchats/email/EmailSender.java). On success →
     `status='SENT'`, `sent_at=now()` (**commit per row** — keeps any duplicate window to ≤1 email). On failure —
     including a **render failure** (template edited into an invalid state, missing variable) — → `status='ERROR'`,
     `error_message=ex.getMessage()` (**no retry**). *(Cache templates per drain to avoid reloading the same one
     for every row in a batch.)*
  3. Re-claim; when a claim returns 0 rows, stop (honor the `rerun` flag if set).

**Runner tradeoffs:** on-demand kick (manual/frontend API request) + single-instance + sequential is chosen
for zero idle cost. Rejected: `@Scheduled` (always-on timer for a monthly job), an **AFTER_COMMIT
enqueue-time auto-trigger** (couples sending to the enqueue transaction and needs an extra event class — the
explicit kick keeps the frontend in control and the rows are already committed by the time it fires), raw
`Thread` (reimplements lifecycle), SQS (extra infra, dual source of truth). Accepted tradeoff: if the kick is
never issued, the batch waits for the next kick or a restart (the startup drain is the safety net).
Future upgrades don't disturb the claim logic: a concurrent rate-limited pool for throughput; `SKIP LOCKED`
or ShedLock for multi-instance.

---

## Files to touch
- **Create:** `db/migration/V0004__Create_email_tables.sql`; `email/` — `EmailRepo`,
  `EmailRequestRepo`, `EmailTemplateRepo`, row mappers, a Jackson JSONB helper;
  `EmailEnqueueService`, `dto/EnqueueEmailRequest`, `dto/EnqueueEmailResponse`; `RecipientSource` (+ CSV impl);
  a shared render helper (wrapping `TemplateRenderer`, used by both `/preview` and the runner);
  `EmailDrainer` (depends on `EmailTemplateRepo` + the render helper + `EmailSender`),
  an executor config `@Configuration`.
- **Modify:** [EmailController](../../src/main/java/org/patinanetwork/patchats/email/EmailController.java)
  (add `/send/async`, `/templates` list, update `/preview`).

## Verification
- **Unit** (fake `EmailSender`, like
  [EmailServiceTest](../../src/test/java/org/patinanetwork/patchats/email/EmailServiceTest.java)):
  - `EmailEnqueueServiceTest` — enqueue stores `template_id` + `template_values` (no rendered output); an unknown
    `templateId` → `400`; one parent + N children inserted in a single transaction.
  - `EmailDrainerTest` — claims ≤50; **renders each row from its template** then `SENT` on success; a **send or
    render** failure → terminal `ERROR` with **no** re-attempt; boot listener resets `PROCESSING → ERROR`;
    overlapping `trigger()` calls coalesce to one drain.
- **Repository/integration** — Testcontainers or local Postgres ([db/README.md](../../db/README.md)) to run
  the `V0004` migration and exercise the claim `UPDATE … RETURNING`.
- **End-to-end** — with the dev profile (logs instead of sending —
  [LoggingEmailSender](../../src/main/java/org/patinanetwork/patchats/email/LoggingEmailSender.java)):
  `just dev`, `POST /api/email/send/async`, confirm `202 {requestId}` and rows move `PENDING→PROCESSING→SENT`
  in the logs; force a send failure to confirm straight-to-`ERROR`; restart mid-batch to confirm the boot
  reset takes `PROCESSING→ERROR`.
