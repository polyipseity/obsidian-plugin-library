# `RevealPrivate` — specification

Specification of the private-API reveal machinery in `src/private.ts`. This document is the source of truth for the type-level semantics; the type tests in `tests/src/private.spec.ts` ("Type system" describe block) encode it.

## Purpose

Obsidian plugin authors need to read members that Obsidian keeps private. The library brands such types with an optional unique-symbol property (`Private<T, K>`); the reveal machinery removes the brand and exposes the private shape so callers can access the members with full type safety.

## Functions and type-level API

- `RevealPrivate<T, Filter = unknown>` — type-level reveal.
- `revealPrivate(context, args, func, fallback)` and `revealPrivateAsync(...)` — runtime helpers wrapping `RevealPrivate`.
- `revealPrivateFilter<Filter>()` and `revealPrivateAsyncFilter<Filter>()` — return the runtime helpers with a fixed `Filter`.
- `RevealPrivateExempt` — brand marker for types that must pass through `RevealPrivate` unchanged. **Discouraged**: only for types that cannot be structurally represented. Builtin exceptions (`Error` and everything else in `Builtin` except functions) are handled by the gate directly — do not use the marker for them.
- `Private`, `PrivateKeys`, `HasPrivate` — branding machinery.

## Gate semantics (evaluation order)

`RevealPrivate<T, Filter>` distributes over unions and evaluates as follows:

1. **Depth guard.** If the recursion depth reaches the cap, return `T` unchanged (terminates on cyclic types).
2. **Builtin gate.** If `T` is `RevealPrivateExempt` or a builtin other than `Error` and functions (`Exclude<Builtin, Error | Function>`), return `T` unchanged. Functions are deliberately excluded from the gate: they are structural containers whose parameters and return type must be processed.
3. **Structural dispatch.** Otherwise dispatch on the shape of `T`:
   - **Tuples** (`number extends T["length"]` is false): homomorphic mapped tuple, preserving element optionality, rest elements, and readonlyness.
   - **Arrays**: mapped element type, preserving mutability/readonlyness.
   - **Functions**: mapped parameters and return type.
   - **Promise** before `PromiseLike`; **Map** before `ReadonlyMap`; **Set** before `ReadonlySet` — preserving the concrete/readonly variant.
   - **Objects**: see below.
   - Anything else (primitives not caught by the gate, `unknown`, `never` via distribution) passes through unchanged.

## Object semantics: exact whitelist vs traversal

For an object type `T`, the `Filter` decides between **eager expansion** and **lazy traversal**:

- **Whitelisted** — `WhitelistMatch<T, Filter>` is true, i.e. some member `F` of the `Filter` union satisfies `IsEqualExact<NonNullable<T>, F>` — the type is **exactly** a filter member after removing `undefined`/`null`. Note this is an exact structural match, not `extends`; a subtype or supertype of a filter member is not expanded.
- Whitelisted types are **expanded**: the brand is replaced by the private shape (`MergePrivateShape<T>` = public members `&` the private shape) and every member is recursively revealed.
- Non-whitelisted types are **traversed**: the brand is dropped (`Omit<T, PrivateKeys$>`) and every member is recursively revealed, but the type itself is not replaced by its shape. Traversal is lazy, which keeps cycles (e.g. `HTMLElement`) finite.

The whitelist therefore controls *which* domain types are eagerly expanded; arrays, tuples, functions, `Promise`, maps, sets, and plain objects are always processed structurally, and the filter applies to the types nested inside them.

`IsEqualExact` uses the deferred-instantiation trick; `Equalish` (mutual assignability) is used in tests only for engine-output assertions because the deferred trick is sensitive to property order in unions.

## Aggressive mode

`Filter = unknown` (the default) matches everything: every object type is whitelisted, so `RevealPrivate<T>` eagerly expands arrays, functions, promises, maps, sets, tuples, and all reachable object members (bounded by the depth guard). This is the historical behavior; it is intentionally aggressive and typically reveals far more than a caller needs.

**`RevealPrivate`/`revealPrivate`/`revealPrivateAsync` are deprecated.** Prefer the filtered variants: `revealPrivateFilter<App>()(context, [app], ...)` expands only `App` and traverses everything else.

## Exempt marker

`RevealPrivateExempt` is a required-property marker (`readonly __reveal_private_exempt: true`). It is intentionally awkward to use: only types that cannot be structurally represented should opt out of reveal. `Record<string, X>` must *not* match the marker — the weak-type bug that allowed it is fixed. The marker is deprecated alongside the unfiltered functions; migrate builtin exceptions into the gate (they already are) instead of using the marker.

## BakedHotkey policy

The library's Obsidian augmentation declares `BakedHotkey`'s private shape (`$BakedHotkey`) with its public members (`readonly key: string; readonly modifiers: readonly Modifier[]`). `$Keymap.constructor.isMatch` takes a plain `BakedHotkey` — no reveal wrapper. Never reintroduce `RevealPrivate<BakedHotkey>` as a workaround; if Obsidian's shape changes, update `$BakedHotkey`.
