# Local development setup

## Prerequisites

The following general software needs to be installed on your local machine:

1. JDK 25 - OpenJDK, Corretto, or another compatible distribution.
1. `just` - The runner for `Justfiles`, which we use to consolidate our run commands.
1. `dotenvx` - Used to load environment variables from the root `.env` file.
1. Node.js - The JavaScript runtime used by the frontend toolchain.
1. Corepack - Activates the version of `pnpm` pinned in `js/package.json`.
1. PostgreSQL 16 - The local application database.

The repository includes the Maven wrapper (`./mvnw`), so a global Maven installation is not
required. SOPS is only required when you need to edit the encrypted secret files.

## macOS

These instructions use [Homebrew](https://brew.sh/), but you may install the same tools manually.

1. Install `openjdk@25`:

    ```bash
    brew install openjdk@25
    ```

1. Install `node`:

    ```bash
    brew install node
    ```

1. Set up `corepack` using its [installation instructions](https://github.com/nodejs/corepack#readme), then enable the repository-pinned version of `pnpm`:

    ```bash
    corepack enable pnpm
    ```

1. Install `dotenvx`:

    ```bash
    brew install dotenvx/brew/dotenvx
    ```

1. Install `just`:

    ```bash
    brew install just
    ```

## Windows

Install the same prerequisites with WinGet, Scoop, or the official installers. The project commands
in this guide should be run from a shell that provides the expected Unix command-line tools.

## IDE integration

### VS Code

Useful extensions include:

1. **Checkstyle for Java** - Java static analyzer
1. **Prettier** - Javascript formatter
    - Helps maintain consistent styling
    - Configure format on save [following these instructions](https://stackoverflow.com/questions/39494277/how-do-you-format-code-on-save-in-vs-code)
1. **ESLint** - Javascript linter
    - Integrates with your project's ESLint configuration
1. **DotENV** - `.env` file syntax highlighting
1. **Prettier Typescript Errors**: Simplifies complex TypeScript error messages
1. **Extension Pack for Java**
    - Includes debuggers, formatters, and managers
    - Supports format on save
1. **Spring Boot Extension Pack** - Additional Spring Boot-specific tooling
1. **XML by RedHat**
    - Official XML language support and formatter
    - Important for editing Java XML files like pom.xml

[.vscode/](../../.vscode/) defines workspace defaults that help keep development consistent.

### IntelliJ

You need to install the following plugins:

1. **Checkstyle-IDEA** - Java static analyzer

You may also need plugins for TypeScript, Prettier, and ESLint support.

### Neovim

> **NOTE**: This may vary greatly by the current configuration of Neovim, but the following setup _should_ work out the box using `LazyVim`.

You need to install the following plugins:

1. **nvim-jdtls** - LSP for Java in Neovim (Install as a plugin, not `Mason`)
    - `nvim-jdtls` may require some additional configuration. If it helps, my current config can be found [here](https://github.com/tahminator/dotfiles/blob/main/.config/nvim/lua/plugins/jdtls.lua)
1. **none-ls** - Provide a code bridge to formatting & LSP diagonostics. (Specifically used for Checkstyle formatting)
1. **vtsls** - LSP for TypeScript in Neovim (can install through `Mason`)
1. **eslint-lsp** - LSP Protocol for ESLint (can install through `Mason`)
1. **json-lsp** - (Optional) LSP for JSON (can install through `Mason`)
1. **dockerfile-language-server** - (Optional) LSP for Dockerfile (can install through `Mason`)

## Database

## Postgres

We currently use Postgres 16 locally to match production (but some members of the team have used 17 locally with no issues).

### Installation

You can feel free to download Postgres however you want, but the way we have all chose to set it up is with [Postgres.app](https://postgresapp.com) on MacOS.

#### MacOS + Postgres.app

1. Install `postgresapp` through `homebrew` (or the website if you would prefer to do so)

    ```bash
    brew install --cask postgres-unofficial
    ```

2. Open `Postgres.app` and click "Initialize" to create a new server. You are now ready to go!

    > - For `Postgres.app` instances, the password you enter to access the database doesn't matter
    > - On first connection attempt, Postgres.app will prompt you to trust the specific program
    > - After allowing access once, it won't ask again for that program

3. Configure your `$PATH` to use the included command line tools (optional):

    ```bash
    sudo mkdir -p /etc/paths.d &&
    echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp
    ```

#### Other

You may install it with Docker or directly through the
[PostgreSQL downloads page](https://www.postgresql.org/download/).

If you would like to use Docker, I can refer you to Patina's documentation for setting up Docker which you can find [here](https://github.com/arklian/patina/blob/main/docs/postgres-on-docker.md)

### Viewer

You can feel free to use any viewer you want, but we would recommend [DataGrip](https://www.jetbrains.com/datagrip/) which is free for all non-commercial use.


## Secrets

Create a local environment file by copying `.example.env` to `.env`. The example file documents
each value required for local development.

If there is a key specific to an environment (such as `CI` or `staging` environment), please consult the tech docs within the `CI` group.
