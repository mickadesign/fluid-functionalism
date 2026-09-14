# Fluid Functionalism — writing custom UI that fits the system

Installed components already follow these rules. Read this before writing any
custom animation, hover treatment, or state-change styling in a project that
uses @fluid components — the point is that your bespoke list moves at the same
magnitudes as the installed dropdown next to it. Live, interactive versions:
<https://www.fluidfunctionalism.com/docs/motion> and
<https://www.fluidfunctionalism.com/docs/fluid-hover>.

## Spring tokens (`@/lib/springs`)

Three speeds cover everything. Pick by the size of what moves — the bigger
the thing, the slower the spring:

| Token | Duration | Bounce | Use for |
|---|---|---|---|
| `spring.fast` | 0.08s | 0 | Hover, focus rings, fades, tooltips, selection indicators |
| `spring.moderate` | 0.16s | 0 | Short travel / small expansion (indicators, switch thumbs) and panels that must land exactly (drawers) |
| `spring.slow` | 0.24s | 0.12 | Large surfaces: dialogs, side panels, stepped flows |

Never hand-write a `duration` or invent a fourth speed — import the token so
unrelated parts of the UI move at consistent magnitudes. Springs (not tweens)
for enters so an interrupted animation reverses from where it is instead of
finishing first.

**Retrofitting an existing app:** most hand-written values sit within a hair
of a tier — adopt the token. A value that is *deliberately* outside the tiers
(a one-off cinematic entrance, a large canvas re-layout) can stay, but hoist
it into one named export next to the code that owns it, so it can't drift or
get re-invented with slightly different numbers in the next file — the same
literal defined twice is how systems decay. Recommend, don't bulldoze:
whether a bespoke value is intent or drift is the author's call, so name the
nearest token and let them choose.

**Exits are tweens, one tier quicker**, so a dismissal reads crisp and final
instead of replaying the entrance in reverse. Each spring carries its own exit
token — never hand-write an exit `{ duration }`:

| Enter | Exit token | Exit value |
|---|---|---|
| `spring.fast` | `spring.fast.exit` | `{ duration: 0.06 }` |
| `spring.moderate` | `spring.moderate.exit` | `{ duration: 0.12 }` |
| `spring.slow` | `spring.slow.exit` | `{ duration: 0.16 }` |

```tsx
import { spring } from "@/lib/springs";

<motion.div
  animate={{ opacity: 1 }}
  exit={{ opacity: 0, transition: spring.fast.exit }}
  transition={spring.fast}
/>
```

An animation that flips a target instead of unmounting has no `exit` prop, so
it picks the transition off its own state:
`transition={isOpen ? spring.fast : spring.fast.exit}`.

## Transform and opacity only

Animate `transform` (`x`, `y`, `scale`) and `opacity` — never `top` / `left` /
`width` / `height`. Two reasons with one fix: layout properties are off the
GPU's fast path, and `MotionConfig reducedMotion="user"` only neutralises
transform/layout animations, so a component moving via `top` ignores the OS
reduced-motion setting. If you genuinely must animate a layout property, gate
the movement on `useReducedMotion()` yourself and keep the opacity fade —
reduced motion means *fewer and gentler*, not *none*.

## Fluid hover for custom lists

One highlight per list: `useFluidHover` picks the item whose center is nearest
the cursor, and a single `bg-hover` overlay springs to its rect on
`spring.fast`. The cursor in a gap still lights the nearest row, and never
blinks off between rows. Install `@fluid/use-fluid-hover`; it ships the hook
and the `FluidHoverHighlight` component.

```tsx
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

function List({ items }) {
  const containerRef = React.useRef<HTMLUListElement>(null);
  const hover = useFluidHover(containerRef, { axis: "y" });
  return (
    <ul ref={containerRef} {...hover.handlers} className="relative">
      <FluidHoverHighlight hover={hover} className="rounded-md" />
      {items.map((item, i) => (
        <Row key={item.id} index={i} registerItem={hover.registerItem} {...item} />
      ))}
    </ul>
  );
}

function Row({ index, registerItem, ...item }) {
  const ref = React.useRef<HTMLLIElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return <li ref={ref} className="relative">…</li>;
}
```

Rules that keep it honest:

- **Render `<FluidHoverHighlight hover={hover} />`** — never a hand-rolled
  `motion.div` fill. It handles measurement readiness, the pointer session
  (fade in at the nearest row instead of sliding across the screen), reduced
  motion, and z-order. `className` carries radius; `hidden` keeps state while
  a popup is closed; `from` seeds where a fresh entry starts.
