---
"@polyipseity/obsidian-plugin-library": patch
---

Keep the caret of a focused text field when `UpdatableUI.newSetting` refreshes. A refresh no longer resets a focused text field to its first-render value, so a callback that relies on that reset must set the value on every call, as `linkSetting` does. (by [@janah01](https://github.com/janah01))
