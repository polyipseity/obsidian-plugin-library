export type Direction = "next" | "previous"
export interface Params {
	readonly caseSensitive: boolean
	readonly findText: string
	readonly regex: boolean
	readonly wholeWord: boolean
}
