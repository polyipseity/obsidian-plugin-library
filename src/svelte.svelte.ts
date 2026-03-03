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
  // the Svelte compiler restricts direct calls to `$state(...)` inside
  // arbitrary functions – it only allows them as variable initializers,
  // class fields, or the first assignment to a class field at the top of a
  // constructor.  To work around that limitation we embed the store access
  // in a small helper class that performs the call from a constructor.
  //
  // Each invocation of `svelteState` creates a fresh instance of
  // `Internal` so the generic typing is preserved, and the actual call to
  // `$state` happens in the constructor where the compiler is happy.
  class Internal<U> {
    readonly val?: U;

    constructor(v?: U) {
      // first assignment to a class field in the constructor – permitted by the compiler
      const val = $state(v); // wtf: <https://github.com/sveltejs/svelte/issues/14600#issuecomment-2528564271>
      this.val = val;
    }
  }

  return new Internal<T>(props).val;
}
