---
"@polyipseity/obsidian-plugin-library": minor
---

Refactor ListModal preset UI and improve type safety

- Replace dropdown-based preset selection with FuzzySuggestModal for better UX
- Make inputter callback signature optional via refs parameter for alignment UI
- Add helper methods for button creation to reduce code duplication
- Remove unused presetPlaceholder option
- Update tests to match new API signatures
