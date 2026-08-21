import type { RevealPrivateExempt } from "../private.js";

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

  // Builtins that pass through `RevealPrivate` unchanged extend the exempt
  // marker so the gate needs no special-case union. `Function` is
  // deliberately not augmented: it is a structural container whose
  // parameters and return type must be processed by the filter.
  interface String extends RevealPrivateExempt {}
  interface Number extends RevealPrivateExempt {}
  interface Boolean extends RevealPrivateExempt {}
  interface BigInt extends RevealPrivateExempt {}
  interface Symbol extends RevealPrivateExempt {}
  interface Date extends RevealPrivateExempt {}
  interface RegExp extends RevealPrivateExempt {}
}
