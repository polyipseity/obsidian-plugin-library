---
name: i18n key checklist for agents
applyTo: "assets/locales/**/*.json"
description: Non-interactive guidance for adding and validating i18n keys (agents)
---

# i18n-check — agent guidance for translation keys

## Purpose

Ensure new user-facing strings are added safely and validated by tests. This instruction is intended for automated agents and Copilot workflows.

## Steps for agents

1. Add the new key/value pair into `assets/locales/en/translation.json` first.
2. Add or update a unit test under `tests/assets/locales.spec.ts` (or `tests/src/*`) that asserts the key resolves via `language.value.t('your.key')`.
3. Run `npm run check` and `npm test` to ensure the change passes linting and tests.
4. If required, add translations to other locales (copy of English is acceptable for initial PR) and add a short note in PR description.

## Important rules

- **Do not** modify `{{...}}` interpolation tokens or `$t(...)` references inside translation strings.
- Keep translation keys organized and follow existing key namespaces (e.g., `components.*`, `settings.*`).

## Example agent prompt

- "i18n-check components.myPlugin.newFeature — add English key, add test that asserts `language.value.t('components.myPlugin.newFeature')` returns the string, and run the test suite."

## Where to look

- `assets/locales/README.md` for conventions
- `tests/assets/locales.spec.ts` for test examples

If you want, I can add an `i18n-check` instruction to `.github/prompts/` that agents can invoke programmatically.
