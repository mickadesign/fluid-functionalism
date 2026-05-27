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

/**
 * Routes keyboard control into a container on click. When the user clicks an
 * empty (non-interactive) part of the click region, focus moves to the first
 * interactive element inside `scope` (falling back to `fallback`, if focusable).
 * Clicking an interactive element keeps its native focus. Pair with a
 * `:focus-within` border so the active container is visible; the page regains
 * keyboard control when focus leaves (click outside / Tab away).
 *
 * `scope` is where we look for the first interactive element; `fallback` is the
 * element that defines the "already active" region and receives focus when the
 * scope has nothing focusable (e.g. a card wrapper with tabIndex={-1}).
 */
export function routeKeyboardOnMouseDown(
  e: MouseEvent,
  scope: HTMLElement | null,
  fallback?: HTMLElement | null
) {
  if (!scope) return;
  const target = e.target as HTMLElement;
  if (target.closest(FOCUSABLE_SELECTOR)) return; // let the element focus itself
  e.preventDefault(); // don't blur to <body> on an empty-space click
  const region = fallback ?? scope;
  if (region.contains(document.activeElement) && document.activeElement !== region)
    return; // already keyboard-active here — keep the current focus
  const focusable = scope.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  (focusable ?? fallback ?? scope).focus();
}
