# Email feature (backend)

How the backend `email` domain sends transactional email (e.g. monthly pairing notifications).

**What it does.** The frontend POSTs *who* to email plus the *content* — a subject + body
template and the variables to fill in. The backend merges the variables into the templates and
sends the result over SMTP.

**How it's organised.** v1 is **plain-text only**; HTML is planned for later. So the module uses
a **domain-first (package-by-feature)** layout — the same idea as the frontend (see
`js/docs/frontend-structure.md`): one flat `email` package that only splits into sub-packages when
it needs to, with the single external dependency (SMTP) hidden behind a *port* (a Java interface
whose implementation can be swapped).

## The shape

```
src/main/java/org/patinanetwork/patchats/email/
  EmailController.java        POST /api/email/send →              ResponseEntity<ApiResponder<SendEmailResponse>>
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
                                Recipient(String email, Map<String,String> variableToValue)
    SendEmailResponse.java    int sent, int failed, List<MessageResult>
                                MessageResult(List<String> recipients, boolean sent, String error?)

common/web/
  ApiExceptionHandler.java    @RestControllerAdvice: bean-validation errors → ApiResponder.failure (400)
```

The SMTP transport is the only piece that touches the outside world, so it sits behind `EmailSender`. That one seam buys three things: the dev profile swaps in a no-send logging implementation, integration tests inject a fake, and the future HTML switch is confined to the adapter.

## API contract

`POST /api/email/send` — subject and body are templates; substitution runs **once per message**.

### Request
```jsonc
{
  "subject": "...",       // ${} template, required
  "body": "...",          // ${} template, required
  "replyTo": "...",       // optional; the "From" address is set in .env
  "messages": [
    {
      "variables": { ... },        // optional shared vars → referenced un-prefixed, e.g. ${month}
      "recipients": [              // 1 or 2 recipients
        { "email": "...", "variableToValue": { ... } },   // becomes ${rec1.*}
        { "email": "...", "variableToValue": { ... } }    // becomes ${rec2.*}
      ]
    }
  ]
}
```

For full, runnable POST requests see the mock JSON files in [src/test/java/org/patinanetwork/patchats/email/mocks/]. 

### Response

Sending is **best-effort**: one failed message never blocks the others, so the response tells you the outcome of *each* message. 

```jsonc
// 200 OK
{
  "success": true,
  "message": "Sent 2 of 2 emails",   // human-readable summary
  "payload": {
    "sent": 2,                        // how many messages went out
    "failed": 0,                      // how many failed
    "results": [                      // one entry per message, in request order
      { "recipients": ["ann@example.com", "bob@example.com"], "sent": true,  "error": null },
      { "recipients": ["cara@example.com"],                    "sent": false, "error": "..." }
      //                                                        ^ false + a reason if that one failed
    ]
  }
}
```

**Placeholders.** Reference message-level `variables` un-prefixed (`${month}`), recipient vars as `${rec1.*}` / `${rec2.*}`. Behaviour when a key is missing depends on the syntax:

| Placeholder    | If missing |
|----------------|------------|
| `${x}`         | **fails the message** (error names `x`) |
| `${x:default}` | uses `default` |
| `${x:}`        | uses empty string |

A solo message has no `rec2.*`, so any `${rec2.*}` placeholder must use a default or
the message fails.

Invalid requests (bad email, empty `messages`, a message with 0 or >2 recipients, blank
subject/body) are rejected with **400** in the standard `ApiResponder` envelope before anything is
sent.

## Testing the endpoint manually (Postman)

To hit the endpoint locally with a real request:

1. Install the **Postman** extension to the workspace
2. Create a **New HTTP Request**.
3. Set the method to **POST** and the URL to `localhost:8080/api/email/send`.
4. Under **Body**, choose **raw**, then select **JSON** from the format dropdown.
5. Write a request body that matches `SendEmailRequest`
   ([dto/SendEmailRequest.java](../src/main/java/org/patinanetwork/patchats/email/dto/SendEmailRequest.java)).
    or paste a mock JSON in
   [src/test/java/org/patinanetwork/patchats/email/mocks/](../src/test/java/org/patinanetwork/patchats/email/mocks/).
6. Start the app with `just dev` in a terminal (the `dev` profile logs emails instead of sending, so no real SMTP is needed).
7. Press **Send** and check the response payload 
