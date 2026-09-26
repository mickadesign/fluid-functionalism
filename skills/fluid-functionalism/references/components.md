# Fluid Functionalism — component catalog

Install with `npx shadcn@latest add @fluid/<registry name>` (add `--overwrite`
when stock shadcn files exist). A second name in the Registry column means the
component has a Base UI flavor — use it when the project depends on
`@base-ui/react`. Every row links to its doc page or the closest parent page,
with live examples, props, and a Copy prompt button. Its Craft column points
to the exact section in [craft.md](craft.md) to read before composing;
standalone parts without their own page point to the parent component whose
behavior they extend.

## Components

| Component | Registry name | What it does | Craft |
|---|---|---|---|
| [Accordion](https://www.fluidfunctionalism.com/docs/accordion) | `accordion` · `base/accordion` | Collapsible sections with animated expand/collapse and fluid hover in grouped mode | [Accordion](craft.md#accordion) |
| [AskUserQuestions](https://www.fluidfunctionalism.com/docs/ask-user-questions) | `ask-user-questions` · `base/ask-user-questions` | Stepped question flow with single/multi-select, an inline "other" input, skip, and multi-question navigation | [AskUserQuestions](craft.md#ask-user-questions) |
| [Badge](https://www.fluidfunctionalism.com/docs/badge) | `badge` | Compact label with solid and dot variants, the Tailwind color palette, and 2 sizes | [Badge](craft.md#badge) |
| [Button](https://www.fluidfunctionalism.com/docs/button) | `button` · `base/button` | Variants (primary, secondary, tertiary, ghost), sizes, loading state, icon slots, and a weight shift on hover | [Button](craft.md#button) |
| [Card](https://www.fluidfunctionalism.com/docs/card) | `card` | shadcn's compositional card with stacked, inline, and grid layouts, borderless dividers, media/logo/feature slots, and 2-D fluid hover | [Card](craft.md#card) |
| [CarouselDots](https://www.fluidfunctionalism.com/docs/carousel-dots) | `carousel-dots` | Carousel dots, static or on autoplay (`autoplay` prop): fluid-hover click areas, a pill that fills over each slide | [CarouselDots](craft.md#carousel-dots) |
| [ChatMessage](https://www.fluidfunctionalism.com/docs/chat-message) | `chat-message` | Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments | [ChatMessage](craft.md#chat-message) |
| [CheckboxGroup](https://www.fluidfunctionalism.com/docs/checkbox-group) | `checkbox-group` · `base/checkbox-group` | Checkbox group with merged backgrounds for contiguous selections | [CheckboxGroup](craft.md#checkbox-group) |
| [ColorPicker](https://www.fluidfunctionalism.com/docs/color-picker) | `color-picker` · `base/color-picker` | HEX, RGB, HSL, and OKLCH formats with alpha, swatches, and eyedropper, inline or in a popover | [ColorPicker](craft.md#color-picker) |
| [Combobox](https://www.fluidfunctionalism.com/docs/combobox) | `combobox` · `base/combobox` | Type-to-filter field with keyboard highlight, fluid hover, chips for multiple selection, and a create-from-query row | [Combobox](craft.md#combobox) |
| [CommandMenu](https://www.fluidfunctionalism.com/docs/command-menu) | `command-menu` · `base/command-menu` | Type to filter a list of actions, arrow through them, press Enter: groups, shortcut caps, suggestions, and a dialog shell on ⌘K | [CommandMenu](craft.md#command-menu) |
| [Dialog](https://www.fluidfunctionalism.com/docs/dialog) | `dialog` · `base/dialog` | Modal with spring enter/exit and overlay in 3 widths, the largest a canvas for a sidebar | [Dialog](craft.md#dialog) |
| [Dropdown](https://www.fluidfunctionalism.com/docs/dropdown) | `dropdown` · `base/dropdown` | Menu-style dropdown with fluid hover, animated selection, and an optional search field in the popup | [Dropdown](craft.md#dropdown) |
| [FileThumbnail](https://www.fluidfunctionalism.com/docs/input-message) | `file-thumbnail` | Read-only square preview of a File: images object-cover, PDFs render their first page | [InputMessage](craft.md#input-message) |
| [InputCopy](https://www.fluidfunctionalism.com/docs/input-copy) | `input-copy` · `base/input-copy` | Read-only input with copy-to-clipboard and animated check feedback | [InputCopy](craft.md#input-copy) |
| [InputGroup](https://www.fluidfunctionalism.com/docs/input-group) | `input-group` | Input fields with fluid hover, animated labels, and validation | [InputGroup](craft.md#input-group) |
| [InputMessage](https://www.fluidfunctionalism.com/docs/input-message) | `input-message` · `base/input-message` | Chat-style composer with auto-resizing textarea, file drop, action slots, and a built-in send button | [InputMessage](craft.md#input-message) |
| [RadioGroup](https://www.fluidfunctionalism.com/docs/radio-group) | `radio-group` · `base/radio-group` | Radio buttons with fluid hover and animated selection | [RadioGroup](craft.md#radio-group) |
| [Select](https://www.fluidfunctionalism.com/docs/select) | `select` · `base/select` | Animated select with bordered/borderless variants, typeahead, and optional icons | [Select](craft.md#select) |
| [Sidebar](https://www.fluidfunctionalism.com/docs/sidebar) | `sidebar` · `base/sidebar` | Composable app sidebar: drag its edge to resize, collapse it away or press `[` or `]`, and a drawer on mobile | [Sidebar](craft.md#sidebar) |
| [Slider](https://www.fluidfunctionalism.com/docs/slider) | `slider` · `base/slider` | Spring-snapped thumb, step dots, range mode, and a click-to-edit value | [Slider](craft.md#slider) |
| [Switch](https://www.fluidfunctionalism.com/docs/switch) | `switch` · `base/switch` | Toggle with animated thumb and label | [Switch](craft.md#switch) |
| [Table](https://www.fluidfunctionalism.com/docs/table) | `table` | Data table with fluid hover on rows and semantic markup | [Table](craft.md#table) |
| [Tabs](https://www.fluidfunctionalism.com/docs/tabs) | `tabs` · `base/tabs` | Segmented control with sliding indicator and fluid hover | [Tabs](craft.md#tabs) |
| [TabsSubtle](https://www.fluidfunctionalism.com/docs/tabs-subtle) | `tabs-subtle` · `base/tabs-subtle` | Tab navigation with an animated pill indicator | [TabsSubtle](craft.md#tabs-subtle) |
| [ThinkingIndicator](https://www.fluidfunctionalism.com/docs/thinking-indicator) | `thinking-indicator` | Animated status indicator with morphing SVG and cycling text | [ThinkingIndicator](craft.md#thinking-indicator) |
| [ThinkingSteps](https://www.fluidfunctionalism.com/docs/thinking-steps) | `thinking-steps` · `base/thinking-steps` | Chain-of-thought display with sequential animation and collapsible steps | [ThinkingSteps](craft.md#thinking-steps) |
| [Tooltip](https://www.fluidfunctionalism.com/docs/tooltip) | `tooltip` · `base/tooltip` | Spring-based floating tooltip with configurable placement | [Tooltip](craft.md#tooltip) |
| [MobileDrawer](https://www.fluidfunctionalism.com/docs/sidebar) | `mobile-drawer` · `base/mobile-drawer` | Slide-in navigation drawer with scrim, focus trap, and scroll lock | [Sidebar](craft.md#sidebar) |

## Systems

Shared infrastructure — each installs as code, the same way. Components pull
these in automatically as dependencies; install one directly when custom code
needs it.

| System | Registry name | What it does | Craft |
|---|---|---|---|
| [Fluid Hover](https://www.fluidfunctionalism.com/docs/fluid-hover) | `use-fluid-hover` | One hook and one highlight per list. The highlight glides to the item nearest your cursor and never blinks off between rows | [Fluid Hover](craft.md#fluid-hover) |
| [Motion](https://www.fluidfunctionalism.com/docs/motion) | `springs` | 3 spring speeds — fast, moderate, slow — each with an exit one tier quicker than its entrance | [Motion](craft.md#motion) |
| [Scrollbars](https://www.fluidfunctionalism.com/docs/scrollbars) | `scroll-area` · `base/scroll-area` | A scrollbar that stays out of the way but never disappears, with native scroll on touch | [Scrollbars](craft.md#scrollbars) |
| [Sizes](https://www.fluidfunctionalism.com/docs/sizes) | `size-context` | 2 sizes, a 36px default and a 28px compact, shared by buttons, inputs, selects, tabs, and rows | [Sizes](craft.md#sizes) |
| [Surfaces](https://www.fluidfunctionalism.com/docs/surfaces) | `elevated` | 8 elevation levels so popovers, dropdowns, and dialogs stay visible at any depth, in light and dark | [Surfaces](craft.md#surfaces) |

Other installable libs and hooks (usually arrive as dependencies):
`font-weight` (variable weight tokens for the ghost-span pattern),
`icon-context` (named icon slots, Lucide defaults, `IconProvider` override),
`shape-context` (pill or rounded), `surface-context` / `surface-classes` /
`tokens` (elevation plumbing and `bg-hover`/`bg-active` state tokens),
`popup` (shared popup chrome), `use-touch-primary`, `use-keyboard-nav-gate`,
`use-merge-split` (the merged selected-background animation).

## Blocks

Compositions that install as one item, with every component they use.

| Block | Registry name | What it is | Craft |
|---|---|---|---|
| [App Sidebar](https://www.fluidfunctionalism.com/docs/sidebar) | `sidebar-app` · `base/sidebar-app` | A complete app shell: workspace header, search field, collapsible sections with badges, user footer, and an inset topbar | [App Sidebar](craft.md#sidebar-app) |
| [Settings Dialog](https://www.fluidfunctionalism.com/docs/dialog) | `dialog-sidebar` · `base/dialog-sidebar` | The xl Dialog as a canvas, a Sidebar of sections down its left edge, and a scrolling panel of controls | [Settings Dialog](craft.md#dialog-sidebar) |
| [Queued message stack](https://www.fluidfunctionalism.com/docs/input-message) | `queued-stack` · `base/queued-stack` | Sonner-style stack of queued composer messages: fan out on hover, drag to reorder, morph into the sent message | [Queued stack](craft.md#queued-stack) |

Smaller sidebar blocks also install individually, and each has a Base UI
flavor too: `sidebar-workspace-header` · `base/sidebar-workspace-header`,
`sidebar-user-footer` · `base/sidebar-user-footer`, `sidebar-search-field` ·
`base/sidebar-search-field`, `sidebar-inset-topbar` ·
`base/sidebar-inset-topbar`. They are parts of the complete shell, so use the
[App Sidebar craft](craft.md#sidebar-app) plus the installed source for the
part itself.

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
