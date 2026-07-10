import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { backend } from "@/utils/run-backend-instance";
import { db } from "@/utils/run-local-db";

process.env.TZ = "America/New_York";

const { environment, dockerUpload, getGhaOutput, githubOutputFile } =
  await yargs(hideBin(process.argv))
    .option("environment", {
      type: "string",
      choices: ["staging", "production"],
      demandOption: true,
    })
    .option("dockerUpload", {
      type: "boolean",
      default: false,
      demandOption: true,
    })
    .option("getGhaOutput", {
      type: "boolean",
      describe:
        "Enable GitHub Actions output to receive latest built tag version",
      default: false,
    })
    .option("githubOutputFile", {
      type: "string",
      describe: "Path to GITHUB_OUTPUT (passed in automatically in CI)",
      default: process.env.GITHUB_OUTPUT,
    })
    .parseAsync();

const tagPrefix = environment === "staging" ? "staging-" : "";
const serverProfiles = environment === "staging" ? "stg" : "prod";

async function main() {
  const ciEnv = parseCiEnv(environment);

  try {
    const { DOCKER_HUB_PAT } = parseCiEnv(environment);

    await backend.start(ciEnv);

    await $`pnpm --dir js run generate`;

    // copy old tz format from build-image.sh
    const timestamp = new Date()
      .toLocaleString("en-US", {
        timeZone: process.env.TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, "$3.$1.$2-$4.$5.$6");

    const gitSha = (await $`git rev-parse --short HEAD`.text()).trim();

    const tags = [
      `patinanetwork/patchats:${tagPrefix}latest`,
      `patinanetwork/patchats:${tagPrefix}${timestamp}`,
      `patinanetwork/patchats:${tagPrefix}${gitSha}`,
    ];

    console.log("Building image with following tags:");
    tags.forEach((tag) => console.log(tag));

    if (DOCKER_HUB_PAT) {
      console.log("DOCKER_HUB_PAT found");
    } else {
      console.log("DOCKER_HUB_PAT missing or empty");
    }

    const proc = Bun.spawn(
      ["docker", "login", "-u", "patinanetwork", "--password-stdin"],
      {
        stdin: new TextEncoder().encode(DOCKER_HUB_PAT),
        stdout: "inherit",
        stderr: "inherit",
      },
    );

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error("Docker login failed");
    }
    try {
      await $`docker buildx create --use --name patchats-builder`;
    } catch {
      await $`docker buildx use patchats-builder`;
    }

    const buildMode = dockerUpload ? "--push" : "--load";

    const viteStagingArg =
      serverProfiles === "stg" ? ["--build-arg", "VITE_STAGING=true"] : [];

    const tagArgs = tags.flatMap((tag) => ["--tag", tag]);

    await $`docker buildx build ${buildMode} \
              --platform linux/amd64 \
              --file infra/Dockerfile \
              --build-arg SERVER_PROFILES=${serverProfiles} \
              --build-arg COMMIT_SHA=${gitSha} \
              --cache-from=type=gha \
              --cache-to=type=gha,mode=max \
              ${viteStagingArg} \
              ${tagArgs} \
              .`;

    console.log("Image pushed successfully.");

    if (getGhaOutput && githubOutputFile) {
      console.log("Outputting image tag...");
      const w = Bun.file(githubOutputFile).writer();
      await w.write(`tag<<EOF\n${tagPrefix}${gitSha}\nEOF\n`);
      await w.flush();
      await w.end();
    }
  } finally {
    await backend.end();
    await db.end();
  }
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

  const DOCKER_HUB_PAT = (() => {
    const v = process.env[`DOCKER_HUB_PAT`];

    if (!v) {
      throw new Error(
        `Missing DOCKER_HUB_PAT from platform-infra patchats.yaml`,
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
    DOCKER_HUB_PAT,
  };
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
