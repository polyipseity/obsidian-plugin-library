import { type Plugin, addIcon as addIcon0, removeIcon } from "obsidian";
import { InternalDOMClasses } from "./internals/magic.js";
import { createElement } from "lucide";

export function addIcon(id: string, content: string): () => void {
  const template = self.document.createElement("template");
  template.innerHTML = content;
  const {
    content: { firstElementChild: svg },
  } = template;
  if (!svg) {
    throw new Error(content);
  }
  svg.classList.add(addIcon.CLASS);
  addIcon0(id, svg.outerHTML);
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
