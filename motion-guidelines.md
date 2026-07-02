# Motion Guidelines

The motion system every component in this project shares. The live, interactive
version is the **Motion** system page (`app/docs/motion/page.tsx`, served at
`/docs/motion`). **Keep this file and that page in sync** — when one changes, so
does the other.

---

## Spring tokens (`registry/default/lib/springs.ts`)

| Token | Duration | Bounce | Use for |
|---|---|---|---|
| `spring.fast` | 0.08s | 0 | Hover, focus rings, fades, tooltips, selection indicators |
| `spring.moderate` | 0.16s | 0.08 | Short travel / small expansion: dropdown & tab indicators, switch thumb, accordions |
| `spring.settle` | 0.16s | 0 | Critically damped moderate — same perceived speed, no overshoot; panels/sheets that must land exactly (mobile drawer, merged selection backgrounds) |
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
| `spring.settle` (0.16s) | `spring.settle.exit` | `{ duration: 0.12 }` |
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
radio tick (`{ duration: 0.04 }`) and `height: 0` collapse exits
(accordion, textarea). Everything else uses the tokens.

The Motion page makes this tangible in the **Slow in, faster out** section: two
identical modals open on `spring.slow`, then close — one on the same
`spring.slow` (drags, and bounces), one on `spring.slow.exit` (crisp). It's the
clearest argument for why the exit is its own, quicker token.

## Weight without reflow

State changes (selected / checked / active / open) make text heavier, and a
heavier weight is wider. Animate that on a bare text node and the layout
reflows. Use the **ghost-span pattern** — an invisible copy of the label at the
heaviest weight reserves the width while the visible copy animates
`font-variation-settings`. Each `fontWeights` token (`@/lib/font-weight`) also
pairs a tighter optical size with the heavier weight so the advance width barely
changes. The full pattern and rules live in
[`component-documentation-guidelines.md`](component-documentation-guidelines.md#animated-font-weight--the-ghost-span-pattern).

## Where each speed shows up

The Motion page renders a high-level map of which component *leads* with which
spring, generated from the `REFERENCE_TIERS` array in `app/docs/motion/page.tsx`.
Keep this table and that array identical.

| fast (0.08s) | moderate (0.16s) | settle (0.16s, no bounce) | slow (0.24s) |
|---|---|---|---|
| Hover & focus rings, Checkbox, Radio, Table rows, Tooltip, Input copy, Slider, Select / Color picker open | Dropdown / Select highlight, Tabs indicator, Switch thumb, Accordion, Chat & message bubbles | Mobile drawer, Selection merge / split | Dialog, Ask-user questions, Thinking steps |

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

### The catch — and why it pushes you toward `transform`

`MotionConfig` only neutralises **transform / layout** animations. A component
that moves by animating `top` / `left` / `width` / `height` directly is *not*
auto-reduced, and it's also off the GPU's fast path. Both problems have the same
fix:

> **Animate `transform` and `opacity`, never `top` / `left` / `width` / `height`.**
> Then `MotionConfig` covers reduced motion for free, and the motion stays on
> the compositor.

Known stragglers that still animate layout properties (so they aren't yet
auto-reduced): the magnetic highlight slides in `dropdown` / `nav-menu` /
`select` / `tabs-subtle`, and the `height` collapse in `accordion`. Re-expressing
those as `transform` (or gating them on `useReducedMotion()`) is the remaining
work. `input-message` already reads `useReducedMotion()` directly as a reference
for the manual approach.

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
7. If you changed a spring token's value, re-check every duration quoted on the
   Motion page (the Reference token tables, code comments, and the
   "Slow in, faster out" demo) and in this file.
