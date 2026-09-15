# Fluid Functionalism — component catalog

Install with `npx shadcn@latest add @fluid/<registry name>` (add `--overwrite`
when stock shadcn files exist). A second name in the Registry column means the
component has a Base UI flavor — use it when the project depends on
`@base-ui/react`. Every row links to a doc page with a live playground,
full props, and a Copy prompt button. Before composing with any item here,
read its section in [craft.md](craft.md) — the behaviors built into it that
composed code must not fight.

## Components

| Component | Registry name | What it does |
|---|---|---|
| [Accordion](https://www.fluidfunctionalism.com/docs/accordion) | `accordion` · `base/accordion` | Collapsible sections with animated expand/collapse and fluid hover in grouped mode |
| [AskUserQuestions](https://www.fluidfunctionalism.com/docs/ask-user-questions) | `ask-user-questions` · `base/ask-user-questions` | Stepped question flow with single/multi-select, an inline "other" input, skip, and multi-question navigation |
| [Badge](https://www.fluidfunctionalism.com/docs/badge) | `badge` | Compact label with solid and dot variants, the Tailwind color palette, and 2 sizes |
| [Button](https://www.fluidfunctionalism.com/docs/button) | `button` · `base/button` | Variants (primary, secondary, tertiary, ghost), sizes, loading state, icon slots, and a weight shift on hover |
| [Card](https://www.fluidfunctionalism.com/docs/card) | `card` | shadcn's compositional card with stacked, inline, and grid layouts, borderless dividers, media/logo/feature slots, and 2-D fluid hover |
| [ChatMessage](https://www.fluidfunctionalism.com/docs/chat-message) | `chat-message` | Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments |
| [CheckboxGroup](https://www.fluidfunctionalism.com/docs/checkbox-group) | `checkbox-group` · `base/checkbox-group` | Checkbox group with merged backgrounds for contiguous selections |
| [ColorPicker](https://www.fluidfunctionalism.com/docs/color-picker) | `color-picker` · `base/color-picker` | HEX, RGB, HSL, and OKLCH formats with alpha, swatches, and eyedropper, inline or in a popover |
| [Combobox](https://www.fluidfunctionalism.com/docs/combobox) | `combobox` · `base/combobox` | Type-to-filter field with keyboard highlight, fluid hover, chips for multiple selection, and a create-from-query row |
| [CommandMenu](https://www.fluidfunctionalism.com/docs/command-menu) | `command-menu` · `base/command-menu` | Type to filter a list of actions, arrow through them, press Enter: groups, shortcut caps, suggestions, and a dialog shell on ⌘K |
| [Dialog](https://www.fluidfunctionalism.com/docs/dialog) | `dialog` · `base/dialog` | Modal with spring enter/exit and overlay in 3 widths, the largest a canvas for a sidebar |
| [Dropdown](https://www.fluidfunctionalism.com/docs/dropdown) | `dropdown` · `base/dropdown` | Menu-style dropdown with fluid hover, animated selection, and an optional search field in the popup |
| [FileThumbnail](https://www.fluidfunctionalism.com/docs/input-message) | `file-thumbnail` | Read-only square preview of a File: images object-cover, PDFs render their first page |
| [InputCopy](https://www.fluidfunctionalism.com/docs/input-copy) | `input-copy` · `base/input-copy` | Read-only input with copy-to-clipboard and animated check feedback |
| [InputGroup](https://www.fluidfunctionalism.com/docs/input-group) | `input-group` | Input fields with fluid hover, animated labels, and validation |
| [InputMessage](https://www.fluidfunctionalism.com/docs/input-message) | `input-message` · `base/input-message` | Chat-style composer with auto-resizing textarea, file drop, action slots, and a built-in send button |
| [RadioGroup](https://www.fluidfunctionalism.com/docs/radio-group) | `radio-group` · `base/radio-group` | Radio buttons with fluid hover and animated selection |
| [Select](https://www.fluidfunctionalism.com/docs/select) | `select` · `base/select` | Animated select with bordered/borderless variants, typeahead, and optional icons |
| [Sidebar](https://www.fluidfunctionalism.com/docs/sidebar) | `sidebar` · `base/sidebar` | Composable app sidebar: drag its edge to resize, collapse it away or press `[` or `]`, and a drawer on mobile |
| [Slider](https://www.fluidfunctionalism.com/docs/slider) | `slider` · `base/slider` | Spring-snapped thumb, step dots, range mode, and a click-to-edit value |
| [Switch](https://www.fluidfunctionalism.com/docs/switch) | `switch` · `base/switch` | Toggle with animated thumb and label |
| [Table](https://www.fluidfunctionalism.com/docs/table) | `table` | Data table with fluid hover on rows and semantic markup |
| [Tabs](https://www.fluidfunctionalism.com/docs/tabs) | `tabs` · `base/tabs` | Segmented control with sliding indicator and fluid hover |
| [TabsSubtle](https://www.fluidfunctionalism.com/docs/tabs-subtle) | `tabs-subtle` · `base/tabs-subtle` | Tab navigation with an animated pill indicator |
| [ThinkingIndicator](https://www.fluidfunctionalism.com/docs/thinking-indicator) | `thinking-indicator` | Animated status indicator with morphing SVG and cycling text |
| [ThinkingSteps](https://www.fluidfunctionalism.com/docs/thinking-steps) | `thinking-steps` · `base/thinking-steps` | Chain-of-thought display with sequential animation and collapsible steps |
| [Tooltip](https://www.fluidfunctionalism.com/docs/tooltip) | `tooltip` · `base/tooltip` | Spring-based floating tooltip with configurable placement |
| [MobileDrawer](https://www.fluidfunctionalism.com/docs/sidebar) | `mobile-drawer` · `base/mobile-drawer` | Slide-in navigation drawer with scrim, focus trap, and scroll lock |

## Systems

Shared infrastructure — each installs as code, the same way. Components pull
these in automatically as dependencies; install one directly when custom code
needs it.

| System | Registry name | What it does |
|---|---|---|
| [Fluid Hover](https://www.fluidfunctionalism.com/docs/fluid-hover) | `use-fluid-hover` | One hook and one highlight per list. The highlight glides to the item nearest your cursor and never blinks off between rows |
| [Motion](https://www.fluidfunctionalism.com/docs/motion) | `springs` | 3 spring speeds — fast, moderate, slow — each with an exit one tier quicker than its entrance |
| [Scrollbars](https://www.fluidfunctionalism.com/docs/scrollbars) | `scroll-area` · `base/scroll-area` | A scrollbar that stays out of the way but never disappears, with native scroll on touch |
| [Sizes](https://www.fluidfunctionalism.com/docs/sizes) | `size-context` | 2 sizes, a 36px default and a 28px compact, shared by buttons, inputs, selects, tabs, and rows |
| [Surfaces](https://www.fluidfunctionalism.com/docs/surfaces) | `elevated` | 8 elevation levels so popovers, dropdowns, and dialogs stay visible at any depth, in light and dark |

Other installable libs and hooks (usually arrive as dependencies):
`font-weight` (variable weight tokens for the ghost-span pattern),
`icon-context` (named icon slots, Lucide defaults, `IconProvider` override),
`shape-context` (pill or rounded), `surface-context` / `surface-classes` /
`tokens` (elevation plumbing and `bg-hover`/`bg-active` state tokens),
`popup` (shared popup chrome), `use-touch-primary`, `use-keyboard-nav-gate`,
`use-merge-split` (the merged selected-background animation).

## Blocks

Compositions that install as one item, with every component they use.

| Block | Registry name | What it is |
|---|---|---|
| [App Sidebar](https://www.fluidfunctionalism.com/docs/sidebar) | `sidebar-app` · `base/sidebar-app` | A complete app shell: workspace header, search field, collapsible sections with badges, user footer, and an inset topbar |
| [Settings Dialog](https://www.fluidfunctionalism.com/docs/dialog) | `dialog-sidebar` · `base/dialog-sidebar` | The xl Dialog as a canvas, a Sidebar of sections down its left edge, and a scrolling panel of controls |
| [Queued message stack](https://www.fluidfunctionalism.com/docs/input-message) | `queued-stack` · `base/queued-stack` | Sonner-style stack of queued composer messages: fan out on hover, drag to reorder, morph into the sent message |

Smaller sidebar blocks also install individually: `sidebar-workspace-header`,
`sidebar-user-footer`, `sidebar-search-field`, `sidebar-inset-topbar`.

## Choosing quickly

- App shell / navigation → `sidebar-app` block (or `sidebar` to compose your own)
- Settings surface → `dialog-sidebar` block
- Chat / AI interface → `input-message` + `chat-message` + `thinking-steps` +
  `thinking-indicator` (+ `queued-stack`, `ask-user-questions`)
- Action palette → `command-menu` (dialog shell on ⌘K included)
- Forms → `input-group`, `select`, `combobox`, `checkbox-group`,
  `radio-group`, `switch`, `slider`, `color-picker`
- Data display → `table`, `card` (grid layout has 2-D fluid hover), `badge`
- Custom list/menu/grid you're writing yourself → `use-fluid-hover` +
  `springs`, then follow
  [custom-motion.md](custom-motion.md)
