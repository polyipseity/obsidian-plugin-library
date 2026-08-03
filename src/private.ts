import type {
  AsyncOrSync,
  MarkRequired,
  Prettify,
  Primitive,
  UnionToIntersection,
} from "ts-essentials";
import type { PluginContext } from "./plugin.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extension point for private keys
export interface PrivateKeys {
  // Empty for interface extension.
}
export type PrivateKeys$ = keyof PrivateKeys;
export type Private<T, P extends keyof PrivateKeys> = {
  readonly [K in P]?: T;
};
export type HasPrivate<P extends keyof PrivateKeys = PrivateKeys$> = {
  readonly [K in P]: Private<unknown, K>;
}[P];
/**
 * Brand marker for types that pass through `RevealPrivate` unchanged.
 * Prefer the whitelist `Filter` over this marker: it is only for types that
 * cannot be structurally represented. The marker is a required property so
 * index-signature objects (weak types) do not accidentally match it.
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
 * Exact structural equality via the deferred-instantiation trick (type-fest
 * `IsEqual`). Order-sensitive; used for whitelist gate semantics.
 */
type IsEqualExact<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? _IsEqual<A, B>
    : false
  : false;
type _IsEqual<A, B> =
  (<G>() => G extends (A & G) | G ? 1 : 2) extends <G>() => G extends
    (B & G) | G
    ? 1
    : 2
    ? true
    : false;
/**
 * True when `T` (after removing `undefined`/`null`) is exactly one member of
 * the `Filter` union. Subtypes and supertypes do not match.
 */
type WhitelistMatch<T, Filter> = [unknown] extends [Filter]
  ? true
  : true extends (
        Filter extends unknown ? IsEqualExact<NonNullable<T>, Filter> : never
      )
    ? true
    : false;
/**
 * The exemption gate: types that pass through `RevealPrivate` unchanged.
 * `RevealPrivateExempt` is an explicit opt-out; the other members are
 * `Exclude<Builtin, Error | Function>` (primitives, `Date`, `RegExp`), spelled
 * out directly to avoid the banned `Function` type. Functions are deliberately
 * not exempt: they are structural containers whose parameters and return type
 * must be processed by the filter.
 */
type RevealPrivateExemptBuiltin =
  RevealPrivateExempt | Primitive | Date | RegExp;
/**
 * The public members of `T` merged with its private shape (the `$X` brand
 * value). String-indexed types skip the brand merge: their index signature
 * would answer the brand lookup with the value type, corrupting the merged
 * shape (e.g. `Record<string, X>` would gain `X`'s members).
 */
type MergePrivateShape<T> = string extends keyof T
  ? Omit<T, PrivateKeys$>
  : Omit<T, PrivateKeys$> &
      (MarkRequired<T, Extract<PrivateKeys$, keyof T>>[Extract<
        PrivateKeys$,
        keyof T
      >] extends never
        ? unknown
        : UnionToIntersection<
            MarkRequired<T, Extract<PrivateKeys$, keyof T>>[Extract<
              PrivateKeys$,
              keyof T
            >]
          >);
/**
 * Removes the private brand of `T` and reveals its members.
 *
 * `Filter` decides which object types are eagerly expanded: only types exactly
 * equal to a filter member are expanded; everything else is traversed lazily.
 * The default `unknown` filter matches everything (aggressive mode).
 */
export type RevealPrivate<
  T,
  Filter = unknown,
  Depth extends readonly unknown[] = [],
> = Depth["length"] extends MaxRevealDepth
  ? T
  : T extends RevealPrivateExemptBuiltin
    ? T
    : RevealPrivateStructural<T, Filter, Depth>;
type RevealPrivateStructural<
  T,
  Filter,
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
  Filter,
  Depth extends readonly unknown[],
> =
  WhitelistMatch<T, Filter> extends true
    ? ExpandObject<T, Filter, Depth>
    : TraverseObject<T, Filter, Depth>;
type ExpandObject<
  T extends object,
  Filter,
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
  Filter,
  Depth extends readonly unknown[],
> = PrivateKeys$ extends keyof T
  ? {
      [K in keyof Omit<T, PrivateKeys$>]: RevealPrivate<
        T[K],
        Filter,
        [...Depth, unknown]
      >;
    }
  : T;

function revealPrivateInternal<
  const As extends readonly HasPrivate[],
  Result,
  Filter,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }
  ) => Result extends PromiseLike<unknown> ? never : Result,
  fallback: (
    error: unknown,
  ) => Result extends PromiseLike<unknown> ? never : Result,
): Result extends PromiseLike<unknown> ? never : Result {
  try {
    return func(
      ...(args as { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }),
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
export function revealPrivate<
  const As extends readonly HasPrivate[],
  Result,
  Filter = unknown,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }
  ) => Result extends PromiseLike<unknown> ? never : Result,
  fallback: (
    error: unknown,
  ) => Result extends PromiseLike<unknown> ? never : Result,
): Result extends PromiseLike<unknown> ? never : Result {
  return revealPrivateInternal<As, Result, Filter>(
    context,
    args,
    func,
    fallback,
  );
}
export function revealPrivateFilter<Filter>(): <
  const As extends readonly HasPrivate[],
  Result,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }
  ) => Result extends PromiseLike<unknown> ? never : Result,
  fallback: (
    error: unknown,
  ) => Result extends PromiseLike<unknown> ? never : Result,
) => Result extends PromiseLike<unknown> ? never : Result {
  return function <const As extends readonly HasPrivate[], Result>(
    context: PluginContext,
    args: As,
    func: (
      ...args: { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }
    ) => Result extends PromiseLike<unknown> ? never : Result,
    fallback: (
      error: unknown,
    ) => Result extends PromiseLike<unknown> ? never : Result,
  ): Result extends PromiseLike<unknown> ? never : Result {
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
  Filter,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: {
      readonly [A in keyof As]: RevealPrivate<As[A], Filter>;
    }
  ) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
): Promise<Result> {
  try {
    return await func(
      ...(args as { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }),
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
export async function revealPrivateAsync<
  const As extends readonly HasPrivate[],
  Result,
  Filter = unknown,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: {
      readonly [A in keyof As]: RevealPrivate<As[A], Filter>;
    }
  ) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
): Promise<Result> {
  return revealPrivateAsyncInternal<As, Result, Filter>(
    context,
    args,
    func,
    fallback,
  );
}
export function revealPrivateAsyncFilter<Filter>(): <
  const As extends readonly HasPrivate[],
  Result,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: { readonly [A in keyof As]: RevealPrivate<As[A], Filter> }
  ) => PromiseLike<Result>,
  fallback: (error: unknown) => AsyncOrSync<Result>,
) => Promise<Result> {
  return function <const As extends readonly HasPrivate[], Result>(
    context: PluginContext,
    args: As,
    func: (
      ...args: {
        readonly [A in keyof As]: RevealPrivate<As[A], Filter>;
      }
    ) => PromiseLike<Result>,
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
