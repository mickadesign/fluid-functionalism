# Fluid Functionalism — writing custom UI that fits the system

Installed components already follow these rules. Read this before writing any
custom animation, hover treatment, or state-change styling in a project that
uses @fluid components — the point is that your bespoke list moves at the same
magnitudes as the installed dropdown next to it. Live, interactive versions:
<https://www.fluidfunctionalism.com/docs/motion>,
<https://www.fluidfunctionalism.com/docs/fluid-hover>, and
<https://www.fluidfunctionalism.com/docs/reveal>.

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
literal defined twice is how systems decay. The same goes for token values
mirrored across languages (a CSS class re-declaring the TS `fontWeights`
numbers): one source of truth, the other side derives or goes. Recommend,
don't bulldoze: whether a bespoke value is intent or drift is the author's
call, so name the nearest token and let them choose.

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
reduced-motion setting. A plain **CSS transition** on a positional property
(`transition-[left,bottom]`) is doubly exempt — it's not Motion at
all, so `MotionConfig` never sees it; move it to `x`/`y` motion values to get
both the compositor and reduced-motion back. If you genuinely must animate a
layout property, gate the movement on `useReducedMotion()` yourself and keep
the opacity fade — reduced motion means *fewer and gentler*, not *none*.

**Depicted UI is exempt.** A mockup frame, product screenshot rebuilt in
code, or demo that *portrays another product's interface* isn't bound by
these rules — a per-row `:hover` inside a fake app frame is set dressing,
not system drift. Judge the app's own chrome, not what it depicts.

## Fluid hover for custom lists

One highlight per list: `useFluidHover` picks the item whose center is nearest
the cursor, and a single `bg-hover` overlay springs to its rect on
`spring.fast`. The cursor in a gap still lights the nearest row, and never
blinks off between rows. Install `@fluid/use-fluid-hover`; it ships the hook
and the `FluidHoverHighlight` component, and pulls in `@fluid/tokens` for the
`bg-hover` fill. The component lands in
`components/`, not `components/ui/`, so import it from
`@/components/fluid-hover-highlight`.

