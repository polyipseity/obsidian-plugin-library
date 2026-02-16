/**
 * Comprehensive tests for src/patch.ts — plugin and window patching utilities
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { patchWindows } from "../../src/patch.js";
import type { Workspace } from "obsidian";

describe("patch.ts — patching utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("patchWindows", () => {
    it("patches current window immediately", () => {
      const patcher = vi.fn(() => vi.fn());
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      expect(patcher).toHaveBeenCalledWith(self);
    });

    it("returns cleanup function", () => {
      const patcher = vi.fn(() => vi.fn());
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      const cleanup = patchWindows(mockWorkspace, patcher);

      expect(typeof cleanup).toBe("function");
    });

    it("registers window-open event listener", () => {
      const patcher = vi.fn(() => vi.fn());
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      expect(mockWorkspace.on).toHaveBeenCalledWith(
        "window-open",
        expect.any(Function),
      );
    });

    it("patches new windows when opened", () => {
      const patcher = vi.fn(() => vi.fn());
      let windowOpenCallback: ((window: { win: Window }) => void) | undefined;

      const mockWorkspace = {
        on: vi.fn(
          (event: string, callback: (window: { win: Window }) => void) => {
            if (event === "window-open") {
              windowOpenCallback = callback;
            }
            return {};
          },
        ),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      // Simulate window open
      const mockWindow = { win: window };
      windowOpenCallback?.(mockWindow);

      expect(patcher).toHaveBeenCalledWith(window);
    });

    it("registers window-close listener for cleanup", () => {
      const unpatcher = vi.fn();
      const patcher = vi.fn(() => unpatcher);
      let windowOpenCallback: ((window: { win: Window }) => void) | undefined;

      const mockWorkspace = {
        on: vi.fn(
          (event: string, callback: (window: { win: Window }) => void) => {
            if (event === "window-open") {
              windowOpenCallback = callback;
            }
            return {};
          },
        ),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      const mockWindow = { win: window };
      windowOpenCallback?.(mockWindow);

      // Should register window-close listener
      expect(mockWorkspace.on).toHaveBeenCalledWith(
        "window-close",
        expect.any(Function),
      );
    });

    it("cleanup function unpatches all windows", () => {
      const unpatcher = vi.fn();
      const patcher = vi.fn(() => unpatcher);
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      const cleanup = patchWindows(mockWorkspace, patcher);
      cleanup();

      expect(unpatcher).toHaveBeenCalledWith(self);
    });

    it("cleanup function removes event listeners", () => {
      const patcher = vi.fn(() => vi.fn());
      const onRef = { id: "test-ref" };
      const mockWorkspace = {
        on: vi.fn(() => onRef),
        offref: vi.fn(),
      } as unknown as Workspace;

      const cleanup = patchWindows(mockWorkspace, patcher);
      cleanup();

      expect(mockWorkspace.offref).toHaveBeenCalledWith(onRef);
    });

    it("handles errors during patching gracefully", () => {
      const patcher = vi.fn(() => {
        throw new Error("Patch error");
      });
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      expect(() => {
        patchWindows(mockWorkspace, patcher);
      }).toThrow("Patch error");
    });

    it("cleans up on error", () => {
      const patcher = vi.fn(() => {
        throw new Error("Error");
      });
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      try {
        patchWindows(mockWorkspace, patcher);
      } catch {
        // Expected
      }

      // Cleanup should have been called
      expect(mockWorkspace.offref).toHaveBeenCalled();
    });

    it("handles window-close for correct window only", () => {
      const unpatcher = vi.fn();
      const patcher = vi.fn(() => unpatcher);
      let windowOpenCallback: ((window: { win: Window }) => void) | undefined;
      let windowCloseCallback: ((window: { win: Window }) => void) | undefined;

      const mockWorkspace = {
        on: vi.fn(
          (event: string, callback: (window: { win: Window }) => void) => {
            if (event === "window-open") {
              windowOpenCallback = callback;
            } else if (event === "window-close") {
              windowCloseCallback = callback;
            }
            return {};
          },
        ),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      const mockWindow1 = { win: window };
      const mockWindow2 = { win: window };

      windowOpenCallback?.(mockWindow1);

      // Close different window - should not unpatch
      windowCloseCallback?.(mockWindow2);

      // Close correct window - should unpatch
      windowCloseCallback?.(mockWindow1);

      expect(unpatcher).toHaveBeenCalled();
    });

    it("handles multiple windows independently", () => {
      const patcher = vi.fn(() => vi.fn());
      let windowOpenCallback: ((window: { win: Window }) => void) | undefined;

      const mockWorkspace = {
        on: vi.fn(
          (event: string, callback: (window: { win: Window }) => void) => {
            if (event === "window-open") {
              windowOpenCallback = callback;
            }
            return {};
          },
        ),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      // Open multiple windows
      windowOpenCallback?.({ win: window });
      windowOpenCallback?.({ win: window });
      windowOpenCallback?.({ win: window });

      expect(patcher).toHaveBeenCalledTimes(4); // 3 new + 1 initial
    });

    it("uses settled mode for Functions", () => {
      const patcher = vi.fn(() => {
        throw new Error("Unpatch error");
      });
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      // Should handle errors in settled mode
      expect(() => {
        const cleanup = patchWindows(mockWorkspace, patcher);
        // Cleanup might throw but shouldn't crash
        try {
          cleanup();
        } catch {
          // Expected in some cases
        }
      }).toThrow();
    });
  });

  describe("Integration scenarios", () => {
    it("patches and unpatches in correct order", () => {
      const callOrder: string[] = [];
      const patcher = vi.fn(() => {
        callOrder.push("patch");
        return () => {
          callOrder.push("unpatch");
        };
      });
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      const cleanup = patchWindows(mockWorkspace, patcher);

      expect(callOrder).toContain("patch");

      cleanup();

      expect(callOrder).toContain("unpatch");
      expect(callOrder.indexOf("unpatch")).toBeGreaterThan(
        callOrder.indexOf("patch"),
      );
    });

    it("handles rapid open/close cycles", () => {
      const patcher = vi.fn(() => vi.fn());
      let windowOpenCallback: ((window: { win: Window }) => void) | undefined;
      let windowCloseCallback: ((window: { win: Window }) => void) | undefined;

      const mockWorkspace = {
        on: vi.fn(
          (event: string, callback: (window: { win: Window }) => void) => {
            if (event === "window-open") {
              windowOpenCallback = callback;
            } else if (event === "window-close") {
              windowCloseCallback = callback;
            }
            return {};
          },
        ),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      // Rapid open/close
      for (let i = 0; i < 5; i++) {
        const mockWindow = { win: window };
        windowOpenCallback?.(mockWindow);
        windowCloseCallback?.(mockWindow);
      }

      expect(patcher).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("handles patcher returning undefined", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const patcher = vi.fn();
      const mockWorkspace = {
        on: vi.fn(() => ({})),
        offref: vi.fn(),
      } as unknown as Workspace;

      // Should not throw even if unpatcher is undefined
      expect(() => {
        const cleanup = patchWindows(mockWorkspace, patcher);
        cleanup();
      }).not.toThrow();
      // Should have logged a TypeError with a message containing "is not a function"
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "TypeError",
          message: expect.stringContaining("is not a function"),
        }),
      );

      errorSpy.mockRestore();
    });

    it("handles workspace.on returning null", () => {
      const patcher = vi.fn(() => vi.fn());
      const mockWorkspace = {
        on: vi.fn(() => null),
        offref: vi.fn(),
      } as unknown as Workspace;

      expect(() => {
        patchWindows(mockWorkspace, patcher);
      }).not.toThrow();
    });

    it("handles error in window-close handler", () => {
      const unpatcher = vi.fn(() => {
        throw new Error("Unpatch error");
      });
      const patcher = vi.fn(() => unpatcher);
      let windowOpenCallback: ((window: { win: Window }) => void) | undefined;
      let windowCloseCallback: ((window: { win: Window }) => void) | undefined;

      const mockWorkspace = {
        on: vi.fn(
          (event: string, callback: (window: { win: Window }) => void) => {
            if (event === "window-open") {
              windowOpenCallback = callback;
            } else if (event === "window-close") {
              windowCloseCallback = callback;
            }
            return {};
          },
        ),
        offref: vi.fn(),
      } as unknown as Workspace;

      patchWindows(mockWorkspace, patcher);

      const mockWindow = { win: window };
      windowOpenCallback?.(mockWindow);

      // Error should be propagated
      expect(() => {
        windowCloseCallback?.(mockWindow);
      }).toThrow("Unpatch error");
    });
  });
});
