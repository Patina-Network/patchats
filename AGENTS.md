# PatChats — Agent Orientation

PatChats is a web app for managing monthly one-on-one coffee chat pairings for the Patina Network. Users build profiles and are matched with another participant each month.

---

## Repository Layout

```
patchats/
├── src/                        # Java backend (Spring Boot)
│   └── main/java/org/patinanetwork/patchats/
│       └── api/                # REST controllers + security config
├── js/                         # TypeScript frontend (React + Vite)
│   └── src/
│       ├── app/                # Pages, organized by route
│       ├── lib/                # Shared setup: router, theme, query provider
│       └── main.tsx            # App entry point
├── Justfile                    # All common dev commands
├── pom.xml                     # Maven config (backend deps + build)
└── .github/workflows/ci.yml    # CI pipeline
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Java 25 + Spring Boot 3.x |
| Backend build | Maven (`./mvnw`) |
| Database | PostgreSQL + Flyway migrations |
| Data access | Spring JDBC (plain SQL — no ORM) |
| Auth | Spring Security + OAuth2 (no passwords stored) |
| API docs | SpringDoc / OpenAPI → `/v3/api-docs` |
| Frontend language | TypeScript (strict mode) |
| Frontend framework | React 18, functional components + hooks |
| Frontend build | Vite |
| UI components | Mantine 8 |
| Routing | React Router v6 — routes defined in `js/src/lib/router.tsx` |
| Forms + validation | Mantine Form + Zod (define Zod schema first, derive form from it) |
| Frontend pkg manager | pnpm (use `pnpm`, not `npm`) |
| Secrets | SOPS — never commit plaintext secrets |
| Task runner | `just` — run `just` to see all commands |

---

## Key Commands

See `Justfile` at the repo root for all available commands.

---

## Code Conventions

**Backend**
- Controllers live in `src/main/java/.../api/` and are annotated with `@RestController`.
- All responses are wrapped in `ApiResponder<T>`.
- Every schema change requires a Flyway migration in `db/`.
- OpenAPI annotations (`@Operation`, `@Tag`) must be kept current.

**Frontend**
- Pages live under `js/src/app/` named `<Name>.page.tsx`.
- Components for a page go in a `_components/` sibling directory.
- Use Mantine components and `js/src/lib/theme.tsx` for all styling.
- Imports use the `@/` alias for `js/src/`.

**Formatting / Linting (enforced in CI)**
- Backend: Spotless (Palantir Java Format) + Checkstyle (`checkstyle.xml`)
- Frontend: Prettier + ESLint + Stylelint

---

## Secret Management

Secrets are encrypted with [SOPS](https://github.com/getsops/sops) and committed as `secrets-ro.yaml` (read-only) and `secrets-rw.yaml` (read-write). Never commit plaintext secrets.

- `.example.env` documents the environment variables the app expects.
- `.sops.yaml` defines the encryption keys and file patterns.
Local development env vars are loaded via `dotenvx` (see `Justfile` commands).