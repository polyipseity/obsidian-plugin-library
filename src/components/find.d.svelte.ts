// This declaration file provides TypeScript typings for the `find.svelte` component.
// Svelte's compiler generates its own `.d.ts` files when building the library, but
// during development we still need explicit types so that `import type { ... } from
// "./find.svelte"` works in the workspace.  Keeping a separate `.d.svelte.ts`
// file avoids having to preprocess the `.svelte` file just for the type checker.

import type { Component } from "svelte";
import type i18next from "i18next";
import type { DeepWritable } from "ts-essentials";

export const DIRECTIONS = ["next", "previous"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export interface Params {
  readonly caseSensitive: boolean;
  readonly findText: string;
  readonly regex: boolean;
  readonly wholeWord: boolean;
}

export interface Props {
  /**
   * Remember to bind `i18nt` if you want to use it in the component's markup.
   * This is because the component expects a function that is already bound to
   * the i18next instance, so it can be called directly without needing to reference
   * the instance.  By default, `i18nt` is set to `i18next.t.bind(i18next)`,
   * so if you don't provide your own it will still work as expected.
   *
   * However, if you want to use a custom translation function or a different
   * i18next instance, you can pass it in as a prop and bind it in your markup.
   */
  readonly i18nt?: typeof i18next.t;
  params?: DeepWritable<Params>;
  readonly results?: string;
  readonly onClose?: () => unknown;
  readonly onFind?: (direction: Direction, params: Params) => unknown;
  readonly onParamsChanged?: (params: Params) => unknown;
  readonly initialFocus?: boolean;
}

export interface Exports {
  readonly focus: () => void;
  readonly blur: () => void;
}

export type Bindings = "params";

// the default export is the component itself. during normal builds the
// compiler generates a class, so our declaration mirrors that by extending the
// generic `Component` type. this makes the value newable and mergeable with a
// namespace below.
declare class FindComponent extends Component<Props, Exports, Bindings> {}
export default FindComponent;
