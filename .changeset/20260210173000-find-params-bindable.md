---
"@polyipseity/obsidian-plugin-library": major
---

Make the `Find` component's `params` property bindable and add
`initialFocus`, default no-op handlers, Enter-key behavior for searching,
and minor accessibility improvements (aria-live for results). This change
removes the exported functions `setI18n`, `getParamsRef`, and `setResults`.
BREAKING CHANGE: Consumers relying on these exports must migrate to the
new API (bind `params` or manage state externally).
