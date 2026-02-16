/**
 * Test helper — relax i18n typings for unit tests.
 *
 * asUntypedI18n() returns the given runtime i18n instance but widens the
 * `t()` signature so tests can use arbitrary keys without inheriting the
 * production `CustomTypeOptions`.
 *
 * NOTE: a stronger/safer alternative is to implement a generic `TypedI18n`
 * / `createI18n` that infers allowed keys from the `resources` object
 * (mentioned as "option 2" in the issue). That can be added later alongside
 * this helper.
 */

import type { i18n } from "i18next";

export function asUntypedI18n(instance: i18n) {
  return instance as unknown as Omit<i18n, "t"> & {
    t(key: string, opts?: unknown): string;
  };
}
