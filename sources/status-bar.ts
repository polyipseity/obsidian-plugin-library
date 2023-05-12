import { Component } from "obsidian"
import { DOMClasses } from "./magic.js"
import { InternalDOMClasses } from "./internals/magic.js"
import type { PluginContext } from "./plugin.js"
import { remove } from "./util.js"

export function getStatusBar(callback?: (
	element: Element) => void): Element | null {
	// Okay to use `document` as it only exists on the main one
	const ret = self.document.querySelector(`.${DOMClasses.STATUS_BAR}`)
	if (ret && callback) { callback(ret) }
	return ret
}

export class StatusBarHider extends Component {
	public static readonly class = InternalDOMClasses.HIDE_STATUS_BAR
	readonly #hiders: (() => boolean)[] = []

	public constructor(protected readonly context: PluginContext) {
		super()
		context.addChild(this)
	}

	public override onload(): void {
		super.onload()
		this.context.app.workspace.onLayoutReady(() => { this.update() })
	}

	public hide(hider: () => boolean): () => void {
		this.#hiders.push(hider)
		this.update()
		return () => {
			remove(this.#hiders, hider)
			this.update()
		}
	}

	public update(): void {
		getStatusBar(div => {
			if (this.#hiders.some(hider0 => hider0())) {
				div.classList.add(StatusBarHider.class)
			} else {
				div.classList.remove(StatusBarHider.class)
			}
		})
	}
}
