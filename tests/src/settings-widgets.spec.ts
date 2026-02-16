/**
 * Comprehensive tests for src/settings-widgets.ts — settings widget utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  closeSetting,
  linkSetting,
  composeSetters,
  setTextToEnum,
  setTextToNumber,
  resetButton,
  dropdownSelect,
} from "../../src/settings-widgets.js";
import type {
  ValueComponent,
  ButtonComponent,
  DropdownComponent,
} from "obsidian";

describe("settings-widgets.ts — widget utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("closeSetting", () => {
    it("closes modal by clicking close button", () => {
      const closeButton = document.createElement("div");
      closeButton.className = "modal-close-button";
      closeButton.click = vi.fn();

      const modal = document.createElement("div");
      modal.className = "modal";
      modal.appendChild(closeButton);

      const container = document.createElement("div");
      modal.appendChild(container);

      document.body.appendChild(modal);

      closeSetting(container);

      expect(closeButton.click).toHaveBeenCalled();

      document.body.removeChild(modal);
    });

    it("does nothing when no modal found", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      expect(() => closeSetting(container)).not.toThrow();

      document.body.removeChild(container);
    });

    it("does nothing when no close button found", () => {
      const modal = document.createElement("div");
      modal.className = "modal";

      const container = document.createElement("div");
      modal.appendChild(container);

      document.body.appendChild(modal);

      expect(() => closeSetting(container)).not.toThrow();

      document.body.removeChild(modal);
    });

    it("traverses up DOM tree to find modal", () => {
      const closeButton = document.createElement("div");
      closeButton.className = "modal-close-button";
      closeButton.click = vi.fn();

      const modal = document.createElement("div");
      modal.className = "modal";
      modal.appendChild(closeButton);

      const parent = document.createElement("div");
      const container = document.createElement("div");
      parent.appendChild(container);
      modal.appendChild(parent);

      document.body.appendChild(modal);

      closeSetting(container);

      expect(closeButton.click).toHaveBeenCalled();

      document.body.removeChild(modal);
    });
  });

  describe("linkSetting", () => {
    type TestComponent = ValueComponent<string> & {
      readonly onChange: (
        callback: (value: string) => unknown,
      ) => TestComponent;
    };

    it("creates component configurator", () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn();
      const callback = vi.fn();

      const configurator = linkSetting(getter, setter, callback);

      expect(configurator).toBeDefined();
      expect(typeof configurator).toBe("function");
    });

    it("sets initial value from getter", () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn();
      const callback = vi.fn();

      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn().mockReturnThis();

      const component = {
        setValue,
        onChange,
      } as unknown as TestComponent;

      const configurator = linkSetting(getter, setter, callback);
      configurator(component);

      expect(setValue).toHaveBeenCalledWith("initial");
      expect(onChange).toHaveBeenCalled();
    });

    it("calls setter and callback on change", async () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn();
      const callback = vi.fn();

      let changeHandler: ((value: string) => unknown) | undefined;
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn((handler) => {
        changeHandler = handler;
        return {} as TestComponent;
      });

      const component = {
        setValue,
        onChange,
      } as unknown as TestComponent;

      const configurator = linkSetting(getter, setter, callback);
      configurator(component);

      expect(changeHandler).toBeDefined();

      await changeHandler?.("new-value");

      expect(setter).toHaveBeenCalledWith("new-value", component, getter);
      expect(callback).toHaveBeenCalledWith("new-value", component, getter);
    });

    it("reverts value when setter returns false", async () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn(() => false);
      const callback = vi.fn();

      let changeHandler: ((value: string) => unknown) | undefined;
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn((handler) => {
        changeHandler = handler;
        return {} as TestComponent;
      });

      const component = {
        setValue,
        onChange,
      } as unknown as TestComponent;

      const configurator = linkSetting(getter, setter, callback);
      configurator(component);

      await changeHandler?.("invalid");

      expect(setter).toHaveBeenCalledWith("invalid", component, getter);
      expect(setValue).toHaveBeenCalledWith("initial");
      expect(callback).not.toHaveBeenCalled();
    });

    it("calls pre action before setup", () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn();
      const callback = vi.fn();
      const pre = vi.fn();

      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn().mockReturnThis();

      const component = {
        setValue,
        onChange,
      } as unknown as TestComponent;

      const configurator = linkSetting(getter, setter, callback, { pre });
      configurator(component);

      expect(pre).toHaveBeenCalledWith(component);
    });

    it("calls post action after setup", () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn();
      const callback = vi.fn();
      const post = vi.fn();

      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn().mockReturnThis();

      const component = {
        setValue,
        onChange,
      } as unknown as TestComponent;

      const configurator = linkSetting(getter, setter, callback, { post });
      configurator(component);

      expect(post).toHaveBeenCalledWith(component, expect.any(Function));
    });

    it("handles async setter", async () => {
      const getter = vi.fn(() => "initial");
      const setter = vi.fn(async () => {
        await Promise.resolve();
      });
      const callback = vi.fn();

      let changeHandler: ((value: string) => unknown) | undefined;
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn((handler) => {
        changeHandler = handler;
        return {} as TestComponent;
      });

      const component = {
        setValue,
        onChange,
      } as unknown as TestComponent;

      const configurator = linkSetting(getter, setter, callback);
      configurator(component);

      await changeHandler?.("new-value");

      expect(setter).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("composeSetters", () => {
    type TestComponent = ValueComponent<string>;

    it("composes multiple setters", async () => {
      const setter1 = vi.fn(() => true);
      const setter2 = vi.fn(() => true);

      const composed = composeSetters<string, TestComponent>(setter1, setter2);

      const component = {} as TestComponent;
      const getter = () => "value";

      const result = await composed("new", component, getter);

      expect(result).toBe(true);
      expect(setter1).toHaveBeenCalledWith("new", component, getter);
      expect(setter2).not.toHaveBeenCalled(); // Short-circuits on first true
    });

    it("returns false when all setters return false", async () => {
      const setter1 = vi.fn(() => false);
      const setter2 = vi.fn(() => false);

      const composed = composeSetters<string, TestComponent>(setter1, setter2);

      const component = {} as TestComponent;
      const getter = () => "value";

      const result = await composed("new", component, getter);

      expect(result).toBe(false);
      expect(setter1).toHaveBeenCalled();
      expect(setter2).toHaveBeenCalled();
    });

    it("stops at first truthy setter", async () => {
      const setter1 = vi.fn(() => false);
      const setter2 = vi.fn(() => true);
      const setter3 = vi.fn(() => true);

      const composed = composeSetters<string, TestComponent>(
        setter1,
        setter2,
        setter3,
      );

      const component = {} as TestComponent;
      const getter = () => "value";

      const result = await composed("new", component, getter);

      expect(result).toBe(true);
      expect(setter1).toHaveBeenCalled();
      expect(setter2).toHaveBeenCalled();
      expect(setter3).not.toHaveBeenCalled();
    });

    it("handles empty setters array", async () => {
      const composed = composeSetters<string, TestComponent>();

      const component = {} as TestComponent;
      const getter = () => "value";

      const result = await composed("new", component, getter);

      expect(result).toBe(false);
    });
  });

  describe("setTextToEnum", () => {
    type TestComponent = ValueComponent<string>;

    it("validates value is in enum", async () => {
      const enums = ["option1", "option2", "option3"] as const;
      const setter =
        vi.fn<
          (
            value: string,
            component: TestComponent,
            getter: () => string,
          ) => unknown
        >();

      const validator = setTextToEnum(enums, setter);

      const component = {} as TestComponent;
      const getter = () => "option1";

      const result = await validator("option1", component, getter);

      expect(result).toBe(true);
      expect(setter).toHaveBeenCalledWith("option1", component, getter);
    });

    it("rejects value not in enum", async () => {
      const enums = ["option1", "option2", "option3"] as const;
      const setter =
        vi.fn<
          (
            value: string,
            component: TestComponent,
            getter: () => string,
          ) => unknown
        >();

      const validator = setTextToEnum(enums, setter);

      const component = {} as TestComponent;
      const getter = () => "option1";

      const result = await validator("invalid" as never, component, getter);

      expect(result).toBe(false);
      expect(setter).not.toHaveBeenCalled();
    });

    it("returns false when setter returns false", async () => {
      const enums = ["option1", "option2"] as const;
      const setter = vi.fn<
        (
          value: string,
          component: TestComponent,
          getter: () => string,
        ) => unknown
      >(() => false);

      const validator = setTextToEnum(enums, setter);

      const component = {} as TestComponent;
      const getter = () => "option1";

      const result = await validator("option1", component, getter);

      expect(result).toBe(false);
    });

    it("handles empty enum array", async () => {
      const enums = [] as const;
      const setter =
        vi.fn<
          (
            value: string,
            component: TestComponent,
            getter: () => string,
          ) => unknown
        >();

      const validator = setTextToEnum(enums, setter);

      const component = {} as TestComponent;
      const getter = () => "";

      const result = await validator("any" as never, component, getter);

      expect(result).toBe(false);
    });
  });

  describe("setTextToNumber", () => {
    type TestComponent = ValueComponent<string>;

    it("converts valid number string", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "123";

      const result = await converter("123", component, getter);

      expect(result).toBe(true);
      expect(setter).toHaveBeenCalledWith(123, component, getter);
    });

    it("handles decimal numbers", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "123.45";

      const result = await converter("123.45", component, getter);

      expect(result).toBe(true);
      expect(setter).toHaveBeenCalledWith(123.45, component, getter);
    });

    it("rejects non-numeric strings", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "abc";

      const result = await converter("abc", component, getter);

      expect(result).toBe(false);
      expect(setter).not.toHaveBeenCalled();
    });

    it("handles integer mode", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter, true);

      const component = {} as TestComponent;
      const getter = () => "42";

      const result = await converter("42", component, getter);

      expect(result).toBe(true);
      expect(setter).toHaveBeenCalledWith(42, component, getter);
    });

    it("rejects decimals in integer mode", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter, true);

      const component = {} as TestComponent;
      const getter = () => "42.5";

      const result = await converter("42.5", component, getter);

      expect(result).toBe(false);
      expect(setter).not.toHaveBeenCalled();
    });

    it("handles + sign as 0", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "+";

      const result = await converter("+", component, getter);

      expect(result).toBe(true);
      expect(setter).toHaveBeenCalledWith(0, component, getter);
    });

    it("handles - sign as 0", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "-";

      const result = await converter("-", component, getter);

      expect(result).toBe(true);
      expect(setter).toHaveBeenCalledWith(0, component, getter);
    });

    it("rejects infinity", async () => {
      const setter = vi.fn();

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "Infinity";

      const result = await converter("Infinity", component, getter);

      expect(result).toBe(false);
      expect(setter).not.toHaveBeenCalled();
    });

    it("returns false when setter returns false", async () => {
      const setter = vi.fn(() => false);

      const converter = setTextToNumber(setter);

      const component = {} as TestComponent;
      const getter = () => "123";

      const result = await converter("123", component, getter);

      expect(result).toBe(false);
    });
  });

  describe("resetButton", () => {
    type TestButtonComponent = ButtonComponent;

    it("creates reset button configurator", () => {
      const resetter = vi.fn();
      const callback = vi.fn();

      const configurator = resetButton(
        "reset-icon",
        "Reset",
        resetter,
        callback,
      );

      expect(configurator).toBeDefined();
      expect(typeof configurator).toBe("function");
    });

    it("configures button with icon and tooltip", () => {
      const resetter = vi.fn();
      const callback = vi.fn();

      const setIcon = vi.fn().mockReturnThis();
      const setTooltip = vi.fn().mockReturnThis();
      const onClick = vi.fn().mockReturnThis();

      const component = {
        setIcon,
        setTooltip,
        onClick,
      } as unknown as TestButtonComponent;

      const configurator = resetButton(
        "reset-icon",
        "Reset tooltip",
        resetter,
        callback,
      );
      configurator(component);

      expect(setIcon).toHaveBeenCalledWith("reset-icon");
      expect(setTooltip).toHaveBeenCalledWith("Reset tooltip");
      expect(onClick).toHaveBeenCalled();
    });

    it("calls resetter and callback on click", async () => {
      const resetter = vi.fn();
      const callback = vi.fn();

      let clickHandler: (() => unknown) | undefined;
      const setIcon = vi.fn().mockReturnThis();
      const setTooltip = vi.fn().mockReturnThis();
      const onClick = vi.fn((handler) => {
        clickHandler = handler;
        return {} as TestButtonComponent;
      });

      const component = {
        setIcon,
        setTooltip,
        onClick,
      } as unknown as TestButtonComponent;

      const configurator = resetButton("icon", "tooltip", resetter, callback);
      configurator(component);

      expect(clickHandler).toBeDefined();

      await clickHandler?.();

      expect(resetter).toHaveBeenCalledWith(component);
      expect(callback).toHaveBeenCalledWith(component);
    });

    it("skips callback when resetter returns false", async () => {
      const resetter = vi.fn(() => false);
      const callback = vi.fn();

      let clickHandler: (() => unknown) | undefined;
      const setIcon = vi.fn().mockReturnThis();
      const setTooltip = vi.fn().mockReturnThis();
      const onClick = vi.fn((handler) => {
        clickHandler = handler;
        return {} as TestButtonComponent;
      });

      const component = {
        setIcon,
        setTooltip,
        onClick,
      } as unknown as TestButtonComponent;

      const configurator = resetButton("icon", "tooltip", resetter, callback);
      configurator(component);

      await clickHandler?.();

      expect(resetter).toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    it("calls pre action", () => {
      const resetter = vi.fn();
      const callback = vi.fn();
      const pre = vi.fn();

      const setIcon = vi.fn().mockReturnThis();
      const setTooltip = vi.fn().mockReturnThis();
      const onClick = vi.fn().mockReturnThis();

      const component = {
        setIcon,
        setTooltip,
        onClick,
      } as unknown as TestButtonComponent;

      const configurator = resetButton("icon", "tooltip", resetter, callback, {
        pre,
      });
      configurator(component);

      expect(pre).toHaveBeenCalledWith(component);
    });

    it("calls post action", () => {
      const resetter = vi.fn();
      const callback = vi.fn();
      const post = vi.fn();

      const setIcon = vi.fn().mockReturnThis();
      const setTooltip = vi.fn().mockReturnThis();
      const onClick = vi.fn().mockReturnThis();

      const component = {
        setIcon,
        setTooltip,
        onClick,
      } as unknown as TestButtonComponent;

      const configurator = resetButton("icon", "tooltip", resetter, callback, {
        post,
      });
      configurator(component);

      expect(post).toHaveBeenCalledWith(component, expect.any(Function));
    });
  });

  describe("dropdownSelect", () => {
    type TestDropdownComponent = DropdownComponent & {
      readonly addOption: (
        value: string,
        text: string,
      ) => TestDropdownComponent;
      readonly addOptions: (
        options: Record<string, string>,
      ) => TestDropdownComponent;
    };

    it("creates dropdown configurator", () => {
      const callback = vi.fn();
      const selections = [
        { name: "Option 1", value: "value1" },
        { name: "Option 2", value: "value2" },
      ];

      const configurator = dropdownSelect("Select...", selections, callback);

      expect(configurator).toBeDefined();
      expect(typeof configurator).toBe("function");
    });

    it("adds unselected option", () => {
      const callback = vi.fn();
      const selections = [{ name: "Option 1", value: "value1" }];

      const addOption = vi.fn().mockReturnThis();
      const addOptions = vi.fn().mockReturnThis();
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn().mockReturnThis();

      const component = {
        addOption,
        addOptions,
        setValue,
        onChange,
      } as unknown as TestDropdownComponent;

      const configurator = dropdownSelect("Select...", selections, callback);
      configurator(component);

      expect(addOption).toHaveBeenCalledWith(expect.any(String), "Select...");
    });

    it("adds selection options", () => {
      const callback = vi.fn();
      const selections = [
        { name: "Option 1", value: "value1" },
        { name: "Option 2", value: "value2" },
      ];

      const addOption = vi.fn().mockReturnThis();
      const addOptions = vi.fn().mockReturnThis();
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn().mockReturnThis();

      const component = {
        addOption,
        addOptions,
        setValue,
        onChange,
      } as unknown as TestDropdownComponent;

      const configurator = dropdownSelect("Select...", selections, callback);
      configurator(component);

      expect(addOptions).toHaveBeenCalledWith({
        "0": "Option 1",
        "1": "Option 2",
      });
    });

    it("calls callback with selected value", async () => {
      const callback = vi.fn();
      const selections = [
        { name: "Option 1", value: "value1" },
        { name: "Option 2", value: "value2" },
      ];

      let changeHandler: ((value: string) => unknown) | undefined;
      const addOption = vi.fn().mockReturnThis();
      const addOptions = vi.fn().mockReturnThis();
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn((handler) => {
        changeHandler = handler;
        return {} as TestDropdownComponent;
      });

      const component = {
        addOption,
        addOptions,
        setValue,
        onChange,
      } as unknown as TestDropdownComponent;

      const configurator = dropdownSelect("Select...", selections, callback);
      configurator(component);

      await changeHandler?.("0");

      expect(callback).toHaveBeenCalledWith("value1", component);
    });

    it("handles empty selections", () => {
      const callback = vi.fn();
      const selections: { name: string; value: string }[] = [];

      const addOption = vi.fn().mockReturnThis();
      const addOptions = vi.fn().mockReturnThis();
      const setValue = vi.fn().mockReturnThis();
      const onChange = vi.fn().mockReturnThis();

      const component = {
        addOption,
        addOptions,
        setValue,
        onChange,
      } as unknown as TestDropdownComponent;

      const configurator = dropdownSelect("Select...", selections, callback);
      configurator(component);

      expect(addOptions).toHaveBeenCalledWith({});
    });
  });

  describe("edge cases and type safety", () => {
    it("linkSetting handles null component gracefully", () => {
      const getter = vi.fn(() => "value");
      const setter = vi.fn();
      const callback = vi.fn();

      const configurator = linkSetting(getter, setter, callback);

      expect(() => configurator(null as never)).toThrow();
    });

    it("composeSetters handles undefined return values", async () => {
      const setter1 = vi.fn(() => undefined);
      const setter2 = vi.fn(() => true);

      const composed = composeSetters<string, ValueComponent<string>>(
        setter1,
        setter2,
      );

      const result = await composed(
        "value",
        {} as ValueComponent<string>,
        () => "",
      );

      expect(result).toBe(true);
    });

    it("setTextToNumber handles very large numbers", async () => {
      const setter = vi.fn();
      const converter = setTextToNumber(setter, true);

      const result = await converter(
        "999999999999999999999",
        {} as ValueComponent<string>,
        () => "",
      );

      expect(result).toBe(false); // Too large for safe integer
    });

    it("closeSetting handles detached elements", () => {
      const container = document.createElement("div");

      expect(() => closeSetting(container)).not.toThrow();
    });
  });
});
