<svelte:options />

<script lang="ts" module>
  // exported types and constants for library consumers
  import { type i18n, default as i18next } from "i18next";
  import type { DeepWritable } from "ts-essentials";
  import { consumeEvent, getKeyModifiers } from "../utils.js";
  import { isEmpty, noop } from "lodash-es";
  import { onMount } from "svelte";
  import { setIcon } from "obsidian";
  import { slide } from "svelte/transition";

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
    readonly i18nt?: i18n["t"];
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
</script>

<script lang="ts">
  const {
    i18nt = i18next.t.bind(i18next),
    params = $bindable({
      caseSensitive: false,
      findText: "",
      regex: false,
      wholeWord: false,
    }),
    results = "",
    onClose = noop,
    onFind = noop,
    onParamsChanged = noop,
    initialFocus = false,
  }: Props = $props();

  $effect(() => {
    onParamsChanged(params);
  });

  let inputElement: HTMLElement | null = null;
  export function focus(): void {
    inputElement?.focus();
  }
  export function blur(): void {
    inputElement?.blur();
  }

  // svelte-ignore state_referenced_locally
  if (initialFocus) {
    onMount(focus);
  }
</script>

<div class="document-search-container" transition:slide role="search">
  <div class="document-search">
    <div class="document-search-buttons">
      <button
        type="button"
        class={`document-search-button${
          params.caseSensitive ? " mod-cta" : ""
        }`}
        aria-label={i18nt("components.find.case-sensitive")}
        onclick={(event) => {
          params.caseSensitive = !params.caseSensitive;
          consumeEvent(event);
        }}
        use:setIcon={i18nt("asset:components.find.case-sensitive-icon")}
      ></button>
      <button
        type="button"
        class={`document-search-button${params.wholeWord ? " mod-cta" : ""}`}
        aria-label={i18nt("components.find.whole-word")}
        onclick={(event) => {
          params.wholeWord = !params.wholeWord;
          consumeEvent(event);
        }}
        use:setIcon={i18nt("asset:components.find.whole-word-icon")}
      ></button>
      <button
        type="button"
        class={`document-search-button${params.regex ? " mod-cta" : ""}`}
        aria-label={i18nt("components.find.regex")}
        onclick={(event) => {
          params.regex = !params.regex;
          consumeEvent(event);
        }}
        use:setIcon={i18nt("asset:components.find.regex-icon")}
      ></button>
    </div>
    <input
      class="document-search-input"
      type="text"
      placeholder={i18nt("components.find.input-placeholder")}
      role="searchbox"
      bind:value={params.findText}
      bind:this={inputElement}
      onkeydown={(event) => {
        if (event.key === "Escape" && isEmpty(getKeyModifiers(event))) {
          onClose();
          consumeEvent(event);
        }
        if (event.key === "Enter" && isEmpty(getKeyModifiers(event))) {
          onFind("next", params);
          consumeEvent(event);
        }
      }}
    />
    <div class="document-search-buttons">
      <button
        type="button"
        class="document-search-button"
        aria-label={i18nt("components.find.previous")}
        onclick={(event) => {
          onFind("previous", params);
          consumeEvent(event);
        }}
        use:setIcon={i18nt("asset:components.find.previous-icon")}
      ></button>
      <button
        type="button"
        class="document-search-button"
        aria-label={i18nt("components.find.next")}
        onclick={(event) => {
          onFind("next", params);
          consumeEvent(event);
        }}
        use:setIcon={i18nt("asset:components.find.next-icon")}
      ></button>
      <div class="document-search-results" aria-live="polite">{results}</div>
      <button
        type="button"
        class="document-search-close-button"
        aria-label={i18nt("components.find.close")}
        onclick={(event) => {
          onClose();
          consumeEvent(event);
        }}
        use:setIcon={i18nt("asset:components.find.close-icon")}
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
