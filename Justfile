set shell := ["bash", "-uc"]

# Migrate to local DB
migrate *args:
  dotenvx run -- ./mvnw flyway:migrate -Dflyway.locations=filesystem:./db {{args}}

# Drop local DB
drop *args:
  dotenvx run -- ./mvnw flyway:clean -Dflyway.locations=filesystem:./db -Dflyway.cleanDisabled=false {{args}}

# Run the backend Spring server
backend-dev *args:
  dotenvx run -f .env -- ./mvnw -Dspring-boot.run.profiles=dev spring-boot:run {{args}}

# Run the backend Spring server with an exposed debugger at :5005
backend-dev-debug *args:
  dotenvx run -- ./mvnw \
    -Dspring-boot.run.profiles=dev \
    -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005" \
    spring-boot:run {{args}}

# Builds and installs Spring backend
backend-install *args:
  ./mvnw install -DskipTests=true {{args}}

# Run backend formatter (check only)
backend-spotless *args:
  ./mvnw spotless:check

# Run backend formatter (check & write)
backend-spotless-fix *args:
  ./mvnw spotless:apply

# Run backend linter, formatter, & tests
backend-test *args:
  just backend-spotless && dotenvx run -f .env -- ./mvnw checkstyle:check verify -Dspring.profiles.active=ci {{args}}

# Run backend tests with a debugger
backend-testd *args:
  just backend-spotless && dotenvx run -f .env -- ./mvnw checkstyle:check verify -Dspring.profiles.active=ci -Dmaven.surefire.debug {{args}}

# Run the frontend 
frontend-dev *args:
  cd js && pnpm i && pnpm run dev {{args}}

# Builds and installs frontend packages
frontend-install *args:
  cd js && pnpm i 

# Frontend tests 
frontend-test *args:
  cd js && pnpm run test

## Generate types through OpenAPI
#type-gen *args:
#  cd js && pnpm run generate {{args}}
#
## Run the react-email development server
#email-dev *args:
#  cd email && pnpm i && pnpm email dev --dir emails {{args}}
#
## Generate HTML output of react-email and copy to backend static folder
email-gen *args:
  cd email && bash email.sh {{args}}

# Run the dev servers (backend & frontend)
dev *args:
  #cp internal/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit && 
  npx concurrently "just backend-dev" "just frontend-dev" {{args}}

# Run the dev servers (backend & frontend) but the backend will launch a debugger server.
devd *args:
  npx concurrently "just backend-dev-debug" "just frontend-dev" {{args}}



### Secret management
# sops is a library that handles the encryption and decryption of files (primarily used for secrets).
# Our secrets are encrypted & stored inside of secrets.yaml.
# The reason why our secrets are checked into version control is so we can
# programmatically change them, track & diff them (similar to what we do with regular source code).

# Use if you created a new secret file and need to encrypt it with SOPS
# If you are editing a file that has already been encrypted, see `just edit`
encrypt file *args:
  just install-pre-scripts && sops --encrypt --in-place {{ file }} {{ args }}

# Securely edit any secret file that is encrypted with SOPS
# You can change the editor it will call on by changing the $EDITOR environment variable
# 
# you can choose to set it one time for the scope of the command: `EDITOR="nvim" just edit secrets.yaml`
# or you can put `export EDITOR=nvim` inside of your `~/.zshrc`, then restart your terminal & run: `just edit secrets.yaml`
#
# if you would like to use VSCode, `EDITOR="code --wait"` (You may have to follow this first: https://code.visualstudio.com/docs/setup/mac#_launch-vs-code-from-the-command-line)
edit file *args:
  just install-pre-scripts && sops edit {{ file }} {{ args }}

# Git hooks are installed on almost every command
# so that we don't accidentally add unencrypted secrets to the git history.
install-pre-scripts:
  just install-pre-commit && just install-pre-push

install-pre-commit:
  cp pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

install-pre-push:
  cp pre-commit .git/hooks/pre-push && chmod +x .git/hooks/pre-push
