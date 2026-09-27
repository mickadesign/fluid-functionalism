# Motion Guidelines

The motion system every component in this project shares. The live, interactive
version is the **Motion** system page (`app/docs/motion/page.tsx`, served at
`/docs/motion`). **Keep this file and that page in sync** — when one changes, so
does the other.

---

## Spring tokens (`registry/default/lib/springs.ts`)

| Token | Duration | Bounce | Use for |
|---|---|---|---|
| `spring.fast` | 0.08s | 0 | Hover, focus rings, fades, tooltips, selection indicators, the accordion panel (it lands with its own chevron) |
| `spring.moderate` | 0.16s | 0 | Critically damped — short travel / small expansion (dropdown & tab indicators, switch thumb) and panels/sheets that must land exactly (mobile drawer, merged selection backgrounds) |
| `spring.slow` | 0.24s | 0.12 | Large surfaces: dialogs, side panels, stepped flows |

**Rule:** the bigger the thing that moves, the slower the spring. No component
invents its own duration — always import the token from `@/lib/springs` so
unrelated parts of the UI move at consistent magnitudes.

## Exit tokens (`registry/default/lib/springs.ts`)

Enters are springs (above); exits are plain **tweens** — no bounce, one tier
quicker — so a dismissal reads as crisp and final rather than replaying the
entrance in reverse. Pair each spring with its exit and never hand-write an exit
`{ duration }` (that is exactly how exit timings drifted before they were
tokenised).

| Enter spring | Exit token | Exit value |
|---|---|---|
| `spring.fast` (0.08s) | `spring.fast.exit` | `{ duration: 0.06 }` |
| `spring.moderate` (0.16s) | `spring.moderate.exit` | `{ duration: 0.12 }` |
| `spring.slow` (0.24s) | `spring.slow.exit` | `{ duration: 0.16 }` |

```tsx
import { spring } from "@/lib/springs";

<motion.div
  animate={{ opacity: 1 }}
  exit={{ opacity: 0, transition: spring.fast.exit }}
  transition={spring.fast}
/>
```

A couple of exits stay bespoke because they are not a simple timed fade: the
radio tick (`{ duration: 0.04 }`) and the textarea's `height: 0` collapse.
Everything else uses the tokens. An animation that flips a target instead of
unmounting has no `exit` prop to carry the quicker tier, so it picks the
transition off its own state — see the accordion panel, which reads
`isOpen ? spring.fast : spring.fast.exit`.

The Motion page makes this tangible in the **Slow in, faster out** section: two
identical modals open on `spring.slow`, then close — one on the same
`spring.slow` (drags, and bounces), one on `spring.slow.exit` (crisp). It's the
clearest argument for why the exit is its own, quicker token.

## Icon swaps

Two glyphs, one cell. When a control's icon changes state (copy → check,
play → pause), both glyphs stay mounted in a grid cell the size of the icon and
crossfade. The slot never resizes, and the label never changes: sighted users
see the check, a screen reader hears "Copied" from a visually hidden span inside
the button's `aria-live="polite"` region.

Three properties move together, on two tweens from the `fast` tier:

| Glyph | Opacity | Blur | Scale | Transition |
|---|---|---|---|---|
| Leaving | 1 → 0 | 0 → 4px | 1 → 0.6 | `spring.fast.exit` (0.06s), `ease: "easeIn"` |
| Arriving | 0 → 1 | 4px → 0 | 0.6 → 1 | `spring.fast.duration` (0.08s), `ease: "easeOut"` |

The arriving glyph rides the tier's full duration and the leaving one its exit
token, so an appear always outlasts a disappear. Both are tweens on purpose: a
critically damped spring settles visibly well before its nominal duration and
would invert that order, and blur is a `filter` string a spring cannot drive
anyway. Reduced motion swaps the glyphs in place.

