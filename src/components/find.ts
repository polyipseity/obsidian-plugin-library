import { deepFreeze } from "../util.js";

export const DIRECTIONS = deepFreeze(["next", "previous"]);
export type Direction = (typeof DIRECTIONS)[number];
export interface Params {
  readonly caseSensitive: boolean;
  readonly findText: string;
  readonly regex: boolean;
  readonly wholeWord: boolean;
}
