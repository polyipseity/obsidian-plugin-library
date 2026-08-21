declare global {
  interface FunctionConstructor {
    <const A extends readonly string[]>(
      ...args: A
    ): (
      this: unknown,
      ...args: A extends readonly [...infer B, unknown]
        ? {
            readonly [I in keyof B]: unknown;
          }
        : []
    ) => unknown;
    new <const A extends readonly string[]>(
      ...args: A
    ): (
      this: unknown,
      ...args: A extends readonly [...infer B, unknown]
        ? {
            readonly [I in keyof B]: unknown;
          }
        : []
    ) => unknown;
  }

  interface ObjectConstructor {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- type augmentation for Function
    freeze<const T extends Function>(f: T): T;

    freeze<
      const T extends Record<string, U | object | null | undefined>,
      U extends bigint | boolean | number | string | symbol,
    >(
      o: T,
    ): Readonly<T>;

    freeze<const T>(o: T): Readonly<T>;
  }

  // Builtins that pass through `RevealPrivate` unchanged carry the exempt
  // marker so the gate needs no special-case union. `Function` is
  // deliberately not augmented: it is a structural container whose
  // parameters and return type must be processed by the filter.
  interface String {
    readonly __reveal_private_exempt: true;
  }
  interface Number {
    readonly __reveal_private_exempt: true;
  }
  interface Boolean {
    readonly __reveal_private_exempt: true;
  }
  interface BigInt {
    readonly __reveal_private_exempt: true;
  }
  interface Symbol {
    readonly __reveal_private_exempt: true;
  }
  interface Date {
    readonly __reveal_private_exempt: true;
  }
  interface RegExp {
    readonly __reveal_private_exempt: true;
  }
}
