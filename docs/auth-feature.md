# Auth feature (magic links)

How PatChats signs members in: **magic links only** — no passwords, no OAuth. A user enters their
email, receives a single-use link, and clicking it establishes a server-side session delivered as an
httpOnly cookie.

**Form-first membership.** The sign-up form is the only way a member row is created; magic links
purely sign in **existing** members. Requesting a link for an email with no member row therefore
**fails with 404**, and the login page turns that into a dead-end panel offering the two ways
forward: try another address, or go sign up.

## The shape

```
src/main/java/org/patinanetwork/patchats/auth/
  AuthController.java            POST /api/auth/request-link | verify | logout, GET /api/session
  AuthService.java               request-link + verify orchestration
  TokenGenerator.java            SecureRandom 256-bit raw token + SHA-256 hex digest
  MagicLinkEmailComposer.java    builds the sign-in email via the EmailSender PORT
  RequestLinkRateLimiter.java    Bucket4j: 3/email + 10/IP per 15 min, in-memory buckets
  AuthProperties.java            @ConfigurationProperties("app.auth") → base-url, cookie-secure, magic-link-ttl
  repo/
    MagicLinkTokenRepo.java        JdbcClient; atomic UPDATE..RETURNING consume
  security/
    SecurityConfig.java            filter chains, cookie serializer, CSRF rationale (read its javadoc)
    AuthenticatedMember.java       Serializable session principal (memberId + email)
    ApiAuthenticationEntryPoint.java  401s in the ApiResponder envelope

js/src/features/auth/
  Login.page.tsx                 /login — email → generic "check your email" panel
  Verify.page.tsx                /auth/verify?token=... — POSTs the token once on mount
  api/                           useSession, useRequestLink, useVerifyMagicLink, useLogout, auth.mock.ts
```

## How a login works

1. `POST /api/auth/request-link {email}` — normalizes the email, then rate-limits **visibly**: an
   exhausted budget (3/email + 10/IP per 15 min) returns HTTP 429 with a friendly message, for
   **all** emails alike — the limiter runs before the member-existence check, so the 429 is
   registration-blind and legitimate users know to stop retrying. Keep that ordering: it is also
   what throttles probing. An email with no member row
   then fails with HTTP 404 (`UnregisteredEmailException`). For a
   registered member it stores a **SHA-256 digest** of a
   fresh 256-bit token (raw is never persisted), and emails
   `<app.auth.base-url>/auth/verify?token=<raw>`. Links expire after 15 minutes
   (`app.auth.magic-link-ttl`). Issuing a link **does not** invalidate earlier ones — a member who
   asks for a second link and then clicks the first email still gets in. Every link stands on its own
   until it is used or expires, and the rate limiter is what bounds how many can be outstanding.
2. The link lands on the **frontend** verify page, which POSTs the token. Email scanners only
   prefetch GETs, so they cannot burn the single-use token.
3. `POST /api/auth/verify {token}` — consumes the token atomically
   (`UPDATE .. WHERE consumed_at IS NULL AND expires_at > now RETURNING email`), resolves the
   member (missing member → same generic invalid-link error), and performs a programmatic Spring
   Security login. Spring Session JDBC
   persists the session (`spring_session` tables) and sets the `patchats_session` cookie
   (httpOnly, SameSite=Lax, Secure outside dev, 30-day Max-Age).
4. Sessions expire after 30 days of inactivity (`spring.session.timeout`, sliding) and are purged by
   Spring Session's built-in cleanup job. `POST /api/auth/logout` invalidates the session row.

`GET /api/session` returns the member **fresh from the database** (never stale session state):
`{ id, name, email, isAdmin }`; 401 in the envelope when signed out. The frontend `RequireAuth`
guard sends signed-out visitors to `/login`.

**CSRF.** Double-submit protection (the Spring-documented SPA pattern): every response sets a
JS-readable `XSRF-TOKEN` cookie, and `apiFetch` echoes it back as an `X-XSRF-TOKEN` header on
state-changing requests. The two pre-auth endpoints (`request-link`, `verify`) are exempt — their
only credential travels in the body, and a first-time visitor has no CSRF cookie yet. Details and
rationale live in `SecurityConfig`'s javadoc.

## Manual test walkthrough (dev)

```bash
just migrate   # needs local Postgres; .env points DATABASE_NAME at the patchats DB
just dev       # backend :8080 (dev profile) + frontend :5173
```

1. Create a test member (only needed until the sign-up form is wired to the backend):
   ```bash
   psql -h localhost -U postgres -d patchats -c \
     "INSERT INTO members (id, first_name, last_name, email, introduction, active) \
      VALUES (gen_random_uuid(), 'You', 'Tester', 'you@example.com', 'Testing locally', TRUE);"
   ```
2. Open `http://localhost:5173/login`, submit that email. (An **unregistered** email instead gets a
   404 and the "No account for that email" panel, with a link to `/sign-up`; the backend log shows
   no email composed.)
3. The dev profile does not send real email — `LoggingEmailSender` prints the full body to the
   **backend terminal**. Copy the `http://localhost:5173/auth/verify?token=...` URL from the log.
4. Open it: you land on `/`. Check DevTools → Application → Cookies for `patchats_session`
   (httpOnly, Lax, not Secure in dev).
5. Open the same link again → "invalid or expired" (single-use). Request a **second** link before
   using the first, then open the first: it still signs you in — outstanding links are not
   invalidated by a new one. A 4th rapid request for the same email → the login page shows the 429
   message ("too many sign-in requests"), whether or not the email is registered — an unregistered
   address hits the 429 before the 404, which is the ordering that keeps probing throttled.
6. Log out from the header (visible on guarded pages like `/sample`); guarded routes now redirect
   to `/login`.

## Configuration

| Property                  | Env var              | Default                 | Meaning                                 |
| ------------------------- | -------------------- | ----------------------- | --------------------------------------- |
| `app.auth.base-url`       | `APP_BASE_URL`       | `http://localhost:5173` | Public SPA origin used in emailed links |
| `app.auth.cookie-secure`  | `AUTH_COOKIE_SECURE` | `true` (`false` in dev) | `Secure` flag on the session cookie     |
| `app.auth.magic-link-ttl` | —                    | `15m`                   | Link validity window                    |
| `spring.session.timeout`  | —                    | `30d`                   | Session inactivity timeout              |

Schema lives in Flyway (`db/migration/V0006`–`V0007`); `spring.session.jdbc.initialize-schema` is
`never` so the app never races migrations, and runtime Flyway is disabled (migrations stay
out-of-band via `just migrate`).
