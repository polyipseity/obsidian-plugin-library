import type {} from "obsidian";

export function requestAnimationFrame(
  ...args: Parameters<AnimationFrameProvider["requestAnimationFrame"]>
): ReturnType<AnimationFrameProvider["requestAnimationFrame"]> {
  return self.activeWindow.requestAnimationFrame(...args);
}

export function setInterval(
  ...args: Parameters<WindowOrWorkerGlobalScope["setInterval"]>
): ReturnType<WindowOrWorkerGlobalScope["setInterval"]> {
  return self.activeWindow.setInterval(...args);
}

export function setTimeout(
  ...args: Parameters<WindowOrWorkerGlobalScope["setTimeout"]>
): ReturnType<WindowOrWorkerGlobalScope["setTimeout"]> {
  return self.activeWindow.setTimeout(...args);
}
