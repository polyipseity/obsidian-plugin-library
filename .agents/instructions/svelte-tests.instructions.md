---
name: Svelte component tests
applyTo: "src/components/**"
description: Guidance and test templates for Svelte components in this repo
---

# Svelte component test guidance — obsidian-plugin-library

## Purpose

Provide clear, actionable rules and a small template for writing unit tests for Svelte components in `src/components/`.

## Core rules

- Tests for components live under `tests/src/` and follow the `*.spec.ts` naming convention (one test file per component where possible).
- Prefer the project's existing test helpers in `tests/support/` (e.g. `tick()`); keep tests framework-agnostic when possible.
- Use `vi.fn()` / `vi.spyOn()` for stubs/mocks and `vi.useFakeTimers()` when controlling timers. Reset/restore mocks in `afterEach`.
- Validate UI text using i18n test utilities from `tests/support/i18n-test-utils.ts` rather than hardcoded strings.
- Test accessibility-relevant behaviour: ARIA attributes, keyboard navigation, and focus management.
- Keep Svelte component tests fast and deterministic — avoid network or file-system access.

## Test checklist (before creating a PR)

- Component behaviour covered (props, events, DOM updates)
- Keyboard/focus flows covered for interactive components
- i18n keys used by the component are present in `assets/locales/en/translation.json`
- Mocks are cleaned up in `afterEach`

## Example test skeleton (adapt to your renderer)

> Note: the project doesn't enforce a specific Svelte testing library — adapt this example to your preferred renderer (Testing Library, SvelteKit utilities, or a lightweight DOM renderer used elsewhere in the repo).

```ts
// tests/src/find.spec.ts — example (pseudocode)
import { render /* or project renderer */ } from 'your-svelte-test-renderer';
import Find from 'src/components/find.svelte';
import { tick } from 'tests/support/helpers';

describe('Find component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('focuses input when initialFocus is true', async () => {
    const { getByRole } = render(Find, { initialFocus: true });

    // wait for mount side-effects
    await tick();

    expect(getByRole('searchbox')).toHaveFocus();
  });

  it('fires onFind when Enter is pressed', async () => {
    const onFind = vi.fn();
    const { getByRole } = render(Find, { onFind });

    const input = getByRole('searchbox');
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(onFind).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
  });
});
```

## Do / Don't

- Do: mirror the test style used in `tests/src/` and add a focused unit test for each new behaviour.
- Don't: introduce new test dependencies unless necessary; prefer to re-use existing helpers and patterns.

## Where to look for examples

- `tests/src/` — existing test files for patterns and utilities
- `tests/support/` — helper utilities and i18n test helpers

If you want, I can add a concrete `tests/src/find.spec.ts` using this template — tell me and I will create it.
