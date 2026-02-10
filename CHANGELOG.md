# @polyipseity/obsidian-plugin-library <!-- markdownlint-disable-file MD024 -->

## 1.34.0

### Minor Changes

- Make the `Find` component's `params` property bindable and add
  `initialFocus`, default no-op handlers, Enter-key behavior for searching,
  and minor accessibility improvements (aria-live for results). This change
  removes the exported functions `setI18n`, `getParamsRef`, and `setResults`.

  **BREAKING CHANGE:** Consumers relying on these exports must migrate to the
  new API (bind `params` or manage state externally).

## 1.33.1

- 64a1faf: Bump dependencies and devDependencies for `obsidian-plugin-library`.

  This changeset records a patch release to reflect dependency updates.

## 1.33.0

### Minor Changes

- 9cd9979: Remove `dynamicWidth` and `makeModalDynamicWidth`.

## 1.32.0

### Minor Changes

- c885124: Fix significant typos.

### Patch Changes

- 6126321: Update `translation.json`. ([GH#4](https://github.com/polyipseity/obsidian-plugin-library/pull/4) by [@cuberwu](https://github.com/cuberwu))
- 63ef697: Fix anchor links in `DocumentationMarkdownView`.

## 1.31.0

### Minor Changes

- bd358df: Add `getDefaultSuggestModalInstructions`.

## 1.30.0

### Minor Changes

- d22bbc4: Expand private typings in `obsidian.ts`.
- b3b6a5f: Add `newHotkeyListener`.

## 1.29.0

### Minor Changes

- 03d5186: Make `Rules.parse` report regex syntax errors.
- f235c5a: Rename `sources/` to `src/`.
- 44afd13: Fix typo in `SettingRules` property names.

## 1.28.0

### Minor Changes

- 94eb4f6: Add `focused` prop to `FindComponent`.

### Patch Changes

- 2c1fb18: Fix missing icon for `FindComponent`.

## 1.27.0

### Minor Changes

- d10b20a: Migrate `FindComponent` to Svelte 5.

## 1.26.0

### Minor Changes

- e34687b: Update Obsidian API to 1.4.11
- 8979742: Migrate to Svelte 5
- e4c0bfa: Remove `esbuild-compress` (available as an separate package)
- c66189d: Remove `destroyWithOutro`
- 26d57a2: Add `toJSONOrString`

### Patch Changes

- 01de23e: Update dependencies

## 1.25.1

### Patch Changes

- f25927f: Add `@capacitor/core` to fix bundling issues.

## 1.25.0

### Minor Changes

- 6a6b55b: Change `$FileSystem.open` to use feature detection instead.

### Patch Changes

- 8a725f7: Fix `build.mjs`. See <https://github.com/nodejs/node/issues/52554>.
- efc2ffc: Fix misdetecting iPadOS as Mac.

## 1.24.0

### Minor Changes

- 33bf954: Make `onMutate` compare objects deeply when deciding to trigger the callback.

### Patch Changes

- 88b03ba: Fix `multireplace` not working.

## 1.23.2

### Patch Changes

- 02db249: Rerelease. Might have screwed up the v1.12.1.

## 1.23.1

### Patch Changes

- bdee81a: Make `asyncDebounce` accept any debounced-like functions.

## 1.23.0

### Minor Changes

- 8a7c931: Fix Svelte components not applying styles due to unescaped CSS identifiers. The CSS identifiers have been changed slightly.

## 1.22.0

### Minor Changes

- 98c96c5: Add `@__PURE__` comments and disable minification to preserve them.

## 1.21.0

### Minor Changes

- ab5a83c: Replace some `Record`s with `Map`s. (<https://2ality.com/2012/01/objects-as-maps.html>)
- 19084bc: Create `AbstractSettingsManager` and `LocalSettingsManager` in `settings.ts`.
- c0a3261: Use `localStorage` when storing temporary settings.

### Patch Changes

- 0f80187: Create `AbstractSettingsManager.fix` and `SettingsManager.fix`.

## 1.20.0

### Minor Changes

- e164adb: Modify function `patchPlugin` to handle cleanup properly.

## 1.19.0

### Minor Changes

- 1d421bd: Create function `patchPlugin`.

## 1.18.1

### Patch Changes

- 86683c9: Change `MAX_LOCK_PENDING` to `Infinity`.
- 6621cd6: Fix active `Window` detection in `registerSettingsCommands`.

## 1.18.0

### Minor Changes

- eb214f6: Revert "Add new platforms: `desktop`, `mobile`".

## 1.17.0

### Minor Changes

- 0d33642: Add a small output compression plugin under `./esbuild-compress`.

## 1.16.0

### Minor Changes

- d22b8e1: Make `generateSourceMap` respect existing source maps and accept `sourceRoot` as an option.

## 1.15.2

### Patch Changes

- a948e6c: Fix inverted condition in `pathInterpreter`.
- 39cfea6: Create always and never regexes.

## 1.15.1

### Patch Changes

- 7279d1e: Add an asset.
- 695cfd9: Fix parsing `RegExp` in `Rules`.
- 189a700: Add rule interpreters.

## 1.15.0

### Minor Changes

- 1add970: Create `rules.ts`.

## 1.14.2

### Patch Changes

- 73c083b: Add more translations related to editing lists.

## 1.14.1

### Patch Changes

- 220ff2d: Handle `+` in `setTextToNumber`.
- a893d20: Create `alternativeRegExp`.
- a8caa2e: Set numeric settings input type to `number` so that mobile users are shown the numeric keyboard.
- a1d32aa: Create `Base64String`, `base64ToBytes`, `base64ToString`, `bytesToBase64`, and `stringToBase64`.
- 3252bb1: Create 4 source map utilities: `attachFunctionSourceMap`, `attachSourceMap`, `generateFunctionSourceMap`, and `generateSourceMap`.
- 2de4c59: Create `splitLines`.
- ac5be73: Sort regex in `multireplace`.
- 026bcbb: Update npm packages.

## 1.14.0

### Minor Changes

- 3e84682: Make uses of `Proxy` enforce [invariants](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-proxy-object-internal-methods-and-internal-slots).

### Patch Changes

- f26782c: Create `asyncFunction` for getting `AsyncFunction` from a global object.
- 72e2fbe: Augment `FunctionConstructor`.
- 715d0ef: Allow custom `require` in `dynamicRequireSync`.
- e7d8eaa: Create `AsyncFunctionConstructor`.

## 1.13.2

### Patch Changes

- 7aa5694: Create `AdvancedSettingTab#newSectionWidget`.

## 1.13.1

### Patch Changes

- b5c0e5a: Fix `addChild` loading too early in the constructor of `AdvancedSettingTab`.
- 16a7553: Automate changelog using changesets.

## 1.13.0 (2023-07-22)

- Fix `RevealPrivate`. (`9ccb94be13da962d29c0b32e0bb7847e77f338ac`)

**Full changelog**: [`v1.12.1...v1.13.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.12.1...v1.13.0)

## 1.12.1 (2023-07-22)

- Fix platform checking not working. (`7e957a25540404dc42072fd1f81408a8d10247a2`)
- Name unnamed types in `obsidian.ts`. (`c030be4e7be5e4f9670eaaebdbcdd2abee155430`)

**Full changelog**: [`v1.12.0...v1.12.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.12.0...v1.12.1)

## 1.12.0 (2023-07-22)

- Add new platforms: `desktop`, `mobile`. (`8b89706a858ca957ec517817ef011bae25ab3f9b`)
- Use Obsidian's `Platform` to detect platform. (`8b89706a858ca957ec517817ef011bae25ab3f9b`)

**Full changelog**: [`v1.11.3...v1.12.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.11.3...v1.12.0)

## 1.11.3 (2023-07-22)

- Use the package `moment`, which is to be replaced by the bundler. (`294c963e9c602853b9e70dcc9597900d637272be`)

**Full changelog**: [`v1.11.2...v1.11.3`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.11.2...v1.11.3)

## 1.11.2 (2023-07-22)

- Create `patchWindows`. (`52c977f05462913fc8ed01bd2179079aca4f77c9`)

**Full changelog**: [`v1.11.1...v1.11.2`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.11.1...v1.11.2)

## 1.11.1 (2023-07-21)

- Create `DOMClasses#SETTING_ITEM`.
- Improve styling of some HTML elements.

**Full changelog**: [`v1.11.0...v1.11.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.11.0...v1.11.1)

## 1.11.0 (2023-07-21)

- Add `startCase` formatter in `locales.ts`. (`8542051c06f281b91ea8083c2d209edc98e660cb`)
- Create `startCase`. (`8542051c06f281b91ea8083c2d209edc98e660cb`)
- Improve `mapFirstCodePoint` and change its signature. (`8542051c06f281b91ea8083c2d209edc98e660cb`)

**Full changelog**: [`v1.10.1...v1.11.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.10.1...v1.11.0)

## 1.10.1 (2023-07-21)

- Improve type inferring in `revealPrivate`. (`c0da867f5befe2826846c1d0f7c81dca35835f6b`)
- Fix potential concurrent modification in `EventEmitterLite#emit`. (`990109ec89b1e0e21961fb8e23091b3570cd7635`)

**Full changelog**: [`v1.10.0...v1.10.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.10.0...v1.10.1)

## 1.10.0 (2023-07-20)

- Fix `updateView` not updating the inner title. (`a6e4ccba0bc7113c629c96c946d1e367e6cd652d`)
- Improve `instanceOf` to accept `unknown` values. (`a6e4ccba0bc7113c629c96c946d1e367e6cd652d`)
- Improve `revealPrivate` to recursively reveal privates. (`d96ca8f14e0c041208ea0bfe0155a59331abe7e1`)
- Fix dependency cycle between the language and settings manager. (`09cb7891af23054de6c603534b31cac36a67ade9`)
- Make event `mutate-settings` a function `onMutate` instead. (`edb9017b70d0f5c26927383b9f4ba30db2b724ed..e7513ae11204869734a4ae9ab9c19e5efff8ab7d`)

**Full changelog**: [`v1.9.0...v1.10.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.9.0...v1.10.0)

## 1.9.0 (2023-07-16)

- Create `PromisePromise` and `ResourceComponent`. (`6834e47d17cf889fea273f815c881fcae98f5840`, `84b1d8d72c8812bc171cd1873e120a61d265414a`)
- Fix lifecycle management. (`84b1d8d72c8812bc171cd1873e120a61d265414a`)
- Remove `LanguageManager#i18n` and `SettingsManager#copy`. (`c4988df6eca85dc46d9feee2b2a0e757922c0442`)

**Full changelog**: [`v1.8.0...v1.9.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.8.0...v1.9.0)

## 1.8.0 (2023-07-15)

- Support using `@polyipseity/obsidian-plugin-library/style` to import the CSS stylesheet. (`ed3a0448c64299dd738f698a666e6f75fd3dae50`)
- Create export `@polyipseity/obsidian-plugin-library/inject`. (`7369e16810e55ee6aa763197602fa48b2ea60158`)

**Full changelog**: [`v1.7.0...v1.8.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.7.0...v1.8.0)

## 1.7.0 (2023-07-15)

- Create `LambdaComponent`, `activeSelf`, and `escapeJavaScriptString`. (`fec46cbe7d3ef397690628286ff0da63679f0ce4`, `aa78fb01a39af6c012be421e0b36901865c39939`, `f1fdf387091e0bcd54ed39978e73352b8160c82d`)
- Add lifecycle management to `AdvancedSettingsTab`. (`b9aaab48e84147fc710a32d8281c67a8166aafdc`)
- Remove `requireNonNil`, `logError`, and `logWarn`. (`7846499944c0091d2c92ef675a151f30dc15d11a`, `6fcb7e1b2b23a046abae8123d38763e25ac70e51`)
- Replace most `self` with `activeSelf`. (`b839194b38f37de51f2393011d76d64ab279d11b`)
- `sleep2` now requires a `Window`. (`b839194b38f37de51f2393011d76d64ab279d11b`)
- Fix the command to export settings to clipboard. (`1e163c217f817a74eb4bb46e99b88068478ca787`)

**Full changelog**: [`v1.6.0...v1.7.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.6.0...v1.7.0)

## 1.6.0 (2023-07-13)

- Rename `updateDisplayText` to `updateView` and improve its implementation. (`4e52de28b8264ae9f0110e1c12176bf2e9b9841f`)
- Remove `DOMClasses#VIEW_HEADER_TITLE`. (`4e52de28b8264ae9f0110e1c12176bf2e9b9841f`)
- Modify `@types/obsidian.ts`. (`4e52de28b8264ae9f0110e1c12176bf2e9b9841f`)
- Replace submodule `obsidian` with `@polyipseity/obsidian`. (`2e4f0fc652929bcea42074db04851ced99b68ebb`..`4049f6e4cab1c46a7891fc973924c6fb652277a2`)
- Upgrade minimum Obsidian API version to v1.2.8. (`4049f6e4cab1c46a7891fc973924c6fb652277a2`)
- Prepare publishing. (`63184057b184c82f786dc19998d31632b2a8fb17`)
- Update npm packages. (`9644440814aee326fcdd7fb8ed2f3c6a47695770`)

**Full changelog**: [`v1.5.0...v1.6.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.5.0...v1.6.0)

## 1.5.0 (2023-07-10)

- Create interface `StatusUI`. (`47e2c752ee993cb3cdc445c506459b4b8daecf2d`)
- Improve resetting `Setting` in `UpdatableUI`. (`30dd2e6267d2665ec281b14da6f3980a52570d61`)
- Improve and create utilities: `assignExact`, `composeSetters`, `createChildElement`, `createDocumentFragment`. (`30dd2e6267d2665ec281b14da6f3980a52570d61`..`3ae484d5b53c4a0c663e975bc648c3bb8946bb80`)
- Add more features to `EditDataModal`. (`5396a54cfafce35794240f84fc8cd5ea3295f227`)

**Full changelog**: [`v1.4.2...v1.5.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.2...v1.5.0)

## 1.4.2 (2023-07-10)

- Fix typing characaters into the find textbox not working. (`5345cbdd12d17ebcc6f8da4f6b359f5cd9782fda`)
- Eliminate the use of `!important` in CSS. (`3e1deee9a4f01aee4fe249bf7fdc97c1a12c30a3`)

**Full changelog**: [`v1.4.1...v1.4.2`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.1...v1.4.2)

## 1.4.1 (2023-07-01)

- Fix `obsidian` version. (`9eb1a1cba7cfa8a7e6fa6395e18bfac826bc1b87`)

**Full changelog**: [`v1.4.0...v1.4.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.0...v1.4.1)

## 1.4.0 (2023-07-01)

- Update npm packages to remove vulnerabilities. (`5921ac38e2c71ad82eb9f1c6ce767ad5b58b4b59`)
- Rename `NamespacedTranslationKey` to `TranslationKey` and fix it. (`b9e09a66b523d1c51afb03468366f2c8a0f7876a`)

**Full changelog**: [`v1.3.0...v1.4.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.3.0...v1.4.0)

## 1.3.0 (2023-05-21)

- Remove printing a notice in `printMalformedData()`. See [polyipseity/obsidian-terminal#19](https://github.com/polyipseity/obsidian-terminal/issues/19). (`5adbc68d36cdd0d2ea3476ef0dbece6f18e82140`)

**Full changelog**: [`v1.2.0...v1.3.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.2.0...v1.3.0)

## 1.2.0 (2023-05-17)

- Create `aroundIdentityFactory()`. (`cd65b88f0a44e36562597cbd1fc4897f5823cb0f`)
- Fix broken `esbuild()` in `build.mjs`. (`ddb3311b1021775926e304fbdc5daffdef0cd6ae`)
- Allow collaboration in `private.ts`. (`cf11c9443abbe59955d85be39b65de9b1e8f5ccb`..`586b49d53725d9d1ee124f46038b27548d2ae595`)

**Full changelog**: [`v1.1.0...v1.2.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.1.0...v1.2.0)

## 1.1.0 (2023-05-16)

- Fix `tsconfig.json` not found in a monorepo. (`577ca4b769c4a08feeb92e377a55a308d205a147`)
- Return the original loaded settings in `SettingsManager#onLoaded`. (`181a2e0851d7e0bafb5de67fb5e4e4769c42b006`)
- Improve type parameter defaults in `promisePromise()`. (`13ae19a3261833e705a210c04308cc3bf916e10d`)

**Full changelog**: [`v1.0.9...v1.1.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.9...v1.1.0)

## 1.0.9 (2023-05-15)

- Various minor improvements.
- Fix calling the wrong `tsc`. (`e31455908f9b8e378c0ff00265c997c9369b1c04`)

**Full changelog**: [`v1.0.8...v1.0.9`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.8...v1.0.9)

## 1.0.8 (2023-05-15)

**Full changelog**: [`v1.0.7...v1.0.8`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.7...v1.0.8)

## 1.0.7 (2023-05-15)

Various bug fixes.

**Full changelog**: [`v1.0.6...v1.0.7`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.6...v1.0.7)

## 1.0.6 (2023-05-15)

- Fix `latest.yml` not overwriting old assets in the release. (`90835653fbfc9a80cb67f3522273fd822177cc22`..`ff1a040f0dcc0e2f446f24fa5db33ff683ad0b4c`)
- Add support for `pnpm`. (`884f214a01e51a22f3fa8a64a34e1ecadd689095`)

**Full changelog**: [`v1.0.5...v1.0.6`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.5...v1.0.6)

## 1.0.5 (2023-05-14)

Finally got it working properly.

**Full changelog**: [`v1.0.4...v1.0.5`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.4...v1.0.5)

## 1.0.4 (2023-05-14)

**Full changelog**: [`v1.0.3...v1.0.4`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.3...v1.0.4)

## 1.0.3 (2023-05-14)

**Full changelog**: [`v1.0.2...v1.0.3`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.2...v1.0.3)

## 1.0.2 (2023-05-14)

**Full changelog**: [`v1.0.1...v1.0.2`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.1...v1.0.2)

## 1.0.1 (2023-05-14)

**Full changelog**: [`v1.0.0...v1.0.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.0...v1.0.1)

## 1.0.0 (2023-05-14)

This package was extracted from `obsidian-plugin-library`, which was extracted from `obsidian-terminal`.

**Full changelog**: [`bdbbd87321b97b84f424136b7f29663660be7027...v1.0.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/bdbbd87321b97b84f424136b7f29663660be7027...v1.0.0)
