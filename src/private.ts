import type {
  AsyncOrSync,
  IsNever,
  MarkRequired,
  Prettify,
  UnionToIntersection,
} from "ts-essentials";
import type { AreNonDistributiveEqual } from "ts-essentials/dist/are-non-distributive-equal.js";
import type { PluginContext } from "./plugin.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extension point for private keys
export interface PrivateKeys {
  // Empty for interface extension.
}
export type PrivateKeys$ = keyof PrivateKeys;
export type Private<T, P extends keyof PrivateKeys> = Prettify<{
  readonly [K in P]?: T;
}>;
export type HasPrivate<P extends keyof PrivateKeys = PrivateKeys$> = Prettify<
  {
    readonly [K in P]: Private<unknown, K>;
  }[P]
>;
/**
 * Brand marker for types that pass through `RevealPrivate` unchanged. The
 * marker is a required property so index-signature objects (weak types) do not
 * accidentally match it. Builtins (`String`, `Number`, `Boolean`, `BigInt`,
 * `Symbol`, `Date`, `RegExp`) extend this marker in `src/@types/lib.es5.ts`,
 * so the gate needs no special-case union. Prefer the `RevealWhitelist`
 * parameter for non-builtin exceptions.
 */
export interface RevealPrivateExempt {
  readonly __reveal_private_exempt: true;
}
/**
 * The default recursion depth of `RevealPrivate`. Cyclic types (e.g. DOM
 * nodes) return the raw type past this depth. Override via the `Depth` number
 * generic — orthogonal to both the reveal whitelist and the recursion
 * blacklist.
 */
type DefaultRevealDepth = 8;
/**
 * Builds a tuple of length `N` so a number generic can drive a tuple-length
 * depth counter (tuple length is the only compile-time integer arithmetic
 * available in the type system).
 */
type Enumerate<
  N extends number,
  Acc extends readonly unknown[] = readonly [],
> = Acc["length"] extends N ? Acc : Enumerate<N, readonly [unknown, ...Acc]>;
/**
 * Drops the first element of a depth counter tuple. When the counter is empty
 * the recursion has reached `Depth` and must stop.
 */
type Tail<T extends readonly unknown[]> = T extends readonly [
  unknown,
  ...infer R,
]
  ? R
  : readonly [];
/**
 * True when the brand payload of `T` (i.e. `T[PrivateKeys$]`) is exactly one
 * element of the `RevealWhitelist` tuple. The whitelist is a SET of PRIVATE
 * types (`$X`); a branded type is revealed only when its brand payload matches
 * a whitelist element via `AreNonDistributiveEqual`. Subtypes and supertypes
 * do not match. A tuple element may itself be a union (`X | Y`) and is matched
 * exactly as one entry; the whole union `T = X | Y` is matched as a single
 * entry (individual members `X`/`Y` do not match).
 */
type RevealWhitelistMatch<
  T,
  RevealWhitelist extends readonly unknown[],
> = RevealWhitelist extends readonly [infer Head, ...infer Tail]
  ? PrivateKeys$ extends keyof T
    ? AreNonDistributiveEqual<NonNullable<T[PrivateKeys$]>, Head> extends true
      ? true
      : RevealWhitelistMatch<T, Tail>
    : RevealWhitelistMatch<T, Tail>
  : false;
/**
 * True when the whole type `T` (after removing `undefined`/`null`) is exactly
 * one element of the `RevealWhitelist` tuple. Unlike `RevealWhitelistMatch`
 * (which matches the brand payload of a branded type), this matches the entire
 * type — used for non-branded types (e.g. local function aliases
 * `LoadPlugin`/`GetPlugin`) that should pass through unchanged rather than be
 * reconstructed (which would strip generic signatures).
 */
type WhitelistMatch<
  T,
  RevealWhitelist extends readonly unknown[],
> = RevealWhitelist extends readonly [infer Head, ...infer Tail]
  ? AreNonDistributiveEqual<NonNullable<T>, Head> extends true
    ? true
    : WhitelistMatch<T, Tail>
  : false;
/**
 * True when `T` (after removing `undefined`/`null`) is exactly one element of
 * the `RecursionBlacklist` tuple. The blacklist is a SET of types to STOP
 * recursing into (returned as-is); it matches the whole type, branded or not.
 * Orthogonal to the reveal whitelist — a type can be in neither, either, or
 * both lists. The blacklist wins: recursion stops before reveal is considered.
 */
type RecursionBlacklistMatch<
  T,
  RecursionBlacklist extends readonly unknown[],
> = RecursionBlacklist extends readonly [infer Head, ...infer Tail]
  ? AreNonDistributiveEqual<NonNullable<T>, Head> extends true
    ? true
    : RecursionBlacklistMatch<T, Tail>
  : false;
