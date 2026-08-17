# Async Email Service — Overview

This directory specifies the conversion of the `email` domain from a **synchronous, in-memory** sender
into an **asynchronous transactional-outbox pipeline** with a background runner, a live progress UI, a
history view, and DB-stored templates.

The work is split into **5 sequential vertical-slice increments**, each in its own file. Every increment
is independently shippable and demoable, and **no increment depends on a later one**. Read this overview
first; each increment file is self-contained for implementation and links back here for rationale.

| File | Increment | Delivers | Prerequisites |
|------|-----------|----------|---------------|
| [01-async-send-pipeline.md](01-async-send-pipeline.md) | Async send pipeline (backend core) | Async sending works via API | — |
| [02-progress-history-resend-apis.md](02-progress-history-resend-apis.md) | Progress, history & resend APIs | Batch status queryable + manual resend | Inc 1 |
| [03-async-admin-frontend.md](03-async-admin-frontend.md) | Async admin frontend | User-facing manual send + live progress + history | Inc 1, 2 |
| [04-matching-send-flow.md](04-matching-send-flow.md) | Matching send flow | Pairing notifications end-to-end | Inc 1–3 |
| [05-template-management.md](05-template-management.md) | Template management (create/list/delete + UI) | Self-service template create + delete (no code) | Inc 1 |

---

## Context (why this change)

Today `POST /api/email/send` renders caller-supplied templates and sends each message over SMTP inside a
**request-blocking `for` loop** ([EmailService.java:29](../../src/main/java/org/patinanetwork/patchats/email/EmailService.java)),
returning per-message results. There is **no persistence** for email and **no DAO layer anywhere** in the
codebase. Consequences: the HTTP request blocks for the whole batch, there is no durable record or live
progress, and a crash mid-batch loses everything.

Target design:
- A request **enqueues** rows into Postgres and returns immediately (`202`).
- A single **on-demand runner** (started by a manual/frontend API kick, plus a startup drain) drains the `emails` table, **renders each row from its template**, sends over SMTP, and updates each row's status.
- A **new admin UI** polls the backend for live per-email progress and a history of past sending sessions.
- Templates live in a DB table (**seeded read-only** first, **create/list/delete** in Increment 5; immutable — no edit).
- Recipient/pair data comes from **CSV uploads for now**, behind a swappable port, with a future migration
  to another team's DB.

**Stack:** Spring Boot, Postgres + Flyway, `spring-boot-starter-jdbc` with the fluent **`JdbcClient`**
(Boot 3.2+; **no JPA**), React + Mantine frontend.

---

## Key decisions & tradeoffs (cross-cutting)

Each increment repeats only the rows it needs; this is the full reference.

