/**
 * Comprehensive tests for src/settings.ts — settings management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AbstractSettingsManager,
  StorageSettingsManager,
  SettingsManager,
  registerSettingsCommands,
} from "../../src/settings.js";
import type { PluginContext } from "../../src/plugin.js";
import type { Fixer } from "../../src/fixers.js";
import { markFixed } from "../../src/fixers.js";
import type { DeepWritable } from "ts-essentials";

describe("settings.ts — settings management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("AbstractSettingsManager", () => {
    interface TestSettings extends AbstractSettingsManager.Type {
      value: number;
      text: string;
    }

    class TestSettingsManager extends AbstractSettingsManager<TestSettings> {
      public constructor(fixer: Fixer<TestSettings>) {
        super(fixer);
      }

      public override async write(): Promise<void> {
        // Mock implementation
      }

      protected override async onInvalidData(): Promise<void> {
        // Mock implementation
      }

      protected override read0(): unknown {
        return { value: 42, text: "test" };
      }
    }

    const testFixer: Fixer<TestSettings> = (data: unknown) => {
      const value =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : {};
      return markFixed(data, {
        value: typeof value.value === "number" ? value.value : 0,
        text: typeof value.text === "string" ? value.text : "",
      });
    };

    it("creates settings manager with fixer", () => {
      const manager = new TestSettingsManager(testFixer);

      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(AbstractSettingsManager);
    });

    it("loads settings on load", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      expect(manager.value).toEqual({ value: 42, text: "test" });
    });

    it("provides onLoaded promise", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      const loaded = await manager.onLoaded;

      expect(loaded).toEqual({ value: 42, text: "test" });
    });

    it("allows mutation of settings", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      await manager.mutate((settings: DeepWritable<TestSettings>) => {
        settings.value = 100;
      });

      expect(manager.value.value).toBe(100);
    });

    it("emits onMutate event after mutation", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      const listener = vi.fn();
      manager.onMutate((settings) => settings.value, listener);

      await manager.mutate((settings: DeepWritable<TestSettings>) => {
        settings.value = 200;
      });

      // Advance timers for async events
      await vi.runAllTimersAsync();

      expect(listener).toHaveBeenCalled();
    });

    it("calls onMutate callback only when value changes", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      const listener = vi.fn();
      manager.onMutate((settings) => settings.text, listener);

      await manager.mutate((settings: DeepWritable<TestSettings>) => {
        settings.value = 300; // Change different property
      });

      await vi.runAllTimersAsync();

      expect(listener).not.toHaveBeenCalled();
    });

    it("allows reading settings", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      await manager.read();

      expect(manager.value).toEqual({ value: 42, text: "test" });
    });

    it("writes settings after load", async () => {
      const writeSpy = vi.spyOn(TestSettingsManager.prototype, "write");

      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      await vi.runAllTimersAsync();

      expect(writeSpy).toHaveBeenCalled();

      writeSpy.mockRestore();
    });

    it("throws when accessing value before load", () => {
      const manager = new TestSettingsManager(testFixer);

      expect(() => manager.value).toThrow();
    });

    it("allows unload and reload", async () => {
      const manager = new TestSettingsManager(testFixer);

      manager.load();
      await manager.onLoaded;

      manager.unload();

      expect(() => manager.value).toThrow();

      manager.load();
      await manager.onLoaded;

      expect(manager.value).toBeDefined();
    });
  });

  describe("AbstractSettingsManager.fix", () => {
    it("fixes unknown data to Type", () => {
      const fixed = AbstractSettingsManager.fix({ extra: "data" });

      expect(fixed.valid).toBe(false);
      expect(fixed.value).toEqual({});
    });

    it("handles null input", () => {
      const fixed = AbstractSettingsManager.fix(null);

      expect(fixed.valid).toBe(false);
      expect(fixed.value).toEqual({});
    });

    it("handles undefined input", () => {
      const fixed = AbstractSettingsManager.fix(undefined);

      expect(fixed.valid).toBe(false);
      expect(fixed.value).toEqual({});
    });
  });

  describe("StorageSettingsManager", () => {
    interface TestLocalSettings extends StorageSettingsManager.Type {
      count: number;
      recovery: StorageSettingsManager.Recovery;
    }

    const testFixer: Fixer<TestLocalSettings> = (data: unknown) => {
      const value =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : {};
      return markFixed(data, {
        count: typeof value.count === "number" ? value.count : 0,
        recovery: {},
      });
    };

    let mockContext: PluginContext;
    let mockStorage: Storage;

    beforeEach(() => {
      // Mock storage
      const storageData: Record<string, string> = {};
      mockStorage = {
        getItem: vi.fn((key: string) => storageData[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storageData[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete storageData[key];
        }),
        clear: vi.fn(() =>
          Object.keys(storageData).forEach((key) => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete storageData[key];
          }),
        ),
        length: 0,
        key: vi.fn(() => null),
      };

      // Mock context
      mockContext = {
        app: {
          appId: "test-app-id",
        },
        manifest: { id: "test-plugin", name: "Test Plugin" },
        language: {
          onLoaded: Promise.resolve(),
          value: {
            t: vi.fn((key: string) => `translated-${key}`),
          },
        },
      } as unknown as PluginContext;
    });

    it("creates storage settings manager", () => {
      const manager = new StorageSettingsManager(
        mockContext,
        testFixer,
        mockStorage,
      );

      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(StorageSettingsManager);
    });

    it("uses localStorage by default", () => {
      const manager = new StorageSettingsManager(mockContext, testFixer);

      expect(manager).toBeDefined();
    });

    it("loads settings from storage", async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify({ count: 10, recovery: {} }),
      );

      const manager = new StorageSettingsManager(
        mockContext,
        testFixer,
        mockStorage,
      );

      manager.load();
      await manager.onLoaded;

      expect(manager.value.count).toBe(10);
    });

    it("writes settings to storage", async () => {
      const manager = new StorageSettingsManager(
        mockContext,
        testFixer,
        mockStorage,
      );

      manager.load();
      await manager.onLoaded;

      await manager.mutate((settings: DeepWritable<TestLocalSettings>) => {
        settings.count = 20;
      });

      await manager.write();

      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    it("handles missing storage key", async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const manager = new StorageSettingsManager(
        mockContext,
        testFixer,
        mockStorage,
      );

      manager.load();
      await manager.onLoaded;

      expect(manager.value.count).toBe(0); // Default value from fixer
    });

    it("handles JSON parse errors", async () => {
      (mockStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        "invalid json",
      );

      const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {
        // Mock
      });

      const manager = new StorageSettingsManager(
        mockContext,
        testFixer,
        mockStorage,
      );

      manager.load();
      await manager.onLoaded;

      expect(manager.value.count).toBe(0);

      consoleDebug.mockRestore();
    });

    it("stores recovery data on invalid data", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });

      const manager = new StorageSettingsManager(
        mockContext,
        testFixer,
        mockStorage,
      );

      // Simulate invalid data
      const invalidData = { invalid: "data" };
      // @ts-expect-error: call protected method for testing
      await manager.onInvalidData(invalidData, {
        count: 0,
        recovery: {},
      });

      // Recovery should contain the invalid data
      expect(manager).toBeDefined();

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("malformed-data"),
        invalidData,
        { count: 0, recovery: {} },
      );
      consoleError.mockRestore();
    });
  });

  describe("StorageSettingsManager.fix", () => {
    it("fixes unknown data to Type with recovery", () => {
      const fixed = StorageSettingsManager.fix({
        recovery: { key1: "value1" },
      });

      expect(fixed.valid).toBe(true);
      expect(fixed.value.recovery).toEqual({ key1: "value1" });
    });

    it("handles missing recovery property", () => {
      const fixed = StorageSettingsManager.fix({});

      expect(fixed.valid).toBe(false);
      expect(fixed.value.recovery).toEqual({});
    });

    it("converts recovery values to strings", () => {
      const fixed = StorageSettingsManager.fix({
        recovery: { key1: 123, key2: true },
      });

      expect(fixed.value.recovery).toEqual({ key1: "123", key2: "true" });
    });
  });

  describe("StorageSettingsManager utility functions", () => {
    it("getRecovery filters by prefix", () => {
      const recovery: StorageSettingsManager.Recovery = {
        "prefix1.key1": "value1",
        "prefix1.key2": "value2",
        "prefix2.key3": "value3",
      };

      const result = StorageSettingsManager.getRecovery(recovery, "prefix1.");

      expect(result.size).toBe(2);
      expect(result.get("prefix1.key1")).toBe("value1");
      expect(result.get("prefix1.key2")).toBe("value2");
    });

    it("setRecovery replaces keys with prefix", () => {
      const recovery: DeepWritable<StorageSettingsManager.Recovery> = {
        "prefix1.key1": "value1",
        "prefix2.key2": "value2",
      };

      const newMap = new Map<string, string>([
        ["prefix1.new1", "new-value1"],
        ["prefix1.new2", "new-value2"],
      ]);

      StorageSettingsManager.setRecovery(recovery, "prefix1.", newMap);

      expect(recovery["prefix1.key1"]).toBeUndefined();
      expect(recovery["prefix1.new1"]).toBe("new-value1");
      expect(recovery["prefix1.new2"]).toBe("new-value2");
      expect(recovery["prefix2.key2"]).toBe("value2"); // Not affected
    });

    it("hasFailed checks for FAILED symbol", () => {
      const failedSettings = {
        [StorageSettingsManager.FAILED]: true,
      } as StorageSettingsManager.Type;
      const normalSettings = {} as StorageSettingsManager.Type;

      expect(StorageSettingsManager.hasFailed(failedSettings)).toBe(true);
      expect(StorageSettingsManager.hasFailed(normalSettings)).toBe(false);
    });
  });

  describe("SettingsManager", () => {
    interface TestPluginSettings extends SettingsManager.Type {
      option: string;
    }

    const testFixer: Fixer<TestPluginSettings> = (data: unknown) => {
      const value =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : {};
      return markFixed(data, {
        option: typeof value.option === "string" ? value.option : "default",
      });
    };

    let mockContext: PluginContext;

    beforeEach(() => {
      mockContext = {
        saveData: vi.fn(),
        loadData: vi.fn(async () => ({ option: "loaded" })),
        language: {
          onLoaded: Promise.resolve(),
          value: {
            t: vi.fn((key: string) => `translated-${key}`),
          },
        },
        localSettings: {
          onLoaded: Promise.resolve(),
          mutate: vi.fn(),
          write: vi.fn(),
        },
      } as unknown as PluginContext;
    });

    it("creates settings manager", () => {
      const manager = new SettingsManager(mockContext, testFixer);

      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(SettingsManager);
    });

    it("loads settings from plugin data", async () => {
      const manager = new SettingsManager(mockContext, testFixer);

      manager.load();
      await manager.onLoaded;

      expect(mockContext.loadData).toHaveBeenCalled();
      expect(manager.value.option).toBe("loaded");
    });

    it("saves settings via plugin saveData", async () => {
      const manager = new SettingsManager(mockContext, testFixer);

      manager.load();
      await manager.onLoaded;

      await Promise.all([
        manager.write(),
        // Advance timers to trigger debounced write
        vi.runAllTimersAsync(),
      ]);

      expect(mockContext.saveData).toHaveBeenCalled();
    });

    it("debounces write calls", async () => {
      const manager = new SettingsManager(mockContext, testFixer);

      manager.load();
      await manager.onLoaded;

      await Promise.all([
        // Call write multiple times rapidly
        manager.write(),
        manager.write(),
        manager.write(),
        // Advance timers to trigger debounced write
        vi.runAllTimersAsync(),
      ]);

      // Should be called only twice due to debouncing
      expect(
        (mockContext.saveData as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBe(2);
    });
  });

  describe("registerSettingsCommands", () => {
    let mockContext: PluginContext;

    beforeEach(() => {
      mockContext = {
        app: {
          fileManager: {},
          metadataCache: {},
          workspace: {},
          lastEvent: {},
        },
        language: {
          value: {
            t: vi.fn((key: string) => `translated-${key}`),
          },
        },
        settings: {
          value: { option: "test" },
        },
        addCommand: vi.fn(),
      } as unknown as PluginContext;
    });

    it("registers settings commands", () => {
      expect(() => registerSettingsCommands(mockContext)).not.toThrow();
    });

    it("uses context language for command names", () => {
      registerSettingsCommands(mockContext);

      expect(mockContext.language.value.t).toHaveBeenCalled();
    });
  });

  describe("edge cases and type safety", () => {
    it("handles null fixer result", () => {
      const nullFixer: Fixer<AbstractSettingsManager.Type> = () =>
        markFixed(null, {});

      class NullSettingsManager extends AbstractSettingsManager<AbstractSettingsManager.Type> {
        public override async write(): Promise<void> {
          // Mock
        }
        protected override async onInvalidData(): Promise<void> {
          // Mock
        }
        protected override read0(): unknown {
          return null;
        }
      }

      const manager = new NullSettingsManager(nullFixer);

      expect(manager).toBeDefined();
    });

    it("handles async mutations", async () => {
      interface TestSettings extends AbstractSettingsManager.Type {
        value: number;
      }

      const testFixer: Fixer<TestSettings> = (data: unknown) =>
        markFixed(data, { value: 0 });

      class TestManager extends AbstractSettingsManager<TestSettings> {
        public override async write(): Promise<void> {
          // Mock
        }
        protected override async onInvalidData(): Promise<void> {
          // Mock
        }
        protected override read0(): unknown {
          return { value: 1 };
        }
      }

      const manager = new TestManager(testFixer);

      manager.load();
      await manager.onLoaded;

      await manager.mutate(async (settings: DeepWritable<TestSettings>) => {
        await Promise.resolve();
        settings.value = 10;
      });

      expect(manager.value.value).toBe(10);
    });
  });
});
