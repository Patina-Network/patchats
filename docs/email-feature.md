# Email feature (backend)

How the backend `email` domain sends transactional email (e.g. monthly pairing notifications).
Read this before touching the feature so new code lands in the right place and keeps the API
contract stable.

The frontend POSTs **who** to email plus the **content** (a subject + body template and the
variables to merge in); the backend interpolates and sends over SMTP. v1 is **plain-text only**;
As of now, the emails are composed of plain-text only. It is intended to implement HTML in 
future emails. To ease this future extension, the email module was developed with a
**domain-first (package-by-feature)** structure. This is similar to the front-end architecture(see `js/docs/frontend-structure.md`): a flat feature package that grows
into sub-packages only when it needs to, with the one external concern (SMTP transport) isolated behind a port.

## The shape

```
src/main/java/org/patinanetwork/patchats/email/
  EmailController.java        POST /api/email/send → ResponseEntity<ApiResponder<SendEmailResponse>>
  EmailService.java           orchestration: per message build vars → render → send → collect results (+ @Slf4j)
  EmailSender.java            PORT: void send(OutgoingEmail email)
  SmtpEmailSender.java        @Profile("!dev") — JavaMailSender + SimpleMailMessage (plain text)
  LoggingEmailSender.java     @Profile("dev")  — renders + logs instead of sending (no real SMTP)
  TemplateRenderer.java       logic-less ${} interpolation (Spring PropertyPlaceholderHelper)
  OutgoingEmail.java          internal record: List<String> to (1–2), subject, body, Optional<String> replyTo
  EmailProperties.java        @ConfigurationProperties("app.email") → from, fromName
  dto/
    SendEmailRequest.java     subject, body, replyTo?, List<Message> messages
                                Message(Map<String,String> variables?, List<Recipient> recipients)  // 1–2
                                Recipient(String email, Map<String,String> variables)
    SendEmailResponse.java    int sent, int failed, List<MessageResult>
                                MessageResult(List<String> recipients, boolean sent, String error?)

common/web/
  ApiExceptionHandler.java    @RestControllerAdvice: bean-validation errors → ApiResponder.failure (400)
```

The SMTP transport is the only piece that touches the outside world, so it sits behind
`EmailSender`. That one seam buys three things: the dev profile swaps in a no-send logging
implementation, integration tests inject a fake, and the future HTML switch is confined to the
adapter.

## Decisions (with rationale)

1. **Domain-first package, flat until it grows.** One `email` package with flat classes + a
   `dto/` sub-package, not a layered `controller/`/`service/`/`repository/` split. Mirrors the
   frontend's domain-first ethos; avoids ceremony for a single endpoint.
2. **`spring-boot-starter-mail` for transport.** Idiomatic Spring Boot: autoconfigures
   `JavaMailSender` from `spring.mail.*`, gives a health indicator, least boilerplate. We drop
   the unused raw `com.sun.mail:jakarta.mail` + `pop3` (pop3 is receive-only) in favour of the
   starter. Wrapped behind `EmailSender` so the domain never imports Spring mail types directly.
3. **Synchronous send (v1).** The request blocks until SMTP completes and returns honest
   `sent`/`failed` results, so the frontend can show real delivery confirmation. The port lets us
   move to `@Async`/outbox later without changing the API. Acceptable because sends are
   admin-triggered and moderate-volume.
4. **Caller-supplied templates.** The client sends the subject + body template strings; there is
   no server-side template registry. Keeps email copy with the people who write it.
5. **Logic-less `${}` interpolation.** Variables are merged with Spring's
   `PropertyPlaceholderHelper` (named-placeholder replacement only). Because templates come from
   the client, a full engine (Thymeleaf/FreeMarker) would be a server-side template injection
   (SSTI) hole — logic-less substitution removes that class of bug, with zero new dependencies.
6. **Messages of 1–2 recipients; per-recipient variables, positional namespace.** A request
   carries `messages[]`; each message is **one email to one or two recipients, both on `To`**.
   Two recipients means a pairing introduction — they *should* see each other and can reply-all.
   Because the two share one rendered body, each recipient's own variables are exposed
   positionally as `${recipient1.*}` / `${recipient2.*}`, alongside an optional message-level
   `variables` map (referenced un-prefixed) for shared values. Capped at 2 (pairings, not lists).
7. **Best-effort, per-message results.** SMTP sends cannot be transactionally rolled back, so one
   failure never aborts the batch. The response reports each message's outcome (`sent` + `error`)
   and totals, letting the frontend retry just the failures.
8. **Minimal validation.** `@NotBlank`/`@Email` plus the structural `@Size(1,2)` on recipients
   and `@NotEmpty` on messages; we lean on `JavaMailSender`'s address parsing + subject encoding
   for baseline header-injection safety. Heavier hardening (explicit CR/LF guards, batch/size
   caps) is deferred — see Future work.
9. **Per-placeholder fallback encoded in the template.** Using the value-separator syntax:
   `${x}` (no default) → that message **fails** if `x` is missing; `${x:default text}` → falls
   back to the default; `${x:}` (empty default) → blanks out. This expresses "required vs.
   optional vs. defaulted" per placeholder without any custom policy engine, and works the same
   for namespaced keys (`${recipient2.linkedIn:N/A}`).
