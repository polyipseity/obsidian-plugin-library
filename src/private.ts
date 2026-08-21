import type {
  AsyncOrSync,
  IsNever,
  MarkRequired,
  Prettify,
  Primitive,
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
 * Brand marker for types that pass through `RevealPrivate` unchanged.
 * Prefer the whitelist `Filter` over this marker: it is only for types that
 * cannot be structurally represented. The marker is a required property so
 * index-signature objects (weak types) do not accidentally match it.
 *
 * @deprecated Prefer the whitelist `Filter` parameter. Builtin exceptions are
 *   handled by the gate directly; the marker is only for types that cannot be
 *   structurally represented.
 */
export interface RevealPrivateExempt {
  readonly __reveal_private_exempt: true;
}
/**
 * The maximum recursion depth of `RevealPrivate`. Cyclic types (e.g. DOM
 * nodes) return the raw type past this depth.
 */
type MaxRevealDepth = 8;
/**
 * True when `T` (after removing `undefined`/`null`) is exactly one element of
 * the `Filter` tuple. Subtypes and supertypes do not match. A tuple element
 * may itself be a union (`X | Y`) and is matched exactly as one entry.
 */
type WhitelistMatch<
  T,
  Filter extends readonly unknown[],
> = Filter extends readonly [infer Head, ...infer Tail]
  ? AreNonDistributiveEqual<NonNullable<T>, Head> extends true
    ? true
    : WhitelistMatch<T, Tail>
  : false;
/**
 * The exemption gate: types that pass through `RevealPrivate` unchanged.
 * The first member mirrors the deprecated `RevealPrivateExempt` marker
 * structurally (required property, so index-signature objects do not match);
 * the others are `Exclude<Builtin, Error | Function>` (primitives, `Date`,
 * `RegExp`), spelled out directly to avoid the banned `Function` type.
 * Functions are deliberately not exempt: they are structural containers whose
 * parameters and return type must be processed by the filter.
 */
type RevealPrivateExemptBuiltin =
  { readonly __reveal_private_exempt: true } | Primitive | Date | RegExp;
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
 * 1. **Depth guard** — past `MaxRevealDepth` (8), return `T` unchanged
 *    (terminates on cyclic types).
 * 2. **Builtin gate** — exempt types pass through unchanged: the
 *    `RevealPrivateExempt` marker shape and `Exclude<Builtin, Error |
 *    Function>` (primitives, `Date`, `RegExp`). Functions are deliberately
 *    NOT exempt: they are structural containers whose parameters and return
 *    type must be processed.
 * 3. **Structural dispatch** — tuples/arrays (preserving element
 *    optionality, rest elements, readonlyness), functions (exact filter
 *    matches pass through unchanged; otherwise parameters and return type
 *    are revealed), `Promise`/`PromiseLike`, `Map`/`ReadonlyMap`,
 *    `Set`/`ReadonlySet`, then objects (below). Anything else (primitives
 *    not caught by the gate, `unknown`, `never` via distribution) passes
 *    through unchanged.
 *
 * Object semantics: `Filter` decides between eager expansion and lazy
 * traversal. A type **exactly equal** to a filter element
 * (`AreNonDistributiveEqual`, not `extends`) is expanded — its private shape
 * is merged and every member is recursively revealed. Everything else is
 * traversed — the brand is dropped, members revealed, but the type itself is
 * kept, which keeps cyclic types (e.g. `HTMLElement`) finite.
 *
 * The default `Filter = readonly []` matches everything (aggressive mode):
 * every object is expanded up to the depth guard. Prefer an explicit filter
 * so the reveal is finite and scoped: `revealPrivateFilter<[App]>()`. A tuple
 * element may itself be a union (`X | Y`) and is matched exactly as one entry.
 */
export type RevealPrivate<
  T,
  Filter extends readonly unknown[] = readonly [],
  Depth extends readonly unknown[] = [],
> = Depth["length"] extends MaxRevealDepth
  ? T
  : T extends RevealPrivateExemptBuiltin
    ? T
    : RevealPrivateStructural<T, Filter, Depth>;
type RevealPrivateStructural<
  T,
  Filter extends readonly unknown[],
  Depth extends readonly unknown[],
> = T extends readonly unknown[]
  ? number extends T["length"]
    ? T extends unknown[]
      ? RevealPrivate<T[number], Filter, [...Depth, unknown]>[]
      : readonly RevealPrivate<T[number], Filter, [...Depth, unknown]>[]
    : { [K in keyof T]: RevealPrivate<T[K], Filter, [...Depth, unknown]> }
  : T extends (...args: infer A) => infer R
    ? WhitelistMatch<T, Filter> extends true
      ? T
      : (
          ...args: {
            [K in keyof A]: RevealPrivate<A[K], Filter, [...Depth, unknown]>;
          }
        ) => RevealPrivate<R, Filter, [...Depth, unknown]>
    : T extends Promise<infer U>
      ? Promise<RevealPrivate<U, Filter, [...Depth, unknown]>>
      : T extends PromiseLike<infer U>
        ? PromiseLike<RevealPrivate<U, Filter, [...Depth, unknown]>>
        : T extends ReadonlyMap<infer K, infer V>
          ? T extends Map<unknown, unknown>
            ? Map<
                RevealPrivate<K, Filter, [...Depth, unknown]>,
                RevealPrivate<V, Filter, [...Depth, unknown]>
              >
            : ReadonlyMap<
                RevealPrivate<K, Filter, [...Depth, unknown]>,
                RevealPrivate<V, Filter, [...Depth, unknown]>
              >
          : T extends ReadonlySet<infer U>
            ? T extends Set<unknown>
              ? Set<RevealPrivate<U, Filter, [...Depth, unknown]>>
              : ReadonlySet<RevealPrivate<U, Filter, [...Depth, unknown]>>
            : T extends object
              ? RevealPrivateObject<T, Filter, Depth>
              : T;
type RevealPrivateObject<
  T extends object,
  Filter extends readonly unknown[],
  Depth extends readonly unknown[],
> =
  WhitelistMatch<T, Filter> extends true
    ? ExpandObject<T, Filter, Depth>
    : TraverseObject<T, Filter, Depth>;
/**
 * Eagerly replaces a whitelisted type by its merged shape and reveals every
 * member. `Prettify` flattens the intersection so narrowed property access
 * (`!== undefined` guards) and inference through the revealed type work.
 */
type ExpandObject<
  T extends object,
  Filter extends readonly unknown[],
  Depth extends readonly unknown[],
> = Prettify<{
  [K in keyof MergePrivateShape<T>]: RevealPrivate<
    MergePrivateShape<T>[K],
    Filter,
    [...Depth, unknown]
  >;
}>;
/**
 * Lazily reveals the members of a branded (or string-indexed) type without
 * replacing it by its shape. Unbranded object types (e.g. DOM types like
 * `HTMLElement`) have no hidden members and pass through unchanged, which
 * keeps the reveal finite and the result assignable to the plain original.
 */
type TraverseObject<
  T extends object,
  Filter extends readonly unknown[],
  Depth extends readonly unknown[],
> = Prettify<
  PrivateKeys$ extends keyof T
    ? {
        [K in keyof Omit<T, PrivateKeys$>]: RevealPrivate<
          T[K],
          Filter,
          [...Depth, unknown]
        >;
      }
    : T
>;

type RevealArgs<
  As extends readonly HasPrivate[],
  Filter extends readonly unknown[],
> = { readonly [A in keyof As]: RevealPrivate<As[A], Filter> };
type SyncResult<R> = R extends PromiseLike<unknown> ? never : R;

function revealPrivateInternal<
  const As extends readonly HasPrivate[],
  Result,
  Filter extends readonly unknown[],
>(
  context: PluginContext,
  args: As,
  func: (...args: RevealArgs<As, Filter>) => SyncResult<Result>,
  fallback: (error: unknown) => SyncResult<Result>,
): SyncResult<Result> {
  try {
    return func(...(args as RevealArgs<As, Filter>));
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
 * @deprecated Prefer {@link revealPrivateFilter} with an explicit whitelist.
 *   Without a filter, every type is expanded aggressively; the filter keeps
 *   the reveal finite and scoped to exactly whitelisted types.
 */
export function revealPrivate<
  const As extends readonly HasPrivate[],
  Result,
  Filter extends readonly unknown[] = readonly [],
>(
  context: PluginContext,
  args: As,
  func: (...args: RevealArgs<As, Filter>) => SyncResult<Result>,
  fallback: (error: unknown) => SyncResult<Result>,
): SyncResult<Result> {
  return revealPrivateInternal<As, Result, Filter>(
    context,
    args,
    func,
    fallback,
  );
}
export function revealPrivateFilter<
  Filter extends readonly unknown[] = readonly [],
>(): <const As extends readonly HasPrivate[], Result>(
  context: PluginContext,
  args: As,
  func: (...args: RevealArgs<As, Filter>) => SyncResult<Result>,
  fallback: (error: unknown) => SyncResult<Result>,
) => SyncResult<Result> {
  return function <const As extends readonly HasPrivate[], Result>(
    context: PluginContext,
    args: As,
    func: (...args: RevealArgs<As, Filter>) => SyncResult<Result>,
    fallback: (error: unknown) => SyncResult<Result>,
  ): SyncResult<Result> {
    return revealPrivateInternal<As, Result, Filter>(
      context,
      args,
      func,
      fallback,
    );
  };
}

async function revealPrivateAsyncInternal<
  const As extends readonly HasPrivate[],
  Result,
  Filter extends readonly unknown[],
>(
  context: PluginContext,
  args: As,
  func: (...args: RevealArgs<As, Filter>) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
): Promise<Result> {
  try {
    return await func(...(args as RevealArgs<As, Filter>));
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
 * @deprecated Prefer {@link revealPrivateAsyncFilter} with an explicit
 *   whitelist.
 */
export async function revealPrivateAsync<
  const As extends readonly HasPrivate[],
  Result,
  Filter extends readonly unknown[] = readonly [],
>(
  context: PluginContext,
  args: As,
  func: (...args: RevealArgs<As, Filter>) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
): Promise<Result> {
  return revealPrivateAsyncInternal<As, Result, Filter>(
    context,
    args,
    func,
    fallback,
  );
}
export function revealPrivateAsyncFilter<
  Filter extends readonly unknown[] = readonly [],
>(): <const As extends readonly HasPrivate[], Result>(
  context: PluginContext,
  args: As,
  func: (...args: RevealArgs<As, Filter>) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
) => Promise<Result> {
  return function <const As extends readonly HasPrivate[], Result>(
    context: PluginContext,
    args: As,
    func: (...args: RevealArgs<As, Filter>) => PromiseLike<Result>,
    fallback: (error: unknown) => AsyncOrSync<Result>,
  ): Promise<Result> {
    return revealPrivateAsyncInternal<As, Result, Filter>(
      context,
      args,
      func,
      fallback,
    );
  };
}
