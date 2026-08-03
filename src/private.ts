import type {
  AsyncOrSync,
  Builtin,
  MarkRequired,
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
 * Brand interface for types that should be exempt from `RevealPrivate`
 * recursion. Any type extending this interface will pass through
 * `RevealPrivate<T>` unchanged.
 */
export interface RevealPrivateExempt {
  readonly __reveal_private_exempt?: never;
}
type RevealPrivate0<T> = Omit<T, PrivateKeys$> &
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
export type RevealPrivate<T, Filter = unknown> =
  T extends Exclude<Builtin, Error>
    ? T
    : T extends RevealPrivateExempt
      ? T
      : RevealPrivate2<T, Filter>;
type RevealPrivate2<T, Filter> = T extends readonly (infer U)[]
  ? T extends U[]
    ? RevealPrivate<U, Filter>[]
    : readonly RevealPrivate<U, Filter>[]
  : RevealPrivate3<T, Filter>;
type RevealPrivate3<T, Filter> = T extends Filter
  ? T extends object
    ? {
        [K in keyof RevealPrivate0<T>]: RevealPrivate<
          RevealPrivate0<T>[K],
          Filter
        >;
      }
    : T
  : T;

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
  return revealPrivate;
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
  return revealPrivateAsync;
}
