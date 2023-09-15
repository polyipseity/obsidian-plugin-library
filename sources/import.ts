import PLazy from "p-lazy"
import { isNil } from "lodash-es"
import { lazyProxy } from "./util.js"

export type Bundle = Map<string, () => unknown>

export async function dynamicRequire<T>(
	...args: Parameters<typeof dynamicRequireSync>
): Promise<T> {
	return PLazy.from(() => dynamicRequireSync(...args))
}

export function dynamicRequireLazy<T extends object>(
	...args: Parameters<typeof dynamicRequireSync>
): T {
	return lazyProxy(() => dynamicRequireSync(...args))
}

export function dynamicRequireSync<T>(
	bundle: Bundle,
	module: string,
	require0 = require,
): T {
	const ret = (bundle.get(module) ?? ((): unknown => require0(module)))()
	if (isNil(ret)) { throw new Error(module) }
	return ret as T
}

export function importable(
	...args: Parameters<typeof dynamicRequireSync>
): boolean {
	try {
		dynamicRequireSync(...args)
		return true
	} catch (error) {
		self.console.debug(error)
		return false
	}
}
