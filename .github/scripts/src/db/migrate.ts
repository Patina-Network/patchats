import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  const { environment } = await yargs(hideBin(process.argv))
    .option("environment", {
      type: "string",
      choices: ["staging", "production"],
      require: true,
    })
    .parseAsync();

  const {
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
  } = parseCiEnv(environment);

  await $.env({
    ...process.env,
    DATABASE_NAME,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
  })`./mvnw flyway:migrate -Dflyway.locations=filesystem:db`;
}

function parseCiEnv(environment: string) {
  const roleSuffix = environment === "staging" ? "stg" : "prod";

  const DATABASE_NAME = (() => {
    return `patchats-${roleSuffix}`;
  })();

  const DATABASE_HOST = (() => {
    const v = process.env["PG_HOST"];
    if (!v) {
      throw new Error("Missing PG_HOST from platform-infra patchats.yaml");
    }
    return v;
  })();

  const DATABASE_PORT = (() => {
    const v = process.env["PG_PORT"];
    if (!v) {
      throw new Error("Missing PG_PORT from platform-infra patchats.yaml");
    }
    return v;
  })();

  const DATABASE_USER = `patchats-${roleSuffix}-sa`;

  const DATABASE_PASSWORD = (() => {
    const v = process.env[`PG_ROLE_PATCHATS_${roleSuffix.toUpperCase()}_SA`];

    if (!v) {
      throw new Error(
        `Missing PG_ROLE_PATCHATS_${roleSuffix.toUpperCase()}_SA from platform-infra patchats.yaml`,
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
