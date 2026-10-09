import { DockerClient, GitHubClient, type Environment } from "@tahminator/pipeline";
import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

process.env.TZ = "America/New_York";

const { environment, getGhaOutput, githubOutputFile, dockerFileName, arch } = await yargs(
  hideBin(process.argv),
)
  .option("environment", {
    choices: ["staging", "production"] satisfies Environment[],
    describe: "Deployment environment (staging or production)",
    demandOption: true,
  })
  .option("getGhaOutput", {
    type: "boolean",
    describe: "Enable GitHub Actions output to receive latest built tag version",
    default: false,
  })
  .option("githubOutputFile", {
    type: "string",
    describe: "Path to GITHUB_OUTPUT (this will be passed in automatically in CI)",
    default: process.env.GITHUB_OUTPUT,
  })
  .option("dockerFileName", {
    type: "string",
    default: "Dockerfile",
  })
  .option("arch", {
    choices: ["amd64", "arm64"] as const,
    describe: "Docker build architecture",
    default: "amd64" as const,
  })
  .strict()
  .parse();

const dockerRepository = arch === "arm64" ? "patchats-arm" : "patchats";
const platforms = [`linux/${arch}`];

async function main() {
  const DOCKER_HUB_PAT = process.env.DOCKER_HUB_PAT;

  if (!DOCKER_HUB_PAT) {
    throw new Error("Missing DOCKER_HUB_PAT from platform-infra patchats.yaml");
  }

  const ghClient = await GitHubClient.createWithDefaultCiToken();
  await using dockerClient = await DockerClient.create("patinanetwork", DOCKER_HUB_PAT);

  const tagPrefix = environment === "staging" ? "staging-" : "";

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

  await dockerClient.buildImage({
    dockerRepository,
    dockerFileLocation: `infra/${dockerFileName}`,
    tags: [`${tagPrefix}${timestamp}`, `${tagPrefix}${gitSha}`],
    platforms,
  });

  if (getGhaOutput) {
    await ghClient.outputToGithubOutput({
      overrideGithubOutputFile: githubOutputFile ? githubOutputFile : undefined,
      ctx: {
        tag: `${tagPrefix}${gitSha}`,
      },
    });
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
