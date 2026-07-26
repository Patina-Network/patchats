import { LocalPostgresClient } from "@tahminator/pipeline";
import { $ } from "bun";

async function main() {
  await using pgClient = await LocalPostgresClient.create({
    database: "patchats",
  });

  const { database, host, port, password, user } = pgClient.state;

  await $.env({
    ...process.env,
    DATABASE_HOST: host,
    DATABASE_PORT: String(port),
    DATABASE_NAME: database,
    DATABASE_USER: user,
    DATABASE_PASSWORD: password,
  })`just migrate`;
}

await main();