- **Axis matches the shape:** `y` for lists, `x` for strips, `xy` for grids.
- **One list per group of alternatives.** A divider between different kinds
  of rows means a new container and a new hook. Children of a parent row
  belong to the parent's list.
- **Only click targets register.** A row without `href`/`onClick` doesn't
  join — lighting it would promise a click with nowhere to land. Disabled
  rows stay registered but are skipped via `isItemDisabled`.
- **Spread `handlers` on the container** — its `onClick` routes a click in a
  gap to the highlighted item's activator, so what is lit is what a click
  hits.
- **Never re-measure on `children` changes** — registration and resizes
  trigger measurement themselves. Call `remeasure()` only when rects may be
  stale (a popup that kept rows registered while hidden: call it on open).
- Rows keep their own `:hover`-free styling — the overlay is the hover
  treatment. Content sits above it via `relative`.

## Weight without reflow (ghost-span pattern)

State changes (selected / checked / active / open) make text heavier; a
heavier weight is wider; animating it on a bare text node reflows the layout.
Reserve the width with an invisible copy at the heaviest weight while the
visible copy animates `font-variation-settings`:

```tsx
import { fontWeights } from "@/lib/font-weight";

<span className="inline-grid">
  <span
    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
    style={{ fontVariationSettings: active ? fontWeights.semibold : fontWeights.normal }}
  >
    {label}
  </span>
  <span aria-hidden="true" className="col-start-1 row-start-1 invisible" style={{ fontVariationSettings: fontWeights.semibold }}>
    {label}
  </span>
</span>
```

- Weight comes from `fontVariationSettings` + the `fontWeights` tokens —
  never `font-weight`/`fontWeight`. The tokens pair a tighter optical size
  (`opsz`) with the heavier weight so the advance width barely changes.
- The transition property list must include `font-variation-settings`
  (`transition-[color,font-variation-settings] duration-80`) — plain
  `transition-colors` snaps the weight.
- Standard pair: resting `normal` → active `semibold` (400 → 550). Don't
  invent new pairs.
- Skip the ghost span only when the weight is static for the node's lifetime
  or the element is already a fixed-size box.

## Icon swaps (copy → check, play → pause)

Two glyphs, one cell, crossfading with a touch of blur and scale — the slot
never resizes. The arriving glyph rides the tier's full duration and the
leaving one its exit token, so an appear always outlasts a disappear. Both
are tweens on purpose (a spring settles early and would invert that order,
and blur is a `filter` string a spring can't drive):

```tsx
import { motion } from "framer-motion";
import { spring } from "@/lib/springs";

const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const enter = { type: "tween", duration: spring.fast.duration, ease: "easeOut" };
const leave = { type: "tween", ...spring.fast.exit, ease: "easeIn" };

<span className="grid" style={{ width: size, height: size }}>
  <motion.span className="col-start-1 row-start-1 flex" initial={false}
    animate={copied ? HIDDEN : SHOWN} transition={copied ? leave : enter}>
    <CopyIcon size={size} />
  </motion.span>
  <motion.span className="col-start-1 row-start-1 flex" initial={false}
    animate={copied ? SHOWN : HIDDEN} transition={copied ? enter : leave}>
    <CheckIcon size={size} />
  </motion.span>
</span>
```

Keep the accessible label stable: sighted users see the check, a screen
reader hears "Copied" from a visually hidden span in an
`aria-live="polite"` region.

## State backgrounds and elevation

- Hover and selection fills use the shared tokens `bg-hover` and `bg-active`
  (installed with any component) — not ad-hoc grays — so they read correctly
  on every surface level in light and dark.
- A custom popover or panel that floats above the page wraps itself in
  `Elevated` (`@fluid/elevated`): it reads the current substrate level and
  applies the right `bg-surface-N` / `shadow-surface-N`, so nested popups
  stay visible at any depth.
- Sizes come from `size-context`: a 36px default and a 28px compact, shared
  by buttons, inputs, selects, tabs, and rows. Match one of the two in custom
  rows instead of inventing a third height.

## Never stack two measured-height collapses

A wrapper that animates to a ResizeObserver-measured height must spring only
when **it** toggles. When the measured height changes because a *child*
collapsed, snap (`{ duration: 0 }`) — otherwise the outer wrapper chases a
moving target every frame, lags its own child, and lands ~100ms late; each
nesting level multiplies the sludge.
