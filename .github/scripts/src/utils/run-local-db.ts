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
    console.log("Starting postgres container...");

    await $`docker rm -f ${CONTAINER_NAME}`.quiet().nothrow();

    await $`docker run -d \
      --name ${CONTAINER_NAME} \
      -e POSTGRES_USER=${DB_USER} \
      -e POSTGRES_PASSWORD=${DB_PASSWORD} \
      -e POSTGRES_DB=${DB_NAME} \
      -p ${DB_PORT}:5432 \
      mirror.gcr.io/library/postgres:16-alpine`;

    console.log("Waiting for postgres to become ready...");

    let ready = false;

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
      const check =
        await $`docker exec ${CONTAINER_NAME} pg_isready -U ${DB_USER} -d ${DB_NAME}`
          .quiet()
          .nothrow();

      if (check.exitCode === 0) {
        console.log("Postgres is ready!");
        ready = true;
        break;
      }

      console.log(`Waiting for postgres... (${i}/${MAX_ATTEMPTS})`);
      await Bun.sleep(RETRY_DELAY_MS);
    }

    if (!ready) {
      console.error("Postgres failed to start in time.");
      await end();
      process.exit(1);
    }

    console.log("Postgres started, running migrations...");

    await $.env(env)`./mvnw flyway:migrate -Dflyway.locations=filesystem:./db`;

    console.log("Postgres ready.");

    return env;
  } catch (e) {
    console.error(e);
    await end();
    process.exit(1);
  }
}

async function end() {
  console.log("Stopping and removing postgres container...");

  console.log("=== DB LOGS ===");

  const logs = await $`docker logs ${CONTAINER_NAME}`.quiet().nothrow();

  if (logs.exitCode === 0) {
    logs.stdout
      .toString()
      .split("\n")
      .filter((line) => line.length > 0)
      .forEach((line) => console.log(line));
  } else {
    console.log("No DB logs found.");
  }

  console.log("=== DB LOGS END ===");

  await $`docker stop ${CONTAINER_NAME}`.quiet().nothrow();
  await $`docker rm ${CONTAINER_NAME}`.quiet().nothrow();

  delete process.env.DATABASE_HOST;
  delete process.env.DATABASE_PORT;
  delete process.env.DATABASE_NAME;
  delete process.env.DATABASE_USER;
  delete process.env.DATABASE_PASSWORD;
}

export const db = {
  start,
  end,
};
