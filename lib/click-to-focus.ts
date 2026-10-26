"use client";

import type { MouseEvent } from "react";

// Anything that can hold keyboard focus. Used to (a) detect clicks that should
// keep their native focus behaviour, and (b) find the element to focus when the
// user clicks an empty part of a container.
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[role="slider"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// Fields a click away should leave: text-like inputs only (not range,
// buttons, checkboxes or file pickers, which keep focus like any control).
const TEXT_ENTRY_SELECTOR = [
  "textarea",
  "input:not([type])",
  ...["text", "search", "email", "url", "tel", "password", "number", "date", "time", "datetime-local", "month", "week"].map(
    (type) => `input[type=${type}]`
  ),
].join(",");

/**
 * Routes keyboard control into a container on click. When the user clicks an
 * empty (non-interactive) part of the click region, focus moves to the
 * CONTAINER itself (`fallback ?? scope` — give it tabIndex={-1}), not to any
 * control inside it: Chrome reports script-driven focus as :focus-visible, so
 * focusing a control would light its keyboard ring on a plain mouse click
 * (the sidebar demo's header row, most visibly). Keyboard-scoped components
 * resolve a focused ancestor to the instance it wraps (see the sidebar
 * provider's and AskUserQuestions' shortcut resolution), so shortcuts still
 * land in the clicked demo. Clicking an interactive element keeps its native
 * focus. Pair with a `:focus-within` border so the active container is
 * visible; the page regains keyboard control when focus leaves.
 */
export function routeKeyboardOnMouseDown(
  e: MouseEvent,
  scope: HTMLElement | null,
  fallback?: HTMLElement | null
) {
  if (!scope) return;
  const target = e.target as HTMLElement;
  if (target.closest(FOCUSABLE_SELECTOR)) return; // let the element focus itself
  // React bubbles events out of portals: a press on a popup opened from the
  // demo (a time list, a menu) isn't a click on this region's empty space.
  // Keep focus where it is (the field driving the popup), and move nothing.
  if (!scope.contains(target)) {
    e.preventDefault();
    return;
  }
  e.preventDefault(); // don't blur to <body> on an empty-space click
  const region = fallback ?? scope;
  const active = document.activeElement as HTMLElement | null;
  // Already keyboard-active here: keep the current focus, except in a text
  // field. Clicking away from a field means leaving it (a time being typed
  // commits on blur), so focus moves to the region instead.
  const typing = !!active && (active.matches(TEXT_ENTRY_SELECTOR) || active.isContentEditable);
  if (active && region.contains(active) && active !== region && !typing) return;
  region.focus();
}
