import { $ } from "bun";
import {
  EnvClient,
  EnvClientStrategy,
} from "@tahminator/pipeline";


async function main() {
  const envClient = EnvClient.create(EnvClientStrategy.SOPS);
  const ciEnv = await envClient.readFromEnv(".env.ci");
  const {
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
  } = parseCiEnv(ciEnv);

  await $.env({
    ...process.env,
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
  })`./mvnw flyway:migrate -Dflyway.locations=filesystem:db`;
}

function parseCiEnv(ciEnv: Record<string, string>) {
  const DATABASE_NAME = (() => {
    const v = ciEnv["PG_DATABASE"];
    if (!v) {
      throw new Error("Missing PG_DATABASE from .env.ci");
    }
    return v;
  })();

  const DATABASE_HOST = (() => {
    const v = ciEnv["PG_HOST"];
    if (!v) {
      throw new Error("Missing PG_HOST from .env.ci");
    }
    return v;
  })();

  const DATABASE_PORT = (() => {
    const v = ciEnv["PG_PORT"];
    if (!v) {
      throw new Error("Missing PG_PORT from .env.ci");
    }
    return v;
  })();

  const DATABASE_USER = (() => {
    return "patchats-stg-app"
  })();

  const DATABASE_PASSWORD = (() => {
    const v = ciEnv["PG_ROLE_patchats-stg-app"];
    if (!v) {
      throw new Error("Missing PG_PASSWORD from .env.ci");
    }
    return v;
  })();

  return {
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
    env: ciEnv,
  };
}

main()
  .then(() => {
    process.exit();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
