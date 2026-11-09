// A keyboard scope is a region that keeps its keys: a component preview on
// the docs, a /demo card, a Showcase tile. While focus is inside one, the
// site's own shortcuts (settings keys, page arrows, the sidebar toggle, ⌘K)
// stand aside so the keys reach the component being tried. Registry parts
// with page-wide shortcuts (Sidebar, CommandMenu) honor the same attribute.

export const KEYBOARD_SCOPE_SELECTOR = "[data-keyboard-scope]";

/** Whether a key event (or focus) comes from inside a keyboard scope. */
export function inKeyboardScope(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(KEYBOARD_SCOPE_SELECTOR) !== null;
}
