// This declaration file provides TypeScript typings for the `find.svelte` component.
// Svelte's compiler generates its own `.d.ts` files when building the library, but
// during development we still need explicit types so that `import type { ... } from
// "./find.svelte"` works in the workspace.  Keeping a separate `.d.svelte.ts`
// file avoids having to preprocess the `.svelte` file just for the type checker.

import type { Component } from "svelte";
import type { t as i18nt } from "i18next";
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
  readonly i18n?: typeof i18nt;
  // `params` is bindable
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
