<svelte:options />

<script module lang="typescript">
	import type { Direction, Params } from "./find.js"
	import { cloneAsWritable, consumeEvent, getKeyModifiers } from "../util.js"
	import type { DeepWritable } from "ts-essentials"
	import { t as i18nt } from "i18next"
	import { isEmpty } from "lodash-es"
	import { setIcon } from "obsidian"
	import { onMount } from "svelte"
	import { slide } from "svelte/transition"
</script>

<script lang="typescript">
	const {
		i18n = i18nt,
		params = {
			caseSensitive: false,
			findText: "",
			regex: false,
			wholeWord: false,
		},
		onClose = () => {},
		onFind = (_direction, _params) => {},
		onParamsChanged = (_params) => {},
		results = "",
		focused = false,
	}: {
		readonly i18n?: typeof i18nt;
		readonly params?: Params;
		readonly onClose?: () => unknown;
		readonly onFind?: (direction: Direction, params: Params) => unknown;
		readonly onParamsChanged?: (params: Params) => unknown;
		readonly results?: string;
		readonly focused?: boolean;
	} = $props()

	let stateI18n = $state.raw(i18n)
	const stateParams = $state(cloneAsWritable(params))
	let stateResults = $state.raw(results)

	$effect(() => {
		onParamsChanged(stateParams)
	})

	export function setI18n(i18n0: typeof i18nt): void {
		stateI18n = i18n0
	}
	export function getParamsRef(): DeepWritable<Params> {
		return stateParams
	}
	export function setResults(results0: string): void {
		stateResults = results0
	}

	let inputElement: HTMLElement | null = null
	export function focus(): void {
		inputElement?.focus()
	}
	export function blur(): void {
		inputElement?.blur()
	}

	if (focused) {
		onMount(focus)
	}
</script>

<div class="document-search-container" transition:slide role="search">
	<div class="document-search">
		<div class="document-search-buttons">
			<button
				class={`document-search-button${
					stateParams.caseSensitive ? " mod-cta" : ""
				}`}
				aria-label={stateI18n("components.find.case-sensitive")}
				onclick={(event) => {
					stateParams.caseSensitive = !stateParams.caseSensitive
					consumeEvent(event)
				}}
				use:setIcon={stateI18n("asset:components.find.case-sensitive-icon")}
			></button>
			<button
				class={`document-search-button${
					stateParams.wholeWord ? " mod-cta" : ""
				}`}
				aria-label={stateI18n("components.find.whole-word")}
				onclick={(event) => {
					stateParams.wholeWord = !stateParams.wholeWord
					consumeEvent(event)
				}}
				use:setIcon={stateI18n("asset:components.find.whole-word-icon")}
			></button>
			<button
				class={`document-search-button${stateParams.regex ? " mod-cta" : ""}`}
				aria-label={stateI18n("components.find.regex")}
				onclick={(event) => {
					stateParams.regex = !stateParams.regex
					consumeEvent(event)
				}}
				use:setIcon={stateI18n("asset:components.find.regex-icon")}
			></button>
		</div>
		<input
			class="document-search-input"
			type="text"
			placeholder={stateI18n("components.find.input-placeholder")}
			role="searchbox"
			bind:value={stateParams.findText}
			bind:this={inputElement}
			onkeydown={(event) => {
				if (event.key === "Escape" && isEmpty(getKeyModifiers(event))) {
					onClose()
					consumeEvent(event)
				}
			}}
		/>
		<div class="document-search-buttons">
			<button
				class="document-search-button"
				aria-label={stateI18n("components.find.previous")}
				onclick={(event) => {
					onFind("previous", stateParams)
					consumeEvent(event)
				}}
				use:setIcon={stateI18n("asset:components.find.previous-icon")}
			></button>
			<button
				class="document-search-button"
				aria-label={stateI18n("components.find.next")}
				onclick={(event) => {
					onFind("next", stateParams)
					consumeEvent(event)
				}}
				use:setIcon={stateI18n("asset:components.find.next-icon")}
			></button>
			<div class="document-search-results">{stateResults}</div>
			<button
				class="document-search-close-button"
				aria-label={stateI18n("components.find.close")}
				onclick={(event) => {
					onClose()
					consumeEvent(event)
				}}
				use:setIcon={stateI18n("asset:components.find.close-icon")}
			></button>
		</div>
	</div>
</div>

<style>
	.document-search {
		flex-wrap: wrap;
	}
	:global(.is-mobile) .document-search .document-search-button.mod-cta {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
	}
</style>
