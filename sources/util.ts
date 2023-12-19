import {
	check_outros as $checkOutros,
	group_outros as $groupOutros,
	transition_out as $transitionOut,
} from "svelte/internal"
import {
	type AnyObject,
	type AsyncFunctionConstructor,
	type Base64String,
	type CodePoint,
	type ReadonlyTuple,
	contravariant,
	correctType,
	launderUnchecked,
	simplifyType,
} from "./types.js"
import type {
	AsyncOrSync,
	DeepReadonly,
	DeepWritable,
	Newable,
} from "ts-essentials"
import { NEVER_REGEX_G, SI_PREFIX_SCALE } from "./magic.js"
import {
	type PrimitiveTypeE,
	type TypeofMapE,
	genericTypeofGuardE,
} from "./typeof.js"
import {
	escapeRegExp,
	identity,
	isEmpty,
	isNil,
	isObject,
	noop,
	range,
} from "lodash-es"
import inspect, { type Options } from "browser-util-inspect"
import AsyncLock from "async-lock"
import { MAX_LOCK_PENDING } from "./internals/magic.js"
import type { SvelteComponent } from "svelte"

export type KeyModifier = "Alt" | "Ctrl" | "Meta" | "Shift"

export class EventEmitterLite<A extends readonly unknown[]> {
	protected static readonly emitLock = "emit"
	protected readonly lock = new AsyncLock({ maxPending: MAX_LOCK_PENDING })
	readonly #listeners: ((...args: A) => unknown)[] = []

