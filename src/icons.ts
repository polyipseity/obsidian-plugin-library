import { createElement } from "lucide";
import { type Plugin, addIcon as addIcon0, removeIcon } from "obsidian";
import { InternalDOMClasses } from "./internals/magic.js";

export function addIcon(id: string, content: string): () => void {
  const svgEl = new DOMParser().parseFromString(
    content,
    "image/svg+xml",
  ).documentElement;
  svgEl.classList.add(addIcon.CLASS);
  addIcon0(id, svgEl.outerHTML);
  return () => {
    removeIcon(id);
  };
}
export namespace addIcon {
  export const CLASS = InternalDOMClasses.ICON;
}

export function registerIcon(
  context: Plugin,
  ...args: Parameters<typeof addIcon>
): void {
  context.register(addIcon(...args));
}

export function registerLucideIcon(
  context: Plugin,
  id: string,
  ...args: Parameters<typeof createElement>
): void {
  const icon = createElement(...args);
  icon.setAttribute("width", "100");
  icon.setAttribute("height", "100");
  registerIcon(context, id, icon.outerHTML);
}
