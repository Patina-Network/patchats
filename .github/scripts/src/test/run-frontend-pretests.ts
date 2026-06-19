import { $ } from "bun";

async function main() {
  await $`pnpm --dir js run typecheck`;

  // fmt
  await $`pnpm --dir js run prettier`;

  // lint
  await $`pnpm --dir js run lint`;

  // compile
  await $`pnpm --dir js run build`;
}

main()
  .then(() => {
    process.exit();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