/**

 * The public members of `T` merged with its private shape (the `$X` brand
 * value). String-indexed types skip the brand merge: their index signature
 * would answer the brand lookup with the value type, corrupting the merged
 * shape (e.g. `Record<string, X>` would gain `X`'s members).
 */
type PrivateShape<T> = MarkRequired<T, Extract<PrivateKeys$, keyof T>>[Extract<
  PrivateKeys$,
  keyof T
>];
type MergePrivateShape<T> = Prettify<
  string extends keyof T
    ? Omit<T, PrivateKeys$>
    : Omit<T, PrivateKeys$> &
        (IsNever<PrivateShape<T>> extends true
          ? unknown
          : UnionToIntersection<PrivateShape<T>>)
>;
/**
 * Removes the private brand of `T` and reveals its members.
 *
 * Evaluation order:
 * 1. **Depth guard** — past `Depth` (default 8), return `T` unchanged
 *    (terminates on cyclic types). `Depth` is a configurable number generic,
 *    orthogonal to both the reveal whitelist and the recursion blacklist.
 * 2. **Builtin gate** — exempt types pass through unchanged: the
 *    `RevealPrivateExempt` shape. Builtins (`String`, `Number`, `Boolean`,
 *    `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in
 *    `src/@types/lib.es5.ts`, so the gate needs no special-case union.
 *    Functions are deliberately NOT exempt: they are structural containers
 *    whose parameters and return type must be processed.
 * 3. **Recursion blacklist** — if `T` is in `RecursionBlacklist`, return `T`
 *    unchanged and stop recursing. The blacklist wins over the reveal
 *    whitelist.
 * 4. **Structural dispatch** — tuples/arrays (preserving element
 *    optionality, rest elements, readonlyness), functions (exact blacklist
 *    matches pass through unchanged; otherwise parameters and return type
 *    are revealed), `Promise`/`PromiseLike`, `Map`/`ReadonlyMap`,
 *    `Set`/`ReadonlySet`, then objects (below). Anything else (primitives
 *    not caught by the gate, `unknown`, `never` via distribution) passes
 *    through unchanged.
 *
 * Two orthogonal lists govern the reveal:
 * - `RevealWhitelist` — a SET of PRIVATE types (`$X`) to reveal. When a branded
 *   type's brand payload exactly matches a whitelist element
 *   (`AreNonDistributiveEqual`), its private `$X` shape is merged and every
 *   member is recursively revealed.
 * - `RecursionBlacklist` — a SET of types to STOP recursing into (returned as-
 *   is). Matches the whole type exactly. Orthogonal to the reveal whitelist.
 * Recursion is uniform for BRANDED types — every branded object is recursed
 * into unless blacklisted, and the reveal whitelist only decides
 * reveal-vs-traverse. Non-branded objects (no private brand, e.g. DOM types
 * like `HTMLElement` or plain data) are returned unchanged, which keeps the
 * reveal finite and the result assignable to the plain original. You no
 * longer list intermediate types on an access path:
 * `app.setting.settingTabs[i].id` is revealed by
 * `RevealPrivate<App, [$CommunityPluginsSettingTab | $UnknownSettingTab]>` —
 * `App` and `setting` are auto-traversed.
 *
 * The default `RevealWhitelist = readonly []` reveals nothing (traverse only);
 * list private types to reveal them. The default `RecursionBlacklist =
 * readonly []` blacklists nothing. A tuple element may itself be a union
 * (`X | Y`) and is matched exactly as one entry; the whole union `T = X | Y`
 * is matched as a single entry (individual members `X`/`Y` do not match).
 */
export type RevealPrivate<
  T,
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
> = RevealPrivateImpl<T, RevealWhitelist, RecursionBlacklist, Enumerate<Depth>>;
type RevealPrivateImpl<
  T,
  RevealWhitelist extends readonly unknown[],
  RecursionBlacklist extends readonly unknown[],
  Depth extends readonly unknown[],
> = Depth extends readonly []
  ? T
  : [T] extends [RevealPrivateExempt]
    ? T
    : RecursionBlacklistMatch<T, RecursionBlacklist> extends true
      ? T
      : [T] extends [object]
        ? RevealWhitelistMatch<T, RevealWhitelist> extends true
          ? RevealUnion<T, RevealWhitelist, RecursionBlacklist, Depth>
          : RevealPrivateStructural<
              T,
              RevealWhitelist,
              RecursionBlacklist,
              Depth
            >
        : RevealPrivateStructural<
            T,
            RevealWhitelist,
            RecursionBlacklist,
            Depth
          >;
type RevealPrivateStructural<
  T,
  RevealWhitelist extends readonly unknown[],
  RecursionBlacklist extends readonly unknown[],
  Depth extends readonly unknown[],
