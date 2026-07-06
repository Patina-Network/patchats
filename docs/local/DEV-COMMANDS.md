# Shared

`just dev` - Will run both the backend and frontend development server at the same time.

`just devd` - Will run both the backend and frontend development server at the same time, but the backend will be in debug mode. See `just backend-dev-debug`.

# Database

`just drop` - Will drop your local database's public schema using the credentials provided in `.env`

`just migrate` - Will migrate your local database using the credentials provided in `.env`

# Frontend

`just dev` - Will run both the backend and frontend development server at the same time.

`just frontend-install` - Download any missing frontend dependencies. An alias for `cd js && pnpm i`.

`just frontend-dev` - Will only start the frontend Vite dev server.

`just frontend-test` - Run the entire frontend test suite - linters, autoformatters, typechecking, etc

# Backend

`just backend-install` - Builds and installs Spring backend. An alias for `./mvnw install -DskipTests=true`.

`just backend-dev` - Will only start the backend Spring dev server.

`just backend-dev-debug` - Will only start the backend Spring dev server, but will wait for a JVM debugger to attach to port 5006 first.

`just backend-test` - Run Checkstyle and then the full test suite.

`just backend-testd` - Run Checkstyle and then the full test suite with a debugger

`just backend-spotless` - Runs the backend formatter (currently Spotless with Palantir Java Formatter) and indicates whether or not you need to run the formatter on any files.

`just backend-spotless-fix` - Runs the backend formatter (currently Spotless with Palantir Java Formatter) and will write to any files that have not been formatted yet.
