/**
 * Comprehensive tests for src/inject/index.ts — timing utilities using activeWindow
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  requestAnimationFrame,
  setInterval,
  setTimeout,
} from "../../../src/inject/index.js";

describe("inject/index.ts — timing utilities", () => {
  type MockActiveWindow = {
    requestAnimationFrame: ReturnType<typeof vi.fn>;
    setInterval: ReturnType<typeof vi.fn>;
    setTimeout: ReturnType<typeof vi.fn>;
  };

  let mockActiveWindow: MockActiveWindow;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock activeWindow
    mockActiveWindow = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      requestAnimationFrame: vi.fn((_callback) => {
        // Mock RAF ID
        return 1;
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setInterval: vi.fn((_callback, _delay) => {
        // Mock interval ID
        return 1;
      }),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setTimeout: vi.fn((_callback, _delay) => {
        // Mock timeout ID
        return 1;
      }),
    };

    // Set up self.activeWindow
    Object.defineProperty(self, "activeWindow", {
      value: mockActiveWindow as unknown as Window & typeof globalThis,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("requestAnimationFrame", () => {
    it("calls activeWindow.requestAnimationFrame", () => {
      const callback = vi.fn();

      requestAnimationFrame(callback);

      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalledWith(
        callback,
      );
    });

    it("returns request ID", () => {
      mockActiveWindow.requestAnimationFrame.mockReturnValue(42);

      const callback = vi.fn();
      const id = requestAnimationFrame(callback);

      expect(id).toBe(42);
    });

    it("handles multiple calls", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      requestAnimationFrame(callback1);
      requestAnimationFrame(callback2);

      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalledTimes(2);
    });

    it("preserves callback type", () => {
      const callback: FrameRequestCallback = (time) => {
        expect(typeof time).toBe("number");
      };

      requestAnimationFrame(callback);

      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalledWith(
        callback,
      );
    });
  });

  describe("setInterval", () => {
    it("calls activeWindow.setInterval", () => {
      const callback = vi.fn();
      const delay = 1000;

      setInterval(callback, delay);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(
        callback,
        delay,
      );
    });

    it("returns interval ID", () => {
      mockActiveWindow.setInterval.mockReturnValue(123);

      const callback = vi.fn();
      const id = setInterval(callback, 1000);

      expect(id).toBe(123);
    });

    it("passes additional arguments", () => {
      const callback = vi.fn();
      const delay = 1000;
      const arg1 = "test";
      const arg2 = 42;

      setInterval(callback, delay, arg1, arg2);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(
        callback,
        delay,
        arg1,
        arg2,
      );
    });

    it("handles zero delay", () => {
      const callback = vi.fn();

      setInterval(callback, 0);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(callback, 0);
    });

    it("handles undefined delay", () => {
      const callback = vi.fn();

      setInterval(callback);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(callback);
    });
  });

  describe("setTimeout", () => {
    it("calls activeWindow.setTimeout", () => {
      const callback = vi.fn();
      const delay = 1000;

      setTimeout(callback, delay);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(callback, delay);
    });

    it("returns timeout ID", () => {
      mockActiveWindow.setTimeout.mockReturnValue(456);

      const callback = vi.fn();
      const id = setTimeout(callback, 1000);

      expect(id).toBe(456);
    });

    it("passes additional arguments", () => {
      const callback = vi.fn();
      const delay = 1000;
      const arg1 = "test";
      const arg2 = 42;
      const arg3 = true;

      setTimeout(callback, delay, arg1, arg2, arg3);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(
        callback,
        delay,
        arg1,
        arg2,
        arg3,
      );
    });

    it("handles zero delay", () => {
      const callback = vi.fn();

      setTimeout(callback, 0);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(callback, 0);
    });

    it("handles multiple timeouts", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      setTimeout(callback1, 1000);
      setTimeout(callback2, 2000);
      setTimeout(callback3, 3000);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledTimes(3);
    });
  });

  describe("integration with activeWindow", () => {
    it("all functions use the same activeWindow", () => {
      const callback = vi.fn();

      requestAnimationFrame(callback);
      setInterval(callback, 1000);
      setTimeout(callback, 1000);

      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalled();
      expect(mockActiveWindow.setInterval).toHaveBeenCalled();
      expect(mockActiveWindow.setTimeout).toHaveBeenCalled();
    });

    it("respects activeWindow changes", () => {
      const callback = vi.fn();
      const newActiveWindow: MockActiveWindow = {
        requestAnimationFrame: vi.fn(() => 99),
        setInterval: vi.fn(() => 99),
        setTimeout: vi.fn(() => 99),
      };

      // Change activeWindow
      Object.defineProperty(self, "activeWindow", {
        value: newActiveWindow as unknown as Window & typeof globalThis,
        writable: true,
        configurable: true,
      });

      requestAnimationFrame(callback);
      setInterval(callback, 1000);
      setTimeout(callback, 1000);

      expect(newActiveWindow.requestAnimationFrame).toHaveBeenCalled();
      expect(newActiveWindow.setInterval).toHaveBeenCalled();
      expect(newActiveWindow.setTimeout).toHaveBeenCalled();

      expect(mockActiveWindow.requestAnimationFrame).not.toHaveBeenCalled();
      expect(mockActiveWindow.setInterval).not.toHaveBeenCalled();
      expect(mockActiveWindow.setTimeout).not.toHaveBeenCalled();
    });
  });

  describe("edge cases and type safety", () => {
    it("requestAnimationFrame preserves return type", () => {
      const callback = vi.fn();
      const id: number = requestAnimationFrame(callback);

      expect(typeof id).toBe("number");
    });

    it("setInterval preserves return type", () => {
      const callback = vi.fn();
      const id: ReturnType<typeof setInterval> = setInterval(callback, 1000);

      expect(id).toBeDefined();
    });

    it("setTimeout preserves return type", () => {
      const callback = vi.fn();
      const id: ReturnType<typeof setTimeout> = setTimeout(callback, 1000);

      expect(id).toBeDefined();
    });

    it("handles very large delay values", () => {
      const callback = vi.fn();
      const largeDelay = Number.MAX_SAFE_INTEGER;

      setTimeout(callback, largeDelay);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(
        callback,
        largeDelay,
      );
    });

    it("handles negative delay values", () => {
      const callback = vi.fn();
      const negativeDelay = -1000;

      setTimeout(callback, negativeDelay);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(
        callback,
        negativeDelay,
      );
    });

    it("setInterval with many arguments", () => {
      const callback = vi.fn();
      const args = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      setInterval(callback, 1000, ...args);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(
        callback,
        1000,
        ...args,
      );
    });

    it("setTimeout with complex argument types", () => {
      const callback = vi.fn();
      const obj = { key: "value" };
      const arr = [1, 2, 3];
      const fn = () => {
        // Empty
      };

      setTimeout(callback, 1000, obj, arr, fn);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(
        callback,
        1000,
        obj,
        arr,
        fn,
      );
    });

    it("handles arrow function callbacks", () => {
      const raf = requestAnimationFrame(() => {
        // Empty
      });
      const interval = setInterval(() => {
        // Empty
      }, 100);
      const timeout = setTimeout(() => {
        // Empty
      }, 100);

      expect(raf).toBeDefined();
      expect(interval).toBeDefined();
      expect(timeout).toBeDefined();
    });

    it("handles named function callbacks", () => {
      function rafCallback(): void {
        // Empty
      }
      function intervalCallback(): void {
        // Empty
      }
      function timeoutCallback(): void {
        // Empty
      }

      const raf = requestAnimationFrame(rafCallback);
      const interval = setInterval(intervalCallback, 100);
      const timeout = setTimeout(timeoutCallback, 100);

      expect(raf).toBeDefined();
      expect(interval).toBeDefined();
      expect(timeout).toBeDefined();
    });
  });

  describe("callback parameter types", () => {
    it("requestAnimationFrame callback receives DOMHighResTimeStamp", () => {
      const callback: FrameRequestCallback = vi.fn();

      requestAnimationFrame(callback);

      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalledWith(
        callback,
      );
    });

    it("setInterval callback can be string", () => {
      const code = "console.log('test')";

      setInterval(code as never, 1000);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(code, 1000);
    });

    it("setTimeout callback can be string", () => {
      const code = "console.log('test')";

      setTimeout(code as never, 1000);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(code, 1000);
    });

    it("setInterval forwards this context", () => {
      const obj = {
        method(): void {
          // Empty
        },
      };

      setInterval(obj.method, 1000);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(
        obj.method,
        1000,
      );
    });

    it("setTimeout forwards this context", () => {
      const obj = {
        method(): void {
          // Empty
        },
      };

      setTimeout(obj.method, 1000);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(
        obj.method,
        1000,
      );
    });
  });

  describe("timing behavior", () => {
    it("requestAnimationFrame is called immediately on next frame", () => {
      const callback = vi.fn();

      requestAnimationFrame(callback);

      // Should have been registered
      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalledOnce();
    });

    it("setInterval can be called multiple times", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      setInterval(callback1, 100);
      setInterval(callback2, 200);
      setInterval(callback3, 300);

      expect(mockActiveWindow.setInterval).toHaveBeenCalledTimes(3);
    });

    it("setTimeout can be called with same delay", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      setTimeout(callback1, 1000);
      setTimeout(callback2, 1000);

      expect(mockActiveWindow.setTimeout).toHaveBeenCalledTimes(2);
    });

    it("mixing all three timing functions", () => {
      const rafCallback = vi.fn();
      const intervalCallback = vi.fn();
      const timeoutCallback = vi.fn();

      requestAnimationFrame(rafCallback);
      setInterval(intervalCallback, 100);
      setTimeout(timeoutCallback, 200);

      expect(mockActiveWindow.requestAnimationFrame).toHaveBeenCalledWith(
        rafCallback,
      );
      expect(mockActiveWindow.setInterval).toHaveBeenCalledWith(
        intervalCallback,
        100,
      );
      expect(mockActiveWindow.setTimeout).toHaveBeenCalledWith(
        timeoutCallback,
        200,
      );
    });
  });
});
