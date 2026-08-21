---
"@polyipseity/obsidian-plugin-library": major
---

Remove `DistributeKeys` and `DistributeValues` from the public types.

- `DistributeKeys<T>` and `DistributeValues<T, K>` are deleted from `src/types.ts`. They duplicated built-in TypeScript behavior.
- Internal usage in `assets/locales.ts` (`MergeResources` / `MergeNamespaces`) now uses `keyof Ts[number]` for the union of keys and an inline distributive conditional for value access.
- `Evaluate` is intentionally kept — it is the only construct that keeps the runtime `deepFreeze(ret as MergeResources<Ts>)` cast well-typed.

May break downstream code that imports `DistributeKeys` or `DistributeValues`.
