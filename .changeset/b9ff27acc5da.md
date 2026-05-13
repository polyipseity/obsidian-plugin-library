---
"@polyipseity/obsidian-plugin-library": minor
---

Enhanced addRibbonIcon API to return element reference and reload callback

- Return object with `elementRef` and `reload` function from addRibbonIcon
- Allows consumers to access the ribbon element and trigger reloads on language changes
- Improves refactor of ribbon function into named function for better maintainability
- Register language change listener that triggers reload to update UI on language changes