> = T extends readonly unknown[]
  ? number extends T["length"]
    ? T extends unknown[]
      ? RevealPrivateImpl<
          T[number],
          RevealWhitelist,
          RecursionBlacklist,
          Tail<Depth>
        >[]
      : readonly RevealPrivateImpl<
          T[number],
          RevealWhitelist,
          RecursionBlacklist,
          Tail<Depth>
        >[]
    : {
        [K in keyof T]: RevealPrivateImpl<
          T[K],
          RevealWhitelist,
          RecursionBlacklist,
          Tail<Depth>
        >;
      }
  : T extends (...args: infer A) => infer R
    ? RecursionBlacklistMatch<T, RecursionBlacklist> extends true
      ? T
      : WhitelistMatch<T, RevealWhitelist> extends true
        ? T
        : (
            ...args: {
              [K in keyof A]: RevealPrivateImpl<
                A[K],
                RevealWhitelist,
                RecursionBlacklist,
                Tail<Depth>
              >;
            }
          ) => RevealPrivateImpl<
            R,
            RevealWhitelist,
            RecursionBlacklist,
            Tail<Depth>
          >
    : T extends Promise<infer U>
      ? Promise<
          RevealPrivateImpl<U, RevealWhitelist, RecursionBlacklist, Tail<Depth>>
        >
      : T extends PromiseLike<infer U>
        ? PromiseLike<
            RevealPrivateImpl<
              U,
              RevealWhitelist,
              RecursionBlacklist,
              Tail<Depth>
            >
          >
        : T extends ReadonlyMap<infer K, infer V>
          ? T extends Map<unknown, unknown>
            ? Map<
                RevealPrivateImpl<
                  K,
                  RevealWhitelist,
                  RecursionBlacklist,
                  Tail<Depth>
                >,
                RevealPrivateImpl<
                  V,
                  RevealWhitelist,
                  RecursionBlacklist,
                  Tail<Depth>
                >
              >
            : ReadonlyMap<
                RevealPrivateImpl<
                  K,
                  RevealWhitelist,
                  RecursionBlacklist,
                  Tail<Depth>
                >,
                RevealPrivateImpl<
                  V,
                  RevealWhitelist,
                  RecursionBlacklist,
                  Tail<Depth>
                >
              >
          : T extends ReadonlySet<infer U>
            ? T extends Set<unknown>
              ? Set<
                  RevealPrivateImpl<
                    U,
                    RevealWhitelist,
                    RecursionBlacklist,
                    Tail<Depth>
                  >
                >
              : ReadonlySet<
                  RevealPrivateImpl<
                    U,
                    RevealWhitelist,
                    RecursionBlacklist,
                    Tail<Depth>
                  >
                >
            : T extends object
              ? RevealPrivateObject<
                  T,
                  RevealWhitelist,
                  RecursionBlacklist,
                  Depth
                >
              : T;
type RevealPrivateObject<
  T extends object,
  RevealWhitelist extends readonly unknown[],
  RecursionBlacklist extends readonly unknown[],
  Depth extends readonly unknown[],
> =
  RevealWhitelistMatch<T, RevealWhitelist> extends true
    ? RevealObject<T, RevealWhitelist, RecursionBlacklist, Depth>
    : TraverseObject<T, RevealWhitelist, RecursionBlacklist, Depth>;
/**
 * Eagerly replaces a whitelisted type by its merged shape and reveals every
 * member. `Prettify` flattens the intersection so narrowed property access
 * (`!== undefined` guards) and inference through the revealed type work.
 */
type RevealObject<
  T extends object,
  RevealWhitelist extends readonly unknown[],
  RecursionBlacklist extends readonly unknown[],
  Depth extends readonly unknown[],
> = Prettify<{
  [K in keyof MergePrivateShape<T>]: RevealPrivateImpl<
    MergePrivateShape<T>[K],
    RevealWhitelist,
    RecursionBlacklist,
    Tail<Depth>
  >;
}>;
/**
 * Eagerly reveals a (possibly union) object type whose whole shape exactly
 * matches a reveal-whitelist element. Distributes `RevealPrivate` over the
 * union's members so each is revealed by `RevealObject`; this is reached only
 * after `RevealWhitelistMatch<T, RevealWhitelist>` has matched the entire `T`
 * (e.g. `T = X | Y` against whitelist `[X | Y]`), so the union is revealed as a
 * whole rather than split before the whitelist is consulted.
 */
type RevealUnion<
  T,
  RevealWhitelist extends readonly unknown[],
  RecursionBlacklist extends readonly unknown[],
  Depth extends readonly unknown[],
> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? RevealObject<T, RevealWhitelist, RecursionBlacklist, Depth>
    : T;
