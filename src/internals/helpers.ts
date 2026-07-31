/**
 * Internal helpers ported from lodash, used to replace `lodash-es` without adding the `es-toolkit/compat` module.
 * Only the semantics needed by this library are implemented, with behavior matching the corresponding lodash functions.
 */

/**
 * Create a function that always returns `value`.
 */
export function constant<T>(value: T): () => T {
  return () => value;
}

/**
 * Check if `value` is an empty value, matching `lodash.isEmpty` semantics: nullish, empty strings/arrays, empty `Map`/`Set`, objects without own enumerable keys, and all other primitives are empty.
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }
  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }
  return true;
}

/**
 * Check if `value` is an object or a function, matching `lodash.isObject` semantics: `null` is not an object.
 */
export function isObject(value: unknown): value is object {
  return (
    value !== null && (typeof value === "object" || typeof value === "function")
  );
}

/**
 * Create an array of numbers from `start` up to but not including `end`, matching `lodash.range` semantics: `range(5)` yields `[0, 1, 2, 3, 4]`, `range(5, 2)` yields `[5, 4, 3]`, and `range(1, 4, 0)` yields `[1, 1, 1]`.
 */
export function range(
  start: number,
  end?: number,
  step?: number,
): readonly number[] {
  const start0 = end === undefined ? 0 : start,
    end0 = end === undefined ? start : end,
    step0 = step ?? (start0 < end0 ? 1 : -1),
    length = Math.max(Math.ceil((end0 - start0) / (step0 || 1)), 0);
  return Array.from({ length }, (_, index) => start0 + step0 * index);
}
