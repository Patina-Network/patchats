import { GitHubClient, Utils, type Environment } from "@tahminator/pipeline";
import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const { environment } = await yargs(hideBin(process.argv))
  .option("environment", {
    choices: ["staging", "production"] satisfies Environment[],
    describe: "Deployment environment (staging or production)",
    demandOption: true,
  })
  .strict()
  .parse();

async function main() {
  const githubAppAppId = process.env._GITHUB_APP_APP_ID;
  const githubAppInstallationId = process.env._GITHUB_APP_INSTALLATION_ID;
  const githubAppPrivateKeyB64 = process.env._GITHUB_APP_PEM_CONTENT;

  if (!githubAppAppId) {
    throw new Error("Missing _GITHUB_APP_APP_ID from process env");
  }
  if (!githubAppInstallationId) {
    throw new Error("Missing _GITHUB_APP_INSTALLATION_ID from process env");
  }
  if (!githubAppPrivateKeyB64) {
    throw new Error("Missing _GITHUB_APP_PEM_CONTENT from process env");
  }

  const ghClient = await GitHubClient.createWithGithubAppToken({
    appId: githubAppAppId,
    installationId: githubAppInstallationId,
    privateKey: await Utils.decodeBase64EncodedString(githubAppPrivateKeyB64),
  });

  const gitSha = (await $`git rev-parse --short HEAD`.text()).trim();

  if (environment === "production") {
    await ghClient.updateK8sTagWithPR({
      manifestRepo: ["Patina-Network", "k8s-manifest"],
      originRepo: ["Patina-Network", "patchats"],
      kustomizationFilePath: "base/production/patchats/kustomization.yaml",
      imageName: "Patina-Network/patchats",
      newTag: gitSha,
      environment: "production",
    });
  }

  if (environment === "staging") {
    await ghClient.updateK8sTagWithPR({
      manifestRepo: ["Patina-Network", "k8s-manifest"],
      originRepo: ["Patina-Network", "patchats"],
      kustomizationFilePath: "base/staging/patchats/kustomization.yaml",
      imageName: "Patina-Network/patchats",
      newTag: `staging-${gitSha}`,
      environment: "staging",
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
