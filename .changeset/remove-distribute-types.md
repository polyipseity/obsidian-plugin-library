---
"@polyipseity/obsidian-plugin-library": major
---

Remove `DistributeKeys`, `DistributeValues`, and `Evaluate` from the public types.

- `DistributeKeys<T>`, `DistributeValues<T, K>`, and `Evaluate<T>` are deleted from `src/types.ts`. `DistributeKeys`/`DistributeValues` duplicated built-in TypeScript behavior.
- Internal usage in `assets/locales.ts` (`MergeResources` / `MergeNamespaces`) now uses `keyof Ts[number]` for the union of keys and an inline distributive conditional for value access.
- The runtime `deepFreeze(ret as MergeResources<Ts>)` cast now routes through `as unknown` (the cast is intentionally unsound).

May break downstream code that imports `DistributeKeys`, `DistributeValues`, or `Evaluate`.
