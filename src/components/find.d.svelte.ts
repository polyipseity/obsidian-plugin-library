import type { Direction, Params } from "./find.ts";
import type { Component } from "svelte";
import type { DeepWritable } from "ts-essentials";
import type { t as i18nt } from "i18next";

declare const FindComponent: Component<
  {
    i18n?: typeof i18nt;
    // `params` is bindable
    params?: DeepWritable<Params>;
    results?: string;
    onClose?: () => unknown;
    onFind?: (direction: Direction, params: Params) => unknown;
    onParamsChanged?: (params: Params) => unknown;
    initialFocus?: boolean;
  },
  {
    readonly focus: () => void;
    readonly blur: () => void;
  },
  "params"
>;
export default FindComponent;
