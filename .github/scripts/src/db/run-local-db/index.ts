import { $ } from "bun";

const CONTAINER_NAME = "patchats-db";

const DB_USER = "postgres";
const DB_PASSWORD = "postgres";
const DB_NAME = "patchats";
const DB_PORT = "5440";

const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

type DbEnv = {
  DATABASE_HOST: string;
  DATABASE_PORT: string;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
};

async function start(): Promise<DbEnv> {
  const env: DbEnv = {
    DATABASE_HOST: "localhost",
    DATABASE_PORT: DB_PORT,
    DATABASE_NAME: DB_NAME,
    DATABASE_USER: DB_USER,
    DATABASE_PASSWORD: DB_PASSWORD,
  };

  try {
    console.log("Starting Postgres container...");

    // Remove a leftover container from a previous run.
    await $`docker rm -f ${CONTAINER_NAME}`.quiet().nothrow();

    await $`docker run -d \
      --name ${CONTAINER_NAME} \
      -e POSTGRES_USER=${DB_USER} \
      -e POSTGRES_PASSWORD=${DB_PASSWORD} \
      -e POSTGRES_DB=${DB_NAME} \
      -p ${DB_PORT}:5432 \
      mirror.gcr.io/library/postgres:16-alpine`;

    const ready = await waitForPostgres();

    if (!ready) {
      throw new Error("Postgres failed to start in time.");
    }

    console.log("Postgres started. Running migrations...");

    await $.env({
      ...process.env,
      ...env,
    })`./mvnw flyway:migrate -Dflyway.locations=filesystem:./db`;

    console.log("Postgres is ready.");

    return env;
  } catch (error) {
    console.error("Failed to start Postgres:", error);

    await end();

    throw error;
  }
}

async function waitForPostgres(): Promise<boolean> {
  console.log("Waiting for Postgres to become ready...");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const running =
      await $`docker inspect -f "{{.State.Running}}" ${CONTAINER_NAME}`
        .quiet()
        .nothrow();

    if (running.exitCode !== 0 || running.stdout.toString().trim() !== "true") {
      console.error("Postgres container exited before becoming ready.");
      return false;
    }

    const check =
      await $`docker exec ${CONTAINER_NAME} pg_isready -U ${DB_USER} -d ${DB_NAME}`
        .quiet()
        .nothrow();

    if (check.exitCode === 0) {
      console.log("Postgres is accepting connections.");
      return true;
    }

    console.log(`Waiting for Postgres... (${attempt}/${MAX_ATTEMPTS})`);
    await Bun.sleep(RETRY_DELAY_MS);
  }

  return false;
}

async function end(): Promise<void> {
  console.log("Stopping and removing Postgres container...");

  try {
    await printLogs();
  } finally {
    const stopResult = await $`docker stop ${CONTAINER_NAME}`.quiet().nothrow();

    if (stopResult.exitCode !== 0) {
      console.log("Postgres container was not running.");
    }

    await $`docker rm -f ${CONTAINER_NAME}`.quiet().nothrow();

    delete process.env.DATABASE_HOST;
    delete process.env.DATABASE_PORT;
    delete process.env.DATABASE_NAME;
    delete process.env.DATABASE_USER;
    delete process.env.DATABASE_PASSWORD;
  }
}

async function printLogs(): Promise<void> {
  console.log("=== DB LOGS ===");

  const logs = await $`docker logs ${CONTAINER_NAME}`.quiet().nothrow();

  if (logs.exitCode === 0) {
    const stdout = logs.stdout.toString().trim();
    const stderr = logs.stderr.toString().trim();

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.error(stderr);
    }

    if (!stdout && !stderr) {
      console.log("DB logs are empty.");
    }
  } else {
    console.log("No DB logs found.");
  }

  console.log("=== DB LOGS END ===");
}

export const db = {
  start,
  end,
};
