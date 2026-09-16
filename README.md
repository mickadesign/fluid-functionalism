```text





───────────────────────────────────────
F L U I D   F U N C T I O N A L I S M
───────────────────────────────────────





```

# Fluid Functionalism

Refined UI components with satisfying hover.

A [shadcn/ui](https://ui.shadcn.com) registry of components, the systems they share, and blocks that compose them. Every transition exists to make a state change legible: springs instead of durations, one hover highlight that glides to the item nearest your cursor, and labels that get heavier without shifting the layout. Components that touch a primitive ship in two flavors, [Radix](https://www.radix-ui.com) and [Base UI](https://base-ui.com), with the same API on both.

[Docs and demos](https://www.fluidfunctionalism.com) · [Browse components](https://www.fluidfunctionalism.com/docs) · [Compare with shadcn/ui](https://www.fluidfunctionalism.com/compare)

## Install

Add the registry to your project once:

```bash
npx shadcn@latest registry add @fluid
```

Then install any component, system, or block by its registry name:

```bash
npx shadcn@latest add @fluid/button
```

Or install straight from the URL, without adding the registry:

```bash
npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json
```

Dependencies, shared libs, and hooks resolve on their own.

### Pick a flavor

Every component that touches a primitive has both a Radix and a Base UI flavor. The bare name installs Radix. Put `base/` in front of it for Base UI:

```bash
npx shadcn@latest add @fluid/base/button
```

The URL form is `https://www.fluidfunctionalism.com/r/base/button.json`. Dependencies follow the flavor you pick, so a Base UI dialog pulls in the Base UI button. Components built on top of a flavored one (AskUserQuestions, ColorPicker, CommandMenu, InputCopy, InputMessage, and the blocks) accept `base/` too. Everything else has one source and installs from the bare name in either kind of project. The tables below list the names.

### Overwrite the stock files

A stock shadcn project already has `button.tsx`, `dialog.tsx`, `tooltip.tsx`, and friends. This library installs under the same names, so pass `--overwrite` to replace them:

```bash
npx shadcn@latest add @fluid/dialog --overwrite
```

Without the flag the CLI asks per existing file, and a non-interactive shell (a coding agent, a CI job) exits at the first question.

### Load Inter with its optical size axis

Font weight animations use Inter's `wght` and `opsz` axes together: the heavier weight widens a label, a tighter optical size pulls it back, so text changes weight without moving its neighbours. Load the variable font with both axes.

Self-hosted, the way the docs site does it:

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/InterVariable.ttf") format("truetype");
  font-weight: 100 900;
  font-display: swap;
}
```

With `next/font/google`, ask for the axis: `Inter({ subsets: ["latin"], axes: ["opsz"] })`.

## With an AI coding agent

Every doc page and playground has a **Copy prompt** button. The prompt is a self-contained brief: the install command, a usage snippet, the props, the built-in behaviors to compose around, and the docs URL. Paste it into your agent and it wires the component in without fetching anything.

For a whole project rather than one component, this repo also ships an agent skill in [skills/fluid-functionalism](skills/fluid-functionalism). It audits the stack the first time it runs and records the flavor verdict, so later runs install without re-deriving it. Alongside it sit the component catalog, the interaction-design decisions built into each component, and the rules for writing custom motion next to them.

## Components

Install with `npx shadcn@latest add @fluid/<name>`. A second name means the component has a Base UI flavor.

| Component | Registry name | What it does |
|---|---|---|
| [Accordion](https://www.fluidfunctionalism.com/docs/accordion) | `accordion` · `base/accordion` | Collapsible sections with animated expand/collapse and fluid hover in grouped mode |
| [AskUserQuestions](https://www.fluidfunctionalism.com/docs/ask-user-questions) | `ask-user-questions` · `base/ask-user-questions` | Stepped question flow with single/multi-select, an inline "other" input, skip, and multi-question navigation |
| [Badge](https://www.fluidfunctionalism.com/docs/badge) | `badge` | Compact label with solid and dot variants, the Tailwind color palette, and 2 sizes |
| [Button](https://www.fluidfunctionalism.com/docs/button) | `button` · `base/button` | Variants, sizes, loading state, icon slots, and a weight shift on hover |
| [Card](https://www.fluidfunctionalism.com/docs/card) | `card` | shadcn's compositional card with stacked, inline, and grid layouts, borderless dividers, media/logo/feature slots, and 2-D fluid hover |
| [ChatMessage](https://www.fluidfunctionalism.com/docs/chat-message) | `chat-message` | Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments |
| [CheckboxGroup](https://www.fluidfunctionalism.com/docs/checkbox-group) | `checkbox-group` · `base/checkbox-group` | Checkbox group with merged backgrounds for contiguous selections |
| [ColorPicker](https://www.fluidfunctionalism.com/docs/color-picker) | `color-picker` · `base/color-picker` | HEX, RGB, HSL, and OKLCH formats with alpha, swatches, and eyedropper, inline or in a popover |
| [Combobox](https://www.fluidfunctionalism.com/docs/combobox) | `combobox` · `base/combobox` | Type-to-filter field with keyboard highlight, fluid hover, chips for multiple selection, and a create-from-query row |
| [CommandMenu](https://www.fluidfunctionalism.com/docs/command-menu) | `command-menu` · `base/command-menu` | Type to filter a list of actions, arrow through them, press Enter: groups, shortcut caps, suggestions, and a dialog shell on ⌘K |
| [Dialog](https://www.fluidfunctionalism.com/docs/dialog) | `dialog` · `base/dialog` | Modal with spring enter/exit and overlay in 3 widths, the largest a canvas for a sidebar |
| [Dropdown](https://www.fluidfunctionalism.com/docs/dropdown) | `dropdown` · `base/dropdown` | Menu-style dropdown with fluid hover, animated selection, and an optional search field in the popup |
| [InputCopy](https://www.fluidfunctionalism.com/docs/input-copy) | `input-copy` · `base/input-copy` | Read-only input with copy-to-clipboard and animated feedback |
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

## Systems

The systems every component shares. Each installs as code, the same way.

| System | Registry name | What it does |
|---|---|---|
| [Fluid Hover](https://www.fluidfunctionalism.com/docs/fluid-hover) | `use-fluid-hover` | One hook and one highlight per list. The highlight glides to the item nearest your cursor and never blinks off between rows |
| [Motion](https://www.fluidfunctionalism.com/docs/motion) | `springs` | 3 spring speeds, fast, moderate, and slow, each with an exit one tier quicker than its entrance |
| [Scrollbars](https://www.fluidfunctionalism.com/docs/scrollbars) | `scroll-area` · `base/scroll-area` | A scrollbar that stays out of the way but never disappears, with native scroll on touch |
| [Sizes](https://www.fluidfunctionalism.com/docs/sizes) | `size-context` | 2 sizes, a 36px default and a 28px compact, shared by buttons, inputs, selects, tabs, and rows |
| [Surfaces](https://www.fluidfunctionalism.com/docs/surfaces) | `elevated` | 8 elevation levels so popovers, dropdowns, and dialogs stay visible at any depth, in light and dark |

## Blocks

Compositions that install as one item each, with every component they use.

| Block | Registry name | What it is |
|---|---|---|
| [App Sidebar](https://www.fluidfunctionalism.com/docs/sidebar) | `sidebar-app` · `base/sidebar-app` | A complete app shell: workspace header, search field, collapsible sections with badges, user footer, and an inset topbar |
| [Settings Dialog](https://www.fluidfunctionalism.com/docs/dialog) | `dialog-sidebar` · `base/dialog-sidebar` | The xl Dialog as a canvas, a Sidebar of sections down its left edge, and a scrolling panel of controls |
| [Queued message stack](https://www.fluidfunctionalism.com/docs/input-message) | `queued-stack` · `base/queued-stack` | Sonner-style stack of queued composer messages: fan out on hover, drag to reorder, morph into the sent message |

## Presets

The Sidebar, Card, InputMessage, AskUserQuestions, Dropdown, Combobox, and CommandMenu playgrounds encode the configuration you build in the rail into a short code. Nothing is stored: the code is the configuration itself. Install it as one block that composes the component with the options you picked:

```bash
npx shadcn@latest add https://www.fluidfunctionalism.com/r/preset/<code>.json
```

Add `?preset=<code>` to the doc page URL to reopen the playground as you left it, or to share it.

## Icons

Components render icons through named slots with [Lucide](https://lucide.dev) defaults, so `lucide-react` is the only icon dependency an install adds. To use another icon library, wrap your app in the installed `IconProvider` and override any slot. Names you leave out keep their Lucide default:

```tsx
import { IconProvider } from "@/lib/icon-context";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";

<IconProvider icons={{ "chevron-right": CaretRight, "search": MagnifyingGlass }}>
  <App />
</IconProvider>
```

The icon-library switcher on the docs site is a preview tool only. None of that machinery ships with installed components.

## What makes these different

- **Motion as information.** Transitions make state changes legible. Nothing moves for decoration.
- **Hover as preview.** One highlight per list glides to the item nearest your cursor, so you see where a click lands before you click.
- **Springs, not durations.** 3 spring speeds cover the library. Interrupt an animation and it reverses from where it is instead of finishing first.
- **Weight without reflow.** Selected and hovered labels get heavier. An optical-size axis compensates the width and a ghost span reserves it, so nothing shifts.
- **Two flavors, one API.** Radix or Base UI, whichever your project already uses.
- **Drop-in compatible.** Your shadcn theme tokens (colors, radii, fonts) apply as they are.

## Tech stack

- [Next.js](https://nextjs.org) 15 + React 19 (docs site)
- [Tailwind CSS](https://tailwindcss.com) v4
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com) and [Base UI](https://base-ui.com) primitives
- [shadcn/ui](https://ui.shadcn.com) registry protocol, shadcn CLI 3

## Development

```bash
npm install
npm run dev              # docs site on http://localhost:3000
npm test                 # vitest
npm run lint
npm run registry:build   # shadcn build + scripts/postbuild-registry.mjs, writes public/r
node scripts/build-skill-craft.mjs   # writes the skill's craft reference
```

Sources live in `registry/`: `radix/` and `base/` hold the two flavors, `default/` the single-source components, hooks, and libs, `blocks/` the compositions. `public/r` is the built output users install from, and it is committed. CI rebuilds it and fails when it drifts from the sources, so run `npm run registry:build` and commit the result with any registry change. The skill's craft reference works the same way: it is generated from the prompt entries in `lib/docs/prompt-entries.ts`, and a test fails when the committed copy has drifted.

Guides in the repo: [motion-guidelines.md](motion-guidelines.md), [component-documentation-guidelines.md](component-documentation-guidelines.md), [preset-guidelines.md](preset-guidelines.md), [tone-of-voice.md](tone-of-voice.md), and [README-guidelines.md](README-guidelines.md) for what this file carries and what it defers.

## Contributing

Open an issue before a pull request, so the direction is agreed before the work starts. Contributions then follow [component-documentation-guidelines.md](component-documentation-guidelines.md) and the Development section above.

## License

[MIT](LICENSE) © Micka Touillaud
