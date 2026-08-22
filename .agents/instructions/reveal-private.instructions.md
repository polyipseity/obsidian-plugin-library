---
description: "Use when working on the RevealPrivate reveal machinery in src/private.ts — type-level semantics, exact-whitelist filter behavior, exempt marker policy, and the BakedHotkey workaround ban."
name: "RevealPrivate Specification"
applyTo: "src/private.ts"
---

# `RevealPrivate` — specification

Source of truth for the type-level semantics of the private-API reveal machinery in `src/private.ts`. The type tests in `tests/src/private.spec.ts` ("Type system" describe block) encode it.

## Purpose

Obsidian plugin authors need to read members that Obsidian keeps private. The library brands such types with an optional unique-symbol property (`Private<T, K>`); the reveal machinery removes the brand and exposes the private shape so callers can access the members with full type safety.

## API surface

- `RevealPrivate<T, Filter extends readonly unknown[] = readonly []>` — type-level reveal.
- `revealPrivate(context, args, func, fallback)` and `revealPrivateAsync(...)` — deprecated runtime helpers wrapping `RevealPrivate`; kept for backwards compatibility.
- `revealPrivateFilter<Filter>()` and `revealPrivateAsyncFilter<Filter>()` — recommended runtime helpers with a fixed `Filter`.
- `RevealPrivateExempt` — brand marker for types that pass through `RevealPrivate` unchanged. Builtins extend it in `src/@types/lib.es5.ts`; prefer the whitelist for non-builtin exceptions.
- `Private`, `PrivateKeys`, `HasPrivate` — branding machinery.
- `$App`, `$BakedHotkey`, `$Commands`, `$CommunityPluginsSettingTab`, `$DataAdapter`, `$FileSystem`, `$HotkeyManager`, `$Keymap`, `$Plugins`, `$UnknownSettingTab`, `$ViewStateResult`, `$Workspace`, `$WorkspaceLeaf`, `$WorkspaceRibbon` — the private-shape brand payloads, all exported from `src/@types/obsidian.ts` and reachable through the public type barrel (`export type *`). Reference them directly (e.g. `NonNullable<$FileSystem["open"]>`) instead of reconstructing shapes.

## Gate semantics (evaluation order)

`RevealPrivate<T, Filter>` distributes over unions and evaluates as follows:

1. **Depth guard.** If the recursion depth reaches `MaxRevealDepth` (8), return `T` unchanged (terminates on cyclic types).
2. **Builtin gate.** Exempt types pass through unchanged: the `RevealPrivateExempt` shape (a required property, so index-signature objects do not match). Builtins (`String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in `src/@types/lib.es5.ts`, so the gate needs no special-case union. Functions are deliberately excluded from the gate: they are structural containers whose parameters and return type must be processed.
3. **Structural dispatch.** Otherwise dispatch on the shape of `T`:
   - **Tuples** (`number extends T["length"]` is false): homomorphic mapped tuple, preserving element optionality, rest elements, and readonlyness.
   - **Arrays**: mapped element type, preserving mutability/readonlyness.
   - **Functions**: exact filter matches pass through unchanged; otherwise parameters and return type are revealed.
   - **Promise** before `PromiseLike`; **Map** before `ReadonlyMap`; **Set** before `ReadonlySet` — preserving the concrete/readonly variant.
   - **Objects**: see below.
   - Anything else (primitives not caught by the gate, `unknown`, `never` via distribution) passes through unchanged.

## Object semantics: exact whitelist vs traversal

For an object type `T`, the `Filter` decides between **eager expansion** and **lazy traversal**:

- **Whitelisted** — `WhitelistMatch<T, Filter>` is true, i.e. some element `F` of the `Filter` tuple satisfies `AreNonDistributiveEqual<NonNullable<T>, F>` — the type is **exactly** a filter element after removing `undefined`/`null`. Note this is an exact structural match, not `extends`; a subtype or supertype of a filter element is not expanded. A tuple element may itself be a union (`X | Y`) and is matched exactly as one entry. The whole union `T = X | Y` is matched as one entry; `RevealPrivate` checks the filter on the whole `T` before distributing, so a union filter element is reachable (individual members `X`/`Y` still do not match).
- Whitelisted types are **expanded**: the brand is replaced by the private shape (`MergePrivateShape<T>` = public members `&` the private shape) and every member is recursively revealed.
- Non-whitelisted types are **traversed**: the brand is dropped (`Omit<T, PrivateKeys$>`) and every member is recursively revealed, but the type itself is not replaced by its shape. Traversal is lazy, which keeps cycles (e.g. `HTMLElement`) finite.

The whitelist therefore controls _which_ domain types are eagerly expanded; arrays, tuples, functions, `Promise`, maps, sets, and plain objects are always processed structurally, and the filter applies to the types nested inside them.

`AreNonDistributiveEqual` (ts-essentials, the type-fest `IsEqual` mutual-assignability variant) is the exact-structural gate; `expectTypeOf(...).toEqualTypeOf(...)` (vitest) is used in tests for the same mutual-assignability semantics.

## Aggressive mode

`Filter = readonly []` (the default, empty tuple) matches everything: every object type is whitelisted, so `RevealPrivate<T>` eagerly expands arrays, functions, promises, maps, sets, tuples, and all reachable object members (bounded by the depth guard). This is the historical behavior; it is intentionally aggressive and typically reveals far more than a caller needs.

`RevealPrivate`/`revealPrivate`/`revealPrivateAsync` are deprecated. Prefer the filtered variants: `revealPrivateFilter<[App]>()(context, [app], ...)` expands only `App` and traverses everything else.

## Exempt marker

`RevealPrivateExempt` is a required-property marker (`readonly __reveal_private_exempt: true`). It is intentionally awkward to use: only types that cannot be structurally represented should opt out of reveal. `Record<string, X>` must _not_ match the marker — the weak-type bug that allowed it is fixed. Builtins (`String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in `src/@types/lib.es5.ts`, so the gate matches the marker shape directly and needs no special-case union.

## BakedHotkey policy

The library's Obsidian augmentation declares `BakedHotkey`'s private shape (`$BakedHotkey`) as an empty interface — the public members live on the augmented `BakedHotkey` interface, not the brand. `$Keymap.constructor.isMatch` takes a plain `BakedHotkey` — no reveal wrapper. Never reintroduce `RevealPrivate<BakedHotkey>` as a workaround; if Obsidian's shape changes, update `$BakedHotkey`.
