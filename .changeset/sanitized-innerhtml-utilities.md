---
"@polyipseity/obsidian-plugin-library": minor
---

Add sanitized `innerHTML` utilities

- Add `sanitizeHTML(root, html, config?)` that sanitizes an HTML string with DOMPurify against an explicit window-like root
- Add `setSanitizedInnerHTML(element, html, config?)` that replaces an element's content with the sanitized HTML, parsed via DOMParser from the element's window, and returns the element, for safely rendering descriptions with `escapeValue: false`
