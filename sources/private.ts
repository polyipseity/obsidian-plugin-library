import type { Builtin, UnionToIntersection } from "ts-essentials"
import type { DistributeValues } from "./types.js"
import type { PluginContext } from "./plugin.js"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PrivateKeys { }
export type PrivateKeys$ = keyof PrivateKeys
export type Private<T, P extends keyof PrivateKeys> = { readonly [_ in P]: T }
export type HasPrivate<P extends keyof PrivateKeys = PrivateKeys$> = {
	readonly [K in P]: Private<unknown, K>
}[P]
type RevealPrivate0<T> =
	Omit<T, PrivateKeys$> & UnionToIntersection<DistributeValues<T, PrivateKeys$>>
export type RevealPrivate<T> = T extends Builtin ? T : {
	[K in keyof RevealPrivate0<T>]: RevealPrivate<RevealPrivate0<T>[K]>
}

export function revealPrivate<const As extends readonly HasPrivate[], R>(
	context: PluginContext,
	args: As,
	func: (
		...args: { readonly [A in keyof As]: RevealPrivate<As[A]> }
	) => R extends PromiseLike<unknown> ? never : R,
	fallback: (error: unknown) => R extends PromiseLike<unknown> ? never : R,
): R extends PromiseLike<unknown> ? never : R {
	try {
		return func(...args as { readonly [A in keyof As]: RevealPrivate<As[A]> })
	} catch (error) {
		self.console.warn(
			context.language.value.t("errors.private-API-changed"),
			error,
		)
		return fallback(error)
	}
}
export async function revealPrivateAsync<
	const As extends readonly HasPrivate[],
	R extends PromiseLike<unknown>,
>(
	context: PluginContext,
	args: As,
	func: (...args: { readonly [A in keyof As]: RevealPrivate<As[A]> }) => R,
	fallback: (error: unknown) => Awaited<R> | R,
): Promise<Awaited<R>> {
	try {
		return await func(...args as
			{ readonly [A in keyof As]: RevealPrivate<As[A]> })
	} catch (error) {
		self.console.warn(
			context.language.value.t("errors.private-API-changed"),
			error,
		)
		return await fallback(error)
	}
}
