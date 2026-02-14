/**
 * tests/helpers.ts
 *
 * Lightweight, documented test helpers used across unit tests.
 * Goals:
 *  - Reduce duplication by centralizing mock creation
 *  - Provide strongly typed factories to avoid `as` casts in individual tests
 *  - Keep implementations minimal and easy to stub / spy on
 */

/**
 * Small helper to cast values to records for assertions without repeating inline casts.
 */
export function toRecord<
  T extends Record<string | number | symbol, unknown> = Record<
    string | number | symbol,
    unknown
  >,
>(v: unknown): T {
  return v as T;
}

/**
 * Wait for the next macrotask tick — useful to await scheduled IIFEs or setImmediate usage
 * in the library code under test.
 */
export function tick(): Promise<void> {
  return new Promise((r) => setImmediate(r));
}
