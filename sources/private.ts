import type { PluginContext } from "./plugin.js"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PrivateKeys { }
export type PrivateKeys$ = keyof PrivateKeys
export type Private<T, P extends keyof PrivateKeys> = { readonly [_ in P]: T }
export type RevealPrivate<T extends Private<unknown, PrivateKeys$>> =
	Omit<T, PrivateKeys$> & T[PrivateKeys$]

export function revealPrivate<
	const As extends readonly Private<unknown, PrivateKeys$>[],
	R,
>(
	context: PluginContext,
	args: As,
	func: (
		...args: { readonly [A in keyof As]: RevealPrivate<As[A]> }
	) => R extends PromiseLike<unknown> ? never : R,
	fallback: (
		error: unknown,
		...args: As
	) => R extends PromiseLike<unknown> ? never : R,
): R extends PromiseLike<unknown> ? never : R {
	try {
		return func(...args as { readonly [A in keyof As]: RevealPrivate<As[A]> })
	} catch (error) {
		self.console.warn(
			context.language.i18n.t("errors.private-API-changed"),
			error,
		)
		return fallback(error, ...args)
	}
}
export async function revealPrivateAsync<
	const As extends readonly Private<unknown, PrivateKeys$>[],
	R extends PromiseLike<unknown>,
>(
	context: PluginContext,
	args: As,
	func: (...args: { readonly [A in keyof As]: RevealPrivate<As[A]> }) => R,
	fallback: (error: unknown, ...args: As) => R,
): Promise<Awaited<R>> {
	try {
		return await func(...args as
			{ readonly [A in keyof As]: RevealPrivate<As[A]> })
	} catch (error) {
		self.console.warn(
			context.language.i18n.t("errors.private-API-changed"),
			error,
		)
		return await fallback(error, ...args)
	}
}
