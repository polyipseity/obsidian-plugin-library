/**
 * Comprehensive tests for src/private.ts — private API access utilities
 *
 * Runtime tests exercise the recommended `revealPrivateFilter` /
 * `revealPrivateAsyncFilter` entry points (with `Filter = unknown` for the
 * aggressive expansion). The deprecated unfiltered `revealPrivate` and
 * `revealPrivateAsync` are thin delegations to the same internal machinery.
 */
import type {
  App,
  BakedHotkey,
  CommunityPluginsSettingTab,
  Keymap,
  UnknownSettingTab,
} from "obsidian";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import type { PluginContext } from "../../src/plugin.js";
import {
  revealPrivateAsyncFilter,
  revealPrivateFilter,
  type HasPrivate,
  type PrivateKeys,
  type RevealPrivate,
} from "../../src/private.js";

// Compile-time assertion helpers replaced by `expectTypeOf` (vitest) and
// `AreNonDistributiveEqual` (ts-essentials) — see
// .agents/instructions/reveal-private.instructions.md.
import type { AreNonDistributiveEqual } from "ts-essentials/dist/are-non-distributive-equal.js";

describe("private.ts — private API access", () => {
  // Create a mock plugin context
  const createMockContext = (): PluginContext => {
    // keep this lightweight for tests and assert to PluginContext to avoid a huge literal
    return {
      language: { value: { t: (key: string) => `translated:${key}` } },
    } as unknown as PluginContext;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test helper: construct a value that satisfies the library's internal `HasPrivate` type.
  // Centralises the unavoidable assertion so individual tests remain readable.
  function makeHasPrivate<const T extends object>(value: T): T & HasPrivate {
    return value;
  }

  describe("revealPrivateFilter (aggressive)", () => {
    it("executes function with revealed private properties", () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ public: "visible", private: "hidden" });

      const result = revealPrivateFilter<[]>()(
        context,
        [obj],
        (revealed) => {
          return revealed.public;
        },
        () => "fallback",
      );

      expect(result).toBe("visible");
    });

    it("returns result from function execution", () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ value: 42 });

      const result = revealPrivateFilter<[]>()(
        context,
        [obj],
        (revealed) => revealed.value * 2,
        () => 0,
      );

      expect(result).toBe(84);
    });

    it("calls fallback on error", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = revealPrivateFilter<[]>()(
        context,
        [obj],
        () => {
          throw new Error("Test error");
        },
        (error) => {
          expect(error).toBeInstanceOf(Error);
          return "fallback-value";
        },
      );

      expect(result).toBe("fallback-value");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalled();
    });

    it("logs warning when fallback is used", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      revealPrivateFilter<[]>()(
        context,
        [obj],
        () => {
          throw new Error("API changed");
        },
        () => null,
      );

      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("handles multiple arguments", () => {
      const context = createMockContext();
      const obj1 = makeHasPrivate({ a: 1 });
      const obj2 = makeHasPrivate({ b: 2 });

      const result = revealPrivateFilter<[]>()(
        context,
        [obj1, obj2],
        (r1, r2) => r1.a + r2.b,
        () => 0,
      );

      expect(result).toBe(3);
    });

    it("preserves return type", () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ data: "test" });

      const stringResult: string = revealPrivateFilter<[]>()(
        context,
        [obj],
        (revealed) => revealed.data,
        () => "fallback",
      );

      expect(typeof stringResult).toBe("string");

      const numberResult: number = revealPrivateFilter<[]>()(
        context,
        [obj],
        () => 42,
        () => 0,
      );

      expect(typeof numberResult).toBe("number");
    });

    it("does not call fallback when function succeeds", () => {
      const context = createMockContext();
      const fallback = vi.fn(() => "fallback");
      const obj = makeHasPrivate({});

      revealPrivateFilter<[]>()(context, [obj], () => "success", fallback);

      expect(fallback).not.toHaveBeenCalled();
    });

    it("handles empty args array", () => {
      const context = createMockContext();

      const result = revealPrivateFilter<[]>()(
        context,
        [],
        () => "no-args",
        () => "fallback",
      );

      expect(result).toBe("no-args");
    });

    it("provides error to fallback", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const testError = new Error("Specific error");
      const obj = makeHasPrivate({});

      revealPrivateFilter<[]>()(
        context,
        [obj],
        () => {
          throw testError;
        },
        (error) => {
          expect(error).toBe(testError);
        },
      );

      expect(debugSpy).toHaveBeenCalledWith(testError);
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        testError,
      );
    });
  });

  describe("revealPrivateAsyncFilter (aggressive)", () => {
    it("executes async function with revealed properties", async () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ value: "async-test" });

      const result = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async (revealed) => {
          await Promise.resolve();
          return revealed.value;
        },
        async () => "fallback",
      );

      expect(result).toBe("async-test");
    });

    it("returns promise that resolves to result", async () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ count: 10 });

      const promise = revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async (revealed) => {
          await new Promise((resolve) => window.setTimeout(resolve, 10));
          return revealed.count * 3;
        },
        async () => 0,
      );

      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).resolves.toBe(30);
    });

    it("calls async fallback on error", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => {
          throw new Error("Async error");
        },
        async (error) => {
          expect(error).toBeInstanceOf(Error);
          return "async-fallback";
        },
      );

      expect(result).toBe("async-fallback");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("logs warning on async error", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = {} as HasPrivate;

      await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => {
          throw new Error("Async API error");
        },
        async () => null,
      );

      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("handles multiple async arguments", async () => {
      const context = createMockContext();
      const obj1 = makeHasPrivate({ x: 5 });
      const obj2 = makeHasPrivate({ y: 7 });

      const result = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj1, obj2],
        async (r1, r2) => {
          await Promise.resolve();
          return r1.x * r2.y;
        },
        async () => 0,
      );

      expect(result).toBe(35);
    });

    it("fallback can be synchronous or asynchronous", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      // Sync fallback
      const syncResult = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => {
          throw new Error("Error");
        },
        () => "sync-fallback", // Synchronous fallback
      );

      expect(syncResult).toBe("sync-fallback");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );

      // Async fallback
      debugSpy.mockClear();
      warnSpy.mockClear();
      const asyncResult = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => {
          throw new Error("Error");
        },

        async () => {
          await Promise.resolve();
          return "async-fallback";
        },
      );

      expect(asyncResult).toBe("async-fallback");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("does not call fallback when async function succeeds", async () => {
      const context = createMockContext();
      const fallback = vi.fn(async () => "fallback");
      const obj = makeHasPrivate({});

      await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => "success",
        fallback,
      );

      expect(fallback).not.toHaveBeenCalled();
    });

    it("handles rejected promises", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],

        async () => Promise.reject(new Error("Rejected")),
        async () => "handled",
      );

      expect(result).toBe("handled");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("provides error to async fallback", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const testError = new Error("Specific async error");
      const obj = makeHasPrivate({});

      await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => {
          throw testError;
        },
        async (error) => {
          expect(error).toBe(testError);
        },
      );

      expect(debugSpy).toHaveBeenCalledWith(testError);
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        testError,
      );
    });
  });

  describe("Type system", () => {
    it("PrivateKeys interface allows extension", () => {
      // This is a compile-time check
      // PrivateKeys should be extendable via declaration merging
      type TestPrivateKeys = PrivateKeys;
      const _typeCheck: TestPrivateKeys = {} as PrivateKeys;
      expect(_typeCheck).toBeDefined();
    });

    it("HasPrivate type represents objects with private properties", () => {
      // Compile-time type check
      const obj = makeHasPrivate({});
      expect(obj).toBeDefined();
    });

    it("RevealPrivate does not collapse un-branded shapes", () => {
      // Compile-time type check: an un-branded shape (no `Private<$X, PrivateKey>`
      // brand) must keep its properties after `RevealPrivate`. Regression for
      // ts-essentials >= 10.2.0, where `UnionToIntersection<never>` became `never`
      // and collapsed `RevealPrivate0` to `{}`.
      interface PlainSetting {
        readonly settingTabs: readonly unknown[];
      }
      interface Host {
        readonly setting: PlainSetting;
      }
      type Revealed = RevealPrivate<Host>;
      const revealed = { setting: { settingTabs: [] } } as unknown as Revealed;
      const _typeCheck: readonly unknown[] = revealed.setting.settingTabs;
      expect(_typeCheck).toEqual([]);
    });

    it("reveals an exactly-whitelisted type", () => {
      // Regression lock: App whitelisted by exact match reveals $App.appId.
      expectTypeOf<
        RevealPrivate<App, [App]>["appId"]
      >().toEqualTypeOf<string>();
    });

    // Regression lock: a subtype of a filter member is NOT expanded — only
    // exact matches are.
    it("does not expand a subtype of a filter member", () => {
      expectTypeOf<
        "appId" extends keyof RevealPrivate<App, [{ readonly keymap: Keymap }]>
          ? true
          : false
      >().toEqualTypeOf<false>();
    });

    // Regression lock: tuples keep their element positions and readonlyness
    // instead of widening to arrays.[App]
    it("preserves tuple structure", () => {
      expectTypeOf<
        RevealPrivate<readonly [App, string], [App]>[1]
      >().toEqualTypeOf<string>();
    });

    // Regression lock: functions are structural containers — parameters and
    // return type must be processed.
    it("expands function parameters and return type", () => {
      expectTypeOf<
        Parameters<RevealPrivate<(x: App) => App, [App]>>[0]["appId"]
      >().toEqualTypeOf<string>();
    });

    it("expands promise resolution types", () => {
      expectTypeOf<
        RevealPrivate<Promise<App>, [App]> extends Promise<infer U>
          ? U extends { readonly appId: infer A }
            ? A
            : never
          : never
      >().toEqualTypeOf<string>();
    });

    it("expands map value types", () => {
      expectTypeOf<
        RevealPrivate<ReadonlyMap<App, App>, [App]> extends ReadonlyMap<
          infer K,
          infer V
        >
          ? [
              K extends { readonly appId: infer A } ? A : never,
              V extends { readonly appId: infer B } ? B : never,
            ]
          : never
      >().toEqualTypeOf<[string, string]>();
    });

    it("passes builtins through unchanged", () => {
      expectTypeOf<
        RevealPrivate<string | number | boolean | Date>
      >().toEqualTypeOf<string | number | boolean | Date>();
    });

    // Regression lock: $BakedHotkey is intentionally empty — the public
    // members live on the augmented `BakedHotkey` interface, not the brand.
    // The reveal strips the brand and exposes no extra members.
    it("reveals BakedHotkey as an empty brand wrapper", () => {
      expectTypeOf<
        RevealPrivate<BakedHotkey, [BakedHotkey]>
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- asserting the empty revealed shape
      >().toEqualTypeOf<{}>();
    });

    // Regression lock: Record<string, unknown> must not match the exempt
    // marker (required property, not weak type). The marker type is
    // deprecated, so the test mirrors its structural shape — the gate uses
    // the shape, not the named (deprecated) type.
    it("exempt marker is a required property", () => {
      type ExemptMarkerShape = { readonly __reveal_private_exempt: true };
      expectTypeOf<
        Readonly<Record<string, unknown>> extends ExemptMarkerShape
          ? true
          : false
      >().toEqualTypeOf<false>();
    });

    // Regression lock only: a nested RevealPrivate wrap must be a no-op. In real
    // usage a single RevealPrivate<App, [App]> already fully reveals; the nested
    // pattern is not recommended outside tests.
    it("reveal is idempotent", () => {
      expectTypeOf<
        RevealPrivate<RevealPrivate<App, [App]>, [App]>
      >().toEqualTypeOf<RevealPrivate<App, [App]>>();
    });

    it("matches filter members exactly, not subtypes or supertypes", () => {
      // Gate semantics of WhitelistMatch: AreNonDistributiveEqual is the
      // mutual-assignability gate used by the engine.
      expectTypeOf<AreNonDistributiveEqual<App, App>>().toEqualTypeOf<true>();
      expectTypeOf<
        AreNonDistributiveEqual<App, { readonly keymap: Keymap }>
      >().toEqualTypeOf<false>();
      expectTypeOf<
        AreNonDistributiveEqual<{ readonly keymap: Keymap }, App>
      >().toEqualTypeOf<false>();
    });

    // Regression lock: a union filter element (`X | Y`) matches ONLY the whole
    // union `T = X | Y` (exact AreNonDistributiveEqual). Individual members X
    // and Y are traversed, so their private members are NOT revealed.
    it("matches only the whole union filter element, not individual members", () => {
      type Single = RevealPrivate<
        CommunityPluginsSettingTab,
        [CommunityPluginsSettingTab | UnknownSettingTab]
      >;
      expectTypeOf<
        "id" extends keyof Single ? true : false
      >().toEqualTypeOf<false>();
      type Whole = RevealPrivate<
        CommunityPluginsSettingTab | UnknownSettingTab,
        [CommunityPluginsSettingTab | UnknownSettingTab]
      >;
      expectTypeOf<
        "id" extends keyof Whole ? true : false
      >().toEqualTypeOf<true>();
    });

    // Regression lock: a whole-union filter element (`X | Y`) is matched as a
    // single entry, so each union member is expanded by `ExpandObject` rather
    // than split before the filter is consulted. Mirrors the documentations.ts
    // use case where `App.setting.settingTabs` is typed as `X | Y`.
    it("reveals both union branches via whole-union filter element", () => {
      type Whole = RevealPrivate<
        CommunityPluginsSettingTab | UnknownSettingTab,
        [CommunityPluginsSettingTab | UnknownSettingTab]
      >;
      // Both union branches expose the private `id` (from $CommunityPluginsSettingTab
      // and $UnknownSettingTab).
      expectTypeOf<
        Whole extends { readonly id: unknown } ? true : false
      >().toEqualTypeOf<true>();
      // The CommunityPluginsSettingTab branch additionally reveals the optional
      // private `installedPlugins`; narrow to it via the literal `id`.
      type CommunityBranch = Extract<
        Whole,
        { readonly id: "community-plugins" }
      >;
      expectTypeOf<
        "installedPlugins" extends keyof CommunityBranch ? true : false
      >().toEqualTypeOf<true>();
    });
  });

  describe("Error scenarios", () => {
    it("handles null/undefined in function", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = null as unknown as HasPrivate;

      const result = revealPrivateFilter<[]>()(
        context,
        [obj],
        () => {
          throw new TypeError("Cannot access property");
        },
        () => "handled-null",
      );

      expect(result).toBe("handled-null");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(TypeError));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(TypeError),
      );
    });

    it("handles synchronous throw in async context", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = await revealPrivateAsyncFilter<[]>()(
        context,
        [obj],
        async () => {
          throw new Error("Sync throw in async");
        },
        async () => "recovered",
      );

      expect(result).toBe("recovered");
      expect(debugSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });
  });
});
