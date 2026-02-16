import type { AsyncOrSync, Builtin, UnionToIntersection } from "ts-essentials";
import type { DistributeValues } from "./types.js";
import type { PluginContext } from "./plugin.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PrivateKeys {
  // Empty for interface extension.
}
export type PrivateKeys$ = keyof PrivateKeys;
export type Private<T, P extends keyof PrivateKeys> = Readonly<Record<P, T>>;
export type HasPrivate<P extends keyof PrivateKeys = PrivateKeys$> = {
  readonly [K in P]: Private<unknown, K>;
}[P];
type RevealPrivate0<T> = Omit<T, PrivateKeys$> &
  UnionToIntersection<DistributeValues<T, PrivateKeys$>>;
export type RevealPrivate<T> =
  T extends Exclude<Builtin, Error> ? T : RevealPrivate2<T>;
type RevealPrivate2<T> = T extends readonly (infer U)[]
  ? T extends U[]
    ? RevealPrivate<U>[]
    : readonly RevealPrivate<U>[]
  : RevealPrivate3<T>;
type RevealPrivate3<T> = T extends object
  ? {
      [K in keyof RevealPrivate0<T>]: RevealPrivate<RevealPrivate0<T>[K]>;
    }
  : T;
export function revealPrivate<const As extends readonly HasPrivate[], R>(
  context: PluginContext,
  args: As,
  func: (
    ...args: { readonly [A in keyof As]: RevealPrivate<As[A]> }
  ) => R extends PromiseLike<unknown> ? never : R,
  fallback: (error: unknown) => R extends PromiseLike<unknown> ? never : R,
): R extends PromiseLike<unknown> ? never : R {
  try {
    return func(
      ...(args as { readonly [A in keyof As]: RevealPrivate<As[A]> }),
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
  R,
>(
  context: PluginContext,
  args: As,
  func: (
    ...args: {
      readonly [A in keyof As]: RevealPrivate<As[A]>;
    }
  ) => PromiseLike<R>,
  fallback: (error: unknown) => AsyncOrSync<R>,
): Promise<R> {
  try {
    return await func(
      ...(args as { readonly [A in keyof As]: RevealPrivate<As[A]> }),
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
