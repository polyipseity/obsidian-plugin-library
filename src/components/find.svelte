<svelte:options />

<script module lang="typescript">
  import type { Direction, Params } from "./find.js";
  import { consumeEvent, getKeyModifiers } from "../util.js";
  import type { DeepWritable } from "ts-essentials";
  import { t as i18nt } from "i18next";
  import { isEmpty, noop } from "lodash-es";
  import { onMount } from "svelte";
  import { setIcon } from "obsidian";
  import { slide } from "svelte/transition";
</script>

<script lang="typescript">
  const {
    i18n = i18nt,
    // `params` is bindable
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
  }: {
    readonly i18n?: typeof i18nt;
    params?: DeepWritable<Params>;
    readonly results?: string;
    readonly onClose?: () => unknown;
    readonly onFind?: (direction: Direction, params: Params) => unknown;
    readonly onParamsChanged?: (params: Params) => unknown;
    readonly initialFocus?: boolean;
  } = $props();

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
        aria-label={i18n("components.find.case-sensitive")}
        onclick={(event) => {
          params.caseSensitive = !params.caseSensitive;
          consumeEvent(event);
        }}
        use:setIcon={i18n("asset:components.find.case-sensitive-icon")}
      ></button>
      <button
        type="button"
        class={`document-search-button${params.wholeWord ? " mod-cta" : ""}`}
        aria-label={i18n("components.find.whole-word")}
        onclick={(event) => {
          params.wholeWord = !params.wholeWord;
          consumeEvent(event);
        }}
        use:setIcon={i18n("asset:components.find.whole-word-icon")}
      ></button>
      <button
        type="button"
        class={`document-search-button${params.regex ? " mod-cta" : ""}`}
        aria-label={i18n("components.find.regex")}
        onclick={(event) => {
          params.regex = !params.regex;
          consumeEvent(event);
        }}
        use:setIcon={i18n("asset:components.find.regex-icon")}
      ></button>
    </div>
    <input
      class="document-search-input"
      type="text"
      placeholder={i18n("components.find.input-placeholder")}
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
        aria-label={i18n("components.find.previous")}
        onclick={(event) => {
          onFind("previous", params);
          consumeEvent(event);
        }}
        use:setIcon={i18n("asset:components.find.previous-icon")}
      ></button>
      <button
        type="button"
        class="document-search-button"
        aria-label={i18n("components.find.next")}
        onclick={(event) => {
          onFind("next", params);
          consumeEvent(event);
        }}
        use:setIcon={i18n("asset:components.find.next-icon")}
      ></button>
      <div class="document-search-results" aria-live="polite">{results}</div>
      <button
        type="button"
        class="document-search-close-button"
        aria-label={i18n("components.find.close")}
        onclick={(event) => {
          onClose();
          consumeEvent(event);
        }}
        use:setIcon={i18n("asset:components.find.close-icon")}
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
