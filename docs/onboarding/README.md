# Developer onboarding

Welcome to PatChats. This guide is the starting point for getting a local development environment running and making a first contribution. The more detailed guides linked below remain the source of truth for individual tools and workflows.

The onboarding documentation is organized as follows:

1. [Local development setup](./local-development-setup.md)
2. [Development commands](./development-commands.md)
3. [Contribution workflow](./contribution-workflow.md)

## What PatChats does

PatChats manages monthly one-on-one coffee chat pairings for the Patina Network. Members create profiles, choose matching preferences, and receive a new pairing each month. Administrators manage members, matching cycles, and communications.

The application has two main parts:

- A Java 25 and Spring Boot backend in `src/`
- A React, TypeScript, and Vite frontend in `js/`

PostgreSQL stores application and session data. Database changes are managed with Flyway migrations in `db/`.

## Before you begin

Make sure you have access to the team resources used during development:

- The PatChats GitHub repository
- The team's Notion workspace and task board
- The team's Discord channels
- Graphite, if you will create and submit stacked pull requests
- The appropriate SOPS keys if your work requires editing encrypted secrets

Ask a maintainer if you are missing access. Never copy plaintext production or staging secrets into the repository or your local `.env` file.

## 1. Install the development tools

Install the prerequisites listed in the
[local development setup guide](./local-development-setup.md). At minimum, local development
currently requires:

- JDK 25
- Node.js and Corepack
- `just`
- `dotenvx`
- PostgreSQL 16

The repository includes the Maven wrapper, so use `./mvnw` instead of relying on a globally
installed Maven version. The frontend's pnpm version is pinned in `js/package.json`; Corepack will
use that version instead of an independently installed global version.

Confirm the main tools are available:

```bash
java --version
node --version
corepack --version
just --version
dotenvx --version
psql --version
```

## 2. Configure the project

Run the following commands from the repository root.

Create your local environment file:

```bash
cp .example.env .env
```

Update the database values in `.env` to match your local PostgreSQL installation. The development profile logs email content to the backend terminal instead of sending it, so working SMTP credentials are not required for normal local development.

Create the database if it does not already exist:

```bash
createdb patchats
```

Install dependencies and configure the repository's Git hooks:

```bash
./mvnw install -DskipTests
just frontend-install
just install-pre-scripts
```

Apply the database migrations and local seed data:

```bash
just migrate
```

See the [database guide](../../db/README.md) before adding or changing a migration.

## 3. Run PatChats locally

Start the backend and frontend together:

```bash
just dev
```

Once both processes are ready:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8080/api>
- OpenAPI document: <http://localhost:8080/v3/api-docs>
- Swagger UI: <http://localhost:8080/swagger-ui/index.html>

Verify the backend in another terminal:

```bash
curl http://localhost:8080/api
```

For a walkthrough of local passwordless login, including where to find the development magic link, see [Manual test walkthrough](../auth-feature.md#manual-test-walkthrough-dev).

## 4. Run the checks

Before opening a pull request, run both test suites:

```bash
just backend-test
just frontend-test
```

Useful focused commands are documented in
[Development commands](./development-commands.md). The installed pre-commit hook formats and
lints staged Java and frontend files, but it does not replace running the complete test suites.

## 5. Learn where code belongs

Start with these locations:

| Area | Location | Notes |
| --- | --- | --- |
| Backend API | `src/main/java/org/patinanetwork/patchats/api/` | REST controllers, services, security, and related domain code |
| Backend tests | `src/test/java/` | Keep tests aligned with the production package structure |
| Frontend features | `js/src/features/` | Domain-owned pages, components, API hooks, and tests |
| Frontend shell | `js/src/app/` | Router, route guards, layouts, and providers |
| Shared frontend code | `js/src/components/` and `js/src/lib/` | Cross-domain UI and infrastructure |
| Database | `db/migration/` and `db/repeated/` | Production migrations and local-only repeatable seed data |
| Project commands | `Justfile` | Common development, test, migration, and secret-management commands |

Read [Frontend structure and conventions](../../js/docs/frontend-structure.md) before adding frontend pages, hooks, or shared components. Backend API responses use `ApiResponder<T>`, and controllers should keep their OpenAPI annotations current.

## 6. Make a first contribution

Use the team's [contribution workflow](./contribution-workflow.md) for the full task-to-merge
process. In brief:

1. Read the task and clarify its acceptance criteria.
2. Move the task to `In Progress`.
3. Sync from `main` and create a focused branch.
4. Implement the change and add or update tests.
5. Run the backend and frontend checks that apply.
6. Submit the pull request with a clear description and screenshots for visible changes.
7. Address automated checks and reviewer feedback before merging.

Keep pull requests small enough to review comfortably. Do not include unrelated formatting changes, local environment files, generated build output, or plaintext secrets.

## Common setup problems

### The backend cannot connect to PostgreSQL

Confirm PostgreSQL is running, the `patchats` database exists, and the five `DATABASE_*` values in `.env` match your local server. Then rerun `just migrate`.

### The frontend cannot reach the API

Confirm the backend is listening on port `8080`. Vite proxies `/api` requests from port `5173` to the backend, so browser requests should normally use `/api` rather than a hard-coded backend origin.

### A magic-link email never arrives

This is expected in development. The backend prints the rendered email and magic-link URL to its terminal instead of connecting to SMTP.

### A formatting check fails

For backend files, run:

```bash
just backend-spotless-fix
```

For frontend files, run:

```bash
cd js
pnpm run fix
```

## Onboarding completion checklist

- [ ] Required team and repository access is working
- [ ] All development tools report the expected versions
- [ ] `.env` is configured without real shared-environment secrets
- [ ] Database migrations complete successfully
- [ ] The frontend and backend run locally
- [ ] The backend smoke test succeeds
- [ ] Passwordless login has been tested locally
- [ ] Backend and frontend checks pass
- [ ] The code structure and contribution workflow guides have been read
- [ ] A first pull request has been opened or assigned