	public async emit(...args: A): Promise<void> {
		return new Promise((resolve, reject) => {
			this.lock.acquire(EventEmitterLite.emitLock, async () => {
				// Copy to prevent concurrent modification
				const emitted = [...this.#listeners]
					.map(async list => { await list(...args) })
				resolve(Promise.all(emitted).then(noop))
				await Promise.allSettled(emitted)
			}).catch(reject)
		})
	}

	public listen(listener: (...args: A) => unknown): () => void {
		this.#listeners.push(listener)
		return () => { remove(this.#listeners, listener) }
	}
}

export type PromisePromise<T> = Promise<{
	readonly promise: Promise<T>
	readonly resolve: (value: AsyncOrSync<T>) => void
	readonly reject: (reason?: unknown) => void
}>

export class Functions<
	Async extends boolean = false,
	Args extends readonly unknown[] = [],
> extends Array<
	Async extends true ? (
		...args: Args
	) => unknown : Async extends false ? (
		...args: Args
	) => void : never> {
	public constructor(
		protected readonly options: {
			readonly async: Async
			readonly settled?: boolean
		},
		...args: readonly (Async extends true ? (
			...args: Args
		) => unknown : Async extends false ? (
			...args: Args
		) => void : never)[]
	) {
		super(...args)
	}

	public transform(func: (
		self0: this[number][],
	) => readonly this[number][]): Functions<Async, Args> {
		return new Functions(this.options, ...func(this))
	}

	public call(...args: Args): Async extends true
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		? Promise<void> : Async extends false ? void : never {
		return this.call0(null, ...args)
	}

	public call0(
		thisArg: unknown,
		...args: Args
	): Async extends true
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		? Promise<void> : Async extends false ? void : never
	public call0(thisArg: unknown, ...args: Args): AsyncOrSync<void> {
		const { async, settled } = this.options
		if (async) {
			return (async (): Promise<void> => {
				const promises = this.map(async func => {
					await func.call(thisArg, ...args)
				})
				if (settled ?? false) {
					await Promise.allSettled(promises)
					return
				}
				await Promise.all(promises)
			})()
		}
		this.forEach(settled ?? false
			? (func): void => {
				try {
					func.call(thisArg, ...args)
				} catch (error) {
					self.console.error(error)
				}
			}
			: (func): void => { func.call(thisArg, ...args) })
		return void 0
	}
}

export async function acquireConditionally<T>(
	lock: AsyncLock,
	key: string[] | string,
	condition: boolean,
	fn: () => PromiseLike<T> | T,
): Promise<T> {
	return condition ? lock.acquire(key, fn) : fn()
}

export function alternativeRegExp(strs: readonly string[]): RegExp {
	return isEmpty(strs)
		? NEVER_REGEX_G
		: new RegExp(
			[...strs]
				.sort(({ length: left }, { length: right }) => right - left)
				.map(escapeRegExp)
				.join("|"),
			"gu",
		)
}

export function anyToError(obj: unknown): Error {
	return obj instanceof Error ? obj : new Error(String(obj))
}

export function aroundIdentityFactory<T extends (this: unknown,
	...args: readonly unknown[]
) => unknown>() {
	return (proto: T) => function fn(
		this: ThisParameterType<T>,
		...args: Parameters<T>
	): ReturnType<T> {
		return proto.apply(this, args) as ReturnType<T>
	}
}

export function assignExact<K extends keyof any, T extends {
	[_ in K]?: unknown
}>(self0: T, key: K & keyof T, value?: T[K]): typeof value {
	if (value === void 0) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete self0[key]
	} else {
		self0[key] = value
	}
	return value
}

export function asyncDebounce<
	A extends readonly unknown[], R,
>(func: (
	resolve: (value: AsyncOrSync<R>) => void,
	reject: (reason?: unknown) => void,
	...args: A) => unknown): (...args: A) => Promise<R> {
	const promises: {
		readonly resolve: (value: AsyncOrSync<R>) => void
		readonly reject: (reason?: unknown) => void
	}[] = []
	return async (...args: A): Promise<R> =>
		new Promise((resolve, reject) => {
			promises.push({ reject, resolve })
			func(value => {
				for (const promise of promises.splice(0)) {
					promise.resolve(value)
				}
			}, error => {
				for (const promise of promises.splice(0)) {
					promise.reject(error)
				}
			}, ...args)
		})
}

export function asyncFunction(
	self0: typeof globalThis,
): AsyncFunctionConstructor {
	return self0.eval("(async()=>{}).constructor") as AsyncFunctionConstructor
}

export function base64ToBytes(base64: Base64String): Uint8Array {
	return Uint8Array.from(self.atob(base64), byte => byte.codePointAt(0) ?? NaN)
}

export function base64ToString(base64: Base64String): string {
	return new TextDecoder().decode(base64ToBytes(base64))
}

export function basename(path: string, ext = ""): string {
	const ret = path.slice(Math.max(
		path.lastIndexOf("/"),
		path.lastIndexOf("\\"),
	) + 1)
	return ret.endsWith(ext) ? ret.slice(0, ret.length - ext.length) : ret
}

export function bigIntReplacer(): (key: string, value: unknown) => unknown {
	return (_0, value) => {
		if (typeof value === "bigint") {
			return value.toString()
		}
		return value
	}
}

export function bracket<T extends object, K extends keyof any>(
	self0: T,
	key: K,
): { readonly valid: false; readonly value?: never }
	| { readonly valid: true; readonly value: T[K & keyof T] } {
	const proof = typedIn(self0, key)
	return Object.freeze(proof
		? { valid: true, value: proof() }
		: { valid: false })
}

export function bytesToBase64(bytes: Uint8Array): Base64String {
	return self.btoa(Array
		.from(bytes, byte => String.fromCodePoint(byte))
		.join("")) as Base64String
}

export function capitalize(
	str: string,
	locales?: string[] | string,
): string {
	return mapFirstCodePoint(str, first => first.toLocaleUpperCase(locales))
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function cartesianProduct<T extends readonly (readonly unknown[])[],
>(...arrays: T) {
	return deepFreeze(arrays.reduce((acc, arr) => acc
		.flatMap(comb => arr.map(ele => [comb, ele].flat())), [[]])) as
		readonly ({ readonly [I in keyof T]: T[I][number] } &
		{ readonly length: T["length"] })[]
}

export function clear(self0: unknown[]): void {
	self0.length = 0
}

export function clearProperties(self0: object): void {
	for (const key of typedOwnKeys(self0)) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete self0[key]
	}
}

export function cloneAsFrozen<T>(
	obj: T,
	cloner: <V>(value: V) => V = structuredClone,
): DeepReadonly<T> {
	return simplifyType<T>(deepFreeze(cloneAsWritable(obj, cloner)))
}

export function cloneAsWritable<T>(
	obj: T,
	cloner: <V>(value: V) => V = structuredClone,
): DeepWritable<T> {
	// `readonly` is fake at runtime
	return cloner(obj) as DeepWritable<T>
}

export function consumeEvent(event: Event): void {
	event.preventDefault()
	event.stopPropagation()
}

export function copyOnWrite<T extends object>(
	obj: DeepReadonly<T>,
	mutator: (obj: DeepWritable<T>) => void,
): DeepReadonly<T> {
	const ret = simplifyType<T>(cloneAsWritable(obj))
	mutator(ret)
	return simplifyType<T>(deepFreeze(ret))
}

export async function copyOnWriteAsync<T extends object>(
	obj: DeepReadonly<T>,
	mutator: (obj: DeepWritable<T>) => unknown,
): Promise<DeepReadonly<T>> {
	const ret = simplifyType<T>(cloneAsWritable(obj))
	await mutator(ret)
	return simplifyType<T>(deepFreeze(ret))
}

export function createChildElement<K extends keyof HTMLElementTagNameMap>(
	element: ParentNode & { readonly ownerDocument: Document },
	type: K,
	callback = (_element: HTMLElementTagNameMap[K]): void => { },
	options?: ElementCreationOptions,
): HTMLElementTagNameMap[K] {
	const ret = element.ownerDocument.createElement(type, options)
	element.append(ret)
	callback(ret)
	return ret
}

export function createDocumentFragment(
	self0: Document,
	callback: (fragment: DocumentFragment) => void,
): DocumentFragment {
	const ret = self0.createDocumentFragment()
	callback(ret)
	return ret
}

export function deepFreeze<const T>(value: T): DeepReadonly<T> {
	return deepFreeze0(value, new WeakSet())
}
function deepFreeze0<T>(value: T, freezing: WeakSet<object>): DeepReadonly<T> {
	if (typeof value === "object" && value) {
		freezing.add(value)
		for (const subkey of typedOwnKeys(value)) {
			const subvalue = value[subkey]
			if (isObject(subvalue) && !freezing.has(subvalue)) {
				deepFreeze0(subvalue, freezing)
			}
		}
	}
	return Object.freeze(value) as DeepReadonly<T>
}

// Feature request: https://github.com/sveltejs/svelte/issues/4056
export function destroyWithOutro(self0: SvelteComponent): void {
	const { $$: { fragment } } = self0
	if (fragment !== false && fragment) {
		try {
			$groupOutros()
			$transitionOut(fragment, 0, 0, () => { self0.$destroy() })
			$checkOutros()
		} catch (error) {
			self.console.error(error)
			self0.$destroy()
		}
	} else {
		self0.$destroy()
	}
}

export function escapeJavaScriptString(value: string): string {
	return `\`${value.replace(/(?<char>`|\\|\$)/ug, "\\$<char>")}\``
}

