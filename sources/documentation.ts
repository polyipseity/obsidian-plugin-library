import { type Fixed, fixTyped, markFixed } from "./fixers.js"
import {
	ItemView,
	MarkdownRenderer,
	type ViewStateResult,
	type WorkspaceLeaf,
} from "obsidian"
import {
	UnnamespacedID,
	newCollabrativeState,
	printMalformedData,
	readStateCollabratively,
	recordViewStateHistory,
	updateView,
	writeStateCollabratively,
} from "./obsidian.js"
import { capitalize, createChildElement, deepFreeze } from "./util.js"
import { DOMClasses } from "./magic.js"
import type { PluginContext } from "./plugin.js"
import type { TranslationKey } from "./i18n.js"
import { launderUnchecked } from "./types.js"

export class DocumentationMarkdownView extends ItemView {
	public static readonly type = new UnnamespacedID("documentation")
	static #namespacedType: string
	protected readonly element
	#state = DocumentationMarkdownView.State.DEFAULT

	public constructor(
		protected readonly context: PluginContext,
		leaf: WorkspaceLeaf,
	) {
		DocumentationMarkdownView.#namespacedType =
			DocumentationMarkdownView.type.namespaced(context)
		super(leaf)
		const { contentEl } = this
		this.navigation = true
		this.element = createChildElement(
			createChildElement(contentEl, "div", element => {
				element.classList.add(
					DOMClasses.ALLOW_FOLD_HEADINGS,
					DOMClasses.ALLOW_FOLD_LISTS,
					DOMClasses.IS_READABLE_LINE_WIDTH,
					DOMClasses.MARKDOWN_PREVIEW_VIEW,
					DOMClasses.MARKDOWN_RENDERED,
					DOMClasses.NODE_INSERT_EVENT,
					DOMClasses.SHOW_INDENTATION_GUIDE,
				)
			}),
			"div",
			element => {
				element.classList.add(
					DOMClasses.MARKDOWN_PREVIEW_SECTION,
					DOMClasses.MARKDOWN_PREVIEW_SIZER,
				)
			},
		)
	}

	protected get state(): DocumentationMarkdownView.State {
		return this.#state
	}

	protected set state(value: DocumentationMarkdownView.State) {
		this.#state = value
		updateView(this.context, this)
	}

	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	public override getViewType(): string {
		return DocumentationMarkdownView.#namespacedType
	}

	public override getDisplayText(): string {
		const {
			context: { language: { value: i18n, language } },
			state: { displayTextI18nKey: key },
		} = this
		return key === null ? "" : capitalize(String(i18n.t(key)), language)
	}

	public override getIcon(): string {
		const {
			context: { language: { value: i18n } },
			state: { iconI18nKey: key },
		} = this
		return key === null ? super.getIcon() : String(i18n.t(key))
	}

	public override async setState(
		state: unknown,
		result: ViewStateResult,
	): Promise<void> {
		const { context: plugin, element } = this,
			ownState = readStateCollabratively(
				DocumentationMarkdownView.type.namespaced(plugin),
				state,
			),
			{ value, valid } = DocumentationMarkdownView.State.fix(ownState)
		if (!valid) { printMalformedData(plugin, ownState, value) }
		await super.setState(state, result)
		const { data } = value
		this.state = value
		await MarkdownRenderer.renderMarkdown(data, element, "", this)
		recordViewStateHistory(plugin, result)
	}

	public override getState(): unknown {
		return writeStateCollabratively(
			super.getState(),
			DocumentationMarkdownView.type.namespaced(this.context),
			this.state,
		)
	}

	protected override async onOpen(): Promise<void> {
		await super.onOpen()
		const { context, context: { language: { onChangeLanguage } } } = this
		this.register(onChangeLanguage.listen(() => { updateView(context, this) }))
	}
}
class Registered0 {
	public constructor(public readonly context: PluginContext) { }

	public async open(
		active: boolean,
		state: DocumentationMarkdownView.State,
	): Promise<void> {
		const { context, context: { app: { workspace } } } = this
		return new Promise(resolve => {
			workspace.onLayoutReady(() => {
				resolve(workspace.getLeaf("tab").setViewState({
					active,
					state: newCollabrativeState(
						context,
						new Map([
							[
								DocumentationMarkdownView.type,
								state satisfies DocumentationMarkdownView.State,
							],
						]),
					),
					type: DocumentationMarkdownView.type.namespaced(context),
				}))
			})
		})
	}
}
export namespace DocumentationMarkdownView {
	export type Registered = Registered0
	export function register(
		context: PluginContext,
	): Registered {
		const { type } = DocumentationMarkdownView
		context.registerView(
			type.namespaced(context),
			leaf => new DocumentationMarkdownView(context, leaf),
		)
		return new Registered0(context)
	}
	export interface State {
		readonly data: string
		readonly displayTextI18nKey: TranslationKey | null
		readonly iconI18nKey: TranslationKey | null
	}
	export namespace State {
		export const DEFAULT: State = deepFreeze({
			data: "",
			displayTextI18nKey: null,
			iconI18nKey: null,
		})
		export function fix(self0: unknown): Fixed<State> {
			const unc = launderUnchecked<State>(self0)
			return markFixed(self0, {
				data: fixTyped(DEFAULT, unc, "data", ["string"]),
				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
				displayTextI18nKey: fixTyped(
					DEFAULT,
					unc,
					"displayTextI18nKey",
					["string", "null"],
				) as TranslationKey | null,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
				iconI18nKey: fixTyped(
					DEFAULT,
					unc,
					"iconI18nKey",
					["string", "null"],
				) as TranslationKey | null,
			})
		}
	}
}
