---
"@polyipseity/obsidian-plugin-library": patch
---

Fix source-map generation for numeric template expressions

- Wrap numeric expressions in template strings with `String()` so generated
  source maps map correctly back to original sources