export function escapeQuerySelectorAttribute(value: string): string {
	return multireplace(value, new Map([
		["\"", "\\\""],
		["\\", "\\\\"],
	]))
}

export function extname(path: string): string {
	const base = basename(path),
		idx = base.lastIndexOf(".")
	return idx === -1 ? "" : base.slice(idx)
}

export function getKeyModifiers(
	event: KeyboardEvent,
): readonly KeyModifier[] {
	const ret: KeyModifier[] = []
	if (event.altKey) { ret.push("Alt") }
	if (event.ctrlKey) { ret.push("Ctrl") }
	if (event.metaKey) { ret.push("Meta") }
	if (event.shiftKey) { ret.push("Shift") }
	return deepFreeze(ret)
}

export function typedIn<T extends object, K extends keyof any>(
	self0: T,
	key: K,
): (() => T[K & keyof T]) | null {
	if (key in self0) {
		return () => self0[key as K & keyof T]
	}
	return null
}

export function typedOwnKeys<T extends object>(
	self0: T,
): (keyof T & (string | symbol))[] {
	return Reflect.ownKeys(self0) as (keyof T & (string | symbol))[]
}

export function typedKeys<T extends readonly (keyof any)[]>() {
	return <O extends (keyof O extends T[number] ? {
		readonly [_ in T[number]]: unknown
	} : never)>(obj: O): Readonly<T> =>
		deepFreeze(Object.keys(obj)) as T
}

