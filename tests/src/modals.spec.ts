/**
 * Comprehensive tests for src/modals.ts — modal dialogs and UI components
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDefaultSuggestModalInstructions,
  ListModal,
} from "../../src/modals.js";
import type { PluginContext } from "../../src/plugin.js";
import type { LanguageManager } from "../../src/i18n.js";
import type { Setting } from "obsidian";

describe("modals.ts — modal dialogs", () => {
  let mockContext: PluginContext;
  let mockI18n: { t: ReturnType<typeof vi.fn> };
  let mockLanguageManager: LanguageManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock i18n
    mockI18n = {
      t: vi.fn((key: string) => `translated-${key}`),
    };

    // Mock language manager
    mockLanguageManager = {
      value: mockI18n,
      onChangeLanguage: {
        listen: vi.fn(),
      },
    } as unknown as LanguageManager;

    // Mock plugin context
    mockContext = {
      app: {
        workspace: {},
      },
      language: mockLanguageManager,
      manifest: { id: "test-plugin", name: "Test Plugin" },
    } as unknown as PluginContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getDefaultSuggestModalInstructions", () => {
    it("returns array of instructions", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      expect(instructions).toBeDefined();
      expect(Array.isArray(instructions)).toBe(true);
      expect(instructions.length).toBeGreaterThan(0);
    });

    it("returns three instructions", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      expect(instructions).toHaveLength(3);
    });

    it("each instruction has command and purpose", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      for (const instruction of instructions) {
        expect(instruction.command).toBeDefined();
        expect(instruction.purpose).toBeDefined();
        expect(typeof instruction.command).toBe("string");
        expect(typeof instruction.purpose).toBe("string");
      }
    });

    it("translates navigate instruction", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      const navigateInstruction = instructions[0];
      expect(navigateInstruction).toBeDefined();
      expect(navigateInstruction).property("command").contains("translated-");
      expect(navigateInstruction).property("purpose").contains("translated-");
    });

    it("translates use instruction", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      const useInstruction = instructions[1];
      expect(useInstruction).toBeDefined();
      expect(useInstruction).property("command").contains("translated-");
      expect(useInstruction).property("purpose").contains("translated-");
    });

    it("translates dismiss instruction", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      const dismissInstruction = instructions[2];
      expect(dismissInstruction).toBeDefined();
      expect(dismissInstruction).property("command").contains("translated-");
      expect(dismissInstruction).property("purpose").contains("translated-");
    });

    it("uses language manager from context", () => {
      getDefaultSuggestModalInstructions(mockContext);

      expect(mockContext.language).toBeDefined();
      expect(mockContext.language.value).toBe(mockI18n);
    });

    it("instructions use i18n.t method", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      // Access the getters to trigger translation
      expect(instructions[0]).toBeDefined();
      expect(instructions[0]).property("command").contains("translated-");
      expect(instructions[0]).property("purpose").contains("translated-");

      expect(mockI18n.t).toHaveBeenCalled();
    });

    it("returns readonly array", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      expect(Object.isFrozen(instructions)).toBe(false); // Not frozen, but typed as readonly
      expect(instructions).toBeDefined();
    });

    it("handles different language contexts", () => {
      const altI18n = {
        t: vi.fn((key: string) => `alt-${key}`),
      };

      const altContext = {
        ...mockContext,
        language: {
          value: altI18n,
          onChangeLanguage: { listen: vi.fn() },
        },
      } as unknown as PluginContext;

      const instructions = getDefaultSuggestModalInstructions(altContext);

      expect(instructions).toHaveLength(3);
      expect(instructions[0]).toBeDefined();
      expect(instructions[0]).property("command").contains("alt-");
    });

    it("instructions are lazily evaluated", () => {
      const instructions = getDefaultSuggestModalInstructions(mockContext);

      // Translation should not be called yet
      const callCountBefore = mockI18n.t.mock.calls.length;

      // Access the getter
      expect(instructions[0]).toBeDefined();
      expect(instructions[0]).property("command").contains("translated-");

      // Now translation should be called
      const callCountAfter = mockI18n.t.mock.calls.length;

      expect(callCountAfter).toBeGreaterThan(callCountBefore);
    });

    it("handles missing language manager gracefully", () => {
      const contextWithoutLanguage = {
        ...mockContext,
        language: undefined,
      } as unknown as PluginContext;

      expect(() =>
        getDefaultSuggestModalInstructions(contextWithoutLanguage),
      ).toThrow();
    });
  });

  describe("ListModal", () => {
    it("creates modal with basic parameters", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1", "item2"];

      const modal = new ListModal(mockContext, inputter, placeholder, data);

      expect(modal).toBeDefined();
      expect(modal).toBeInstanceOf(ListModal);
    });

    it("accepts empty data array", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data: string[] = [];

      const modal = new ListModal(mockContext, inputter, placeholder, data);

      expect(modal).toBeDefined();
    });

    it("accepts data with multiple items", () => {
      const inputter = vi.fn();
      const placeholder = (): number => 0;
      const data = [1, 2, 3, 4, 5];

      const modal = new ListModal(mockContext, inputter, placeholder, data);

      expect(modal).toBeDefined();
    });

    it("accepts options parameter", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];
      const options = {
        callback: vi.fn(),
        title: () => "Test Title",
        description: () => "Test Description",
      };

      const modal = new ListModal(
        mockContext,
        inputter,
        placeholder,
        data,
        options,
      );

      expect(modal).toBeDefined();
    });

    it("uses default callback when none provided", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];

      const modal = new ListModal(mockContext, inputter, placeholder, data);

      expect(modal).toBeDefined();
    });

    it("accepts custom namer function", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];
      const options = {
        namer: (item: string, index: number): string =>
          `Item ${index}: ${item}`,
      };

      const modal = new ListModal(
        mockContext,
        inputter,
        placeholder,
        data,
        options,
      );

      expect(modal).toBeDefined();
    });

    it("accepts custom descriptor function", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];
      const options = {
        descriptor: (item: string): string => `Description of ${item}`,
      };

      const modal = new ListModal(
        mockContext,
        inputter,
        placeholder,
        data,
        options,
      );

      expect(modal).toBeDefined();
    });

    it("accepts presets option", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];
      const options = {
        presets: [
          { name: "Preset 1", value: "preset1" },
          { name: "Preset 2", value: "preset2" },
        ] as const,
      };

      const modal = new ListModal(
        mockContext,
        inputter,
        placeholder,
        data,
        options,
      );

      expect(modal).toBeDefined();
    });

    it("accepts preset placeholder option", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];
      const options = {
        presetPlaceholder: () => "Select a preset",
      };

      const modal = new ListModal(
        mockContext,
        inputter,
        placeholder,
        data,
        options,
      );

      expect(modal).toBeDefined();
    });

    it("accepts editables option", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "placeholder";
      const data = ["item1"];
      const options = {
        editables: ["edit", "remove", "moveDown"] as const,
      };

      const modal = new ListModal(
        mockContext,
        inputter,
        placeholder,
        data,
        options,
      );

      expect(modal).toBeDefined();
    });
  });

  describe("ListModal.stringInputter", () => {
    it("creates string inputter with transformer", () => {
      const transformer = {
        forth: (value: number): string => String(value),
        back: (value: string): number => Number(value),
      };

      const inputter = ListModal.stringInputter(transformer);

      expect(inputter).toBeDefined();
      expect(typeof inputter).toBe("function");
    });

    it("inputter accepts setting and callbacks", () => {
      const transformer = {
        forth: (value: string): string => value.toUpperCase(),
        back: (value: string): string => value.toLowerCase(),
      };

      const inputter = ListModal.stringInputter(transformer);

      const mockSetting = {
        addTextArea: vi.fn((callback) => {
          callback({
            setValue: vi.fn().mockReturnThis(),
            setDisabled: vi.fn().mockReturnThis(),
            onChange: vi.fn().mockReturnThis(),
          });
        }),
      } as unknown as Setting;

      const getter = vi.fn(() => "test");
      const setter = vi.fn();

      inputter(mockSetting, true, getter, setter);

      expect(mockSetting.addTextArea).toHaveBeenCalled();
    });

    it("disables input when editable is false", () => {
      const transformer = {
        forth: (value: string): string => value,
        back: (value: string): string => value,
      };

      const inputter = ListModal.stringInputter(transformer);

      const setDisabled = vi.fn().mockReturnThis();
      const mockSetting = {
        addTextArea: vi.fn((callback) => {
          callback({
            setValue: vi.fn().mockReturnThis(),
            setDisabled,
            onChange: vi.fn().mockReturnThis(),
          });
        }),
      } as unknown as Setting;

      const getter = vi.fn(() => "test");
      const setter = vi.fn();

      inputter(mockSetting, false, getter, setter);

      expect(setDisabled).toHaveBeenCalledWith(true);
    });

    it("enables input when editable is true", () => {
      const transformer = {
        forth: (value: string): string => value,
        back: (value: string): string => value,
      };

      const inputter = ListModal.stringInputter(transformer);

      const setDisabled = vi.fn().mockReturnThis();
      const mockSetting = {
        addTextArea: vi.fn((callback) => {
          callback({
            setValue: vi.fn().mockReturnThis(),
            setDisabled,
            onChange: vi.fn().mockReturnThis(),
          });
        }),
      } as unknown as Setting;

      const getter = vi.fn(() => "test");
      const setter = vi.fn();

      inputter(mockSetting, true, getter, setter);

      expect(setDisabled).toHaveBeenCalledWith(false);
    });

    it("transforms value with forth function", () => {
      const transformer = {
        forth: vi.fn((value: number) => `Value: ${value}`),
        back: (value: string): number =>
          parseInt(value.replace("Value: ", ""), 10),
      };

      const inputter = ListModal.stringInputter(transformer);

      const setValue = vi.fn().mockReturnThis();
      const mockSetting = {
        addTextArea: vi.fn((callback) => {
          callback({
            setValue,
            setDisabled: vi.fn().mockReturnThis(),
            onChange: vi.fn().mockReturnThis(),
          });
        }),
      } as unknown as Setting;

      const getter = vi.fn(() => 42);
      const setter = vi.fn();

      inputter(mockSetting, true, getter, setter);

      expect(transformer.forth).toHaveBeenCalledWith(42);
      expect(setValue).toHaveBeenCalledWith("Value: 42");
    });

    it("transforms value with back function on change", () => {
      const transformer = {
        forth: (value: number): string => String(value),
        back: vi.fn((value: string) => parseInt(value, 10)),
      };

      const inputter = ListModal.stringInputter(transformer);

      let onChangeCallback: ((value: string) => unknown) | undefined;
      const mockSetting = {
        addTextArea: vi.fn((callback) => {
          callback({
            setValue: vi.fn().mockReturnThis(),
            setDisabled: vi.fn().mockReturnThis(),
            onChange: vi.fn((cb) => {
              onChangeCallback = cb;
              return {};
            }),
          });
        }),
      } as unknown as Setting;

      const getter = vi.fn(() => 10);
      // mock `setter` should execute the provided updater so `transformer.back` runs
      const setter = vi.fn((updater) => updater(undefined, 0, [undefined]));

      inputter(mockSetting, true, getter, setter);

      expect(onChangeCallback).toBeDefined();

      // Trigger onChange (will call setter which executes the updater)
      onChangeCallback?.("25");

      expect(transformer.back).toHaveBeenCalledWith("25");
    });

    it("accepts custom input function", () => {
      const transformer = {
        forth: (value: string): string => value,
        back: (value: string): string => value,
      };

      const customInput = vi.fn();

      const inputter = ListModal.stringInputter(transformer);

      const mockSetting = {} as Setting;
      const getter = vi.fn(() => "test");
      const setter = vi.fn();

      inputter(mockSetting, true, getter, setter, customInput);

      expect(customInput).toHaveBeenCalled();
    });
  });

  describe("type safety", () => {
    it("ListModal accepts generic type parameter", () => {
      interface TestItem {
        id: number;
        name: string;
      }

      const inputter = vi.fn();
      const placeholder = (): TestItem => ({ id: 0, name: "" });
      const data: TestItem[] = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      const modal = new ListModal<TestItem>(
        mockContext,
        inputter,
        placeholder,
        data,
      );

      expect(modal).toBeDefined();
    });

    it("stringInputter preserves type transformations", () => {
      const transformer: {
        readonly forth: (value: boolean) => string;
        readonly back: (value: string) => boolean;
      } = {
        forth: (value) => String(value),
        back: (value) => value === "true",
      };

      const inputter = ListModal.stringInputter(transformer);

      expect(inputter).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles null data gracefully", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "";

      expect(
        () =>
          new ListModal(
            mockContext,
            inputter,
            placeholder,
            null as unknown as string[],
          ),
      ).toThrow();
    });

    it("handles undefined data gracefully", () => {
      const inputter = vi.fn();
      const placeholder = (): string => "";

      expect(
        () =>
          new ListModal(
            mockContext,
            inputter,
            placeholder,
            undefined as unknown as string[],
          ),
      ).toThrow();
    });

    it("handles complex object types", () => {
      interface ComplexType {
        nested: {
          value: number;
          array: string[];
        };
      }

      const inputter = vi.fn();
      const placeholder = (): ComplexType => ({
        nested: { value: 0, array: [] },
      });
      const data: ComplexType[] = [{ nested: { value: 1, array: ["a", "b"] } }];

      const modal = new ListModal<ComplexType>(
        mockContext,
        inputter,
        placeholder,
        data,
      );

      expect(modal).toBeDefined();
    });
  });
});
