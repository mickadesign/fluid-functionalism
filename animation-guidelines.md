# Animation Guidelines

## Spring Tokens

| Token | Value | Usage | Components |
|---|---|---|---|
| `spring-fast` | 0.08s | Micro-interactions: hover, fade | Checkboxes, Radio Buttons, Toggles, Tabs, Chips |
| `spring-moderate` | 0.16s | Small expansion, short distance movement | Dropdowns, Tooltips, Toast |
| `spring-slow` | 0.24s | Large expansion, important system notifications | Modals, LeftNav, SidePeek |

## Entering and Exiting

Use these patterns when a UI element appears on or disappears from the screen.

### Entering

For elements being added to the view: modals appearing, toasts sliding in, dropdowns opening, toggles switching. Any motion triggered by user input that introduces a new element.

### Exiting

For elements being removed from view: closing a modal, dismissing a toast.

Exit animations should be slightly faster than their enter counterpart. Faster exits make the interface feel responsive and alive — they signal finality, keep interaction rhythm sharp, and prevent the UI from feeling sluggish.
