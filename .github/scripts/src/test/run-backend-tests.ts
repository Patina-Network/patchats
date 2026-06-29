import { $ } from "bun";

async function main() {
  await $`./mvnw clean verify -Dspring.profiles.active=ci`;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
