# Increment 4 — Matching send flow

**Prerequisites:** [Increment 1](01-async-send-pipeline.md) (pipeline),
[Increment 2](02-progress-history-resend-apis.md) (progress/history), and
[Increment 3](03-async-admin-frontend.md) (progress UI to reuse).
**Delivers:** pairing notifications end-to-end. This is a **second producer** into the Increment-1 queue —
the runner, tables, and progress UI are reused unchanged. See [00-overview.md](00-overview.md) for full context.

## Decisions that apply here
- **Matching in scope** (#12); **explicit selection**, interim rows from the **pairings CSV** (#13).
- **One email to both partners** (#14) — per match: one `emails` row, 2 recipients (`per1`/`per2`).
- **Render at send-time from `templateId` + `template_values`** (#4, #16). **CSV source behind the port** (#17).

---

## Backend

- **Endpoint:** `POST /api/email/matching/send` — accepts selected pairs (interim: rows parsed from the
  uploaded [pairings-test.csv](../../js/src/features/emails/examples/pairings-test.csv)) plus a `templateId`.
- **Fan-out:** per pair → build one `Message` with **two recipients** (member A = `per1`, member B = `per2`),
  then call the **same `EmailEnqueueService.enqueue(...)`** from Increment 1 with `source=MATCHING`. Each pair
  becomes one `emails` row addressed to both; set `matches_id` if the CSV carries a match id, else null.
- **Variable mapping:** auto-expose per-side fields as `per1.*` / `per2.*` — `name`, `email`, `bio`,
  `industry`, `role`, `topics`, `linkedUrl` — from the pair's CSV columns (see the `Pair`/`User` shapes in
  [emailDto.ts](../../js/src/features/emails/dto/emailDto.ts)); shared vars (e.g. `${period}`) come from the
  request. The merged map is stored as `template_values` (via `EmailService.mergeVariables` at enqueue); the
  runner renders it at send-time (`TemplateRenderer`). A future DB-backed source swaps only the `RecipientSource` impl.
- **Dedup guard:** before enqueuing a pair that has a `matches_id`, check for an existing non-`ERROR` row with
  that `matches_id` and skip/reject it (prevents double-notifying a pair on re-run). Uses `idx_emails_matches`.

## Frontend

- **Match-selection UI** (new component under [js/src/features/emails/](../../js/src/features/emails/)):
  browse the uploaded pairs (scoped by cycle once DB-backed later), with a checkbox per pair.
- **Show each pair's email status** (from `matches_id` lookups) so already-sent pairs are visibly
  disabled/warned — the UI half of the dedup guard.
- **Select → preview → send:** reuse [EmailPreviewer](../../js/src/features/emails/_components/EmailPreviewer.tsx)
  to render a `per1`/`per2` pairing email, then `POST /api/email/matching/send`, then reuse the
  **Increment-3 progress view** for live status.

---

## Files to touch
- **Create (backend):** a matching controller endpoint + a `MatchingSendService` (or a method on the enqueue
  service) that maps pairs → messages; `dto/MatchingSendRequest`.
- **Create (frontend):** a match-selection component; add a `sendMatchingEmails(...)` fn to
  [emailAPI.ts](../../js/src/features/emails/api/emailAPI.ts).
- **Reuse:** `EmailEnqueueService`, `EmailDrainer`, the progress endpoints/UI — unchanged.

## Verification
- Upload the pairings CSV, select a seeded **pairing** template, preview one pair and confirm both partners'
  variables render (`per1.*` and `per2.*`).
- Send; confirm **one email per pair addressed to both** recipients, and watch progress in the reused view.
- Re-select an already-sent pair and confirm the dedup guard blocks it (UI disabled + backend rejects).
