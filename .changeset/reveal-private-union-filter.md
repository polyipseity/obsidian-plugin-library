---
"@polyipseity/obsidian-plugin-library": patch
---

Fix `RevealPrivate`/`revealPrivateFilter` so a union filter element (`X | Y`) is actually matched. Previously `RevealPrivate` distributed a union `T` into its members before the filter was consulted, so even `T = X | Y` never reached the `X | Y` filter element and `settingTabs` members were not revealed. The whole union still matches exactly (individual members `X`/`Y` do not match the `X | Y` element).
