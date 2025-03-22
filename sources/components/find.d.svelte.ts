import type { Direction, Params } from "./find.ts"
import type { Component } from "svelte"
import type { DeepWritable } from "ts-essentials"
import type { t as i18nt } from "i18next"

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const FindComponent: Component<{
  readonly i18n?: typeof i18nt,
  readonly params?: Params
  readonly onClose?: () => unknown
  readonly onFind?: (direction: Direction, params: Params) => unknown
  readonly onParamsChanged?: (params: Params) => unknown
  readonly results?: string
}, {
  readonly setI18n: (i18n: typeof i18nt) => void
  readonly getParamsRef: () => DeepWritable<Params>
  readonly setResults: (results: string) => void
  readonly focus: () => void
  readonly blur: () => void
}>
export default FindComponent
