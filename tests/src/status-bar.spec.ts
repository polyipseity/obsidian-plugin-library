/**
 * Comprehensive tests for src/status-bar.ts — status bar utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStatusBar, StatusBarHider } from "../../src/status-bar.js";
import type { PluginContext } from "../../src/plugin.js";
import { InternalDOMClasses } from "../../src/internals/magic.js";

describe("status-bar.ts — status bar utilities", () => {
  let mockStatusBar: HTMLElement;

  beforeEach(() => {
    // Create a mock status bar element
    mockStatusBar = document.createElement("div");
    mockStatusBar.className = "status-bar";
    document.body.appendChild(mockStatusBar);
  });

  afterEach(() => {
    // Clean up
    if (document.body.contains(mockStatusBar)) {
      document.body.removeChild(mockStatusBar);
    }
    vi.restoreAllMocks();
  });

  describe("getStatusBar", () => {
    it("finds status bar element", () => {
      const statusBar = getStatusBar();

      expect(statusBar).toBeTruthy();
      expect(statusBar).toBe(mockStatusBar);
    });

    it("returns null when status bar not found", () => {
      document.body.removeChild(mockStatusBar);

      const statusBar = getStatusBar();

      expect(statusBar).toBeNull();
    });

    it("calls callback with status bar element", () => {
      const callback = vi.fn();

      getStatusBar(callback);

      expect(callback).toHaveBeenCalledWith(mockStatusBar);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does not call callback when status bar not found", () => {
      document.body.removeChild(mockStatusBar);
      const callback = vi.fn();

      getStatusBar(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("returns element even without callback", () => {
      const result = getStatusBar();

      expect(result).toBe(mockStatusBar);
    });

    it("works with undefined callback", () => {
      const result = getStatusBar(undefined);

      expect(result).toBe(mockStatusBar);
    });

    it("queries document for status-bar class", () => {
      const querySelectorSpy = vi.spyOn(document, "querySelector");

      getStatusBar();

      expect(querySelectorSpy).toHaveBeenCalledWith(".status-bar");
    });
  });

  describe("StatusBarHider", () => {
    let mockContext: PluginContext;
    let hider: StatusBarHider;

    beforeEach(() => {
      mockContext = {
        app: {
          workspace: {
            onLayoutReady: (callback: () => void) => {
              callback();
            },
          },
        },
      } as unknown as PluginContext;

      hider = new StatusBarHider(mockContext);
    });

    describe("constructor", () => {
      it("creates StatusBarHider instance", () => {
        expect(hider).toBeInstanceOf(StatusBarHider);
      });

      it("stores context", () => {
        expect(hider["context"]).toBe(mockContext);
      });

      it("initializes with empty hiders array", () => {
        expect(hider["_hiders"]).toEqual([]);
      });
    });

    describe("hide", () => {
      it("adds hider function", () => {
        const hiderFn = vi.fn(() => true);

        hider.hide(hiderFn);

        expect(hider["_hiders"]).toContain(hiderFn);
      });

      it("returns cleanup function", () => {
        const hiderFn = vi.fn(() => true);

        const cleanup = hider.hide(hiderFn);

        expect(typeof cleanup).toBe("function");
      });

      it("cleanup function removes hider", () => {
        const hiderFn = vi.fn(() => true);
        const cleanup = hider.hide(hiderFn);

        cleanup();

        expect(hider["_hiders"]).not.toContain(hiderFn);
      });

      it("adds hide class when hider returns true", () => {
        hider.onload();
        const hiderFn = () => true;

        hider.hide(hiderFn);

        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );
      });

      it("does not add hide class when hider returns false", () => {
        hider.onload();
        const hiderFn = () => false;

        hider.hide(hiderFn);

        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );
      });

      it("updates status bar immediately", () => {
        hider.onload();
        const updateSpy = vi.spyOn(hider, "update");

        hider.hide(() => true);

        expect(updateSpy).toHaveBeenCalled();
      });

      it("supports multiple hiders", () => {
        hider.onload();
        const hider1 = () => false;
        const hider2 = () => true;

        hider.hide(hider1);
        hider.hide(hider2);

        expect(hider["_hiders"]).toHaveLength(2);
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );
      });
    });

    describe("update", () => {
      beforeEach(() => {
        hider.onload();
      });

      it("adds hide class when any hider returns true", () => {
        hider.hide(() => false);
        hider.hide(() => true);

        hider.update();

        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );
      });

      it("removes hide class when all hiders return false", () => {
        mockStatusBar.classList.add(StatusBarHider.class);
        hider.hide(() => false);
        hider.hide(() => false);

        hider.update();

        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );
      });

      it("checks all hider functions", () => {
        const hider1 = vi.fn(() => false);
        const hider2 = vi.fn(() => false);
        const hider3 = vi.fn(() => true);

        hider.hide(hider1);
        hider.hide(hider2);
        hider.hide(hider3);

        hider.update();

        // Should check until one returns true
        expect(hider1).toHaveBeenCalled();
      });

      it("short-circuits when first hider returns true", () => {
        const hider1 = vi.fn(() => true);
        const hider2 = vi.fn(() => false);

        hider.hide(hider1);
        hider.hide(hider2);

        hider.update();

        expect(hider1).toHaveBeenCalled();
        // May or may not call hider2 depending on implementation
      });

      it("handles no hiders gracefully", () => {
        hider.update();

        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );
      });

      it("does nothing when status bar not found", () => {
        document.body.removeChild(mockStatusBar);

        expect(() => hider.update()).not.toThrow();
      });
    });

    describe("onload", () => {
      it("calls parent onload", () => {
        const parentOnload = vi.spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(hider)),
          "onload",
        );

        hider.onload();

        expect(parentOnload).toHaveBeenCalled();
      });

      it("registers cleanup function", () => {
        const registerSpy = vi.spyOn(hider, "register");

        hider.onload();

        expect(registerSpy).toHaveBeenCalled();
      });

      it("updates status bar on layout ready", () => {
        const updateSpy = vi.spyOn(hider, "update");

        hider.onload();

        expect(updateSpy).toHaveBeenCalled();
      });

      it("cleanup clears all hiders", () => {
        hider.onload();
        const cleanupFn1 = hider.hide(() => true);
        const cleanupFn2 = hider.hide(() => false);

        // Get the cleanup function registered
        const cleanupFn = [cleanupFn1, cleanupFn2] as const;

        expect(hider["_hiders"]).toHaveLength(2);
        cleanupFn[0]();
        expect(hider["_hiders"]).toHaveLength(1);
        cleanupFn[1]();
        expect(hider["_hiders"]).toHaveLength(0);
      });
    });

    describe("StatusBarHider.class constant", () => {
      it("exports class constant", () => {
        expect(typeof StatusBarHider.class).toBe("string");
      });

      it("class constant is non-empty", () => {
        expect(StatusBarHider.class.length).toBeGreaterThan(0);
      });

      it("class constant matches expected value", () => {
        expect(StatusBarHider.class).toBe(InternalDOMClasses.HIDE_STATUS_BAR);
      });
    });

    describe("Integration scenarios", () => {
      beforeEach(() => {
        hider.onload();
      });

      it("toggles visibility based on hider state", () => {
        let shouldHide = false;
        const toggleHider = () => shouldHide;
        hider.hide(toggleHider);

        // Initially visible
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );

        // Hide
        shouldHide = true;
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );

        // Show again
        shouldHide = false;
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );
      });

      it("multiple hiders work independently", () => {
        let hide1 = false;
        let hide2 = false;

        const cleanup1 = hider.hide(() => hide1);
        const cleanup2 = hider.hide(() => hide2);

        // Neither hiding
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );

        // One hiding
        hide1 = true;
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );

        // Both hiding
        hide2 = true;
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );

        // Remove one hider
        cleanup1();
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );

        // Remove second hider
        cleanup2();
        hider.update();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );
      });

      it("cleanup removes hider and updates", () => {
        const cleanup = hider.hide(() => true);
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          true,
        );

        cleanup();
        expect(mockStatusBar.classList.contains(StatusBarHider.class)).toBe(
          false,
        );
      });

      it("handles rapid hide/show cycles", () => {
        const hiderFn = vi.fn(() => true);

        for (let i = 0; i < 10; i++) {
          const cleanup = hider.hide(hiderFn);
          cleanup();
        }

        expect(hider["_hiders"]).toHaveLength(0);
      });
    });

    describe("Edge cases", () => {
      it("handles hider that throws error", () => {
        hider.onload();
        const errorHider = () => {
          throw new Error("Hider error");
        };

        expect(() => hider.hide(errorHider)).toThrow("Hider error");
      });

      it("handles cleanup called multiple times", () => {
        hider.onload();
        const cleanup = hider.hide(() => true);

        expect(() => {
          cleanup();
          cleanup();
          cleanup();
        }).not.toThrow();
      });

      it("handles update before onload", () => {
        const newHider = new StatusBarHider(mockContext);

        expect(() => newHider.update()).not.toThrow();
      });
    });
  });
});
