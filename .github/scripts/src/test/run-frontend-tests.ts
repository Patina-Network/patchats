import { $ } from "bun";

async function main() {
  await $`pnpm --dir js run vt`;
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