export function inSet<const T extends ReadonlyTuple>(
	set: T,
	obj: unknown,
): obj is T[number] {
	return contravariant(set).includes(obj)
}

export function insertAt<T>(
	self0: T[],
	index: number,
	...items: readonly T[]
): void {
	self0.splice(index, 0, ...items)
}

export function instanceOf<T extends Node | UIEvent>(
	self0: unknown,
	type: Newable<T>,
): self0 is T {
	if (!isObject(self0)) { return false }
	if (self0 instanceof type) { return true }
	const { name } = type,
		typeMain: unknown = Reflect.get(self, name)
	if (typeof typeMain === "function" && self0 instanceof typeMain) {
		return true
	}
	const
		win = "ownerDocument" in self0
			? launderUnchecked<AnyObject>(self0.ownerDocument)["defaultView"]
			: launderUnchecked<AnyObject>(self0)["view"],
		typeWin: unknown = isObject(win) ? Reflect.get(win, name) : null
	if (typeof typeWin === "function" && self0 instanceof typeWin) {
		return true
	}
	return false
}

export function isHomogenousArray<T extends PrimitiveTypeE>(
	types: readonly T[],
	value: unknown,
): value is TypeofMapE[T][] {
	if (!Array.isArray(value)) { return false }
	return value.every(element => genericTypeofGuardE(types, element))
}

export function isNonNil<T>(
	value: (T & (null | undefined)) extends never ? never : T,
): value is (T & (null | undefined)) extends never ? never : NonNullable<T> {
	return !isNil(value)
}

