---
"@polyipseity/obsidian-plugin-library": minor
---

Refactor core utilities for maintainability and performance (no public API changes).

Fix source-map generation so stack traces and debugger stepping correctly map back to original TypeScript sources — this resolves incorrect file/line mappings seen during debugging.

Expand and tighten unit tests for plugin discovery and build-time utilities to cover edge cases and prevent regressions.
