# Increment 2 — Progress, history & resend APIs

**Prerequisites:** [Increment 1](01-async-send-pipeline.md) (tables, rows, `EmailDrainer`).
**Delivers:** batch state queryable via API + a manual resend path. This is a read/UX-support layer over
Increment 1 — no schema changes. See [00-overview.md](00-overview.md) for full context.

## Decisions that apply here
- **Progress = per-batch summary + per-email list** (#10), scoped by `requestId`.
- **Session model = parent `email_requests` table** (#11) — the history unit.
- **At-most-once** (#9) means `ERROR` rows may include never-sent emails, so a **manual resend** is required.

---

## Endpoints

Add to the email controller; back them with the Increment-1 repositories (add query methods as needed).

### `GET /api/email/progress?requestId={uuid}`
Returns the live state of one batch. One `GROUP BY status` for the counts plus the row list.
```jsonc
{
  "total": 12,
  "pending": 3,
  "processing": 1,
  "sent": 7,
  "error": 1,
  "emails": [
    { "id": "…", "recipients": ["a@x.com", "b@x.com"], "status": "SENT",  "error": null, "sentAt": "…" },
    { "id": "…", "recipients": ["c@x.com"],            "status": "ERROR", "error": "…",  "sentAt": null }
  ]
}
```
`recipients` is derived from `recipient_1` (+ `recipient_2` when non-null). Counts query:
```sql
SELECT status, count(*) FROM emails WHERE request_id = :requestId GROUP BY status;
```

### `GET /api/email/requests`
History list for the sessions tab — one entry per `email_requests` row with aggregated child counts,
newest first.
```sql
SELECT r.id, r.source, r.template_id, r.created_at, r.total_count,
       count(*) FILTER (WHERE e.status = 'SENT')       AS sent,
       count(*) FILTER (WHERE e.status = 'ERROR')      AS error,
       count(*) FILTER (WHERE e.status IN ('PENDING','PROCESSING')) AS in_flight
  FROM email_requests r
  JOIN emails e ON e.request_id = r.id
 GROUP BY r.id
 ORDER BY r.created_at DESC;
```
Return `terminal = (in_flight == 0)` so the frontend knows whether a past session needs polling.
(Consider pagination later; not required for v1 volume.)

### `POST /api/email/{emailId}/resend`
The manual recovery the at-most-once model requires. Flip the row `ERROR → PENDING` (clear `error_message`,
`updated_at = now()`), then call `EmailDrainer.trigger()` so it sends promptly. Reject if the row is not
currently `ERROR` (`409`/`400`).

### `POST /api/email/process` *(optional)*
A convenience "process now" kick that just calls `EmailDrainer.trigger()`. Handy for ops; not required by
the UI.

---

## Files to touch
- **Modify:** the email controller (add the three/four endpoints); Increment-1 repositories (add
  `countByStatus(requestId)`, `findEmailsByRequest(requestId)`, `listRequestsWithCounts()`,
  `markPending(emailId)` query methods).
- **Create:** `dto/EmailProgressResponse`, `dto/EmailRequestSummary`.

## Verification
- **Controller/repository tests:** the aggregate counts match seeded rows; the history list returns sessions
  newest-first with correct counts and `terminal`; `resend` on an `ERROR` row → `PENDING`, then (with a fake
  sender) drains to `SENT`; `resend` on a non-`ERROR` row is rejected.
- **Manual (Postman):** against a batch created in Increment 1, poll `GET /progress?requestId=` and watch
  counts change; call `GET /requests`; force an `ERROR`, `POST /{id}/resend`, and confirm it re-sends.