export function lazyInit<T>(initializer: () => T): () => T {
	let cache: {
		readonly init: false
		readonly value: null
	} | {
		readonly init: true
		readonly value: T
	} = { init: false, value: null }
	return () => {
		const cache0 = cache.init
			? cache
			: cache = { init: true, value: initializer() }
		return cache0.value
	}
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function lazyProxy<T extends Function | object>(
	initializer: () => T,
): T {
	const lazy = lazyInit(initializer),
		functions = new Map(),
		proxy = new Proxy(lazy, {
			apply(target, thisArg, argArray): unknown {
				const target0 = target()
				if (typeof target0 !== "function") {
					throw new TypeError(String(target0))
				}
				return Reflect.apply(
					target0,
					thisArg === target ? target() : thisArg,
					argArray,
				)
			},
			construct(target, argArray, newTarget): object {
				const target0 = target()
				if (typeof target0 !== "function") {
					throw new TypeError(String(target0))
				}
				const ret: unknown = Reflect.construct(
					target0,
					argArray,
					newTarget === target ? target0 : newTarget,
				)
				if (isObject(ret)) { return ret }
				throw new TypeError(String(ret))
			},
			defineProperty(target, property, attributes): boolean {
				if (!(attributes.configurable ?? true) &&
					!Reflect.defineProperty(target, property, attributes)) {
					return false
				}
				return Reflect.defineProperty(target(), property, attributes)
			},
			deleteProperty(target, property): boolean {
				const own = Reflect.getOwnPropertyDescriptor(target, property)
				if (!(own?.configurable ?? true) &&
					!Reflect.deleteProperty(target, property)) {
					return false
				}
				return Reflect.deleteProperty(target(), property)
			},
			get(target, property, receiver): unknown {
				const own = Reflect.getOwnPropertyDescriptor(target, property)
				if (!(own?.configurable ?? true) &&
					// eslint-disable-next-line @typescript-eslint/no-extra-parens
					(!(own?.writable ?? true) || (own?.set && !own.get))) {
					return Reflect.get(target, property, receiver)
				}
				const ret = Reflect.get(
					target(),
					property,
					receiver === target ? target() : receiver,
				)
				if (typeof ret === "function") {
					const ret0 = ret
					// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
					return functions.get(ret) ?? (() => {
						function fn(
							this: unknown,
							...args: readonly unknown[]
						): unknown {
							// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
							if (new.target) {
								return Reflect.construct(
									ret0,
									args,
									new.target === fn ? ret0 : new.target,
								)
							}
							return Reflect.apply(
								ret0,
								this === proxy ? target() : this,
								args,
							)
						}
						functions.set(ret, fn)
						return fn
					})()
				}
				return ret
			},
			getOwnPropertyDescriptor(
				target,
				property,
			): PropertyDescriptor | undefined {
				let ret = Reflect.getOwnPropertyDescriptor(target(), property)
				if (ret && !(ret.configurable ?? true) &&
					!Reflect.defineProperty(target, property, ret)) {
					ret = void 0
				}
				return ret
			},
			getPrototypeOf(target): object | null {
				return Reflect.getPrototypeOf(target())
			},
			has(target, property): boolean {
				return Reflect.getOwnPropertyDescriptor(target, property)
					?.configurable ?? true
					? Reflect.has(target(), property)
					: Reflect.has(target, property)
			},
			isExtensible(target): boolean {
				return Reflect.isExtensible(target)
			},
			ownKeys(target): ArrayLike<string | symbol> {
				return [
					...new Set([
						Reflect.ownKeys(target()),
						Reflect.ownKeys(target)
							.filter(key => !(Reflect.getOwnPropertyDescriptor(target, key)
								?.configurable ?? true)),
					].flat()),
				]
			},
			preventExtensions(target): boolean {
				return Reflect.preventExtensions(target)
			},
			set(target, property, newValue, receiver): boolean {
				const own = Reflect.getOwnPropertyDescriptor(target, property)
				if (!(own?.configurable ?? true) &&
					// eslint-disable-next-line @typescript-eslint/no-extra-parens
					(!(own?.writable ?? true) || (own?.get && !own.set)) &&
					!Reflect.set(target, property, newValue, receiver)) {
					return false
				}
				return Reflect.set(
					target(),
					property,
					newValue,
					receiver === target ? target() : receiver,
				)
			},
			setPrototypeOf(target, proto): boolean {
				return Reflect.setPrototypeOf(target(), proto)
			},
		} satisfies Required<ProxyHandler<typeof lazy>>)
	return proxy as T
}

export function logFormat(
	options: Options,
	...args: readonly unknown[]
): string {
	if (isEmpty(args)) { return "" }
	const
		stringify0 = (param: unknown): string => {
			try {
				return inspect(param, options)
			} catch {
				// Do not log
				return String(param)
			}
		},
		[format, ...rest] = args
	if (typeof format === "string") {
		return [
			...(function* fn(): Generator<string, void> {
				const params = rest[Symbol.iterator]()
				let back = 0
				for (let sub = format.indexOf("%");
					sub !== -1;
					sub = format.indexOf("%", back)) {
					yield format.slice(back, sub)
					back = sub + "%".length
					const type = format.codePointAt(back)
					if (type === void 0) {
						yield "%"
						continue
					}
					const type0 = String.fromCodePoint(type)
					back += type0.length
					let func: ((param: unknown) => string) | null = null
					switch (type0) {
						case "%":
							yield "%%"
							break
						case "s":
							func = (param): string => String(param)
							break
						case "o":
						case "O":
							func = stringify0
							break
						case "f":
							func = (param): string => Number(param).toString()
							break
						case "d":
						case "i":
							func = (param): string => Math.trunc(Number(param)).toString()
							break
						case "c":
							// CSS unsupported
							func = (): string => ""
							break
						default:
							yield `%${type0}`
							break
					}
					if (func) {
						const param = params.next()
						if (param.done ?? false) {
							yield `%${type0}`
							break
						}
						yield func(param.value)
					}
				}
				yield format.slice(back)
				for (const param of params) {
					yield ` ${stringify0(param)}`
				}
			}()),
		].join("")
	}
	return args.map(stringify0).join(" ")
}

export function mapFirstCodePoint(
	str: string,
	map: (value: string) => string,
	mapRest: (value: string) => string = identity,
): string {
	const cp0 = str.codePointAt(0)
	if (cp0 === void 0) { return "" }
	const char0 = String.fromCodePoint(cp0)
	return `${map(char0)}${mapRest(str.slice(char0.length))}`
}

export function multireplace(
	self0: string,
	replacements: Map<string, string>,
): string {
	return self0.replace(
		alternativeRegExp([...replacements.keys()]),
		match => replacements.get(match) ?? match,
	)
}

export function onResize(
	element: Element,
	callback: (entry: ResizeObserverEntry) => void,
): ResizeObserver {
	const ret = new (activeSelf(element).ResizeObserver)(ents => {
		const ent = ents.at(-1)
		if (ent) { callback(ent) }
	})
	ret.observe(element)
	return ret
}

export function onVisible(
	element: Element,
	callback: (entry: IntersectionObserverEntry) => void,
	transient = false,
): IntersectionObserver {
	const ret = new (activeSelf(element).IntersectionObserver)(ents => {
		for (const ent of transient
			? ents.reverse()
			: [ents.at(-1) ?? { isIntersecting: false }]) {
			if (ent.isIntersecting) {
				callback(ent)
				break
			}
		}
	})
	ret.observe(element)
	return ret
}

export function openExternal(self0: Window, url?: URL | string): Window | null {
	return self0.open(url, "_blank", "noreferrer")
}

export async function promisePromise<T = void>(): PromisePromise<T> {
	return new Promise(resolve0 => {
		const promise = new Promise<T>((resolve, reject) => {
			resolve0(Promise.resolve()
				.then(() => ({ promise, reject, resolve })))
		})
	})
}

export function randomNotIn(
	self0: readonly string[],
	generator = (): string => self.crypto.randomUUID(),
): string {
	let ret = generator()
	while (self0.includes(ret)) { ret = generator() }
	return ret
}

export function rangeCodePoint(
	start: CodePoint,
	end?: CodePoint,
	step?: number,
): readonly string[] {
	return deepFreeze(
		range(start.codePointAt(0), end?.codePointAt(0), step)
			.map(cp => String.fromCodePoint(cp)),
	)
}

export function remove<T>(self0: T[], item: T): T | undefined {
	return removeAt(self0, self0.indexOf(item))
}

export function removeAt<T>(self0: T[], index: number): T | undefined {
	return self0.splice(index, 1)[0]
}

export function replaceAllRegex(string: string): RegExp {
	return new RegExp(escapeRegExp(string), "ug")
}

export function splitLines(
	str: string,
	delimiter = /\r\n|[\n\v\f\r\x85\u2028\u2029]/u,
): readonly string[] {
	return str.split(delimiter)
}

export function startCase(str: string, locales?: string[] | string): string {
	return str.replace(/\w\S*/gu, ss => mapFirstCodePoint(
		ss,
		str0 => str0.toLocaleUpperCase(locales),
		str0 => str0.toLocaleLowerCase(locales),
	))
}

export function stringToBase64(string: string): Base64String {
	return bytesToBase64(new TextEncoder().encode(string))
}

export function activeSelf(
	reference?: Element | UIEvent | null,
): Window & typeof globalThis {
	if (reference) {
		if ("ownerDocument" in reference) {
			const { ownerDocument: { defaultView } } = reference
			if (defaultView) { return defaultView }
		}
		if ("view" in reference) {
			const { view } = reference
			if (view) { return correctType(view) }
		}
		correctType(self.activeWindow).console.warn(reference)
	}
	return correctType(self.activeWindow)
}

export async function sleep2(
	self0: WindowOrWorkerGlobalScope,
	timeInSeconds: number,
): Promise<void> {
	return new Promise(resolve => {
		self0.setTimeout(resolve, timeInSeconds * SI_PREFIX_SCALE)
	})
}

export function swap(self0: unknown[], left: number, right: number): void {
	[self0[left], self0[right]] = [self0[right], self0[left]]
}

export function uncapitalize(
	str: string,
	locales?: string[] | string,
): string {
	return mapFirstCodePoint(str, first => first.toLocaleLowerCase(locales))
}

export function unexpected(): never {
	throw new Error()
}