/**
 * Uniformly reveals the members of a branded object without replacing it by
 * its shape. The brand key is omitted and every member is recursed into.
 * Non-branded objects (no private brand) are returned unchanged by the
 * `PrivateKeys$ extends keyof T` guard, which keeps cyclic types (e.g.
 * `HTMLElement`) finite and the result assignable to the plain original.
 */
type TraverseObject<
  T extends object,
  RevealWhitelist extends readonly unknown[],
  RecursionBlacklist extends readonly unknown[],
  Depth extends readonly unknown[],
> = Prettify<
  PrivateKeys$ extends keyof T
    ? {
        [K in keyof Omit<T, PrivateKeys$>]: RevealPrivateImpl<
          T[K],
          RevealWhitelist,
          RecursionBlacklist,
          Tail<Depth>
        >;
      }
    : T
>;

type RevealArgs<
  As extends readonly HasPrivate[],
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
> = {
  readonly [A in keyof As]: RevealPrivate<
    As[A],
    RevealWhitelist,
    RecursionBlacklist,
    Depth
  >;
};
type SyncResult<R> = R extends PromiseLike<unknown> ? never : R;

function revealPrivateInternal<
  const As extends readonly HasPrivate[],
  Result,
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
  ) => SyncResult<Result>,
  fallback: (error: unknown) => SyncResult<Result>,
): SyncResult<Result> {
  try {
    return func(
      ...(args as RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>),
    );
  } catch (error) {
    /* @__PURE__ */ self.console.debug(error);
    self.console.warn(
      context.language.value.t("errors.private-API-changed"),
      error,
    );
    return fallback(error);
  }
}
/**
 * Calls `func` with `args` where each arg's private members are revealed.
 *
 * @deprecated Prefer {@link revealPrivateFilter} with an explicit reveal
 *   whitelist. Without a whitelist, nothing is revealed (traverse only); the
 *   whitelist keeps the reveal scoped to exactly the private types you list.
 */
export function revealPrivate<
  const As extends readonly HasPrivate[],
  Result,
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
  ) => SyncResult<Result>,
  fallback: (error: unknown) => SyncResult<Result>,
): SyncResult<Result> {
  return revealPrivateInternal<
    As,
    Result,
    RevealWhitelist,
    RecursionBlacklist,
    Depth
  >(context, args, func, fallback);
}
export function revealPrivateFilter<
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
>(): <const As extends readonly HasPrivate[], Result>(
  context: PluginContext,
  args: As,
  func: (
    ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
  ) => SyncResult<Result>,
  fallback: (error: unknown) => SyncResult<Result>,
) => SyncResult<Result> {
  return function <const As extends readonly HasPrivate[], Result>(
    context: PluginContext,
    args: As,
    func: (
      ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
    ) => SyncResult<Result>,
    fallback: (error: unknown) => SyncResult<Result>,
  ): SyncResult<Result> {
    return revealPrivateInternal<
      As,
      Result,
      RevealWhitelist,
      RecursionBlacklist,
      Depth
    >(context, args, func, fallback);
  };
}

async function revealPrivateAsyncInternal<
  const As extends readonly HasPrivate[],
  Result,
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
  ) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
): Promise<Result> {
  try {
    return await func(
      ...(args as RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>),
    );
  } catch (error) {
    /* @__PURE__ */ self.console.debug(error);
    self.console.warn(
      context.language.value.t("errors.private-API-changed"),
      error,
    );
    return fallback(error);
  }
}
/**
 * Async variant of {@link revealPrivate}.
 *
 * @deprecated Prefer {@link revealPrivateAsyncFilter} with an explicit reveal
 *   whitelist.
 */
export async function revealPrivateAsync<
  const As extends readonly HasPrivate[],
  Result,
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
  ) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
): Promise<Result> {
  return revealPrivateAsyncInternal<
    As,
    Result,
    RevealWhitelist,
    RecursionBlacklist,
    Depth
  >(context, args, func, fallback);
}
export function revealPrivateAsyncFilter<
  RevealWhitelist extends readonly unknown[] = readonly [],
  RecursionBlacklist extends readonly unknown[] = readonly [],
  Depth extends number = DefaultRevealDepth,
>(): <const As extends readonly HasPrivate[], Result>(
  context: PluginContext,
  args: As,
  func: (
    ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
  ) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
) => Promise<Result> {
  return function <const As extends readonly HasPrivate[], Result>(
    context: PluginContext,
    args: As,
    func: (
      ...args: RevealArgs<As, RevealWhitelist, RecursionBlacklist, Depth>
    ) => PromiseLike<Result>,
    fallback: (error: unknown) => AsyncOrSync<Result>,
  ): Promise<Result> {
    return revealPrivateAsyncInternal<
      As,
      Result,
      RevealWhitelist,
      RecursionBlacklist,
      Depth
    >(context, args, func, fallback);
  };
}
