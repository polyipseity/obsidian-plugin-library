# AGENTS.md — Agent Playbook for obsidian-plugin-library ✅

## Purpose

This file gives concise, actionable guidance to automated coding agents working in this repo. Follow project-specific rules, run the project's tests and linters, and prefer non-interactive commands that match existing `.github/prompts/*` automation.

## Quick facts (TL;DR)

- Project: TypeScript + Svelte library for Obsidian plugins
- Key dirs: `src/`, `assets/locales/`, `scripts/`, `tests/`, `.github/`
- Common commands:
  - `npm run build` (runs `npm run check` then `node scripts/build.mjs`) — use `node scripts/build.mjs dev` for dev builds
  - `npm run check` (TypeScript + ESLint + markdown + Prettier)
  - `npm test` (runs `vitest run --coverage`)
  - `npm run format` (eslint + prettier + markdown fixes)
- Prefer `pnpm` when managing versions/releases (this repo is pnpm-friendly — `pnpm-lock.yaml` present at workspace root)

## Agent rules (must follow) ⚠️

- Always prefer non-interactive, reproducible commands. Do not ask confirmation questions when using built-in prompts like `commit-staged` or `bump-version` — those prompts are written for agents.
- Do NOT run `vitest` interactively/watch mode. The `vitest` CLI defaults to interactive/watch mode when invoked without the `run` subcommand; agents must always use `vitest run <options>` or append `--run` so tests execute non-interactively.
- Run project checks before making changes: `npm run check` and `npm test` where applicable. If CI/coverage fails, include failing test details in your report.
- Commit messages must conform to Conventional Commits and pass `npm run commitlint`. Use the `commit-staged` prompt to generate and create commits.
- When bumping versions use the repository's preferred manager: `pnpm` if a `pnpm-lock.yaml` exists; otherwise fall back to `npm`.
- Keep changes minimal and scoped. Do not stage unrelated files; stage only files changed by your operation.

TypeScript typing rules (required)

- **Never use `any`.** Prefer `unknown`, explicit interfaces/types, unions, or generics. If you believe `any` is unavoidable, leave a TODO and open an issue instead of committing it.
- **Never use `as` type assertions/casts.** Replace casts with properly-typed APIs, overloads, or type-guard helpers that narrow types at runtime.
- **Make code type-checking friendly.** Add explicit `return` types for public functions/components, annotate exported symbols, prefer narrow unions and discriminated unions, and add small helper types instead of widening to `any`.
- Fix TypeScript errors by improving type declarations — do not silence the checker with `// @ts-ignore` or `as` casts.
- Run `npm run check` after changes and ensure `tsc` (with `strict` settings) passes locally before committing.
- If an ESLint/TS rule is missing to enforce these practices, propose the lint/config update in a separate PR and reference it in your commit message.

## Project-specific patterns & examples 🔧

- Settings & persistence: use `SettingsManager` / `StorageSettingsManager` + `fix()` helpers (see `src/settings.ts`). Persisted settings must be validated using `.fix()` helpers.
- i18n: add keys first in `assets/locales/en/translation.json` and keep interpolation tokens like `{{...}}` and `$t(...)` unchanged (see `.github/instructions/localization.instructions.md`).
- Svelte: components live under `src/components/` and are compiled via `scripts/build.mjs` (uses `esbuild-svelte` + `svelte-preprocess`). For dev builds use `node scripts/build.mjs dev`.
- Tests: follow `tests/README.md` conventions — prefer `vi.fn()` for stubs, `vi.spyOn` for globals, reset/restore mocks in `afterEach` and use `vi.useFakeTimers()` for timer control.

## Build & release tips

- Build process performs `tsc --emitDeclarationOnly` + esbuild bundling (see `scripts/build.mjs`). Ensure declaration files are generated when changing public API.
- Release bumps should update `package.json` and run any version scripts; use the `bump-version` prompt or `pnpm version --no-git-tag-version` when applicable.

## When making changes (PR checklist)

1. Run `npm run check` → `npm test` locally.
2. Add or update unit tests to cover behavior changes.
3. Add i18n keys to `assets/locales/en/translation.json` first (then update other locales if needed).
4. If public API or exports changed, run `npm run build` and verify `.d.ts` outputs are updated.
5. Ensure commit message follows Conventional Commits and passes `npm run commitlint`.

---

## Copilot / assistant quick rules (short & actionable)

Applies to: `src/**/*.ts`, `src/**/*.svelte`, `assets/locales/**/*.json`, `tests/**/*.spec.{ts,js}`, `.github/**`, `README.md`

- Run checks before proposing code changes: `npm run check` and `npm test`.
- TypeScript: **do not** use `any` or `as`; prefer `unknown`, explicit return types and type guards.
- Commits: follow Conventional Commits and use `.github/prompts/commit-staged` for automation.
- i18n: add new keys in `assets/locales/en/translation.json` first; do **not** change `{{...}}` or `$t(...)` tokens.
- Settings/persistence: use `SettingsManager` / `StorageSettingsManager` + `.fix()` helpers for persisted data.
- Tests: run non-interactively with `vitest run --coverage`; follow existing test patterns and reset mocks in `afterEach`.
- Build/API changes: run `npm run build` when changing public exports and verify generated `.d.ts` files.
- Avoid interactive or broad operations in automation: do **not** run `vitest` without `--run`, do **not** use `git add .`, and avoid interactive prompts.

> Follow the PR checklist above and the detailed `.github/instructions/*` files for area-specific rules (TypeScript, i18n, commit messages).

### Example Copilot prompts

- "Write unit tests for `src/settings.ts::SettingsManager.fix()` following existing test styles."
- "Refactor `src/utils.ts` to add explicit return types; do not use `any` or `as`."
- "Add i18n key `components.myPlugin.newFeature` to English and include tests that assert the translation is present."
- "Create a non-interactive Conventional Commit for changes in `src/plugin.ts` using `.github/prompts/commit-staged` and ensure `npm run commitlint` passes."
- "Add unit tests for `src/components/find.svelte` to cover keyboard navigation and initial focus behavior; use `vi.useFakeTimers()` and reset mocks in `afterEach`."
- "Change an exported symbol in `src/index.ts`: update types, run `npm run build`, and add tests validating the public API."

---

## Suggested agent customizations to add next

- `/create-prompt commit-staged` — generate Conventional Commit messages for staged changes (automated, non-interactive). Example: `commit-staged` → produce `feat(settings): add fix() for malformed data` and ensure `commitlint` passes.
- `/create-instruction svelte-tests` — guidance and test templates for Svelte components (applyTo: `src/components/**`). Example: "Add find.svelte keyboard/focus tests using existing test helpers."
- `/create-agent pre-PR-check` — agent that runs `npm run check`, `npm test`, and returns a remediation report with failing tests and lint errors. Example: `pre-PR-check` → list failures and suggested fixes.
- `/create-instruction i18n-check` — validate that new i18n keys are added to `assets/locales/en/translation.json` and covered by tests. Example: `i18n-check components.myPlugin.newFeature` → add English key + test scaffold.

---

## Where to look for more rules

- Commit and lint rules: `.commitlintrc.mjs`, `.github/instructions/commit-message.instructions.md`
- TypeScript coding patterns: `.github/instructions/typescript.instructions.md`
- Localization rules: `.github/instructions/localization.instructions.md`, `.github/instructions/i18n-check.instructions.md`
- Svelte component testing: `.github/instructions/svelte-tests.instructions.md`
- Test best practices: `tests/README.md`

---

If anything in this playbook is unclear or you want me to expand examples (e.g., sample commit message for a particular change), tell me which area to expand and I’ll update this doc. 💡
