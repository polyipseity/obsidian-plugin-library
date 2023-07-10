# Changelog for Plugin Library

[Buy Me a Coffee]: https://buymeacoffee.com/polyipseity
[Buy Me a Coffee/embed]: https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=polyipseity&button_colour=40DCA5&font_colour=ffffff&font_family=Lato&outline_colour=000000&coffee_colour=FFDD00
[readme]: https://github.com/polyipseity/obsidian-plugin-library/blob/main/README.md

[![Buy Me a Coffee/embed]][Buy Me a Coffee]

Versions are ordered by recency.

- [Readme]

## Unreleased

__Full changelog__: [`v1.5.0...main`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.5.0...main)

## v1.5.0 (2023-07-10)

- Create interface `StatusUI`. (`47e2c752ee993cb3cdc445c506459b4b8daecf2d`)
- Improve resetting `Setting` in `UpdatableUI`. (`30dd2e6267d2665ec281b14da6f3980a52570d61`)
- Improve and create utilities: `assignExact`, `composeSetters`, `createChildElement`, `createDocumentFragment`. (`30dd2e6267d2665ec281b14da6f3980a52570d61`..`3ae484d5b53c4a0c663e975bc648c3bb8946bb80`)
- Add more features to `EditDataModal`. (`5396a54cfafce35794240f84fc8cd5ea3295f227`)

__Full changelog__: [`v1.4.2...v1.5.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.2...v1.5.0)

## v1.4.2 (2023-07-10)

- Fix typing characaters into the find textbox not working. (`5345cbdd12d17ebcc6f8da4f6b359f5cd9782fda`)
- Eliminate the use of `!important` in CSS. (`3e1deee9a4f01aee4fe249bf7fdc97c1a12c30a3`)

__Full changelog__: [`v1.4.1...v1.4.2`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.1...v1.4.2)

## v1.4.1 (2023-07-01)

- Fix `obsidian` version. (`9eb1a1cba7cfa8a7e6fa6395e18bfac826bc1b87`)

__Full changelog__: [`v1.4.0...v1.4.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.0...v1.4.1)

## v1.4.0 (2023-07-01)

- Update npm packages to remove vulnerabilities. (`5921ac38e2c71ad82eb9f1c6ce767ad5b58b4b59`)
- Rename `NamespacedTranslationKey` to `TranslationKey` and fix it. (`b9e09a66b523d1c51afb03468366f2c8a0f7876a`)

__Full changelog__: [`v1.3.0...v1.4.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.4.0...main)

## v1.3.0 (2023-05-21)

- Remove printing a notice in `printMalformedData()`. See [polyipseity/obsidian-terminal#19](https://github.com/polyipseity/obsidian-terminal/issues/19). (`5adbc68d36cdd0d2ea3476ef0dbece6f18e82140`)

__Full changelog__: [`v1.2.0...v1.3.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.2.0...v1.3.0)

## v1.2.0 (2023-05-17)

- Create `aroundIdentityFactory()`. (`cd65b88f0a44e36562597cbd1fc4897f5823cb0f`)
- Fix broken `esbuild()` in `build.mjs`. (`ddb3311b1021775926e304fbdc5daffdef0cd6ae`)
- Allow collaboration in `private.ts`. (`cf11c9443abbe59955d85be39b65de9b1e8f5ccb`..`586b49d53725d9d1ee124f46038b27548d2ae595`)

__Full changelog__: [`v1.1.0...v1.2.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.1.0...v1.2.0)

## v1.1.0 (2023-05-16)

- Fix `tsconfig.json` not found in a monorepo. (`577ca4b769c4a08feeb92e377a55a308d205a147`)
- Return the original loaded settings in `SettingsManager#onLoaded`. (`181a2e0851d7e0bafb5de67fb5e4e4769c42b006`)
- Improve type parameter defaults in `promisePromise()`. (`13ae19a3261833e705a210c04308cc3bf916e10d`)

__Full changelog__: [`v1.0.9...v1.1.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.9...v1.1.0)

## v1.0.9 (2023-05-15)

- Various minor improvements.
- Fix calling the wrong `tsc`. (`e31455908f9b8e378c0ff00265c997c9369b1c04`)

__Full changelog__: [`v1.0.8...v1.0.9`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.8...v1.0.9)

## v1.0.8 (2023-05-15)

__Full changelog__: [`v1.0.7...v1.0.8`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.7...v1.0.8)

## v1.0.7 (2023-05-15)

Various bug fixes.

__Full changelog__: [`v1.0.6...v1.0.7`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.6...v1.0.7)

## v1.0.6 (2023-05-15)

- Fix `latest.yml` not overwriting old assets in the release. (`90835653fbfc9a80cb67f3522273fd822177cc22`..`ff1a040f0dcc0e2f446f24fa5db33ff683ad0b4c`)
- Add support for `pnpm`. (`884f214a01e51a22f3fa8a64a34e1ecadd689095`)

__Full changelog__: [`v1.0.5...v1.0.6`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.5...v1.0.6)

## v1.0.5 (2023-05-14)

Finally got it working properly.

__Full changelog__: [`v1.0.4...v1.0.5`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.4...v1.0.5)

## v1.0.4 (2023-05-14)

__Full changelog__: [`v1.0.3...v1.0.4`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.3...v1.0.4)

## v1.0.3 (2023-05-14)

__Full changelog__: [`v1.0.2...v1.0.3`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.2...v1.0.3)

## v1.0.2 (2023-05-14)

__Full changelog__: [`v1.0.1...v1.0.2`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.1...v1.0.2)

## v1.0.1 (2023-05-14)

__Full changelog__: [`v1.0.0...v1.0.1`](https://github.com/polyipseity/obsidian-plugin-library/compare/v1.0.0...v1.0.1)

## v1.0.0 (2023-05-14)

This package was extracted from `obsidian-plugin-library`, which was extracted from `obsidian-terminal`.

__Full changelog__: [`bdbbd87321b97b84f424136b7f29663660be7027...v1.0.0`](https://github.com/polyipseity/obsidian-plugin-library/compare/bdbbd87321b97b84f424136b7f29663660be7027...v1.0.0)
