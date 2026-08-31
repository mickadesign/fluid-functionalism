# System invariants

Read the selected component source before changing behavior. These rules describe the shared language; they do not authorize redesigning unrelated UI.

## Motion communicates state

Use `spring` from `registry/default/lib/springs.ts`:

| Tier | Enter | Exit | Use |
|---|---:|---:|---|
| `fast` | 0.08s, no bounce | 0.06s | Hover, focus, fades, selection, tooltip |
| `moderate` | 0.16s, no bounce | 0.12s | Short travel, indicators, switch thumb, drawers, merged backgrounds |
| `slow` | 0.24s, slight bounce | 0.16s | Dialogs, side panels, stepped flows |

The larger the moving object, the slower the tier. Enters use the spring; exits use the matching `.exit` tween. Do not hand-write a replacement duration merely because one component needs adjustment.

Prefer transform and opacity. They stay on the compositor and are suppressed appropriately by `MotionConfig reducedMotion="user"`. If a layout property must animate, gate it explicitly with `useReducedMotion()` and test it.

Known snapshot limitation: magnetic highlights in dropdown, nav-menu, select, and tabs-subtle still animate layout properties. The merge/split renderer also animates measured geometry. Do not claim reduced-motion completeness without runtime verification.

Measured-height containers spring only when they own the open/close transition. When an already-open parent remeasures because a child collapsed, snap the parent to the new height; stacked measured-height springs visibly lag.

## Hover previews an action

`useProximityHover` finds the nearest registered item along `x`, `y`, or `xy`, tracks transforms and scrolling, coalesces measurements, and exposes `isMeasured` so overlays do not animate from stale geometry.

- Gate absolutely positioned hover/selection overlays on complete measurement.
- Use `isItemDisabled` for mounted-but-clipped rows.
- Re-measure when a persistent popup becomes visible after being laid out hidden.
- Keep hover visual-only. Keyboard focus and selection state must remain independently legible.
- Do not make hover the only way to discover or operate an action; touch devices have no proximity phase.

## Weight changes without reflow

Animated labels use `fontVariationSettings` with the `fontWeights` tokens. An invisible ghost copy at the heaviest reachable weight reserves width while the visible copy animates in the same grid cell.

- Default state pair: `normal` to `semibold`.
- Use `medium` to `semibold` only when the resting component already uses medium.
- Keep the explicit `opsz` value paired with each `wght`; it compensates width.
- The transition property must include `font-variation-settings`.
- Static labels and fixed-size boxes do not need a ghost.

Do not substitute raw `font-weight`, a bare `'wght' N` string, or an arbitrary font without measuring the result.

## Size is a two-step ladder

`SizeProvider` and component `size` props resolve to:

- `default`: 36px controls, 13px body labels, 16px icons.
- `compact`: 28px controls, 12px body labels, 14px icons.

Controls, popup rows, gaps, padding, icons, and type step together. Prefer a regional `SizeProvider size="compact"` for toolbars, sidebars, and dense tables. Do not shrink only the box or freeze a raw font size in `className`.

## Shape is shared

`ShapeProvider` resolves pill or rounded classes for items, backgrounds, focus rings, merged blocks, containers, buttons, and inputs. Use `useShape()` classes instead of isolated radius literals when adapting a component. Keep focus-ring radii concentric with the element.

## Elevation follows the substrate

Surface levels run from 1 through 8. `Elevated` reads the current substrate, adds an offset, applies literal Tailwind lookup classes, and re-provides the resulting level to descendants.

- Typical popup offset: 2.
- Typical dialog offset: 4.
- Clamp at level 8.
- Use the static `surfaceClasses` maps; Tailwind 4 cannot discover template-literal classes such as `bg-surface-${level}`.
- Use a fixed shadow level only when shadow strength should stay constant while the background follows nesting.

Do not replace this with unrelated shadows and z-indexes when nesting is the actual problem.

## Icons are named slots

Components render icon names through `IconProvider`, with Lucide defaults. Add a new reusable icon name to the published `icon-context` map. Multi-library maps and keyboard shortcuts under `lib/docs/` are preview-only.

When composing a consumer screen, obtain icons from the installed provider or pass a public icon prop. Do not couple individual components to Phosphor, Tabler, HugeIcons, or Untitled UI.

## Semantic color and focus

Use the host's semantic tokens plus the FF token bridge described in `integration-and-flavors.md`. Do not use utilities reserved for the comparison-only shadcn theme (`primary`, `secondary`, `popover`, and their foreground variants) in FF source.

Every focus indicator uses `--focus-ring` with the component fallback `#6B97FF`. Preserve visible focus for keyboard users; avoid double rings by respecting the component's `outline-none` and focus styles.

## Keyboard and mounted instances

AskUserQuestions and Sidebar own global shortcuts. Multiple mounted instances must not all answer the same key:

- Prefer the innermost registered instance containing focus.
- If focus is outside nested instances, use the outermost application instance rather than mount order.
- Ignore modifier chords and editable targets.
- Stop propagation for handled arrows when an outer page also owns navigation keys.

Keep this registry pattern when embedding demos or nested shells. Do not disable shortcuts globally merely because a docs page mounts more than one instance.

## Accessibility and verification

Preserve the underlying Radix/Base UI semantics, labels, focus management, disabled states, controlled/uncontrolled contracts, and portal behavior. When adapting compound components, keep every part on one primitive flavor so contexts match.

Static type/build success is insufficient for interaction parity. Exercise real pointer, keyboard, focus, escape/outside press, scrolling, controlled-state, touch, and reduced-motion behavior for the components changed.
