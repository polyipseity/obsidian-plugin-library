import type {
  DeepReadonly,
  DeepWritable,
  Opaque,
  WithOpaque,
} from "ts-essentials";
import type { LibraryUUIDs } from "./magic.js";

import SemVer from "semver/classes/semver.js";

export type AnyObject = Readonly<Record<string | number | symbol, unknown>>;
export interface AsyncFunctionConstructor {
  <const A extends readonly string[]>(
    ...args: A
  ): (
    this: unknown,
    ...args: A extends readonly [...infer B, unknown]
      ? {
          readonly [I in keyof B]: unknown;
        }
      : []
  ) => Promise<unknown>;
  new <const A extends readonly string[]>(
    ...args: A
  ): (
    this: unknown,
    ...args: A extends readonly [...infer B, unknown]
      ? {
          readonly [I in keyof B]: unknown;
        }
      : []
  ) => Promise<unknown>;
}
export type Base64String = Opaque<string, (typeof LibraryUUIDs)["UUID3"]>;
export type CodePoint = Opaque<string, (typeof LibraryUUIDs)["UUID0"]> & {
  readonly codePointAt: (pos: 0) => number;
};
export type Deopaque<T> =
  T extends WithOpaque<infer U>
    ? T extends Opaque<infer V, U>
      ? V
      : never
    : never;
export type DistributeKeys<T> = T extends unknown ? keyof T : never;
export type DistributeValues<T, K> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : never
  : never;
export type Evaluate<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends object
    ? T extends infer O
      ? { [K in keyof O]: O[K] }
      : never
    : T;
export type IsExact<T, U> =
  (<G>() => G extends T ? 1 : -1) extends <G>() => G extends U ? 1 : -1
    ? true
    : false;
export type ReadonlyTuple<Type = unknown> =
  | readonly []
  | readonly [Type, ...Type[]];
export type SemVerString = Opaque<string, (typeof LibraryUUIDs)["UUID1"]>;
export type Unchecked<T> = { readonly [_ in keyof T]?: unknown };

export const NULL_SEM_VER_STRING = semVerString("0.0.0");

export function contravariant<T>(value: readonly T[]): readonly T[] {
  return value;
}

export function correctType(value: Window): Window & typeof globalThis {
  return value as Window & typeof globalThis;
}

export function deopaque<T>(value: T): Deopaque<T> {
  return value as Deopaque<T>;
}

export function launderUnchecked<T extends object>(
  value: unknown,
): Unchecked<T> {
  const ret = {};
  Object.assign(ret, value);
  return ret;
}

export function opaqueOrDefault<T, I extends string, D>(
  type: (value: T) => Opaque<T, I>,
  value: T,
  defaultValue: D,
): D | Opaque<T, I> {
  try {
    return type(value);
  } catch (error) {
    /* @__PURE__ */ self.console.debug(error);
    return defaultValue;
  }
}
export function codePoint(value: string): CodePoint {
  const cp = value.codePointAt(0);
  if (cp === void 0 || String.fromCodePoint(cp) !== value) {
    throw new TypeError(value);
  }

  return value as CodePoint;
}
export function semVerString(value: string): SemVerString {
  return new SemVer(value).version as SemVerString;
}

export function simplifyType<T>(
  value: DeepWritable<DeepReadonly<T>> | DeepWritable<DeepWritable<T>>,
): DeepWritable<T>;
export function simplifyType<T>(
  value: DeepReadonly<DeepReadonly<T>> | DeepReadonly<DeepWritable<T>>,
): DeepReadonly<T>;
export function simplifyType<T>(value: T): T {
  return value;
}