10. **Fixed server `From` + optional `replyTo`.** `From` is a single server-configured, real,
    monitored address (config value), so SPF/DKIM/DMARC stay aligned and the client cannot spoof
    the sender. Callers may set `replyTo` to route replies to a coordinator.
11. **Admin-only.** Sending is an admin action and an abuse magnet, so the endpoint targets the
    admin role (mirrors the frontend `RequireAdmin` guard). See the security note below for the
    current enforcement caveat.
12. **Logs now, audit-table-ready.** v1 records outcomes via `@Slf4j` only. The per-message
    result objects are already shaped like future audit rows, so adding a DB table later is a
    contained change (see Future work).
13. **HTML is future, and isolated.** Plain text now via `SimpleMailMessage`. Adding HTML means a
    `contentType`/`html` field on `OutgoingEmail` and a `MimeMessageHelper` branch inside
    `SmtpEmailSender` — no change to the controller, service, or renderer.

## API contract

`POST /api/email/send` — subject and body are templates; substitution runs **once per message**.

```jsonc
{
  "subject": "You've been paired, ${recipient1.firstName}!",
  "body": "Hi ${recipient1.firstName} and ${recipient2.firstName} — you're paired for ${month}!\nSay hi: ${recipient1.firstName} (${recipient1.linkedIn:N/A}) ↔ ${recipient2.firstName} (${recipient2.linkedIn:N/A}).\n${intro:Looking forward to your chat!}",
  "replyTo": "coordinator@patinanetwork.org",          // optional
  "messages": [
    {                                                   // a pair → ONE email to both, both on To
      "variables": { "month": "July" },                 // shared (message-level), referenced un-prefixed
      "recipients": [
        { "email": "ann@example.com", "variables": { "firstName": "Ann", "linkedIn": "https://linkedin.com/in/ann" } },
        { "email": "bob@example.com", "variables": { "firstName": "Bob" } }   // recipient2.linkedIn → "N/A"
      ]
    },
    {                                                   // a solo notice → ONE email to one recipient
      "recipients": [ { "email": "cara@example.com", "variables": { "firstName": "Cara" } } ]
    }
  ]
}
```

```jsonc
// 200 OK — results are per message, in request order
{ "success": true, "message": "Sent 2 of 2 emails",
  "payload": { "sent": 2, "failed": 0,
    "results": [ { "recipients": ["ann@example.com","bob@example.com"], "sent": true, "error": null },
                 { "recipients": ["cara@example.com"], "sent": true, "error": null } ] } }
```

**Variable resolution per message.** The service builds one merged map: message-level
`variables` un-prefixed, the first recipient's under `recipient1.`, the second's under
`recipient2.`. Then for each placeholder:

| Placeholder | If the key is present | If the key is missing |
|-------------|-----------------------|-----------------------|
| `${x}`            | substitutes the value | **fails the message** (reason names `x`) |
| `${x:default}`    | substitutes the value | substitutes `default` |
| `${x:}`           | substitutes the value | substitutes empty string |

A solo message exposes only `recipient1.*`; any `${recipient2.*}` reference must therefore carry
a default (or use a solo-specific template), otherwise the message fails.

Invalid requests (bad email, empty `messages`, a message with 0 or >2 recipients, blank
subject/body) are rejected with **400** in the standard `ApiResponder` envelope before anything is
sent.

## Security & config

- **Authorization.** The default/production security chain requires the admin role on
  `POST /api/email/**` (`.hasRole("ADMIN")`). ⚠️ Authentication (OAuth2 login / roles) is not yet
  wired, so no `SecurityContext` is populated — the rule therefore **fails closed**: every caller
  is denied until the auth domain authenticates admins. The `dev` profile uses a separate chain
  that permits everything, so local development can exercise the endpoint without auth. Other
  endpoints remain open for now, matching prior behaviour.
- **SMTP config** lives in `application.yml` under `spring.mail.*`
  (host/port/username/password/`properties.mail.smtp.auth`+`starttls.enable`), sourced from
  `${SMTP_*}` environment variables via `spring-dotenv`. Maven resource filtering uses `@@`
  delimiters, so Spring's `${...}` placeholders pass through untouched. Secrets are managed with
  SOPS, never committed in plaintext.
- **Sender identity** is configured under `app.email` (`from`, `from-name`) and bound by
  `EmailProperties`. Use a real, monitored address on a domain authenticated with the SMTP
  provider.
- **Dev/test.** The `dev` profile binds `LoggingEmailSender`, so local development needs no real
  SMTP server. Integration tests use GreenMail (in-process fake SMTP) to assert real MIME output.

## Future work (designed for, not built)

- **HTML emails** — `contentType`/`html` on `OutgoingEmail` + a `MimeMessageHelper` branch in
  `SmtpEmailSender`; renderer and contract unchanged.
- **DB audit table** — a Flyway migration + a recorder fed the existing `MessageResult` objects;
  no change to send logic.
- **Asynchronous / outbox delivery** — move sending off the request thread behind the existing
  `EmailSender` port if volume grows.
- **Rate limiting** — Bucket4j (already a dependency) for per-admin/per-window caps.
- **Hardened validation** — explicit CR/LF & control-char rejection, batch and body-size caps.
- **Frontend** — a `features/email/api/useSendEmail.ts` mutation hook + Zod schema mirroring this
  contract.
