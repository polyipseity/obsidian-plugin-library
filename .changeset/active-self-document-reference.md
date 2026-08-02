---
"@polyipseity/obsidian-plugin-library": minor
---

Support `Document` references in `activeSelf`

- Accept a `Document` in addition to `Element` and `UIEvent` as the `reference` argument, resolving the window from the document's `defaultView`
- Guard against a null `ownerDocument` so documents no longer crash when passed as `reference`
