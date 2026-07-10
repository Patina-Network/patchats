import type { Environment } from "@tahminator/pipeline";

import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

process.env.TZ = "America/New_York";

const { environment, dockerUpload, getGhaOutput, githubOutputFile } =
  await yargs(hideBin(process.argv))
    .option("environment", {
      type: "string",
      choices: ["staging", "production"] satisfies Environment[],
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
  const DOCKER_HUB_PAT = process.env.DOCKER_HUB_PAT;

  if (!DOCKER_HUB_PAT) {
    throw new Error("Missing DOCKER_HUB_PAT from platform-infra patchats.yaml");
  }

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
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