```tsx
import { motion } from "framer-motion";
import { spring } from "@/lib/springs";

const SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
const HIDDEN = { opacity: 0, scale: 0.6, filter: "blur(4px)" };
const enter = { type: "tween", duration: spring.fast.duration, ease: "easeOut" };
const leave = { type: "tween", ...spring.fast.exit, ease: "easeIn" };

<span className="grid" style={{ width: size, height: size }}>
  <motion.span
    className="col-start-1 row-start-1 flex"
    initial={false}
    animate={copied ? HIDDEN : SHOWN}
    transition={copied ? leave : enter}
  >
    <CopyIcon size={size} />
  </motion.span>
  <motion.span
    className="col-start-1 row-start-1 flex"
    initial={false}
    animate={copied ? SHOWN : HIDDEN}
    transition={copied ? enter : leave}
  >
    <CheckIcon size={size} />
  </motion.span>
</span>
```

Reference implementation: [`lib/docs/copy-prompt-button.tsx`](lib/docs/copy-prompt-button.tsx),
the Copy prompt button on every doc page. Button's `leadingIcon` takes a
component type, so the swap state reaches the glyph through a context rather
than a prop.

## Weight without reflow

State changes (selected / checked / active / open) make text heavier, and a
heavier weight is wider. Animate that on a bare text node and the layout
reflows. Use the **ghost-span pattern** — an invisible copy of the label at the
heaviest weight reserves the width while the visible copy animates
`font-variation-settings`. Each `fontWeights` token (`@/lib/font-weight`) also
pairs a tighter optical size with the heavier weight so the advance width barely
changes. The full pattern and rules live in
[`component-documentation-guidelines.md`](component-documentation-guidelines.md#animated-font-weight--the-ghost-span-pattern).

## Fluid hover (`registry/default/hooks/use-fluid-hover.ts`)

One highlight per list. `useFluidHover` picks the item whose center is
nearest the cursor, and a single absolutely positioned `bg-hover` overlay springs
to that item's rect on `spring.fast`. Every menu, table, strip, and grid in the
library hovers this way, so the mechanism is documented once, on its own system
page (`app/docs/fluid-hover/page.tsx`, served at `/docs/fluid-hover`; demos in
`demos.tsx` beside it), with three demos:

1. **Blink or glide.** Plain `:hover` next to fluid hover on the same 5
   rows with 4px gaps. Plain `:hover` lights nothing between rows; fluid hover
   lights the nearest row and travels to it instead of blinking.
2. **Show the math.** A switch reveals each row's center, the midpoint between
   neighbouring centers (where the highlight flips), and the distance from the
   cursor to the winning center.
3. **3 axes.** `y` (default) for lists, `x` for strips, `xy` for grids, on real
   components stacked vertically: Tabs, an inline Dropdown, and a 2-column CardGroup.
4. **When to split a list.** A sidebar with a parent and its children, a disabled
   row, and a second group behind a divider: one `SidebarMenu` is one list
   (children included, disabled skipped), the next group is another.
5. **What it costs.** 200 rows in a scroll frame and a meter: `pickNearest`
   (the hook's own exported pure function) timed on every move with the real
   rects, the highlight element count, frames of travel, and layout writes
   while travelling (0, since the travel is a transform).

Rules the hook enforces, worth knowing when you consume it:

- **A containing item always wins; otherwise the nearest center does.** The
  cursor in a gap, in the container padding, or past the last row still lands.
- **One overlay, and it is one component.** Render
  `<FluidHoverHighlight hover={hover} />` (`registry/default/fluid-hover-highlight.tsx`,
  shipped with the hook) instead of a `motion.div`. It reads the highlighted
  index, the measured rects, readiness, and the pointer session off the hook
  (the session increments on `onMouseEnter`, so the highlight fades in at the
  nearest row instead of sliding over from where it was last). `hidden` keeps
  the list's state but shows nothing (a closed popup). Optional `from` is where
  a fresh entry starts (dropdowns pass the checked row, the sidebar its level's
  active row), `className` carries radius and z-index, and `transition={false}`
  snaps when only a reflow moved the rows. A list that resolves its own rect
  (the sidebar's unified scope) passes `rect` and `session` instead.
  `tests/registry-consistency.test.mjs` fails on any new hand-rolled copy.
- **A gap click lands on the lit row.** `handlers.onClick` (spread with the
  rest, or attached beside `onMouseLeave`) routes a click that hits the
  container between items to the highlighted item's activator, so what is lit
  is what a click hits. It leaves clicks inside an item, on a control between
  rows (a menu's search field), and on disabled items alone. The `gapClick`
  option turns it off (`false`) or caps it (`{ maxDistance }`, which the card
  grid uses at 16px). Every list that renders the highlight attaches it; tabs
  and the accordion (which registers only the trigger) do not.
- **One list per group of alternatives.** Children belong to the parent's
  list (the sidebar's unified scope). A divider between different kinds of
  rows means a new list: give it its own container and hook. A disabled row
  stays in its list and is skipped (`isItemDisabled`; the sidebar reads the
  button's `disabled`).
- **Only click targets register.** A card without `href` or `onClick` does
  not join the highlight: lighting it would promise a click with nowhere to
  land. When the lit row unregisters, the highlight clears.
- **Rows join with `useRegisterFluidHoverItem(registerItem, index, ref)`.**
  Both arguments may be undefined for a row rendered outside a list; then
  nothing registers. No hand-written registration effects.
- **Measurement runs itself.** Registration, an item resizing, and the
  container resizing each trigger a coalesced pass, so never call anything on
  `children` changes. `remeasure()` is for rects that may be wrong and would
  misplace an overlay (a popup that kept its rows registered while hidden:
  call it on open). `measureItems()` re-reads synchronously without hiding
  anything, and only the accordion needs that, inside its height animation.
- **Gate the overlay on `isMeasured`.** Rects are measured with `offset*`
  (transform-proof) one frame after registration; an overlay mounted against a
  rect a later pass corrects animates from the wrong place. `FluidHoverHighlight`
  does this itself when given `hover`.
- **`isItemDisabled` skips a row without unregistering it**, for rows that stay
  mounted while clipped away (a collapsed sidebar sub-tree).

The highlight is pinned to the container's padding corner and travels on a
`transform` (framer `x` / `y`), so the per-frame work is on the compositor;
`width` / `height` are layout values but only change when the target rect's
size does. Reduced motion is covered twice: `MotionConfig` reduces the
transform, and the component reads `useReducedMotion()` itself so an installed
copy drops the travel and keeps the fade without any wrapper (see
[Reduced motion](#reduced-motion)).

Deliberately not on the component: `tabs` / `tabs-subtle` (the hover pill
fades in from, and on leave back to, the selected pill at 0.4 opacity on
`spring.moderate`) and `thinking-steps` (a single trigger with an inset fade).

## Where each speed shows up

The Motion page renders a high-level map of which component *leads* with which
spring, generated from the `REFERENCE_TIERS` array in `app/docs/motion/page.tsx`.
Keep this table and that array identical.

| fast (0.08s) | moderate (0.16s, no bounce) | slow (0.24s) |
|---|---|---|
| Fluid hover, Focus rings, Checkbox, Radio, Table rows, Card grid, Tooltip, Input copy, Slider, Select / Combobox / Color picker open, Command menu, Accordion | Dropdown / Select highlight, Tabs indicator, Carousel dots, Switch thumb, Chat & message bubbles, Mobile drawer, Sidebar, Selection merge / split | Dialog, Ask-user questions, Thinking steps |

Most components *also* use `fast` for their hover and focus states on top of
their headline tier — the table lists each component once, by its headline
motion.

## Reduced motion

`prefers-reduced-motion` means *fewer and gentler*, not *none*. Keep opacity and
colour fades (they aid comprehension); drop the movement — transforms, position,
scale, and layout shifts.

The whole system is switched on at the root in
[`app/layout.tsx`](app/layout.tsx):

```tsx
<MotionConfig reducedMotion="user">
  {/* providers + app */}
</MotionConfig>
```

`reducedMotion="user"` makes **every** framer-motion component honour the OS
setting automatically: it disables animations of `transform` (`scale`, `x`,
`y`, `rotate`) and `layout`, while letting `opacity` and colour keep animating.
A dialog opens by fading in instead of scaling; a drawer appears in place
instead of sliding; a tooltip fades instead of moving.

**Consumers** who copy a component into their own app get this for free by
wrapping their tree the same way — one line, like a `ThemeProvider`.

### Never stack two measured-height collapses

A wrapper that pins its height to a ResizeObserver-measured value and *animates*
to it — `SidebarGroup`, `SidebarMenuSub`, `AccordionContent` — must spring only
when **it** toggles. When the measured height changes underneath it because a
child collapsed, it has to snap (`{ duration: 0 }`).

Spring on a re-measure and the outer wrapper chases a target that moves every
frame: it lags its own child badly, then needs a full settle time *after* the
child has already landed, dragging everything below it along late. Measured on
the sidebar playground before the guard, collapsing a sub-menu inside a
collapsible group: the sub-menu finished in 218ms, the group's wrapper in 326ms,
diverging by ~80px mid-flight. With the snap, both land within one frame of each
other. Every extra nesting level multiplies the effect, which is what makes a
deep tree feel sludgy.

The guard is a render-phase ref comparing the previous `open` to the current
one, cleared in `onAnimationComplete` — see `SidebarGroup` in `sidebar-core`.

### The catch — and why it pushes you toward `transform`

`MotionConfig` only neutralises **transform / layout** animations. A component
that moves by animating `top` / `left` / `width` / `height` directly is *not*
auto-reduced, and it's also off the GPU's fast path. Both problems have the same
fix:

> **Animate `transform` and `opacity`, never `top` / `left` / `width` / `height`.**
> Then `MotionConfig` covers reduced motion for free, and the motion stays on
> the compositor.

Known stragglers that still animate layout properties (so they aren't yet
auto-reduced): the hover pill in `tabs` / `tabs-subtle`, the selected
backgrounds (`bg-active`, the merged selection blocks), and the travelling
focus rings. Re-expressing those as `transform` (or gating them on
`useReducedMotion()`) is the remaining work. The hover highlight is done:
`FluidHoverHighlight` travels on a transform and reads `useReducedMotion()`
itself, snapping its position while keeping the fade. `input-message` and the `height` collapse in `accordion` read
it directly too, as a reference for the manual approach — worth copying for
anything that animates a positional value, since an installed component can't
count on the consumer having wrapped their app in `MotionConfig`.

---

## When you add (or change) a component

Do this as part of the [new-component checklist](component-documentation-guidelines.md#checklist-for-a-new-component):

1. **Pick a tier** from the table above by the size of the component's headline
   motion (a small state flip → `fast`; a panel/indicator that travels →
   `moderate`; a surface that takes over the view → `slow`).
2. **Import the tokens** from `@/lib/springs` — never hand-write a `duration`.
3. **Enter on `spring.<tier>`, exit on `spring.<tier>.exit`.** The `.exit` is
   already a tier faster, so the "exits are faster" rule holds by construction.
4. **Update the Motion page:** add the component to the correct column of the
   `REFERENCE_TIERS` array in `app/docs/motion/page.tsx`, and update the table above
   to match.
5. **Move with `transform` / `opacity`, not `top` / `left` / `width` /
   `height`.** That keeps it on the GPU *and* lets the root `MotionConfig`
   reduce it for free (see [Reduced motion](#reduced-motion)). If you must
   animate a layout property, gate the movement on `useReducedMotion()`.
6. **Animated weight?** Follow the ghost-span pattern (link above).
7. **An icon that changes state?** Crossfade it with the [Icon swaps](#icon-swaps)
   recipe: both glyphs mounted in one cell, `fast` tier, arrive on the tier's
   duration and leave on its exit token.
8. If you changed a spring token's value, re-check every duration quoted on the
   Motion page (the Reference token tables, code comments, and the
   "Slow in, faster out" demo) and in this file.