| # | Decision | Choice | Why / tradeoff accepted |
|---|----------|--------|--------------------------|
| 1 | Queue transport | **DB-as-queue (outbox), no SQS** | Postgres is already the transactional store; single atomic insert, no dual-write. Any future retry logic would be ours (SQS gives it free) — fine since retry is deferred. |
| 2 | `/send` semantics | **New async endpoint, `202` + `{requestId, accepted}`** | Added alongside the existing sync `/send` (kept during migration, retired later). |
| 3 | Row granularity | **One row per message** (1–2 recipients), grouped by `requestId` | Matches current domain; `matchesId` stays 1:1 with a row. |
| 4 | Render timing | **Render at send-time** — the runner renders each row from `template_id` + `template_values` just before sending | Stores only the template ref + variables, not rendered text → smaller rows. Tradeoffs: render errors surface **async** as `ERROR` rows (no `400`); the runner needs the renderer + template lookup; `/preview` must share a render helper with the runner to avoid drift. (Templates are **immutable** — see #15 — so a queued row's template never changes under it.) |
| 5 | Deployment topology | **Strictly single instance** | Simplest claim logic. ⚠️ Deploys must be **stop-then-start** to avoid a transient 2-runner window. |
| 6 | Runner driver | **On-demand executor** (manual/frontend kick → drain loop → idle), **no polling** | Zero steady-state cost for a monthly workload. Coverage from an explicit `POST /api/email/process` kick (issued by the frontend after a send / by ops) plus a startup drain — **no enqueue-time auto-trigger**, no always-on poller. Tradeoff: if the kick is never issued, the batch waits for the next kick or a restart. |
| 7 | Intra-drain processing | **Sequential small batch** (claim ≤50 oldest, send one-at-a-time) | Gentle on SMTP, per-row error handling. Parallel pool is a future upgrade. |
| 8 | Retry policy | **No auto-retry — one attempt → `ERROR`** (deferred) | Avoids re-sending to the same person. Failed rows wait for a deliberate manual resend. |
| 9 | Crash recovery | **On boot: orphaned `PROCESSING` → `ERROR`** (at-most-once) | Guarantees **zero duplicate emails**. Cost: an email that crashed pre-send is stranded as `ERROR`, needs manual resend. |
| 10 | Progress UI | **Per-batch summary + per-email table**, polled live; **history tab** | Poll self-terminates when the batch is terminal. |
| 11 | Session model | **Parent `email_requests` table** | Durable session record; stable count denominator; home for the `source` flag. |
| 12 | Matching | **In scope** (Increment 4) | A **second producer** into the same queue: the manual flow (`source=MANUAL`) is the first writer into the `emails` outbox; matching (`source=MATCHING`) is a second endpoint that fans pairs into messages and calls the **same `EmailEnqueueService.enqueue(...)`**. Reuses the existing queue, runner, tables, and progress UI unchanged — only a new producer endpoint is added; the `source` column distinguishes them. |
| 13 | Match selection | **Explicit selection** (browsable by cycle), interim rows from the **pairings CSV** | DB-read is the future swap. |
| 14 | Pairing email shape | **One email to both partners** (per1/per2, 2 recipients) | Reuses multi-recipient sender; `matchesId` 1:1. |
| 15 | Templates | **DB-stored; seeded read-only (Inc 1) → create / list / delete (Inc 5)**; **immutable — no edit** | Admins add/select/delete without code once Inc 5 lands; to change copy, create a new template. Immutability keeps render-at-send safe — a queued row's template never changes under it. |
| 16 | Template model | **All sends via a selected `templateId`** (`template_id` is load-bearing / `NOT NULL`) | "Add a template" is the escape hatch. Future freeform sends would need rendered-body columns back (a hybrid), since freeform has no template to render at send-time. |
| 17 | Recipient/pair source | **CSV now, behind a swappable `RecipientSource` port**; DB later | Unblocks both flows without the unready DB; future swap is one seam. |
| 18 | Recipient storage | **Two scalar columns** `recipient_1` / `recipient_2` (nullable) | Plain btree indexing + `=`/`LIKE`; maps to per1/per2 (capped at 2). |
| 19 | Persistence API | **`JdbcClient`** (not `JdbcTemplate`) | Fluent, auto-configured; drop to `JdbcTemplate` only for batch inserts. |

---

## Data model (full reference)

The migration lands in **Increment 1** ([details](01-async-send-pipeline.md#1a-data-model)); all three
tables are created together because of the FKs. Summary:

- **`email_templates`** — reusable `${}` subject/body templates. Seeded read-only in Inc 1; CRUD in Inc 5.
- **`email_requests`** — one row per "sending session" (the history-tab unit); carries `source`
  (`MANUAL`/`MATCHING`), `template_id`, `total_count`, `created_at`.
- **`emails`** — one row per message (the outbox): `recipient_1`/`recipient_2`, `reply_to`, `template_id` +
  `template_values` (the runner renders `subject`/`body` from these at send-time — **rendered text is not stored**),
  `status` (`PENDING`|`PROCESSING`|`SENT`|`ERROR`), `error_message`, timestamps.

---

## Deferred (documented, not in these increments)

- **DB-backed recipient/pair source** — swap the CSV `RecipientSource` impl for the other team's DB.
- **Auto-retry with backoff** — re-add `attempt_count` / `next_attempt_at`, a claim eligibility clause, and a
  one-shot `TaskScheduler` re-arm. Intentionally omitted now to avoid any risk of re-sending to the same person.
- **SQS transport** — a future scale lever if volume outgrows DB-as-queue.
- **Multi-instance runner** — `SELECT … FOR UPDATE SKIP LOCKED` or ShedLock leader election.
- **Concurrent send pool** — a bounded, rate-limit-capped executor over the claimed batch.
- **Global ops dashboard** — an always-on monitor across all sends (Inc 3 ships per-batch + history only).
- **Freeform (non-template) sends** — would require adding rendered `subject`/`body` columns back (a hybrid with
  the render-at-send rows), since a freeform email has no template to render at send-time.
- **Storing sent output for audit** — render-at-send does not keep the exact bytes that went out; if a template is
  later edited/deleted, past sends can't be reconstructed. Add rendered columns (or a sent-copy table) if audit needs it.

---

## Cross-cutting notes for implementers

- **External dependency:** the other team's user/pair DB. Isolated behind `RecipientSource` + nullable
  `matches_id`; the CSV→DB swap touches only the source impl.
- **Ops:** production deploys must be **stop-then-start** (single-instance runner assumption).
- **Reuse, don't reinvent:** the SMTP port [EmailSender](../../src/main/java/org/patinanetwork/patchats/email/EmailSender.java),
  the [TemplateRenderer](../../src/main/java/org/patinanetwork/patchats/email/TemplateRenderer.java), and
  `EmailService.mergeVariables` already exist — the pipeline wraps them, it does not replace them.
