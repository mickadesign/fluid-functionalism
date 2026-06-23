# Daily design lesson — 2026-06-23

## Today's one specific thing: round your geometry comparisons, or your affordances will flicker

**Where this came from:** your most recent thread of work — `scroll-fade`,
`scroll-area`, the scroll-edge cues. Specifically `useScrollEdges` in
`registry/default/lib/scroll-fade.tsx`.

---

### The detail

Look at how the hook decides whether an edge cue should show:

```ts
const overflowing = scrollHeight - clientHeight > 1;
next.top = overflowing && scrollTop > 1;
next.bottom = overflowing && scrollTop + clientHeight < scrollHeight - 1;
```

Every comparison has a `1`-pixel slack in it. Not `> 0`. Not `=== scrollHeight`.
The whole behaviour of the affordance hinges on those three little `1`s, and
they are the easiest thing in the file to delete by accident in a "cleanup."

### Why it matters (the part the design file can't show you)

Browser layout is **subpixel**. With fractional zoom, high-DPI displays,
`transform: scale`, flex/grid distribution, or a scrollbar that rounds
differently than its track, the trio `scrollTop`, `clientHeight`, and
`scrollHeight` routinely disagree by a fraction of a pixel *even when the user
is visually at rest at the bottom of a list.*

Write the naive version —

```ts
next.bottom = scrollTop + clientHeight < scrollHeight; // ✗
```

— and at the resting bottom of the scroller the right-hand side might be
`812.6` while the left is `812.0`. The condition is technically true, so the
"there's more below" chevron **renders when there is nothing more below.** Worse,
because `scroll` and `ResizeObserver` fire continuously, the value jitters across
the boundary and the cue *flickers* on and off. It reads as a bug to the user
and they can't tell you why — it just feels cheap.

The `> 1` / `- 1` slack is a **deadband**: a tolerance wide enough to swallow
subpixel noise but far narrower than a real "more content" gap (which is always
many pixels). It is the single line between "this product feels solid" and "this
product feels slightly broken."

### The transferable principle

> **Any time a visible state flips on a geometry comparison, compare with a
> tolerance, never with raw equality or zero.**

This is a *product design engineer* lesson precisely because it lives in the gap
between the two disciplines:

- In the **design tool**, pixels are integers and exact. There is no such thing
  as `812.6`. So this failure mode is literally unrepresentable in Figma — you
  will never catch it by reviewing a mock.
- In the **browser**, geometry is continuous and noisy. The polish you spec'd
  ("fade out the bottom edge when there's more to scroll") only survives contact
  with the runtime if you defend it against subpixel drift.

Bridging that gap *is* the job. The deadband is a tiny, unglamorous instance of
it, which is exactly why it's worth internalising — nobody reviews it, nobody
thanks you for it, and its absence is felt by everyone.

### Where else this same instinct pays off

- **"Is it scrolled to the top/bottom?"** for sticky shadows, "back to top"
  buttons, infinite-scroll triggers — same `± 1` (often `± 2` on touch).
- **IntersectionObserver thresholds** — a `threshold: 0` toggles on a single
  subpixel sliver; give it a small ratio or a rootMargin deadband.
- **Snap/active detection in carousels** — "which slide is centred" compared
  exactly will fight you between two slides; pick the nearest within a band.
- **Drag end / "did it move?"** — treat travel under a few px as a click, not a
  drag, so a shaky finger doesn't suppress the tap.
- **Animation completion** — `value === target` rarely lands; check
  `Math.abs(value - target) < epsilon`.

### How to apply it tomorrow

When you wire any boolean to a measured number, ask three questions:

1. **Can the inputs be fractional?** (Layout geometry: always yes. Scroll
   position: always yes.) If yes, raw `===`/`> 0` is a latent flicker.
2. **What's the smallest *real* change I care about?** Set the deadband well
   below that and well above subpixel noise — `1`–`2`px is almost always right
   for layout.
3. **Does the boolean drive something visible that the user watches?** If yes,
   flicker is not cosmetic — it's a credibility bug. Defend it.

And one bonus you already did right in the same file: after computing the new
edges, you bail out of `setEdges` when nothing changed. Deadband stops the
*flicker*; the no-op bail-out stops the *render churn*. Both are the same value —
make the cheap, correct thing happen and nothing else.
