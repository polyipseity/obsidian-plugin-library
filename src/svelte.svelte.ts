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
  // Earlier versions used a single `Internal` class for both read and write
  // operations.  That worked fine, but the compiler only knows whether we're
  // using `new Internal(...)` with or without an argument at compile time.  To
  // make the generated code more explicit (and satisfy a developer request) we
  // now branch at runtime and define *two* tiny helper classes.  One is used
  // when the caller omitted arguments (read operation) and simply calls
  // `$state()`; the other is used when a value is provided and forwards that
  // value to `$state(v)`.
  //
  // We detect the difference using `arguments.length` rather than checking
  // `props === undefined`, because the generic `T` may legitimately be
  // `undefined` when the caller intends to store that value.
  if (arguments.length === 0) {
    class InternalRead<U> {
      readonly val: U | undefined;
      constructor() {
        // call with no arguments – allowed by the compiler inside the ctor
        const val = $state<U>();
        this.val = val;
      }
    }
    return new InternalRead<T>().val;
  } else {
    // a value must exist because `arguments.length > 0`, but the generic type
    // may legitimately be `undefined`.  Capture it in a local variable and
    // use a simple type assertion (not a forbidden non-null assertion comment)
    const value = props as T;
    class InternalWrite<U> {
      readonly val: U;
      constructor(v: U) {
        const val = $state(v);
        this.val = val;
      }
    }
    return new InternalWrite<T>(value).val;
  }
}
