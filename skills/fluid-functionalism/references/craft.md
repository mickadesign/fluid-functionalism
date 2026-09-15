# Fluid Functionalism — per-component craft

<!-- GENERATED from lib/docs/prompt-entries.ts by scripts/build-skill-craft.mjs.
     Do not edit by hand: change the craft entry there and regenerate. -->

The interaction-design decisions built into each component and system —
exact behaviors, exact values, and the why. Read the relevant section
before composing with, wrapping, extending, or imitating that component:
these are constraints to compose around, not suggestions. The installed
source (and its comments) remains the final word; the live demos are at
`https://www.fluidfunctionalism.com/docs/<slug>`.

Systems first — their craft applies across every component below.

## Contents

- [Motion (springs)](#motion)
- [Fluid Hover (use-fluid-hover)](#fluid-hover)
- [Surfaces (elevated)](#surfaces)
- [Sizes (size-context)](#sizes)
- [Scrollbars (scroll-area)](#scrollbars)
- [Accordion](#accordion)
- [AskUserQuestions](#ask-user-questions)
- [Badge](#badge)
- [Button](#button)
- [Card](#card)
- [ChatMessage](#chat-message)
- [CheckboxGroup](#checkbox-group)
- [ColorPicker](#color-picker)
- [Combobox](#combobox)
- [CommandMenu](#command-menu)
- [Dialog](#dialog)
- [Dropdown](#dropdown)
- [InputCopy](#input-copy)
- [InputGroup](#input-group)
- [InputMessage](#input-message)
- [RadioGroup](#radio-group)
- [Select](#select)
- [Sidebar](#sidebar)
- [Slider](#slider)
- [Switch](#switch)
- [Table](#table)
- [Tabs](#tabs)
- [TabsSubtle](#tabs-subtle)
- [ThinkingIndicator](#thinking-indicator)
- [ThinkingSteps](#thinking-steps)
- [Tooltip](#tooltip)

# Systems

## Motion (springs) {#motion}

- Three spring tiers only: `fast` 0.08s bounce 0, `moderate` 0.16s bounce 0, `slow` 0.24s bounce 0.12. Rule: the bigger the thing that moves, the slower the spring — never hand-write a duration, always reach for a tier.
- Exits are plain tweens, no bounce, one tier quicker than the enter (fast 0.06s, moderate 0.12s, slow 0.16s), so a dismissal reads as crisp and final rather than replaying the entrance in reverse.
- `moderate` is critically damped: same perceived speed as a bouncier tier but it lands exactly with no overshoot, so it also carries panels/sheets that must settle precisely (dropdowns, tabs, mobile drawer, merged selection backgrounds).
- Icon swaps keep both glyphs mounted in one icon-sized grid cell and crossfade opacity 1→0, blur 0→4px, scale 1→0.6; the arriving glyph rides the tier's full 0.08s (easeOut) and the leaving one the 0.06s exit (easeIn), so an appear always outlasts a disappear. Both are tweens on purpose: a critically damped spring settles well before its nominal duration and would invert that order, and blur is a `filter` string a spring cannot drive.
- Reduced motion means fewer and gentler, not none: `<MotionConfig reducedMotion="user">` at the root drops transform/layout animation but keeps opacity and colour fades (they aid comprehension) — a dialog fades instead of scaling, a drawer appears in place.
- Never stack two measured-height collapses: a wrapper animating to a ResizeObserver-measured height springs only when it itself toggles and snaps (`{duration: 0}`) when a child's collapse changed the measurement — before the guard, the sub-menu landed in 218ms while its group wrapper took 326ms, diverging ~80px mid-flight.
- Animate `transform` and `opacity`, never `top`/`left`/`width`/`height`: that keeps motion on the compositor AND lets root MotionConfig auto-reduce it — a component that animates layout properties gets neither.

## Fluid Hover (use-fluid-hover) {#fluid-hover}

- The whole picking rule is one pure function: an item the pointer is inside always wins; otherwise the item whose center is nearest does, so a cursor in a gap, in the container padding, or past the last row still lands. Ties keep the first item. Axes: `y` for lists, `x` for strips, `xy` for grids (Euclidean distance to centers).
- One highlight per list: a single absolutely positioned `bg-hover` element pinned to the container's padding corner, travelling on a transform (framer `x`/`y`) on `spring.fast` so per-frame work stays on the compositor; width/height are layout values but only change when the target rect's size does — in most lists never.
- The pointer session counter increments on `onMouseEnter` and re-keys the highlight, so a fresh entry fades in at the nearest row instead of sliding over from wherever it was last; `from` sets where that fresh entry fades in from (a dropdown passes its checked row, a nav menu its active route).
- Gap click: a click that lands between items (gap, padding, past the last row) is routed as a real DOM `.click()` to the highlighted item's activator — "what is lit is what a click hits". Clicks inside an item, on controls between rows (a menu's search field), and on disabled items are left alone; `gapClick: false` turns it off, `{maxDistance}` caps it (the card grid uses 16px).
- Gate overlays on `isMeasured`: an overlay mounted against a rect a later pass corrects animates from the wrong place to the right one, which reads as the highlight sliding in from another row. Measurement coalesces every trigger into one rAF pass, retries up to 3 frames while a popup has no layout box, and never publishes zeroed rects — the last complete measurement stands.
- Reduced motion is handled inside the component itself via `useReducedMotion()`: travel snaps, the 0.08s opacity fade stays — so an installed copy behaves correctly without the consumer wrapping their app in `MotionConfig`.
- Only click targets register: a card without `href` or `onClick` does not join the highlight, because lighting it would promise a click with nowhere to land. One list per group of alternatives — children ride in the parent's list, a divider between different kinds of rows means a new container and a new hook.
- The docs' skip-list is explicit UX judgment: skip fluid hover when a wrong click would hurt, when only some items are clickable, when there is a lot of empty space around items, or when rows change place as you scroll.

## Surfaces (elevated) {#surfaces}

- Eight surface levels, each paired 1:1 with a shadow recipe. Light mode has only two color steps (#FAFAFA floor, #FCFCFC sunken) and flattens to #FFFFFF from surface-3 up — shadow alone carries elevation; dark mode is an additive white-opacity ladder #171717 → #484848 in even steps.
- The motivating failure: a dropdown that hard-codes its background ends up surface-5 on surface-5 inside a dialog — the elevation shadow still gives a faint edge, but the menu body melts straight into the dialog.
- Substrate flows through React context (default 1 = the page); `Elevated` computes its own level as `min(substrate + offset, 8)` and re-provides it, so further nesting walks up the ladder automatically and a popover lands at the right depth on the page or inside a dialog with no props passed.
- Conventional offsets: `2` for dropdown / popover / select menu, `4` for dialog / modal.
- `shadowLevel` decouples shadow from background: a dropdown always reads `shadow-surface-3` whether it opens on the page or inside a dialog — the background tracks the substrate, but the shadow weight stays constant, so "a popover still reads as a popover three layers down".
- Hover and selected states are surface-relative overlays, not fixed colors, so they work at any elevation: `--overlay` flips tint direction per theme (black on light, white on dark); dark hover is +6% white and selected +10% (light: 4% / 7%) — the demo labels these exactly.

## Sizes (size-context) {#sizes}

- Two steps only: default 36px controls and compact 28px. Every dimension steps down together — text 13→12px, icon 16→14px, control padding 12→10px, row padding 8→6px, gap 8→4px — "so the whole control shrinks together, not just its box".
- One `control` height token by design for BOTH bounded controls (buttons, inputs, select triggers) AND list/menu rows: a popup row lines up with the trigger that opened it because they share this height.
- Segmented tabs are sized so `segmentPad` + `segmentItem` adds back up to the control height (28px item + 4px pad = 36px default; 24 + 2 = 28 compact) — the segmented control's outer box stays on the same ladder as its neighbours.
- The compact step halves the `gap` token (8px → 4px) because "density is spacing as much as control height" — control-to-control spacing comes from the ladder, not from layout code.
- Type follows the ladder: compact drops each role one notch (display 28→24, title 16→15, subtitle 14→13, body 13→12, caption 12→11) so a dense region reads as "a smaller sibling of the same hierarchy, not a squeezed copy".
- Resolution order is explicit component `size` prop > surrounding `SizeProvider` > `"default"`; ~20 components accept the per-component override and it wins over the provider.
- Density is a region decision, not a per-control one: wrap the region in one `SizeProvider` and everything follows — menus opened from it included, since React context crosses portals.

## Scrollbars (scroll-area) {#scrollbars}

- On touch-primary devices the custom scrollbar machinery is skipped entirely for native overflow scrolling — better physics, momentum, and rubber-banding beat any custom scrollbar; the exported ScrollBar no-ops there.
- The thumb rests narrow and low-contrast (4px wide, 8% overlay tint), then widens to 6px and darkens on hover (12%, 16% while dragging), "so it gets out of the way until you reach for it"; the 10px track stays as a comfortable hit target.
- Show/hide is a plain CSS opacity fade matching the cue fade: 160ms in, 120ms out — exits faster, per the animation guidelines; spring tokens are framer-motion configs and don't apply to CSS. On hide, a 160ms delay waits out the thumb shrink first so the thumb visibly narrows back rather than the fade masking it.
- The thumb is nudged 2px off the container edge with a `-translate`, but the track (and its 10px hit target) stays flush with the edge so edge-throws still land.
- The baseline edge treatment is a vendored shadcn `scroll-fade`: a 48px mask dissolves content toward edges that have more to scroll, and CSS scroll-driven animations keep the true start/end edge crisp until you scroll past it — no JavaScript; browsers without scroll-driven animations fall back to a static fade on both edges.
- `scroll-divider` draws the hairline the fade can't: the line lives on the parent's pseudo-elements (inside the scroller the fade's own mask would erase it at exactly the edge it marks) and borrows the scroller's timeline by name; a region flush with the panel's top suppresses its start line, which would otherwise read as a stray border.

# Components

## Accordion {#accordion}

- The trigger label renders twice in a stacked grid: an invisible semibold copy reserves the width, so the visible label animates 'wght' 400 → 550 ('opsz' 14 → 18, holding advance width within ±0.4px) on open with zero layout shift.
- The chevron points right when collapsed and springs 90° down on expand via spring.fast; its strokeWidth also steps 1.5 → 2 when the row is open or hovered.
- Panel height animates to a self-measured offsetHeight pixel value, never `height:"auto"` — framer measures "auto" visually, so under a scaled ancestor the open would overshoot to scale× the real height and snap back.
- Open uses spring.fast with bounce 0 so height "lands with the trigger's chevron" without overshoot; close takes the quicker 0.06s exit tween because "a close is a decision already made". Opacity runs ahead of height (0.06s in / 0.04s out) so the body dissolves rather than being sliced by the clip edge.
- Reduced motion is read via useReducedMotion (not trusted to a consumer MotionConfig) and drops the height transition to duration 0; content resizing underneath an open panel (e.g. a nested accordion) also snaps, since a re-targeted spring would chase the child's animation and land late.
- highlight="item" (default) tints the whole open row + panel as one accent/20 block (accent/12 dark); highlight="trigger" scopes the fill to the row on hover only, "the way a sidebar row highlights without colouring its sub-tree". Hovering a non-open trigger dims the open tint to 0.7.
- Closed panels stay mounted for measurement but flip to `hidden` only after the exit finishes, keeping them out of the accessibility tree without cutting the animation short; the keyboard focus ring is one shared rect that springs (spring.fast) between rows at a −2px inset, only on :focus-visible.

## AskUserQuestions {#ask-user-questions}

- Digits 1-9 answer options from a document-level listener (no focus in the card needed); with several instances mounted, only one answers — the one containing focus, else the most recently mounted — so stacked docs demos never all fire on the same digit. The digit for the Other row focuses its textarea, and digits are ignored while typing in any input.
- ↑/↓ move a highlight that reuses the exact same fluid-hover indicator as the mouse, "so keyboard and pointer focus look identical"; ← is Back, → is Skip, with stopPropagation so the doc page's arrow-key page nav doesn't also fire. Inside the Other textarea, ↑/↓ are stolen only when the caret is at the very start/end — anywhere else the caret moves natively, so multi-line drafts stay editable.
- ⌘+Enter (macOS) / ⌃+Enter commits multi-select and freeText from anywhere inside the card; the platform is detected in a lazy initializer (not an effect) so the very first keydown checks the right modifier, and the ShortcutChip carries suppressHydrationWarning to absorb the server's ⌃-for-⌘ one-character delta.
- The Q/A region animates its REAL height (spring.slow) to a ResizeObserver-measured content height, so the card border and footer reflow frame-by-frame in lockstep with the morph; header and footer live outside the clipped region so neither is yanked.
- Contiguous selected rows merge into a single rounded background block; stable run IDs make a growing/shrinking run morph instead of exit+re-enter, and useMergeSplitBlocks draws two abutting halves mid merge/split so a bridging row animates the boundary.
- One morphing blue focus ring springs between rows, gated to real keyboard focus: a module-level `pointerFocusRedirect` flag marks the row's mousedown focus() redirect, because Chrome reports script focus as :focus-visible and would otherwise light the ring on every click. The ring is intentionally suppressed on the Other row — it has its own input-field treatment and the ring "reads as noise while typing".
- The Other row's textarea auto-resizes (height 0 → scrollHeight) and only switches to top-aligned chip once content actually exceeds ~1.5× the measured line-height — zoom-safe — so a single line stays optically centered like sibling rows; plain Enter submits it in single-select (Shift+Enter newlines), and once it has text it joins the merged selected background instead of reading as a detached field.
- A11y structure: the visible rows carry role radio/checkbox with a roving tabindex (one tab stop — first selected row, else first row), while hidden sr-only Base UI primitives carry the group plumbing; every keyboard query is scoped to `[data-fluid-hover-index]` because a bare role selector would also match the hidden primitive and land arrow focus on invisible controls.
- Question changes restore keyboard focus to the new question's first row only when the user was actually keyboard-driving (the component's own focusedIndexRef is the modality signal, since the DOM can't distinguish); restoring after a mouse click would leave the ring stuck on screen.
- Footer Back/Skip show ←/→ icons as keyboard hints on desktop only — mobile has no equivalent keys — while the inline per-row submit arrows stay everywhere because "those are tap affordances, not keyboard hints"; the single-select submit arrow overlays the numbered chip on hover/focus (chipPosition "left" moves it to its own right-edge slot so the action stays where the eye expects).

## Badge {#badge}

- Solid non-gray badges derive their tint at runtime: `color-mix(in srgb, <color> 15%, var(--background))` with plain `var(--foreground)` text, so one hex per color adapts to light and dark themes.
- Solid gray is special-cased to the theme's `--accent` background instead of a mixed tint.
- The dot variant keeps a neutral `border-border` outline and foreground text; only the dot itself carries the color — full-strength hex, or `--muted-foreground` for gray.
- Two sizes on the shared ladder: default h-6, px-2.5, 12px text, gap-1.5; compact h-5, px-2, 11px text, gap-1. Legacy sm/md/lg still compile as aliases (sm → compact, md/lg → default).
- Size resolves explicit prop > surrounding SizeProvider > default, so badges inside a compact region shrink automatically.
- The label sits in its own span with `text-box: trim-both cap alphabetic`; the badge height is fixed, so trimming only recenters the letterforms vertically.
- Corner radius comes from the shape context (`shape.item`), so badges follow the app's pill/rounded shape system rather than hardcoding a radius.

## Button {#button}

- Press effect: the surface layer sits 1px inside the button (inset-px) and a same-color 1px box-shadow spread fills it back to full bounds; pressing collapses the spread so the surface shrinks exactly 1px per side at any width — a scale would warp (2% of a 400px button is 8px sideways but under 1px vertically). Fill colors are opaque color-mix()es rather than alpha so fill and spread ring never seam.
- The press geometry releases slowly, presses fast: box-shadow transitions at 180ms cubic-bezier(0.23,1,0.32,1) at rest, dropping to 80ms while :active; background-color always runs 80ms ease.
- Tertiary's border is an outer 1px shadow at rest that hands off to an inset 1px shadow when pressed, so the ring moves inward with the shrinking surface.
- Icons thicken on hover instead of the label changing: strokeWidth animates 1.5 → 2 over 80ms; icons also sit 4px closer to their edge than text (12px default / 8px compact vs 16px / 12px base padding).
- Loading keeps label and icons mounted at opacity-0 so the button's width never changes; the spinner overlays them, its box tracking the button height (h-9 / h-7). The spinner is a figure-eight SVG path with a 15/85 dash driven by two loops: 2s linear movement + 4s ease-in-out dash.
- `active` prop forces the pressed colors at full size — for a button holding a dropdown/popover open — and the geometric press-collapse still reacts on top.
- Size ladder: default h-9 (36px) px-4 13px text, compact h-7 (28px) px-3 12px text; unset size follows the surrounding SizeProvider, legacy sm/md/lg resolve as aliases. asChild clones the user's element with the button's internals as children and drops `disabled` on non-button roots.

## Card {#card}

- Cards are transparent and borderless by default, unlike stock shadcn: they inherit the parent substrate and lean on hairline dividers plus the fluid hover highlight instead of a drawn frame.
- Only clickable cards (href/onClick) register with the group's fluid hover — "a highlight on an informational card would promise a click that has nowhere to land".
- With columns > 1 the fluid hover resolves the nearest card in two dimensions (axis "xy"); gap clicks route to the highlighted card only within 16px, because a card grid has generous whitespace.
- Hairline dividers drop next to the active OR selected card so highlight and selection fill read clean (the Table row-border trick); where a bottom and right hairline meet, the vertical one stops 1px short so the horizontal line owns the crossing pixel — two 60%-alpha lines stacked would read brighter than the grid.
- CardTitle uses the ghost-span pattern (invisible semibold copy reserves width) and animates 'wght' 400 → 550 only for the persistent `selected` state — fluid hover previews via the highlight fill, not by bolding the label. A consumer's `truncate` still ellipsizes via overflow-hidden cell spans clamped by grid-cols-[minmax(0,1fr)].
- Clickable cards use a stretched z-20 overlay link/button, with footer actions and dismiss at z-30 above it — the accessible alternative to nesting interactive elements; a disabled card drops the overlay entirely so keyboard can't reach it (pointer-events-none only blocks the mouse).
- The on-hover dismiss ✕ gates pointer-events alongside opacity (an invisible control must not swallow touch taps meant for the card), gets a bg-card/70 backdrop-blur ground over images so the icon never reads against arbitrary pixels, and in inline rows the header yields pr-10 only while the control is revealed.
- An inline card with a CardImage reflows its text + actions into a centred column beside the image (footer drops below the text in natural order); CardImage keeps a fixed 2px corner radius in every state rather than inheriting a frame's larger clip — a 16:9 banner stacked, a 160px square inline.

## ChatMessage {#chat-message}

- Every message enters with opacity 0, y 8, scale 0.96 → settled on spring.moderate, with transformOrigin bottom-right for user messages and bottom-left for assistant, so bubbles appear to grow from the composer side they belong to.
- `layout="position"` is baked in so earlier messages slide up smoothly when a new one is appended to the transcript.
- User = right-aligned accent bubble filled with `color-mix(in oklab, var(--accent), var(--background) 45%)`; assistant = flush-left plain text with no background at all.
- `text-pretty` is applied only to user bubbles and deliberately left off assistant replies: `text-wrap: pretty` re-balances the last lines on every content change, so a word-by-word stream would visibly reflow earlier words onto new lines; normal wrapping appends left-to-right and stays put.
- The meta row (timestamp + icon actions) is always rendered so it reserves its height and the gap between bubbles never shifts; it fades in over 150ms on hover or focus-within, and stays permanently visible on touch where hover is unreachable.
- Timestamps are a user-message-only affordance — `time` is ignored on assistant replies, which show their actions alone; the timestamp renders tabular-nums.
- Messages cap at max-w-[80%]; attachments render as square thumbnails (default 64px) in a row above the bubble, justified toward the message's own side, and an attachment-only message (no children) drops the text bubble entirely.

## CheckboxGroup {#checkbox-group}

- Contiguous checked rows merge into one rounded selection block: indices group into runs with stable IDs (reused when any member overlaps the previous render) so framer morphs a growing/shrinking block instead of exit+re-enter.
- Checking a row that bridges two runs plays a merge: both inner edges glide to the bridging row's midpoint, facing corners straightening to sharp, then swap to one block with no visible motion — instead of the surviving block spring-growing over the whole union. Unchecking a middle row plays the inverse.
- The merge/split edges ride spring.moderate (0.16s, critically damped) "so converging edges meet exactly instead of overshooting"; inner corners trail by 0.07s, staying rounded until the halves meet.
- The check mark draws itself: pathLength animates 0 → 1 over 0.08s easeOut on check, retracts over 0.04s easeIn on uncheck; items already checked at mount skip the draw.
- When checked, the box's 1.5px border turns transparent (the check alone marks the state); hover darkens it from `border` to neutral-400/500. The label animates 'wght' 400 → 550 plus muted → foreground over 80ms via the invisible-semibold-sizer grid, both spans carrying the text-box trim so their boxes stay identical; rows are fixed-height so the trim doesn't shrink the row.
- Mousedown on the checkbox square prevents native focus from landing on the hidden primitive and refocuses the row — otherwise arrow-key nav dead-zones because the group's keydown handler can't find the target among row wrappers.
- Arrow keys wrap, Home/End jump; the item query scopes to row wrappers because the inner primitive also carries role="checkbox" and a bare selector would match twice per row. The focus ring is one shared rect springing (spring.fast) between rows at a −2px inset, only on :focus-visible.

## ColorPicker {#color-picker}

- Switching format (HEX/RGB/HSL/OKLCH) immediately re-emits the current color formatted in the new format through onValueChange, so consumers stay in sync without touching the color.
- The eyedropper is the native `window.EyeDropper` API; support is detected in an effect (SSR-safe) and the button renders only when supported — the docs note it's Chromium-only and auto-hidden elsewhere; user cancellation is silently swallowed.
- The saturation square hides the OS cursor (`cursor-none`); a ghost ring cursor follows hover (suppressed while dragging), and the real 18px thumb is filled with the live color, white border + black ring, moving with duration 0 so it never lags the pointer; arrow keys nudge S/V by 0.01, Shift by 0.1.
- Hue and alpha rails are the compact Slider engine with `hideFill` and the thumb colored by the current color; the alpha gradient's transparent stop keeps the same hue at alpha 0 "so the gradient stays chromatically consistent and reaches fully opaque at 100% with no edge gap", over an 8px conic-gradient checker.
- HSV is the canonical internal state with H preserved across S=0/V=0 transitions, and a sticky OKLCH hue preserves the user's stated H across the lossy RGB round-trip and achromatic colors (where RGB-derived H would collapse to 0); L/C edits anchor on that stated H "so we don't drift along with chroma changes".
- Channel fields are scrubbable (Base UI NumberField ScrubArea with pointer-lock and a virtual cursor); a no-drag press enters edit mode (focus + select), typing commits on blur (per-keystroke parses ignored) while keyboard nudges/scroll/scrub commit immediately, and Escape reverts the draft; nudge steps are 1 / Shift 10 (0.01 / 0.1 for OKLCH chroma).
- Hue-like fields wrap modulo instead of clamping (361 → 1, -1 → 359; exactly max stays put) — used for HSL hue and OKLCH H.
- Swatch selection compares hex-normalized values, resolving named CSS colors ("red", "tomato") through the browser in an effect so render/SSR never touch the DOM; the hex field accepts named colors too, via a canvas fillStyle round-trip.

## Combobox {#combobox}

- Radix has no combobox primitive, so this composes Radix Popover with its own listbox: the input keeps DOM focus the whole time and drives the rows through `aria-activedescendant`; a press on a row is `preventDefault`ed at pointerdown so it never blurs the field, and open/close autofocus is suppressed.
- Arrows loop THROUGH the field: past the last row the highlight clears (the input is the stop) and the next press wraps to the first row — the APG combobox pattern. Enter picks the highlighted row; ArrowDown/ArrowUp on a closed field open it highlighting the first/last row.
- The first row is highlighted the moment the list opens, whatever opened it (click, chevron, typing), so Enter always has a target; typing re-highlights index 0. An opener that already chose a row (ArrowUp picks the last) keeps its choice.
- The highlight knows keyboard from pointer: a keyboard/auto highlight scrolls its row into view (`block: "nearest"` — the input keeps focus, so the browser won't) and survives the pointer leaving the list; a pointer highlight only makes the row Enter's target and drops on mouse-leave.
- What the field shows is split from what filters: opening with a selection shows its label but lists everything until the user types; closing without a pick reverts the field to the selection and clears the query.
- The create row (`onCreate`) appears once the trimmed query matches no label exactly and is appended LAST, so Enter picks a real match while one exists and only creates once nothing matches; its value is `" create"` so it can't collide with a consumer's.
- Chips (multiple mode) pop in/out on the fast tier and slide into new slots with `layout`; `popLayout` lifts an exiting chip out of the flow at once so the field reflows immediately. The text input itself never animates — "chips slide, the field snaps" — because animating it read as the placeholder sliding in from the right when the last chip went. Backspace in an empty field removes the last chip.
- Multiple-pick close behavior: a pick from an unfiltered list toggles and keeps the popup open for the next pick; a pick made while filtering closes it and clears the query.
- Selection visuals: single mode glides ONE marker between rows (a value change springs it to the picked row, moderate tier); multiple mode paints one block per contiguous run of checked rows, merging and splitting like CheckboxGroup as picks bridge or break a run. Checked indices are recomputed against the filtered list as the query shifts them.

## CommandMenu {#command-menu}

- The input keeps DOM focus the whole time and points at the highlighted row through `aria-activedescendant`; there is no list primitive — the one thing a primitive would add, the modal shell, comes from the library's own Dialog. Row mousedown is `preventDefault`ed so a click never blurs the field.
- The highlight is the fluid hover fill and nothing else — no focus ring in the list, like the dropdown and combobox popups; the pointer moves it through useFluidHover, the keyboard through setActiveIndex, and Enter runs whatever it sits on.
- The panel's frame springs to its rows' measured height on the moderate tier (0.16s) — measured via `offsetHeight` (transform-immune), never `height: "auto"`, because framer would read the visual size under a scaled ancestor; reduced motion snaps. A max-height on the shell inherits down and the list scrolls past it.
- CommandMenuDialog opens centered at its cap min(440px, 76dvh) and keeps that top edge — `top-[max(12dvh,calc(50dvh-220px))]` — so the field stays put while the rows under it filter down. It closes on Escape and on a pick (`closeOnSelect`), so no ✕ button is rendered.
- Keyboard scrolling is done at the moment a move is decided, not in an effect: a keyboard move keeps its row at the CENTER of the viewport (as the ends allow) and the viewport travels on the same fast spring as the highlight so row and fill move together; a query reset snaps to the top, heading included. Offsets, never `scrollIntoView`, which would also scroll the page.
- Arrows wrap at both ends — the list is the whole keyboard space, no field stop (unlike the combobox) — and skip disabled rows; the first enabled row is re-highlighted whenever the row set changes (detected by a NUL-joined values key, so an inline items literal doesn't reset it), so Enter always has a target as the query filters. Pointer leaving the list keeps the highlight where it was.
- With CommandMenuTabs mounted, ← and → in the field switch tabs (wrapping) instead of moving the caret; modified presses keep their editing meaning. IME composition keys are left to the composer (including Safari's keyCode 229 commit). Escape closes the dialog shell, but inline it clears the query.
- Shortcut system: `"mod+k"` is ⌘K on a Mac, Ctrl+K elsewhere ("mod" matches either while listening); physical-key (`code`) fallback applies only when `key` isn't a Latin letter/digit, so Dvorak's "t" is never read as physical K; a bare key stays out of editable fields. Among mounted dialogs sharing a combo, an open one answers first (the press closes it), else the most recently mounted one whose `shortcutScope` holds focus.
- The footer's Enter hint names the highlighted row's `action` (default: its label) so it reads as the thing Enter does ("Open Showcase") rather than a generic "Run"; it sits at the trailing edge so its changing width never moves the other hints, which follow the menu (tabs add ← →, a dialog adds Esc).
- Suggested rows lead under their own heading while nothing is typed, and leave their original group so nothing is listed twice; the default filter matches every query word against label + description + keywords and never re-sorts, so rows don't move under the cursor as the query grows.

## Dialog {#dialog}

- Enters and exits on the slow tier: panel fades and scales 0.97→1 on a spring (0.24s, bounce 0.12); the exit is a quicker plain tween (0.16s) so a dismissal reads crisp and final rather than replaying the entrance in reverse.
- The portal stays mounted through the exit tween (forceMount + `onAnimationComplete`), with a timeout at `exitFallbackMs(spring.slow)` (exit ms + 100) as fallback: a throttled/background tab can stall rAF callbacks, which would leave an invisible full-screen overlay and Radix's scroll lock in place.
- Elevation: the panel sits 4 surface steps above the current substrate (capped at 8) and re-provides that level via SurfaceProvider, so popups opened inside a dialog walk further up the ladder automatically.
- Three widths — sm 400, lg 540, xl 880 — each one notch narrower in compact regions (360/480/800); width only, the padding stays put. `xl` is the canvas for composed layouts (sidebar beside a panel), usually with `p-0` and a fixed height.
- `position="top"` anchors the panel 12dvh from the top instead of centering, so a panel whose height follows its content (a command menu) keeps its top edge still.
- `container` retargets the portal and switches overlay + panel from `fixed` to `absolute`, scoping the dialog to a positioned, overflow-hidden region — usually paired with `modal={false}` (e.g. a docs preview).
- `showCloseButton` (default true) renders the corner ✕ as a ghost icon Button; drop it when the content has its own way out, e.g. a command menu that closes on Escape and on a pick.

## Dropdown {#dropdown}

- Two forms with different semantics: the inline always-rendered panel is a plain `role="group"` (name it with `aria-label`) — real `role="menu"` lives only on the popup DropdownContent, so a hand-rolled trigger around the inline panel never announces a falsely popup menu.
- The popup enters/exits on the fast tier (0.08s spring in, 0.06s tween out) with opacity + `scaleY 0.96` + a 4px slide; origin and slide direction follow the RESOLVED side after collision flipping via `popupMotionClass`, so a popup that flips above its anchor grows upward from its bottom edge.
- Keyboard navigation inside the popup moves the hover background only — no ring: "in a menu the highlighted row is the focus indicator". The inline panel, by contrast, draws an animated focus ring on `:focus-visible`.
- The selected background is a separate overlay that springs between rows on the moderate tier (0.16s) with an 0.08s opacity tween, and the fluid hover highlight starts `from` the checked rect so hover appears to grow out of the selection.
- `checkedIndices` flips rows to checkbox items that keep the menu open on toggle (Radix's close-on-select is suppressed by preventing the select event — Base UI `closeOnClick={false}` parity), and contiguous checked rows share one merged background that merges/splits as picks bridge or break a run.
- Opens ready to act: two rAFs after the primitive's own open autofocus, focus lands on the first enabled row — unless a DropdownSearch is mounted, which takes focus itself so a searchable menu opens ready to type.
- DropdownSearch: typing while a row is focused is redirected into the field (capture-phase keydown refocuses and appends the character; Backspace too; Space is left alone because on a row it activates). While the field has focus the first row carries the hover background — what Enter will pick — recomputed as the query re-filters; ↓/↑ jump to first/last row, Enter clicks the first row.
- The search field is sticky at the popup's top, bleeding into the 4px padding so its divider runs edge to edge and rows scroll underneath; the popup drops its scroll fade while a field is pinned there. The query resets on close (`clearOnClose` default true) so the menu reopens unfiltered.
- The popup opts out of the global pill/rounded shape and keeps the smaller "rounded" radii: heavy pill bubbling distorts perceived padding at this scale and produces corner-shadow asymmetry. Elevation is substrate + 2 with the shadow pinned to level 3, so a dropdown reads the same shadow on the page or inside a dialog. Width: min-w tracks the trigger, max-h is min(480px, available height).

## InputCopy {#input-copy}

- Icon swap is a wait-mode crossfade: the copy icon exits at scale 0.8, the check (or error ×) enters at scale 0.6→1 on spring.fast, and the check/× glyph then draws itself with a pathLength 0→1 stroke animation in 0.08s easeOut.
- Success and error glyphs are keyed by a copy counter (`check-${copyCount}`), so clicking Copy again while already in the "copied" state replays the draw animation instead of doing nothing.
- Status resets to idle after exactly 2000ms; "copied" and "error" deliberately occupy the same animation slot on the button.
- Tooltip choreography (icon variant): tooltip visibility is captured on pointerdown — before Radix closes it on press — and after copying the tooltip is force-opened as "Copied" only if it was already showing; otherwise it's suppressed. Leaving the row suppresses it, re-entering re-arms normal 500ms-delay behavior.
- Button variant renders an invisible "Copied" layer in the same grid cell behind Copy/Copied/Failed, so the label swap never shifts the row's width.
- The entire row is one `<button>`; hovering it highlights the mono value with a `<mark>` tinted #6B97FF/20 and thickens icon strokes 1.5→2 over 80ms, making the whole value read as the click target.
- Accessible name reflects state ("Copied" / "Copy failed" / "Copy"), and when a field label exists `aria-labelledby` chains button-then-label so screen readers hear "Copy <label>".

## InputGroup {#input-group}

- A field lights up when it is the hover-nearest item OR focused (`labelActive = isActive || isFocused`): its leading icon shifts muted→foreground and stroke-width 1.5→2 over 80ms.
- State chrome is a precedence ladder: disabled → transparent/ring-border; error → destructive-tinted bg (bg-destructive-light/60 on hover-active) and ring-destructive/50; focused → bg-card + ring-border; hover-active → bg-muted/50; rest → fully transparent with invisible ring.
- The label sits one notch tighter (pl-2.5, compact pl-2) than the ladder's control padding because "the field ring is invisible at rest, so the roomier inset reads as a gap".
- The label stacks an invisible semibold layer under the visible one in one grid cell, reserving the bold width so weight changes never shift layout.
- Mousedown anywhere on the input container (icon, padding) focuses the input — preserving the old one-big-label behavior — while clicks on the input itself are left alone so caret placement isn't disturbed.
- The input container uses a fixed ladder control height (rather than py-2 around the line box) so the field sits exactly on the 36px / 28px size steps.
- Base UI Field wires the a11y plumbing: label htmlFor, error id landing in aria-describedby, `invalid` driving aria-invalid; `Field.Error match` pins the message visible while the controlled `error` prop stands, and `labelHidden` renders sr-only so inline fields keep their accessible name.

## InputMessage {#input-message}

- Auto-resize clamps the textarea between minRows and maxRows × the parsed line-height (cached per element to avoid getComputedStyle on every keystroke); overflow-y only turns on past maxRows. A width-gated ResizeObserver re-runs the measure because a near-zero-width mount wraps the placeholder into many lines and pins the height at maxRows.
- Enter sends, Shift+Enter newlines, and IME composition keydowns are ignored (`e.nativeEvent.isComposing`) so committing Japanese/Chinese input never fires a send.
- The composer's edge is the box-shadow's 1px hairline ring recolored in place — drag-over #6B97FF > focus (20% foreground) > hover (border) — so state changes bump contrast "without ever appearing to thicken" the stroke; the 0 1px 1px drop layer is kept so the lift never flickers. Applied inline because Tailwind shadow utilities mangle multi-layer arbitrary values.
- File drop only reacts to drags whose dataTransfer types include "Files" (text/HTML drags don't trigger), sets dropEffect "copy", swaps the placeholder to "Drop files here to add to chat", and ignores dragLeave into children; drops are filtered by accept and deduped by a name+size+lastModified fingerprint.
- The three collapsible regions (attachments, queue, suggestions) spring to a self-measured PIXEL height, never `height:"auto"`, because framer resolves auto from the element's visual (transformed) size — under a scaled ancestor the region would balloon to scale× and snap back. The suggestions region exits height-only (no opacity fade) because a simultaneous fade "read as a height glitch".
- Send button morphs by state: Stop (streaming + empty draft) ⇄ arrow-up; Send and Queue intentionally share the arrow glyph so only the Stop⇄arrow swap animates. While streaming, a submit enqueues the draft (text + attached files snapshot) instead of sending; on the streaming→idle edge the queue head auto-dispatches through onSend with meta.queuedId, and an sr-only aria-live="polite" region announces "Message sent. N still queued.".
- Queued rows are fully keyboard-operable: Enter/F2 edits the row back into the composer, Delete/Backspace removes, Alt+↑/↓ reorders (drag via Reorder also works); the × is hover-revealed on pointer devices but persistent on touch, detected via `(hover: none)`.
- History recall is readline-style: plain ArrowUp only when the caret is on the first line, ArrowDown on the last, so multi-line editing still works; the in-progress draft is stashed and restored when walking past the newest entry, and real typing exits history mode.
- The placeholder suggestion is a real overlay, not the native placeholder, so a Tab keycap can render inline after the text; its typography mirrors the textarea's step exactly "so it sits where typed text will", long suggestions truncate on one flex line so the chip is never cut, and an sr-only hint joins the textarea's aria-describedby. Tab fills without sending; Shift+Tab still moves focus back.
- Suggestions are a listbox that never steals focus: ↓ enters/descends, ↑ walks back up and out, Enter or click fills the composer; the highlighted row is tracked via aria-activedescendant and shares the same sliding fluid-hover overlay as the pointer. While nothing is highlighted the first row shows a ↓ keycap hint in the slot where the active row shows ↵.

## RadioGroup {#radio-group}

- The selected-row background is one shared motion.div that springs (spring.moderate, 0.16s critically damped) from the old row to the new one instead of fading out/in per row.
- The dot pops in with spring.fast from scale 0.3 / opacity 0 and exits shrinking over 0.04s; items selected at mount skip the entrance entirely.
- When selected, the circle's 1.5px border turns transparent — the dot alone marks the state; hover darkens the border from `border` to neutral-400 (neutral-500 dark) over 80ms. The circle is 16px (14px compact) with an 8px (7px) dot.
- The label animates 'wght' 400 → 550 and muted → foreground over 80ms when selected or hovered; an invisible semibold sizer span reserves the width, both stacked spans carrying the text-box trim so their boxes stay identical, and rows are fixed-height so the trim doesn't shrink the row.
- Arrow keys (all four) move focus AND select in one step, wrapping at the ends; Home/End jump-and-select. The item query scopes to row wrappers because the hidden primitive also carries role="radio" and a bare selector would match twice per row.
- Roving tabindex: the selected item is the tab stop, and with no selection the first item takes it "or the whole group becomes unreachable by keyboard".
- The animated focus ring is a single rect that springs (spring.fast) between rows at a −2px inset, only on :focus-visible; a `value`-controlled group still wraps the Radix primitive even without onValueChange because the hidden per-item inputs need its context.

## Select {#select}

- Selection acknowledgment: picking an item holds the popup open 300ms (`selectionAckMs`) before closing, so the checkmark drawing in and the selected background springing to the picked row are seen instead of cut off by the ~60ms close fade. Escape, outside press and trigger toggle still close immediately; Radix reports no close reason, so a close arriving within 100ms of `onValueChange` is read as selection-driven.
- The checkmark draws in as an SVG path (`pathLength` 0→1, 0.08s easeOut) and erases faster (0.04s easeIn); its slot is always rendered at fixed width so a check appearing never changes the row's intrinsic width — without it the whole popup would resize when a selection lands.
- The selected-background overlay keeps its position in `animate` (not `initial`) so an in-session value change springs the marker (moderate tier) from the old row to the picked one; a value change while open deliberately does NOT remeasure — the rows haven't moved, so only `checkedIndex` switches and the marker glides.
- Keyboard focus ring is gated: seeded from the trigger's `:focus-visible` at open and earned by nav keys (arrows/Home/End/PageUp/PageDown/Tab) inside the popup, tracked in the capture phase because the primitive moves focus during its own keydown. Pointer-driven focus never draws the ring.
- SelectContent renders unconditionally: while closed, Radix parks its children in a detached DocumentFragment, which the selected label portal into the trigger, closed-trigger typeahead, and the hidden native `<select>` options all depend on — never gate it behind a mounted flag.
- Flavor difference a user feels: the Radix flavor is modal-ish — it scroll-locks the page and disables outside pointer events while open (and its hidden viewport scrollbar is forced back with `![scrollbar-width:thin]` so long lists keep a scroll affordance); the Base UI flavor is non-modal — the page keeps scrolling and the positioner tracks the anchor.
- The trigger follows the global pill/rounded shape but the popup always keeps the smaller "rounded" radii; the popup enters on the fast tier with the side-aware `popupMotionClass`, tracks the trigger width via `--radix-select-trigger-width`, and caps at min(300px, available height).

## Sidebar {#sidebar}

- The rail handle does three things: drag to resize clamped 160–360px; drag ≥56px past the minimum (SIDEBAR_COLLAPSE_SLOP) to preview collapse — "the same 'throw it at the edge to dismiss' affordance native apps use" — with drag-back past the threshold re-expanding, nothing committed until release; and a press that never moves ≥4px is the collapse click.
- Toggle shortcut is a bare `[` (left side) / `]` (right side) — bare "so the browser's history shortcuts stay untouched" (⌘[/⌘] skipped when a modifier is held), skipped while typing, and focus-scoped: only one mounted provider answers a keypress — the innermost provider containing focus, else the outermost mounted one.
- Peek: the collapsed edge is a 12px (`w-3`) strip whose hairline brightens on hover; hover mode arms the peek after a 150ms intent delay and dismisses after 250ms, with ONE shared timer serving the strip, the collapsed trigger, and the peeked card so crossing between them cancels a pending dismissal; Escape or an outside press dismisses, and peeking never pins the sidebar or writes the cookie.
- Hover-peek dismissal uses geometric containment of the pointer, not enter/leave events, because a portalled tooltip or menu covering the card steals the hit-test and fires pointerleave even though the cursor never left the sidebar.
- Motion tiers: open/close ride `spring.slow` ("a whole column moving is the largest thing this component animates"; the sheet and peek stay on moderate), drag-resize is glued duration-0 tracking, mid-drag collapse/re-expand flips ride `spring.moderate`, and reduced motion snaps instead of sliding.
- Desktop open state persists to a `sidebar_state` cookie for 7 days (`persist` prop; read it in a server layout to restore the last visit); the mobile drawer state never persists, and below 768px the sidebar becomes a modal drawer — crossing the breakpoint DISSOLVES the desktop rail (opacity fade with display allow-discrete) instead of snapping it away.
- SidebarMenuSub collapses on the content's measured `offsetHeight`, "never to 'auto', which framer measures wrong under a scaled ancestor", and springs only when that sub itself toggles — a height change from a nested sub collapsing inside it snaps, so the wrapper never chases with a stacked second spring.
- One highlight scope per SidebarMenu tree: hover/active/focus overlays glide between all visible rows, sub-rows included; hit-testing measures the row's BUTTON, not the `<li>` (an expanded sub-tree would otherwise hand its gaps to the parent row), and overlay height is clamped to the button box with a 48px fallback.
- Active backgrounds are keyed per level so the selection GLIDES when it moves instead of remounting; a rect change on the SAME row (reflow from a sibling collapsing) snaps rather than springing, and hover tracking freezes across every scope while any sidebar-anchored popup is open.
- There is deliberately no icon-rail collapsed mode (`collapsible` is only "offcanvas" | "none"): the docs argue icon rails make "every destination take a hover, a beat, a tooltip" and section labels collapse to a divider — collapsed means gone, and `peek="hover"` floats the REAL sidebar, labels and all, instead.

## Slider {#slider}

- One component, two ladder steps: default size renders the pips/scrubber design, compact the dense one; any compact-only prop (array value, `steps`, `showSteps`, `showValue`, `valuePosition`, track/fill styling, thumb colors) forces the compact engine regardless of size "so no capability is ever lost".
- Compact thumb snaps to the step grid continuously during drag (pixel → snapped value → pixel on every move); a track click spring-animates the thumb to the snapped position (`spring.moderate`), and release spring-settles to the final quantized position.
- The value label is click-to-edit: clicking swaps in a number input, auto-selected; Enter/blur commits (clamped to min/max then snapped to step or nearest `steps` entry), Escape cancels; an invisible ghost of the widest possible value reserves width so nothing shifts.
- Hovering the track previews the change: a 40%-accent bar runs from the nearest thumb center to the snapped hover value (extended to the track edge at min/max "so there's no gap", rounded only on its leading edge), plus a tooltip that appears after a 100ms delay and hides while pressed.
- The value display shifts normal → medium weight while hovering/pressing (fontVariationSettings, 100ms transition) with tabular-nums, so interaction is signalled without layout shift.
- Range mode: pointer-down grabs the nearest thumb, and thumbs can't cross — each is clamped half a thumb-width (10px of the 20px thumb) from the other.
- Step dots are masked out on the filled side of the track with a 2px feather (a moving linear-gradient mask driven by the thumb's motion value) and grow 1.25x on hover; an invisible Radix slider supplies ARIA + keyboard, and non-uniform `steps` runs it on indices so arrow keys walk the list, with `aria-valuetext` reporting the formatted value.
- Comfortable (default-size) designs use a 2px handle line that grows 2px taller (inset 8 → 7) and darkens 25% → 50% → 100% foreground across rest/hover/focus; at min a zeroOffset (8px pips, 17px scrubber) keeps the line visible; scrubber drag sets fill directly (glued, no spring) while pips springs per snap; both add an 8px-beyond-each-edge hit area.

## Switch {#switch}

- The thumb is draggable, not just clickable: pointer capture + a 2px dead zone distinguishes drag from click, the thumb tracks the pointer clamped to the track, and release toggles when past the track midpoint or springs back otherwise.
- After a drag, a `didDrag` flag suppresses the click/onCheckedChange that follows the same pointer-up (cleared next animation frame) so a drag never double-toggles; a system-cancelled gesture snaps back without toggling.
- Hover extends the thumb into a pill (+2px width); press extends it further (+4px) and squashes it (−4px height, recentred). These extents scale down for compact (+3/−3) "so the compact switch keeps the same feel".
- When checked, the extra press/hover width grows leftward (thumbX subtracts extraWidth) so the thumb's outer edge stays pinned to the track end.
- All thumb motion rides spring.moderate (0.16s, critically damped); initial mount sets position with duration 0 so a pre-checked switch never animates on load.
- Track colors: checked #6B97FF darkening to #5C89F2 on hover; unchecked uses `--accent`, hovered mixing in 10% overlay via color-mix in oklab. Geometry per ladder step: 34×20 track / 16px thumb default, 28×16 / 12px compact, constant 2px inset.
- Hover state is only set for mouse pointers (pointerType check), so touch never leaves the switch stuck in its pill-extended hover shape.
- The whole row is the pointer target (touch-none stops scroll fighting the drag); the label shifts muted-foreground → foreground over 80ms when on, with text-box trim recentering letterforms against the taller track without changing layout.

## Table {#table}

- Row hover is the shared fluid-hover highlight drawn once behind the whole `<table>`; body rows opt in by passing `index`, header rows omit it.
- The active row's bottom border AND the border of the row above it (`index === activeIdx - 1`) go transparent while hovered, so the highlight sits on a clean pill; the header row's border hides when row 0 is active.
- Borders never pop: they transition border-color from `border-accent/40` to `border-transparent` with `transition-[border-color] duration-80`.
- Cell text lifts from `text-muted-foreground` to `text-foreground` when its row is active, via an `is-active` class on the row and `group-[.is-active]/row:text-foreground` on cells, over the same `duration-80`.
- Header rows render semibold and body rows normal through `fontVariationSettings` (variable-font axis, not a font-weight class).
- Rows sit on the size ladder — 36px default, 28px compact — via cell padding (`px-3 py-2` vs `px-2.5 py-[5px]`); the comment states "py + line box lands the row on the ladder (36px / 28px)".
- A `size` prop pins every cell to one ladder step by wrapping the table in a SizeProvider ("cells read the context"); omitted, cells follow the surrounding provider.

## Tabs {#tabs}

- The active pill travels between tabs on `spring.moderate`; clicking sets an optimistic selected index so the indicator jumps immediately instead of waiting for controlled state to round-trip — the item's onClick is composed, not spread-overridable, so a consumer onClick can't break this.
- The hover pill is born AT the selected pill (initial = selectedRect, opacity 0) and springs to the hovered tab at opacity 0.4 on `spring.fast`; when the mouse exits the list it travels back to the selected pill while fading out (spring.moderate, 60ms opacity) rather than just disappearing.
- While a non-selected tab is hovered, the active pill dims to opacity 0.85 (0.08s), signalling the split attention.
- The active pill's surface level is `min(substrate + 3, 8)` — "1 above the muted track + 2 for pop": surface 4 on the page, but 8 inside a dialog (substrate 5) instead of colliding at 4.
- Labels change weight without layout shift: two stacked grid spans, an invisible semibold sizer plus the visible label, both carrying `[text-box:trim-both_cap_alphabetic]` so their boxes stay identical; selected = semibold, color+weight transition `duration-80`.
- Items use a fixed height from the size ladder instead of `py` "so the text-box trim below doesn't shrink the tab — browsers without text-box support render identically"; segmentPad + segmentItem sum to the ladder's 36px/28px control height so the control lines up with adjacent buttons/selects/inputs.
- Icons animate strokeWidth 1.5 → 2 and muted → foreground color when the tab is hovered or selected (`transition-[color,stroke-width] duration-80`).
- Keyboard focus draws a springing 2px-outset focus ring rect only on `:focus-visible`, and focus also drives the hover highlight; blur clears the highlight only if the mouse isn't inside the list.

## TabsSubtle {#tabs-subtle}

- Same pill choreography as Tabs: the hover pill starts at the selected pill (opacity 0), springs to the hovered tab at opacity 0.4 (`spring.fast`), and on mouse exit travels back to the selected pill while fading (spring.moderate, 60ms opacity); the selected pill dims to 0.8 while another tab is hovered.
- `activeLabel` mode collapses every non-selected tab to its icon; the label expands/collapses by animating width to a MEASURED `offsetWidth`, never `"auto"` — framer resolves an "auto" target from the element's visual (transformed) size, so under a scaled ancestor the spring overshoots and snaps.
- Until the first measurement lands, width stays plain CSS `auto` instead of handing framer "auto": under the /demo card's ~1.76x scale framer would write back a too-wide width and spring back down, making the selected tab visibly pulse on arrival.
- The expanding label animates `marginLeft` to 8px (6px compact) so the icon-to-label gap matches the ladder's gap-2/gap-1.5.
- Each tab button gets its own ResizeObserver so pill rects re-measure when a label expands/collapses in activeLabel mode; a collapsed tab keeps its name for AT via `aria-label`.
- The list wears `-mx-1 px-1 / -my-1 py-1` so the 2px-outset focus ring can draw inside `overflow-x-auto` without clipping, and `max-w-[calc(100%_+_8px)]` because fit-content parents size against the margin box — a plain max-w-full would clamp the list 8px too small and clip the first/last tab's ring.
- Activation is manual (`activationMode="manual"`): arrows move focus, Enter/Space selects; Radix owns role="tablist", roving tabindex, and Arrow/Home/End.

## ThinkingIndicator {#thinking-indicator}

- The glyph is one SVG path morphing circle → infinity → reversed circle → infinity → circle in equal quarters (`times: [0,.25,.5,.75, 1]`) over 6s easeInOut, repeating forever; the two circle paths trace opposite winding directions so the loop keeps flowing.
- The label cycles "Thinking / Moonwalking / Planning / Refining" every 4000ms; the incoming word slides up from y 80% (0.24s), the outgoing word exits to y -80% slightly faster (0.16s), both on cubic-bezier(0.4, 0, 0.2, 1) with popLayout so they overlap.
- An invisible copy of the longest word sits in the same grid cell to reserve width, so the word cycle never shifts layout.
- The shimmer is a shared `.shimmer-text` utility: transparent text over a 300%-wide gradient clipped to the glyphs, animating background-position 0→100%; colors are `light-dark()` pairs so the sweep inverts correctly per theme.
- Screen readers hear one static sr-only "Thinking…" under role="status"; the cycling display is aria-hidden so it doesn't re-announce every 4 seconds.
- Reduced motion drops both the infinite morph and the word cycling — a static infinity glyph and the first word "carry the same meaning without the movement".

## ThinkingSteps {#thinking-steps}

- Each step enters in two phases: an outer wrapper opens height on spring.slow (to a measured pixel height, never "auto") while the inner content fades in after a default 0.08s delay — space opens first, then content appears. Pixel targets are used because framer resolves an "auto" height from the element's visual (transformed) size, so under a scaled ancestor the whole list would overshoot and snap back.
- Steps with `status="pending"` render nothing at all; flipping them to active/complete is what streams the list in. The active step's label gets `.shimmer-text` plus an appended "…".
- The header trigger stacks an invisible semibold label layer to reserve bold width, animates weight normal→semibold when open, recolors muted→foreground on hover/open, thickens the chevron stroke 1.5→2, and rotates the chevron 0→90° on spring.fast.
- The collapse panel keeps content force-mounted: Radix/Base UI would apply `hidden` (display:none) the moment it closes, freezing the exit mid-flight, so the component applies `hidden` itself only after the framer exit completes, preserving the trigger↔panel aria-controls contract.
- A panel that is already open at mount SNAPs (duration 0) to its first measured pixel target instead of springing — the auto→pixel hand-off would otherwise animate on load; later opens spring normally with `bounce: 0` because "pure height looks better without overshoot".
- Each step's icon column is a fixed 14px cell with a 1px connector line stretching from below the icon to the step's bottom; `isLast` hides the line so the rail terminates cleanly.
- Source badges enter with a blur(4px)→0 + scale 0.85→1 + fade on spring.moderate, staggerable via per-badge `delay` (docs use 0.05s increments); step images use the same blur-in without the scale.

## Tooltip {#tooltip}

- Enters on the fast tier (0.08s spring) with a 4px slide toward the trigger from the chosen side (top→y:4, bottom→y:-4, left→x:4, right→x:-4) and fades out on the quicker 0.06s exit tween; default `sideOffset` is 8.
- Hover delay defaults to 200ms; an app-level `TooltipProvider` adds skip-delay grouping (300ms window) so moving between adjacent triggers shows the next tooltip instantly. Each bare Tooltip falls back to a per-instance provider only when no ambient one exists — a per-instance provider everywhere would defeat the grouping and re-wait the full delay between neighbors.
- `followCursor="x" | "y"` tracks the pointer along one axis for tall or wide triggers (the Sidebar rail) where a centered tooltip sits far from the pointer; the other axis stays anchored by `side`. The offset is a framer motion value, so per-move updates skip React re-renders; a force-opened follow tooltip rests centered until a real pointer takes over.
- The bubble is an inverted surface (`bg-foreground text-background`), 12px at medium weight (`fontVariationSettings`); `text-box: trim-both cap alphabetic` recenters the label, with the padding bump applied only where text-box is supported so overall height stays ~26px on untrimmed browsers.
- `contentClassName` exists because Radix copies the content's z-index onto its popper wrapper: pass a z utility there to lift the whole tooltip above other fixed layers (default z-50); `className` styles the bubble itself.
- `forceOpen` pins the tooltip open (or closed) over the hover/focus behavior — `onOpenChange` still reports the internal state before forceOpen is applied.
