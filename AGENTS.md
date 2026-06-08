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
│   ├── docs/frontend-structure.md  # Frontend folder structure & conventions (READ THIS)
│   └── src/
│       ├── app/                # App shell: router, guards, layouts, providers
│       ├── features/           # Domains — one folder per bounded context (pages + api + tests)
│       ├── components/         # App-shared UI primitives
│       ├── lib/                # App-shared infra: api client, query, test utils
│       └── main.tsx            # App entry point
├── Justfile                    # All common dev commands
├── pom.xml                     # Maven config (backend deps + build)
└── .github/workflows/ci.yml    # CI pipeline
```

---

## Tech Stack

| Layer                | Technology                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| Backend language     | Java 25 + Spring Boot 3.x                                              |
| Backend build        | Maven (`./mvnw`)                                                       |
| Database             | PostgreSQL + Flyway migrations                                         |
| Data access          | Spring JDBC (plain SQL — no ORM)                                       |
| Auth                 | Spring Security + OAuth2 (no passwords stored)                         |
| API docs             | SpringDoc / OpenAPI → `/v3/api-docs`                                   |
| Frontend language    | TypeScript (strict mode)                                               |
| Frontend framework   | React 18, functional components + hooks                                |
| Frontend build       | Vite                                                                   |
| UI components        | Mantine 8                                                              |
| Routing              | React Router v6 — central route tree in `js/src/app/router/router.tsx` |
| Forms + validation   | Mantine Form + Zod (define Zod schema first, derive form from it)      |
| Frontend pkg manager | pnpm (use `pnpm`, not `npm`)                                           |
| Secrets              | SOPS — never commit plaintext secrets                                  |
| Task runner          | `just` — run `just` to see all commands                                |

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

**Frontend** — see `js/docs/frontend-structure.md` for the full structure + conventions.

- Domain-first: feature code lives under `js/src/features/<domain>/`; pages are `<Name>.page.tsx`.
- Permissions live in the router (guards + layouts), not the folder tree.
- Data hooks are domain-owned (`features/<domain>/api/`); generated types + client live in `js/src/lib/api/`.
- Use Mantine components and `js/src/app/providers/theme.tsx` for styling.
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
