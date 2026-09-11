import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type DatabaseEnvironment = {
  DATABASE_HOST: string;
  DATABASE_NAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_PORT: string;
  DATABASE_USER: string;
};

export async function migrateDb(
  environment: DatabaseEnvironment,
): Promise<void> {
  await $.env({
    ...process.env,
    ...environment,
  })`./mvnw flyway:migrate -Dflyway.locations=filesystem:db/migration`;
}

async function main(): Promise<void> {
  const { environment } = await yargs(hideBin(process.argv))
    .option("environment", {
      type: "string",
      choices: ["staging", "production"],
      demandOption: true,
    })
    .parseAsync();

  await migrateDb(parseCiEnv(environment));
}

function parseCiEnv(environment: string): DatabaseEnvironment {
  const roleSuffix = environment === "production" ? "prod" : "stg";

  const DATABASE_NAME = `patchats-${roleSuffix}`;

  const DATABASE_HOST = (() => {
    const value = process.env["PG_HOST"];
    if (!value) {
      throw new Error("Missing PG_HOST from platform-infra patchats.yaml");
    }
    return value;
  })();

  const DATABASE_PORT = (() => {
    const value = process.env["PG_PORT"];
    if (!value) {
      throw new Error("Missing PG_PORT from platform-infra patchats.yaml");
    }
    return value;
  })();

  const DATABASE_USER = `patchats-${roleSuffix}-sa`;

  const DATABASE_PASSWORD = (() => {
    const variableName = `PG_ROLE_PATCHATS_${roleSuffix.toUpperCase()}_SA`;
    const value = process.env[variableName];

    if (!value) {
      throw new Error(
        `Missing ${variableName} from platform-infra patchats.yaml`,
      );
    }
    return value;
  })();

  return {
    DATABASE_HOST,
    DATABASE_NAME,
    DATABASE_PASSWORD,
    DATABASE_PORT,
    DATABASE_USER,
  };
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
