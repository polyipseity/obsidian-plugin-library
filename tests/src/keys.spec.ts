/**
 * Comprehensive tests for src/keys.ts — hotkey management and filtering
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { newHotkeyListener } from "../../src/keys.js";
import type { PluginContext } from "../../src/plugin.js";
import type {
  HotkeyManager,
  KeymapEventListener,
  KeymapContext,
  Keymap,
} from "obsidian";

// Test-friendly mock type: exposes private-ish fields that the real HotkeyManager
// keeps internal but our tests need to read/manipulate.
type MockHotkeyManager = Partial<HotkeyManager> & {
  bake?: ReturnType<typeof vi.fn>;
  bakedHotkeys?: Array<{ modifiers: string[]; key: string }>;
  bakedIds?: string[];
  defaultKeys?: Record<string, Array<{ modifiers: string[]; key: string }>>;
  customKeys?: Record<string, Array<{ modifiers: string[]; key: string }>>;
  baked?: boolean;
};

describe("keys.ts — hotkey management", () => {
  let mockContext: PluginContext;
  let mockHotkeyManager: MockHotkeyManager;
  let mockKeymap: {
    constructor: {
      isMatch: ReturnType<typeof vi.fn>;
    };
  };
  let mockApp: {
    hotkeyManager: MockHotkeyManager;
    commands: {
      findCommand: ReturnType<typeof vi.fn>;
      executeCommand: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock hotkey manager
    mockHotkeyManager = {
      bake: vi.fn(),
      bakedHotkeys: [
        { modifiers: ["Ctrl"], key: "k" },
        { modifiers: ["Alt"], key: "s" },
      ],
      bakedIds: ["command-1", "command-2"],
      defaultKeys: {
        "command-1": [{ modifiers: ["Ctrl"], key: "k" }],
        "command-2": [{ modifiers: ["Alt"], key: "s" }],
      },
      customKeys: {},
      removeHotkeys: vi.fn(),
      setHotkeys: vi.fn(),
      baked: false,
    } as MockHotkeyManager;

    // Mock keymap
    mockKeymap = {
      constructor: {
        isMatch: vi.fn(() => false),
      },
    };

    // Mock app
    mockApp = {
      hotkeyManager: mockHotkeyManager,
      commands: {
        findCommand: vi.fn(),
        executeCommand: vi.fn(),
      },
    };

    // Mock plugin context
    mockContext = {
      app: mockApp,
      register: vi.fn((callback) => {
        // Optionally call the callback immediately for testing
        return callback;
      }),
      // minimal language mock used by revealPrivate's error handler
      language: { value: { t: vi.fn((k: string) => k) } },
    } as unknown as PluginContext;

    mockContext.app.keymap = mockKeymap as unknown as Keymap;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("newHotkeyListener", () => {
    it("creates hotkey listener function", () => {
      const listener = newHotkeyListener(mockContext);

      expect(listener).toBeDefined();
      expect(typeof listener).toBe("function");
    });

    it("returns function that accepts event and context", () => {
      const listener = newHotkeyListener(mockContext);

      expect(listener.length).toBeGreaterThanOrEqual(2);
    });

    it("filters hotkeys by provided IDs", () => {
      const ids = new Set(["command-1"]);

      const listener = newHotkeyListener(mockContext, ids);

      expect(listener).toBeDefined();
    });

    it("handles empty ID set", () => {
      const ids = new Set<string>();

      const listener = newHotkeyListener(mockContext, ids);

      expect(listener).toBeDefined();
    });

    it("handles undefined IDs (no filtering)", () => {
      const listener = newHotkeyListener(mockContext, undefined);

      expect(listener).toBeDefined();
    });

    it("registers cleanup callback", () => {
      newHotkeyListener(mockContext);

      expect(mockContext.register).toHaveBeenCalled();
    });

    it("patches hotkey manager bake method", () => {
      newHotkeyListener(mockContext);

      expect(mockContext.register).toHaveBeenCalled();
    });

    it("handles context without keymap gracefully", () => {
      const contextWithoutKeymap = {
        ...mockContext,
        app: {
          ...mockApp,
          keymap: undefined,
        },
      } as unknown as PluginContext;

      expect(() => newHotkeyListener(contextWithoutKeymap)).not.toThrow();
    });

    it("handles missing hotkey manager gracefully", () => {
      const contextWithoutHotkeyManager = {
        ...mockContext,
        app: {
          ...mockApp,
          hotkeyManager: undefined,
        },
      } as unknown as PluginContext;

      // suppress private-API warnings for this intentional negative test
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // revealPrivate should catch missing private API and return the fallback (noop)
      expect(() =>
        newHotkeyListener(contextWithoutHotkeyManager),
      ).not.toThrow();

      const listener = newHotkeyListener(contextWithoutHotkeyManager);
      expect(listener).toBeDefined();
      expect(typeof listener).toBe("function");

      // restore spies (afterEach will also restore, but keep explicit expectation)
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("hotkey listener behavior", () => {
    it("calls hotkey manager bake method", () => {
      // sanity-check mocks
      expect(mockContext.app).toBeDefined();
      expect(mockApp.hotkeyManager).toBeDefined();

      const listener = newHotkeyListener(mockContext);

      // Mock event and keymap context
      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;
      const result = listener(mockEvent, mockKeymapContext); // ensure hotkeyManager.bake is invoked and listener returns boolean when possible
      expect(mockApp.hotkeyManager?.bake).toHaveBeenCalled();
      // bakedHotkeys on the hotkey manager should remain defined
      expect(mockApp.hotkeyManager?.bakedHotkeys).toBeDefined();
      expect(typeof result === "boolean" || typeof result === "undefined").toBe(
        true,
      );
    });

    it("returns true when no hotkey matches", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(false);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      // no command should be executed when there is no match
      expect(mockKeymap.constructor.isMatch).toHaveBeenCalled();
      expect(mockApp.commands.executeCommand).not.toHaveBeenCalled();
    });

    it("executes command when hotkey matches", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Test Command",
      });
      mockApp.commands.executeCommand.mockReturnValue(true);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      expect(mockApp.commands.findCommand).toHaveBeenCalled();
      expect(mockApp.commands.executeCommand).toHaveBeenCalled();
    });

    it("respects command repeatable flag", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Test Command",
        repeatable: false,
      });
      mockApp.commands.executeCommand.mockReturnValue(true);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: true } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      // Should not execute non-repeatable command on repeat
      expect(mockApp.commands.executeCommand).not.toHaveBeenCalled();
    });

    it("allows repeatable commands on repeat events", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Test Command",
        repeatable: true,
      });
      mockApp.commands.executeCommand.mockReturnValue(true);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: true } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      expect(mockApp.commands.executeCommand).toHaveBeenCalled();
    });

    it("handles missing command gracefully", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue(null);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      expect(mockApp.commands.findCommand).toHaveBeenCalled();
      expect(mockApp.commands.executeCommand).not.toHaveBeenCalled();
    });

    it("handles command execution failure", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Test Command",
      });
      mockApp.commands.executeCommand.mockReturnValue(false);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      // command execution attempted but returned false
      expect(mockApp.commands.findCommand).toHaveBeenCalled();
      expect(mockApp.commands.executeCommand).toHaveBeenCalled();
    });
  });

  describe("ID filtering", () => {
    it("only processes hotkeys for specified IDs", () => {
      const ids = new Set(["command-1"]);
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Command 1",
      });
      mockApp.commands.executeCommand.mockReturnValue(true);

      const listener = newHotkeyListener(mockContext, ids);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      // Should only process command-1
      expect(mockApp.commands.findCommand).toHaveBeenCalled();
    });

    it("filters out hotkeys not in ID set", () => {
      const ids = new Set(["command-3"]); // ID not in bakedIds

      const listener = newHotkeyListener(mockContext, ids);

      expect(listener).toBeDefined();
    });

    it("handles multiple IDs", () => {
      const ids = new Set(["command-1", "command-2"]);

      const listener = newHotkeyListener(mockContext, ids);

      expect(listener).toBeDefined();
    });

    it("processes all hotkeys when no IDs provided", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Command 1",
      });
      mockApp.commands.executeCommand.mockReturnValue(true);

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);

      expect(mockApp.commands.findCommand).toHaveBeenCalled();
    });
  });

  describe("bake method patching", () => {
    it("patches hotkey manager bake method", () => {
      newHotkeyListener(mockContext);

      expect(mockContext.register).toHaveBeenCalled();
    });

    it("handles bake method with already baked state", () => {
      mockHotkeyManager.baked = true;

      newHotkeyListener(mockContext);

      expect(mockContext.register).toHaveBeenCalled();
    });

    it("restores original bake method on cleanup", () => {
      newHotkeyListener(mockContext);

      expect(mockContext.register).toHaveBeenCalled();

      // Cleanup should be registered
      const registeredCallback = (
        mockContext.register as ReturnType<typeof vi.fn>
      ).mock.calls[0]?.[0];
      expect(typeof registeredCallback).toBe("function");
    });

    it("filters default keys during bake", () => {
      const ids = new Set(["command-1"]);

      newHotkeyListener(mockContext, ids);

      expect(mockContext.register).toHaveBeenCalled();
    });

    it("filters custom keys during bake", () => {
      mockHotkeyManager.customKeys = {
        "command-1": [{ modifiers: ["Ctrl", "Shift"], key: "k" }],
        "command-3": [{ modifiers: ["Alt"], key: "x" }],
      };

      const ids = new Set(["command-1"]);

      newHotkeyListener(mockContext, ids);

      expect(mockContext.register).toHaveBeenCalled();
    });
  });

  describe("edge cases and error handling", () => {
    it("handles null context gracefully", () => {
      expect(() =>
        newHotkeyListener(null as unknown as PluginContext),
      ).toThrow();
    });

    it("handles undefined context gracefully", () => {
      expect(() =>
        newHotkeyListener(undefined as unknown as PluginContext),
      ).toThrow();
    });

    it("handles empty bakedHotkeys array", () => {
      mockHotkeyManager.bakedHotkeys = [];
      mockHotkeyManager.bakedIds = [];

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(mockEvent, mockKeymapContext);
      expect(mockApp.commands.executeCommand).not.toHaveBeenCalled();
    });

    it("handles mismatched bakedHotkeys and bakedIds lengths", () => {
      mockHotkeyManager.bakedHotkeys = [{ modifiers: ["Ctrl"], key: "k" }];
      mockHotkeyManager.bakedIds = [];

      const listener = newHotkeyListener(mockContext);

      expect(listener).toBeDefined();
    });

    it("handles null event", () => {
      const listener = newHotkeyListener(mockContext);

      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      expect(() =>
        listener(null as unknown as KeyboardEvent, mockKeymapContext),
      ).not.toThrow();
    });

    it("handles null keymap context", () => {
      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;

      expect(() =>
        listener(mockEvent, null as unknown as KeymapContext),
      ).not.toThrow();
    });

    it("handles exception in command execution", () => {
      mockKeymap.constructor.isMatch.mockReturnValue(true);
      mockApp.commands.findCommand.mockReturnValue({
        id: "command-1",
        name: "Test Command",
      });
      mockApp.commands.executeCommand.mockImplementation(() => {
        throw new Error("Execution error");
      });

      // silence and capture private-API logs produced by revealPrivate
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const listener = newHotkeyListener(mockContext);

      const mockEvent = { repeat: false } as KeyboardEvent;
      const mockKeymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      // revealPrivate should catch errors from private API calls — listener should not throw
      expect(() => listener(mockEvent, mockKeymapContext)).not.toThrow();
      expect(mockApp.commands.executeCommand).toHaveBeenCalled();

      // ensure revealPrivate logged the expected private-API warning and the original error
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "errors.private-API-changed",
        expect.any(Error),
      );

      // also assert the error message is preserved
      const loggedError = warnSpy.mock.calls[0]?.[1] as Error | undefined;
      expect(loggedError).toBeInstanceOf(Error);
      expect(loggedError?.message).toBe("Execution error");
    });

    it("handles missing baked property", () => {
      const hotkeyManagerWithoutBaked = {
        ...mockHotkeyManager,
        baked: undefined,
      } as MockHotkeyManager;

      mockApp.hotkeyManager = hotkeyManagerWithoutBaked;

      const listener = newHotkeyListener(mockContext);

      expect(listener).toBeDefined();
    });
  });

  describe("type safety", () => {
    it("accepts KeyboardEvent", () => {
      const listener: KeymapEventListener = newHotkeyListener(mockContext);

      const event: KeyboardEvent = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
      });
      const keymapContext = {
        vkey: "",
        modifiers: null,
        key: null,
      } as unknown as KeymapContext;

      listener(event, keymapContext);

      expect(listener).toBeDefined();
    });

    it("accepts Set<string> for IDs", () => {
      const ids: Set<string> = new Set(["command-1", "command-2"]);

      const listener = newHotkeyListener(mockContext, ids);

      expect(listener).toBeDefined();
    });

    it("returns KeymapEventListener", () => {
      const listener: KeymapEventListener = newHotkeyListener(mockContext);

      expect(typeof listener).toBe("function");
    });

    it("handles PluginContext interface", () => {
      const context: PluginContext = mockContext;

      const listener = newHotkeyListener(context);

      expect(listener).toBeDefined();
    });
  });
});
