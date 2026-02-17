---
name: Agent Guidelines
applyTo: "**/*"
description: Short machine-consumable guidance for automated agents
---

# Agent Guidelines — obsidian-plugin-library 🤖

- Always run `npm run check` and `npm test` before proposing changes.
- Use the `commit-staged` and `bump-version` prompts in `.github/prompts/` for commits and version bumps. These are designed to be non-interactive for automation.
- Ensure commits pass `npm run commitlint` and `husky` hooks. If the commit is rejected, rewrap and retry programmatically.
- Prefer `pnpm` for version bumping when a `pnpm-lock.yaml` is present.
- Do not run `git add .` or other broad staging commands; stage only changed files.
- When making public API changes, update types and run `npm run build` to ensure exported bundles and types are updated.

## Copilot quick rules (short)

- Run `npm run check` and `npm test` before changing code.
- **Do not** use `any` or `as` in TypeScript; prefer `unknown` and type guards.
- Use `.github/prompts/commit-staged` for non-interactive commit creation.
- Add i18n keys to `assets/locales/en/translation.json` first; do not change `{{...}}` or `$t(...)` tokens.

See `AGENTS.md` for the full playbook and additional example prompts. Available prompts: `.github/prompts/commit-staged.prompt.md`.
