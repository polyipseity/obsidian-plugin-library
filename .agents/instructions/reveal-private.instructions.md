---
description: "Use when working on the RevealPrivate reveal machinery in src/private.ts — two orthogonal lists (reveal whitelist + recursion blacklist), configurable depth, exempt marker policy, and the BakedHotkey workaround ban."
name: "RevealPrivate Specification"
applyTo: "src/private.ts"
---

# `RevealPrivate` — specification

Source of truth for the type-level semantics of the private-API reveal machinery in `src/private.ts`. The type tests in `tests/src/private.spec.ts` ("Type system" describe block) encode it.

## Purpose

Obsidian plugin authors need to read members that Obsidian keeps private. The library brands such types with an optional unique-symbol property (`Private<T, K>`); the reveal machinery removes the brand and exposes the private shape so callers can access the members with full type safety.

## API surface

- `RevealPrivate<T, RevealWhitelist extends readonly unknown[] = readonly [], RecursionBlacklist extends readonly unknown[] = readonly [], Depth extends number = DefaultRevealDepth>` — type-level reveal.
- `revealPrivate(context, args, func, fallback)` and `revealPrivateAsync(...)` — deprecated runtime helpers wrapping `RevealPrivate`; kept for backwards compatibility.
- `revealPrivateFilter<RevealWhitelist, RecursionBlacklist, Depth>()` and `revealPrivateAsyncFilter<RevealWhitelist, RecursionBlacklist, Depth>()` — recommended runtime helpers with fixed lists and depth.
- `RevealPrivateExempt` — brand marker for types that pass through `RevealPrivate` unchanged. Builtins extend it in `src/@types/lib.es5.ts`; prefer the recursion blacklist for non-builtin exceptions.
- `Private`, `PrivateKeys`, `HasPrivate` — branding machinery.
- `$App`, `$BakedHotkey`, `$Commands`, `$CommunityPluginsSettingTab`, `$DataAdapter`, `$FileSystem`, `$HotkeyManager`, `$Keymap`, `$Plugins`, `$UnknownSettingTab`, `$ViewStateResult`, `$Workspace`, `$WorkspaceLeaf`, `$WorkspaceRibbon` — the private-shape brand payloads, all exported from `src/@types/obsidian.ts` and reachable through the public type barrel (`export type *`). Reference them directly (e.g. `NonNullable<$FileSystem["open"]>`) instead of reconstructing shapes.

## Gate semantics (evaluation order)

`RevealPrivate<T, RevealWhitelist, RecursionBlacklist, Depth>` distributes over unions and evaluates as follows:

1. **Depth guard.** If the recursion depth reaches `Depth` (default `DefaultRevealDepth` = 8), return `T` unchanged (terminates on cyclic types). `Depth` is a configurable number generic, orthogonal to both lists.
2. **Builtin gate.** Exempt types pass through unchanged: the `RevealPrivateExempt` shape (a required property, so index-signature objects do not match). Builtins (`String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in `src/@types/lib.es5.ts`, so the gate needs no special-case union. Functions are deliberately excluded from the gate: they are structural containers whose parameters and return type must be processed.
3. **Recursion blacklist.** If `RecursionBlacklistMatch<T, RecursionBlacklist>` is true (the whole type `T` exactly matches a blacklist element via `AreNonDistributiveEqual`), return `T` unchanged. The blacklist wins over the reveal whitelist.
4. **Structural dispatch.** Otherwise dispatch on the shape of `T`:
   - **Tuples** (`number extends T["length"]` is false): homomorphic mapped tuple, preserving element optionality, rest elements, and readonlyness.
   - **Arrays**: mapped element type, preserving mutability/readonlyness.
   - **Functions**: exact whole-type matches pass through unchanged; otherwise parameters and return type are revealed.
   - **Promise** before `PromiseLike`; **Map** before `ReadonlyMap`; **Set** before `ReadonlySet` — preserving the concrete/readonly variant.
   - **Objects**: see below.
   - Anything else (primitives not caught by the gate, `unknown`, `never` via distribution) passes through unchanged.

## Two orthogonal lists

The two concerns are **orthogonal**, modeled as two separate lists plus a configurable depth:

- **`RevealWhitelist` (whitelist)** — a SET of PRIVATE types (`$X` brand payloads) to reveal. When a branded type's brand payload `T[PrivateKeys$]` exactly matches a reveal-whitelist element (`AreNonDistributiveEqual`), its private `$X` shape is merged and members are recursed. A union element (`$X | $Y`) matches only the whole union; individual members `$X`/`$Y` do not match the `$X | $Y` element.
- **`RecursionBlacklist` (blacklist)** — a SET of types to STOP recursing into (returned as-is). `RecursionBlacklistMatch` matches the whole type `T` exactly (`AreNonDistributiveEqual<NonNullable<T>, Head>`), branded or not. Orthogonal to the reveal whitelist: a type can be in neither, either, or both lists — the blacklist wins, so recursion stops before reveal is considered.
- **Recursion is uniform** — there is no branded/non-branded distinction. Every object is recursed into unless blacklisted. The reveal whitelist only decides reveal-vs-traverse for a branded type; intermediate types on an access path are auto-traversed, so you list only the private types you want revealed.
- **`Depth` is orthogonal** to both lists — a configurable number generic bounding recursion on cyclic types.

`AreNonDistributiveEqual` (ts-essentials, the type-fest `IsEqual` mutual-assignability variant) is the exact-structural gate; `expectTypeOf(...).toEqualTypeOf(...)` (vitest) is used in tests for the same mutual-assignability semantics.

## Default behavior

`RevealWhitelist = readonly []` (the default) means NO reveal: branded types are traversed (brand dropped, members recursed) but not replaced by their private shape. `RecursionBlacklist = readonly []` (the default) means nothing is blacklisted. List private types in the reveal whitelist to reveal them; list whole types in the recursion blacklist to keep them opaque.

`RevealPrivate`/`revealPrivate`/`revealPrivateAsync` are deprecated. Prefer the filtered variants: `revealPrivateFilter<[$App]>()(context, [app], ...)` reveals only `App` and traverses everything else.

## Worked example

To reveal `app.setting.settingTabs[i].id` you list ONLY the private types whose shape you want: `revealPrivateFilter<[$CommunityPluginsSettingTab | $UnknownSettingTab]>()`. `App` and `setting` are auto-traversed — you do NOT list them. To keep DOM nodes opaque, add a recursion blacklist: `revealPrivateFilter<[$CommunityPluginsSettingTab | $UnknownSettingTab], [HTMLElement]>()`.

## Exempt marker

`RevealPrivateExempt` is a required-property marker (`readonly __reveal_private_exempt: true`). It is intentionally awkward to use: only types that cannot be structurally represented should opt out of reveal. `Record<string, X>` must _not_ match the marker — the weak-type bug that allowed it is fixed. Builtins (`String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in `src/@types/lib.es5.ts`, so the gate matches the marker shape directly and needs no special-case union.

## BakedHotkey policy

The library's Obsidian augmentation declares `BakedHotkey`'s private shape (`$BakedHotkey`) as an empty interface — the public members live on the augmented `BakedHotkey` interface, not the brand. `$Keymap.constructor.isMatch` takes a plain `BakedHotkey` — no reveal wrapper. Never reintroduce `RevealPrivate<BakedHotkey>` as a workaround; if Obsidian's shape changes, update `$BakedHotkey`.
