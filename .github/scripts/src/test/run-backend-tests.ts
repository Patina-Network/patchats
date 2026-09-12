import { LocalPostgresClient } from "@tahminator/pipeline";
import { $ } from "bun";

import { migrateDb } from "../db/index.ts";

async function main() {
  await using pgClient = await LocalPostgresClient.create({
    database: "patchats-ci",
  });

  const { database, host, port, password, user } = pgClient.state;

  const databaseEnvironment = {
    DATABASE_HOST: host,
    DATABASE_NAME: database,
    DATABASE_PASSWORD: password,
    DATABASE_PORT: String(port),
    DATABASE_USER: user,
  };

  await migrateDb(databaseEnvironment);

  await $.env({
    ...process.env,
    ...databaseEnvironment,
  })`./mvnw clean test -Dspring.profiles.active=ci`;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