```tsx
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";

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
import { motion } from "motion/react";
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
  (installed with any component and with `@fluid/use-fluid-hover`) — not ad-hoc grays — so they read correctly
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

## Page reveals (`@fluid/reveal`)

Appear and scroll animation for whole pages: 2 presets for the page, each
with a `-subtle` step, and 2 helpers for slow data (`reveal-swap`,
`reveal-items`). Install `@fluid/reveal` and put 1 class on the page's
container, the way you add shadcn's `scroll-fade`.
Live version: <https://www.fluidfunctionalism.com/docs/reveal>.

### Pick by context

| Class | For | On load | On scroll |
|---|---|---|---|
| `reveal-landing` | A page read once: a launch, pricing, a case study | 1st child is the hero; its children rise 12px and scale in from 0.94, 0.1s apart | Every later child does the same with the scroll, from its top edge 12px inside the viewport to 120px; every section leaves the same way at the top |
| `reveal-landing-subtle` | Same, quieter | 8px and 0.98, 0.06s apart | From 8px to 60px |
| `reveal-product` | The app people come back to | Every child fades in, 0.06s apart, no rise | Nothing |
| `reveal-product-subtle` | Same, quieter | Fade, 0.04s apart | Nothing |

Scroll reveals in an app are noise by the 10th visit: an app screen should
feel like it was already there.

### What moves

- Groups, not elements: a hero, a product shot, a row of cards, a quote.
  Never every line, and never a `whileInView` fade on each element.
- Everything on screen at first paint goes in the hero (the 1st child),
  product shot included: a later section that starts on screen sits half
  revealed, waiting for a scroll, instead of playing on load.
- For a grid, put `reveal-scroll` on each card: every card becomes a
  scroll section with the same values, and the section holding them stays
  still. Wrap a card that already animates `transform` (a framer layout
  node) and put the class on the wrapper: the CSS animation would override
  its transform.
- Every scroll section and `reveal-scroll` also plays a load step after the
  hero, a step apart, so cards already on screen at first paint arrive with
  the page instead of sitting there; off screen, the step plays unseen and
  the scroll takes over. A section cut by the bottom edge still settles half
  revealed, which is why first-paint content belongs in the hero.
- Nest a second `reveal-scroll` inside a card for its content: it follows
  half a range later on the way in and leaves half a range sooner, so the
  card frame arrives first and its content settles into it.
- A view timeline binds to the nearest scroll container, and
  `overflow: hidden` makes one even if it never scrolls. Clip a revealed
  element's ancestors with `overflow: clip` instead, or its animation never
  moves.
- Keep chrome still: put the header, nav, sidebar, and footer outside the
  container. Backgrounds and dividers never move.
- Never animate a parent and its children both. Pick 1 level.
- Product reveals play once and have no exit. Landing sections follow the
  scroll on purpose, both ways: in at the bottom, and out at the top as a
  mirror of the way in (fade, lift, scale down).

### Timing

- No new token: landing steps ride `spring.slow` (0.24s, bounce 0.12), the
  tier for large surfaces, so pages move at the pace of dialogs. Product
  steps ride `spring.moderate` (0.16s, no bounce): app blocks are panels,
  and a fade has no travel for a bounce to act on. Both are written in CSS
  as `linear()`; scroll steps follow the scroll.
- Stagger siblings only, 0.04 to 0.1s apart, and cap it: the 4th step (8th
  for data rows) carries everything after it, so a list never queues.
- Travel stays small: 12px and a 0.94 scale at most on a landing page,
  none in the app. No blur, no rotation, no sideways travel.

### Bulletproof by default

- Pure CSS: no JavaScript, no hydration flash. The server renders
  everything visible; on-load steps start on first paint.
- Scroll-linked motion uses CSS view timelines. Browsers without them show
  the content still.
- Keep the LCP element (hero image, main headline) out of any reveal:
  Chrome does not count a paint at opacity 0.
- Animate `transform` and `opacity` only, so layout never shifts.
- A revealed landing section keeps a `transform`, which pins any
  `position: fixed` child to the section: keep fixed elements outside.

### Loading data in the app

Slow data waits on shadcn's Skeleton (installed with `@fluid/reveal`).

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<main className="reveal-product">
  <Header />
  <div className="reveal-swap">
    <ThreadsSkeleton className="reveal-items" aria-hidden />
    {threads && <Threads className="reveal-items" rows={threads} />}
  </div>
</main>
```

- Build each skeleton the exact size of its real block (same paddings,
  line heights, avatar sizes) and measure both: the swap must not shift
  layout.
- Never replace a skeleton with data on the same frame: the data starts at
  opacity 0 and the space blinks empty. `reveal-swap` stacks both in 1 cell;
  render the skeleton, add the real block after it, and the skeleton fades
  out as the block fades in.
- `reveal-items` on both brings rows and metrics in one by one, each
  skeleton row handing over to its own real row. It works beside a preset
  too, for a sidebar.
- Load blocks independently: each request lands on its own time and in any
  order. Never fake a tidy sequence; give each metric its own swap.
- Skeletons fade in over 250ms before shadcn's pulse starts, so they arrive
  instead of popping in. Keep Skeletons inside a block: a Skeleton that is
  itself an animated child loses its pulse.

### Accessibility

- Reduced motion keeps the fades, drops all travel and scale, turns scroll-linked
  motion off, and stops the skeleton pulse.
- Mark skeleton blocks `aria-hidden`.

### When you demo it

- Show real content edge to edge, not grey boxes in a small frame.
- Put the controls where the eye is (intensity tabs, a primary Replay) and
  show the live values under the demo.
- Start a demo only once it is on screen, so people see it play instead of
  its end state.
