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

See `AGENTS.md` for a concise playbook with examples and links to project-specific rules.
