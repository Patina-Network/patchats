# Contributing to PatChats

## Commit Message Guidelines

Commit messages use a **domain prefix** format that communicates *where* a change lives at a glance.

### Format

```
<Domain>: <Description>

[optional body]

[optional footers]
```

### Rules

- **Domain** — a short label for the area changed. Prefer starting with a capital letter. Symbols are fine when natural (e.g. `.git`, `v2`, `JS/CSS`).
- **Description** — capitalized, imperative mood. Write what the commit *does*, not what you *did*.
  - ✅ `JS: Add password reset form`
  - ❌ `JS: added password reset form`
- **Subject line** — 72 characters max, no trailing period.
- **Body** (optional) — explain *why*, not *what*. Separate it from the subject with a blank line.
- **Footers** (optional) — structured [git trailers](#footers); see below.

No fixed domain taxonomy — pick whatever makes the change's location obvious to someone scanning the git log.

### Examples

```
JS: Add password reset form
Java: Validate email uniqueness on signup
DB: Add users table migration
CI: Cache pnpm dependencies in workflow
Docs: Document commit message convention
Hooks: Add commit-msg validation hook
Infra: Pin Java version to 25 in pom.xml
JS/CSS: Fix button hover contrast ratio
API/Auth: Restrict admin endpoints to ROLE_ADMIN
```

### Footers

Footers are optional [git trailers](https://git-scm.com/docs/git-interpret-trailers) — `Key: value` lines at the end of the message, after a blank line. Sticking to the trailer format means `git interpret-trailers`, GitHub, and changelog tools can parse them.

| Trailer | Use |
|---|---|
| `Test:` | How the change was verified — `none`, `manual`, `compile`, or `auto` |
| `Refs:` | Link an issue or ticket — `#12`, or a ticket id like `PROJ-123` |
| `Co-authored-by:` | Credit a pair partner or AI assistant — `Name <email>` |
| `BREAKING CHANGE:` | Describe an incompatible change and how to migrate |

Example with body and footers:

```
Java: Validate email uniqueness on signup

Prevents duplicate accounts when two OAuth providers report the same email.

Refs: #42
Test: auto
Co-authored-by: Ada Lovelace <ada@example.com>
```

### Merge strategy & commit hygiene

We **rebase-merge** PRs, so every commit you make lands on `main` as-is. A little hygiene keeps the history readable:

- Keep commits **atomic** — one logical change each.
- Tidy up `wip` / `fix typo` / `address review` commits before merge (`git rebase -i main`, or `git commit --fixup=<sha>` then `git rebase -i --autosquash`).
- Ideally each commit subject follows the convention above — not just the PR title.

### Conventions are advisory

Nothing here is blocking — this repo is a learning playground, and we optimize for development speed.

- The local `commit-msg` hook *warns* at commit time (install via `just install-pre-scripts`).
- CI adds a *non-blocking* check that annotates any PR commits that stray from the convention.

Treat both as friendly nudges: clean history helps everyone learning from it, but a warning will never stop your work.

### Setup

Run:

```sh
just install-pre-scripts
```

This registers the commit message template (so your editor pre-fills it on `git commit`) and points Git at the shared `.githooks` directory. To register just the template manually:

```sh
git config commit.template .gitmessage
```
