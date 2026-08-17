# Increment 3 — Async admin frontend

**Prerequisites:** [Increment 1](01-async-send-pipeline.md) (`/send/async`, `/templates`) and
[Increment 2](02-progress-history-resend-apis.md) (`/progress`, `/requests`, `/resend`).
**Delivers:** the full user-facing manual async send experience — select a template, send, watch live
progress, review history, resend failures. See [00-overview.md](00-overview.md) for full context.

All files live under [js/src/features/emails/](../../js/src/features/emails/).

## Decisions that apply here
- **Progress = summary + per-email table**, **polled live**, **self-terminating** (#10).
- **History tab** of past sessions (#11).
- **All sends via a selected `templateId`** (#16) — the compose UI selects a template, not freeform text.
- **CSV is the interim recipient source** (#17) — keep the uploader.

---

## Send flow (rework [EmailAdminPage](../../js/src/features/emails/EmailAdminPage.tsx))

- **Replace** the freeform subject/body inputs with a **template selector** populated from
  `GET /api/email/templates` (read-only list from Increment 1).
- **Keep** [CsvUploader](../../js/src/features/emails/_components/CsvUploader.tsx) as the interim recipient
  source, and [EmailPreviewer](../../js/src/features/emails/_components/EmailPreviewer.tsx) — but preview now
  renders the **selected template** against the CSV rows (the `/preview` call sends a `templateId`).
- On **Send**: `POST /api/email/send/async`, capture the returned `requestId`, and switch the page to the
  **progress view** for that batch.

## API layer (extend [emailAPI.ts](../../js/src/features/emails/api/emailAPI.ts))
Add: `enqueueEmails(body): Promise<{requestId, accepted}>`, `getProgress(requestId)`, `listRequests()`,
`resendEmail(emailId)`, `listTemplates()`. Follow the existing fetch + `ApiResponder` unwrap pattern already
used by `sendToPreviewApi`.

## Progress component (new — e.g. `_components/EmailProgress.tsx`)
- **Summary tiles:** total / pending / processing / sent / error (Mantine cards or a `Group` of badges).
- **Per-email table:** recipients, a status badge (color by status), error message, `sent_at`, and a
  **Resend** button on `ERROR` rows (calls `resendEmail`, which re-queues + triggers a drain).
- **Polling:** every ~2s call `getProgress(requestId)` (use `@tanstack/react-query` `refetchInterval`, or a
  `useEffect` + `setInterval`). **Stop polling when `pending + processing === 0`** (batch terminal).

## History tab (new — e.g. `_components/EmailHistory.tsx`)
- One-shot `GET /api/email/requests` → a table of past sessions (created time, source, template, sent/error
  counts, terminal?).
- Row click drills into that batch's per-email table — **reuse the progress table component**, but do **not**
  poll a terminal batch (fetch once).

**Polling tradeoffs:** short-interval, self-terminating polling is chosen — trivial to build, no server-push
infra, ≤2s staleness, and chatter is bounded because polling stops at terminal state. Rejected SSE (needs a
server event stream) and WebSockets (heaviest infra) as overkill for a monthly admin action.

---

## Files to touch
- **Modify:** [EmailAdminPage.tsx](../../js/src/features/emails/EmailAdminPage.tsx) (template selector +
  view switch), [emailAPI.ts](../../js/src/features/emails/api/emailAPI.ts) (new fns),
  [emailDto.ts](../../js/src/features/emails/dto/emailDto.ts) (progress/request/template types).
- **Create:** `_components/EmailProgress.tsx`, `_components/EmailHistory.tsx`, a shared status-badge helper,
  and a template-selector component.

## Verification
- Load a users CSV, select a seeded template, preview (confirm rendered subject/body), send.
- Watch the progress table update live and **stop polling** once the batch is terminal.
- Confirm the batch appears in the **History** tab with correct counts; open it and see the per-email rows
  without re-polling.
- Force an `ERROR` (dev profile) and confirm the **Resend** button re-queues and the row goes to `SENT`.
