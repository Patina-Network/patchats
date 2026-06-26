import { EnvClient, EnvClientStrategy } from "@tahminator/pipeline";
import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  const { environment } = await yargs(hideBin(process.argv))
    .option("environment", {
      type: "string",
      choices: ["staging", "production"],
      default: "production",
    })
    .option("sha", {
      type: "string",
      description: "Current commit SHA (staging only)",
    })
    .parseAsync();

  const envClient = EnvClient.create(EnvClientStrategy.SOPS);
  const ciEnv = await envClient.readFromEnv("secrets-rw.yaml");
  const {
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
  } = parseCiEnv(ciEnv, environment);

  await $.env({
    ...process.env,
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
  })`./mvnw flyway:migrate -Dflyway.locations=filesystem:db`;
}

function parseCiEnv(ciEnv: Record<string, string>, environment: string) {
  const roleSuffix = environment === "staging" ? "stg" : "prod";

  const DATABASE_NAME = (() => {
    const v = ciEnv["PG_DATABASE"];
    if (!v) {
      throw new Error("Missing PG_DATABASE from secrets-rw.yaml");
    }
    return v;
  })();

  const DATABASE_HOST = (() => {
    const v = ciEnv["PG_HOST"];
    if (!v) {
      throw new Error("Missing PG_HOST from secrets-rw.yaml");
    }
    return v;
  })();

  const DATABASE_PORT = (() => {
    const v = ciEnv["PG_PORT"];
    if (!v) {
      throw new Error("Missing PG_PORT from secrets-rw.yaml");
    }
    return v;
  })();

  const DATABASE_USER = `patchats-${roleSuffix}-app`;

  const DATABASE_PASSWORD = (() => {
    const v = ciEnv[`PG_ROLE_patchats-${roleSuffix}-app`];
    if (!v) {
      throw new Error(
        `Missing PG_ROLE_patchats-${roleSuffix}-app from secrets-rw.yaml`,
      );
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
