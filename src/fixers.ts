import {
  type InverseTypeofMapE,
  type PrimitiveOfE,
  genericTypeofGuardE,
  primitiveOfE,
} from "./typeof.js";
import type { ReadonlyTuple, Unchecked } from "./types.js";
import { inSet, isHomogenousArray, lazyInit } from "./utils.js";
import type { DeepWritable } from "ts-essentials";
import deepEqual from "deep-equal";

export interface Fixed<T> {
  readonly value: DeepWritable<T>;
  readonly valid: boolean;
}
export type Fixer<T> = (value: unknown) => Fixed<T>;

export function markFixed<T>(
  unchecked: unknown,
  fixed: DeepWritable<T>,
): Fixed<T> {
  const validator = lazyInit(() =>
    deepEqual(unchecked, fixed, { strict: true }),
  );
  return Object.freeze({
    get valid() {
      return validator();
    },
    value: fixed,
  });
}

export function fixTyped<S, K extends keyof S>(
  defaults: S,
  from: Unchecked<S>,
  key: K,
  types: readonly InverseTypeofMapE<S[K]>[],
): PrimitiveOfE<S[K]> {
  const val = from[key];
  return genericTypeofGuardE(types, val) ? val : primitiveOfE(defaults[key]);
}

export function fixArray<
  S,
  K extends keyof S,
  V extends S[K] extends readonly (infer V0)[] ? V0 : never,
>(
  defaults: S,
  from: Unchecked<S>,
  key: K,
  types: readonly InverseTypeofMapE<V>[],
): PrimitiveOfE<V>[] {
  const default0 = defaults[key];
  if (!Array.isArray(default0)) {
    throw new TypeError(String(default0));
  }
  const val = from[key];
  if (isHomogenousArray(types, val)) {
    return val;
  }
  const default1: readonly V[] = default0;
  return default1.map(primitiveOfE);
}

export function fixInSet<S, K extends keyof S, const Vs extends ReadonlyTuple>(
  defaults: S,
  from: Unchecked<S>,
  key: K,
  set: Vs,
): Vs[number] {
  const val = from[key];
  return inSet(set, val) ? val : defaults[key];
}
