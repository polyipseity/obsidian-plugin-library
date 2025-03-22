import type { Direction, Params } from "./find.ts"
import type { Component } from "svelte"
import type { DeepWritable } from "ts-essentials"
import type { t as i18nt } from "i18next"

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const FindComponent: Component<{
  i18n: typeof i18nt,
  params: DeepWritable<Params>
  onClose: () => void,
  onFind: (direction: Direction, params: Params) => void
  onParamsChanged: (params: Params) => void
  results: str
}, {
  readonly focus: () => void
  readonly blur: () => void
}>
export default FindComponent
