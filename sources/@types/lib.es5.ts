declare global {
	interface FunctionConstructor {
		<const A extends readonly string[]>(
			...args: A
		): (this: unknown, ...args: A extends readonly [...infer B, unknown] ? {
			readonly [I in keyof B]: unknown
		} : []) => unknown
		new <const A extends readonly string[]>(
			...args: A
		): (this: unknown, ...args: A extends readonly [...infer B, unknown] ? {
			readonly [I in keyof B]: unknown
		} : []) => unknown
	}

	interface ObjectConstructor {
		// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/method-signature-style
		freeze<const T extends Function>(f: T): T
		// eslint-disable-next-line @typescript-eslint/method-signature-style
		freeze<const T extends Record<string, U | object | null | undefined>,
			U extends bigint | boolean | number | string | symbol>(o: T): Readonly<T>
		// eslint-disable-next-line @typescript-eslint/method-signature-style
		freeze<const T>(o: T): Readonly<T>
	}
}
