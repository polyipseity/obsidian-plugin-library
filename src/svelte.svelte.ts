/**
 * Write a value to the underlying `$state` store and return whatever the
 * `$state` call returns (it may or may not be the same value).
 *
 * @param props - value to set
 * @returns the result of invoking `$state(props)`
 */
export function svelteState<T>(props: T): T;

/**
 * Read the current value from the `$state` store.
 *
 * @returns the stored value, or `undefined` if none has been set yet
 */
export function svelteState<T>(): T | undefined;

/**
 * Shared implementation handling both read and write overloads of
 * `svelteState`.
 *
 * If `props` is provided the value is forwarded to the `$state` store and
 * whatever `$state` returns is returned to the caller. When called without
 * arguments the current stored value is retrieved instead.
 *
 * The public overloads above expose the two different signatures while
 * this internal definition consolidates the common logic with proper typing.
 *
 * @param props - optional value to set; omit to perform a read
 * @returns the stored value when reading, or the result of `$state(props)` when writing
 */
export function svelteState<T>(props?: T): T | undefined {
  return props === undefined ? $state() : $state(props as T);
}
