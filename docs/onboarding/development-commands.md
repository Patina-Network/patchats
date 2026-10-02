# Development commands

Run these commands from the repository root. Use `just --list` to see the recipes currently
available in the `Justfile`.

## Application

`just dev` - Will run both the backend and frontend development server at the same time.

`just devd` - Will run both development servers, but the backend waits for a JVM debugger on port
`5005`. See `just backend-dev-debug`.

## Database

`just drop` - Will drop your local database's public schema using the credentials provided in `.env`

`just migrate` - Will migrate your local database using the credentials provided in `.env`

## Frontend

`just frontend-install` - Download any missing frontend dependencies. An alias for `cd js && pnpm i`.

`just frontend-dev` - Will only start the frontend Vite dev server.

`just frontend-test` - Run the frontend test suite.

## Backend

`just backend-install` - Builds and installs Spring backend. An alias for `./mvnw install -DskipTests=true`.

`just backend-dev` - Will only start the backend Spring dev server.

`just backend-dev-debug` - Will only start the backend Spring dev server, but will wait for a JVM debugger to attach to port 5005 first.

`just backend-test` - Run Checkstyle and then the full test suite.

`just backend-testd` - Run Checkstyle and then the full test suite with a debugger

`just backend-spotless` - Runs the backend formatter (currently Spotless with Palantir Java Formatter) and indicates whether or not you need to run the formatter on any files.

`just backend-spotless-fix` - Runs the backend formatter (currently Spotless with Palantir Java Formatter) and will write to any files that have not been formatted yet.

## Repository setup and secrets

`just install-pre-scripts` - Configure Git to use the repository's `.githooks` directory.

`just edit <file>` - Decrypt an existing SOPS-managed file in an editor and re-encrypt it when the
editor closes.

`just encrypt <file>` - Encrypt a new secrets file with SOPS. Use `just edit` for files that are
already encrypted.
