# Fluid Functionalism

Refined UI components with satisfying hover. Built on [shadcn/ui](https://ui.shadcn.com) and Radix primitives — every transition exists to make a state change legible.

[Live docs & demos](https://www.fluidfunctionalism.com) | [Browse components](https://www.fluidfunctionalism.com/docs)

## Install

Add the registry to your project:

```bash
npx shadcn@latest registry add @fluid
```

Then install any component:

```bash
npx shadcn@latest add @fluid/button
```

Or install directly without adding the registry:

```bash
npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json
```

Dependencies resolve automatically. Font weight animations require the [Inter](https://fonts.google.com/specimen/Inter) variable font.

## Components

| Component | Description |
|---|---|
| [Accordion](https://www.fluidfunctionalism.com/docs/accordion) | Collapsible sections with animated expand/collapse and proximity hover |
| [Badge](https://www.fluidfunctionalism.com/docs/badge) | Compact label with solid and dot variants, Tailwind color palette |
| [Button](https://www.fluidfunctionalism.com/docs/button) | Variants, sizes, loading state, and icon support |
| [CheckboxGroup](https://www.fluidfunctionalism.com/docs/checkbox-group) | Merged backgrounds for contiguous selections |
| [Dialog](https://www.fluidfunctionalism.com/docs/dialog) | Modal with smooth enter/exit animations and overlay |
| [Dropdown](https://www.fluidfunctionalism.com/docs/dropdown) | Menu-style dropdown with proximity hover |
| [InputCopy](https://www.fluidfunctionalism.com/docs/input-copy) | Read-only input with copy-to-clipboard and animated feedback |
| [InputGroup](https://www.fluidfunctionalism.com/docs/input-group) | Input fields with proximity hover and validation |
| [RadioGroup](https://www.fluidfunctionalism.com/docs/radio-group) | Radio buttons with proximity hover and animated selection |
| [Select](https://www.fluidfunctionalism.com/docs/select) | Animated select with bordered/borderless variants |
| [Slider](https://www.fluidfunctionalism.com/docs/slider) | Range slider with step snapping, range mode, animated thumb |
| [Switch](https://www.fluidfunctionalism.com/docs/switch) | Toggle with animated thumb and label |
| [Table](https://www.fluidfunctionalism.com/docs/table) | Data table with row hover effects |
| [Tabs](https://www.fluidfunctionalism.com/docs/tabs) | Segmented control with sliding indicator and proximity hover |
| [TabsSubtle](https://www.fluidfunctionalism.com/docs/tabs-subtle) | Tab navigation with smooth pill animations |
| [ThinkingIndicator](https://www.fluidfunctionalism.com/docs/thinking-indicator) | Animated status indicator with morphing SVG |
| [ThinkingSteps](https://www.fluidfunctionalism.com/docs/thinking-steps) | Chain-of-thought display with sequential animation |
| [Tooltip](https://www.fluidfunctionalism.com/docs/tooltip) | Spring-based floating tooltip with configurable placement |

## What makes these different

- **Motion as information** — transitions make state changes legible, nothing moves for decoration
- **Hover as preview** — proximity highlights show where your action will land before you click
- **Spring physics** — springs replace fixed durations, adapting naturally to interruption
- **Drop-in compatible** — your existing shadcn theme and tokens apply automatically

## Tech stack

- [Next.js](https://nextjs.org) 15 + React 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com) primitives
- [shadcn/ui](https://ui.shadcn.com) registry protocol

## License

MIT
