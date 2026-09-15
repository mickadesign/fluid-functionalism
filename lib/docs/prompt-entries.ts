/** Per-page usage snippet and props list for the "Copy prompt" button.
 *  Keyed by doc page slug. `install-prompt.ts` derives the rest (install
 *  command, description, flavor, docs URL). Keep imports pointing at the
 *  installed paths (`@/components/ui/*`, `@/lib/*`, `@/hooks/*`), not the
 *  repo's registry paths. */
export interface PromptEntry {
  /** Minimal composition, ~12 lines, imports from the installed path. */
  usage: string;
  /** One line per prop: `name: type (default X). What it does.` */
  props: string[];
  /** Extra sentence when the two primitive flavors differ in usage. */
  flavorNote?: string;
  /** The craft: the interaction-design decisions built into the component
   *  that a consumer (human or agent) would miss from the API alone — exact
   *  behaviors, exact values, and the why where one exists. Each bullet is
   *  one decision, ≤2 lines, sourced from the component code and doc page —
   *  never aspirational. Rendered in the Copy-prompt brief so composed code
   *  respects the behaviors instead of fighting them. */
  craft?: string[];
}

export const PROMPT_ENTRIES: Record<string, PromptEntry> = {
  "fluid-hover": {
    craft: [
      "The whole picking rule is one pure function: an item the pointer is inside always wins; otherwise the item whose center is nearest does, so a cursor in a gap, in the container padding, or past the last row still lands. Ties keep the first item. Axes: `y` for lists, `x` for strips, `xy` for grids (Euclidean distance to centers).",
      "One highlight per list: a single absolutely positioned `bg-hover` element pinned to the container's padding corner, travelling on a transform (framer `x`/`y`) on `spring.fast` so per-frame work stays on the compositor; width/height are layout values but only change when the target rect's size does \u2014 in most lists never.",
      "The pointer session counter increments on `onMouseEnter` and re-keys the highlight, so a fresh entry fades in at the nearest row instead of sliding over from wherever it was last; `from` sets where that fresh entry fades in from (a dropdown passes its checked row, a nav menu its active route).",
      "Gap click: a click that lands between items (gap, padding, past the last row) is routed as a real DOM `.click()` to the highlighted item's activator \u2014 \"what is lit is what a click hits\". Clicks inside an item, on controls between rows (a menu's search field), and on disabled items are left alone; `gapClick: false` turns it off, `{maxDistance}` caps it (the card grid uses 16px).",
      "Gate overlays on `isMeasured`: an overlay mounted against a rect a later pass corrects animates from the wrong place to the right one, which reads as the highlight sliding in from another row. Measurement coalesces every trigger into one rAF pass, retries up to 3 frames while a popup has no layout box, and never publishes zeroed rects \u2014 the last complete measurement stands.",
      "Reduced motion is handled inside the component itself via `useReducedMotion()`: travel snaps, the 0.08s opacity fade stays \u2014 so an installed copy behaves correctly without the consumer wrapping their app in `MotionConfig`.",
      "Only click targets register: a card without `href` or `onClick` does not join the highlight, because lighting it would promise a click with nowhere to land. One list per group of alternatives \u2014 children ride in the parent's list, a divider between different kinds of rows means a new container and a new hook.",
      "The docs' skip-list is explicit UX judgment: skip fluid hover when a wrong click would hurt, when only some items are clickable, when there is a lot of empty space around items, or when rows change place as you scroll.",
    ],
    usage: `import { useRef } from "react";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

function List({ rows }: { rows: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(containerRef); // options: { axis: "y" | "x" | "xy" }
  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 p-2" {...hover.handlers}>
      <FluidHoverHighlight hover={hover} className="rounded-lg" />
      {rows.map((label, i) => <Row key={label} index={i} registerItem={hover.registerItem}>{label}</Row>)}
    </div>
  );
}
// Inside Row: const ref = useRef<HTMLButtonElement>(null); useRegisterFluidHoverItem(registerItem, index, ref);
// then render <button ref={ref} className="relative z-10 ...">`,
    props: [
      "axis: \"y\" | \"x\" | \"xy\" (default \"y\"). Hook option. Which way the list runs: y for lists, x for strips, xy for grids.",
      "isItemDisabled: (el: HTMLElement) => boolean. Hook option. Skips an item: never lit, never clicked.",
      "gapClick: boolean | { maxDistance?: number } (default true). Hook option. A click between items goes to the lit one.",
      "handlers: { onMouseEnter, onMouseMove, onMouseLeave, onClick }. Returned. Spread onto the container.",
      "registerItem: (index, element | null) => void. Returned. Give it to each row via useRegisterFluidHoverItem; indices start at 0.",
      "activeIndex: number | null. Returned. The lit item, also set as data-fluid-hover-active on the item.",
      "setActiveIndex: (index | null) => void. Returned. Light an item yourself, for keyboard focus.",
      "remeasure: () => void. Returned. Measure again and hide the highlight until done; call it when a popup opens.",
      "FluidHoverHighlight hover: ReturnType<typeof useFluidHover>. The hook; the highlight reads what it needs from it.",
      "FluidHoverHighlight transition: Transition | false (default spring.fast). The travel; false snaps in place after a reflow.",
    ],
  },
  motion: {
    craft: [
      "Three spring tiers only: `fast` 0.08s bounce 0, `moderate` 0.16s bounce 0, `slow` 0.24s bounce 0.12. Rule: the bigger the thing that moves, the slower the spring \u2014 never hand-write a duration, always reach for a tier.",
      "Exits are plain tweens, no bounce, one tier quicker than the enter (fast 0.06s, moderate 0.12s, slow 0.16s), so a dismissal reads as crisp and final rather than replaying the entrance in reverse.",
      "`moderate` is critically damped: same perceived speed as a bouncier tier but it lands exactly with no overshoot, so it also carries panels/sheets that must settle precisely (dropdowns, tabs, mobile drawer, merged selection backgrounds).",
      "Icon swaps keep both glyphs mounted in one icon-sized grid cell and crossfade opacity 1\u21920, blur 0\u21924px, scale 1\u21920.6; the arriving glyph rides the tier's full 0.08s (easeOut) and the leaving one the 0.06s exit (easeIn), so an appear always outlasts a disappear. Both are tweens on purpose: a critically damped spring settles well before its nominal duration and would invert that order, and blur is a `filter` string a spring cannot drive.",
      "Reduced motion means fewer and gentler, not none: `<MotionConfig reducedMotion=\"user\">` at the root drops transform/layout animation but keeps opacity and colour fades (they aid comprehension) \u2014 a dialog fades instead of scaling, a drawer appears in place.",
      "Never stack two measured-height collapses: a wrapper animating to a ResizeObserver-measured height springs only when it itself toggles and snaps (`{duration: 0}`) when a child's collapse changed the measurement \u2014 before the guard, the sub-menu landed in 218ms while its group wrapper took 326ms, diverging ~80px mid-flight.",
      "Animate `transform` and `opacity`, never `top`/`left`/`width`/`height`: that keeps motion on the compositor AND lets root MotionConfig auto-reduce it \u2014 a component that animates layout properties gets neither.",
    ],
    usage: `import { motion } from "framer-motion";
import { spring } from "@/lib/springs";

// fast: 0.08s, bounce 0. Hover, fades, tooltips, focus rings.
// moderate: 0.16s, bounce 0. Dropdowns, tabs, short travel, panels that must land exactly.
// slow: 0.24s, bounce 0.12. Dialogs, drawers, large surfaces.
// spring.<tier> is the enter; spring.<tier>.exit is the matching exit tween.
<motion.div
  transition={spring.fast}
  exit={{ opacity: 0, transition: spring.fast.exit }}
/>`,
    props: [
      "spring.fast: { type: \"spring\", duration: 0.08, bounce: 0, exit: { duration: 0.06 } }. Hover, fades, tooltips, focus rings.",
      "spring.moderate: { type: \"spring\", duration: 0.16, bounce: 0, exit: { duration: 0.12 } }. Critically damped: dropdowns, tabs, drawers, short travel.",
      "spring.slow: { type: \"spring\", duration: 0.24, bounce: 0.12, exit: { duration: 0.16 } }. Dialogs, drawers, large surfaces.",
      "spring.<tier>.exit: tween config. Pass as the transition of an exit prop; never reuse the enter spring for a dismissal.",
      "exitFallbackMs(tier): number. Exit duration in ms plus a 100ms buffer, for deferred-unmount timers that guard an exit tween.",
    ],
  },
  scrollbars: {
    craft: [
      "On touch-primary devices the custom scrollbar machinery is skipped entirely for native overflow scrolling \u2014 better physics, momentum, and rubber-banding beat any custom scrollbar; the exported ScrollBar no-ops there.",
      "The thumb rests narrow and low-contrast (4px wide, 8% overlay tint), then widens to 6px and darkens on hover (12%, 16% while dragging), \"so it gets out of the way until you reach for it\"; the 10px track stays as a comfortable hit target.",
      "Show/hide is a plain CSS opacity fade matching the cue fade: 160ms in, 120ms out \u2014 exits faster, per the animation guidelines; spring tokens are framer-motion configs and don't apply to CSS. On hide, a 160ms delay waits out the thumb shrink first so the thumb visibly narrows back rather than the fade masking it.",
      "The thumb is nudged 2px off the container edge with a `-translate`, but the track (and its 10px hit target) stays flush with the edge so edge-throws still land.",
      "The baseline edge treatment is a vendored shadcn `scroll-fade`: a 48px mask dissolves content toward edges that have more to scroll, and CSS scroll-driven animations keep the true start/end edge crisp until you scroll past it \u2014 no JavaScript; browsers without scroll-driven animations fall back to a static fade on both edges.",
      "`scroll-divider` draws the hairline the fade can't: the line lives on the parent's pseudo-elements (inside the scroller the fade's own mask would erase it at exactly the edge it marks) and borrows the scroller's timeline by name; a region flush with the panel's top suppresses its start line, which would otherwise read as a stray border.",
    ],
    usage: `import { ScrollArea } from "@/components/ui/scroll-area";

// className constrains the outer box; viewportClassName goes on the inner
// scrolling viewport, where the scroll-fade / scroll-fade-x utility lives.
<ScrollArea orientation="horizontal" viewportClassName="scroll-fade-x" className="w-full">
  <div className="flex w-max gap-2 p-3">
    {months.map((month) => (
      <div key={month} className="flex h-20 w-28 shrink-0 items-center justify-center border border-border">
        {month}
      </div>
    ))}
  </div>
</ScrollArea>`,
    props: [
      "orientation: \"vertical\" | \"horizontal\" | \"both\" (default \"vertical\"). Which axes get scrollbars.",
      "viewportClassName: string. Classes for the inner scrolling viewport, where the scroll-fade utility goes.",
      "className: string. Classes for the outer container; set the height or width constraint here.",
    ],
    flavorNote: "Radix flavor wraps @radix-ui/react-scroll-area, Base UI flavor wraps @base-ui/react ScrollArea. Both export ScrollArea and ScrollBar with the same props.",
  },
  sizes: {
    craft: [
      "Two steps only: default 36px controls and compact 28px. Every dimension steps down together \u2014 text 13\u219212px, icon 16\u219214px, control padding 12\u219210px, row padding 8\u21926px, gap 8\u21924px \u2014 \"so the whole control shrinks together, not just its box\".",
      "One `control` height token by design for BOTH bounded controls (buttons, inputs, select triggers) AND list/menu rows: a popup row lines up with the trigger that opened it because they share this height.",
      "Segmented tabs are sized so `segmentPad` + `segmentItem` adds back up to the control height (28px item + 4px pad = 36px default; 24 + 2 = 28 compact) \u2014 the segmented control's outer box stays on the same ladder as its neighbours.",
      "The compact step halves the `gap` token (8px \u2192 4px) because \"density is spacing as much as control height\" \u2014 control-to-control spacing comes from the ladder, not from layout code.",
      "Type follows the ladder: compact drops each role one notch (display 28\u219224, title 16\u219215, subtitle 14\u219213, body 13\u219212, caption 12\u219211) so a dense region reads as \"a smaller sibling of the same hierarchy, not a squeezed copy\".",
      "Resolution order is explicit component `size` prop > surrounding `SizeProvider` > `\"default\"`; ~20 components accept the per-component override and it wins over the provider.",
      "Density is a region decision, not a per-control one: wrap the region in one `SizeProvider` and everything follows \u2014 menus opened from it included, since React context crosses portals.",
    ],
    usage: `import { SizeProvider, useSize } from "@/lib/size-context";

// One SizeProvider pins every control in its subtree to a step:
// default is 36px controls, compact is 28px. Components also take a
// per-instance size prop that wins over the provider.
function Toolbar() {
  const { gap, control, text, icon } = useSize(); // Tailwind classes plus icon px for the current step
  return (
    <SizeProvider size="compact">
      <div className={\`flex items-center \${gap}\`}>...</div>
    </SizeProvider>
  );
}`,
    props: [
      "SizeProvider size: \"default\" | \"compact\". Controlled variant; pins every control in the subtree to one step.",
      "SizeProvider defaultSize: \"default\" | \"compact\" (default \"default\"). Uncontrolled initial variant, switchable via useSizeContext().setSize.",
      "useSize(override?): SizeClasses. Returns { variant, control, controlHeight, segmentItem, segmentPad, text, px, itemPx, gap, icon } for the current step.",
      "useSizeVariant(override?): \"default\" | \"compact\". The resolved step, honoring a per-component override over the provider.",
      "useSizeContext(): { size, setSize }. Read or switch the step from inside a SizeProvider.",
      "useTypeScale(override?): Record<TypeScaleRole, number>. Font sizes per role (display, title, body, caption and so on) for the current step.",
      "size (on components): \"default\" | \"compact\" (default from provider). Per-component override on Button, Badge, Select, Tabs, Dropdown, Accordion, Card and most others.",
    ],
  },
  surfaces: {
    craft: [
      "Eight surface levels, each paired 1:1 with a shadow recipe. Light mode has only two color steps (#FAFAFA floor, #FCFCFC sunken) and flattens to #FFFFFF from surface-3 up \u2014 shadow alone carries elevation; dark mode is an additive white-opacity ladder #171717 \u2192 #484848 in even steps.",
      "The motivating failure: a dropdown that hard-codes its background ends up surface-5 on surface-5 inside a dialog \u2014 the elevation shadow still gives a faint edge, but the menu body melts straight into the dialog.",
      "Substrate flows through React context (default 1 = the page); `Elevated` computes its own level as `min(substrate + offset, 8)` and re-provides it, so further nesting walks up the ladder automatically and a popover lands at the right depth on the page or inside a dialog with no props passed.",
      "Conventional offsets: `2` for dropdown / popover / select menu, `4` for dialog / modal.",
      "`shadowLevel` decouples shadow from background: a dropdown always reads `shadow-surface-3` whether it opens on the page or inside a dialog \u2014 the background tracks the substrate, but the shadow weight stays constant, so \"a popover still reads as a popover three layers down\".",
      "Hover and selected states are surface-relative overlays, not fixed colors, so they work at any elevation: `--overlay` flips tint direction per theme (black on light, white on dark); dark hover is +6% white and selected +10% (light: 4% / 7%) \u2014 the demo labels these exactly.",
    ],
    usage: `import { Elevated } from "@/lib/elevated";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

// Elevated reads the substrate from context, computes min(substrate + offset, 8),
// applies the surface background and shadow classes, then re-provides the new
// level so nested surfaces keep climbing the ladder.
<Elevated offset={2} className="rounded-xl p-2">   {/* popover / dropdown: 2 above */}
  <Elevated offset={4} shadowLevel={5}>...</Elevated>   {/* dialog: 4 above, fixed shadow */}
</Elevated>
// Manual: const level = Math.min(useSurface() + 2, 8); className={surfaceClasses(level)}`,
    props: [
      "offset: number. Steps above the current substrate; the surface level becomes min(substrate + offset, 8). Use 2 for dropdown, popover, select menu and 4 for dialog, modal.",
      "shadowLevel: number (default the computed level). Override the shadow level so a dropdown keeps a constant shadow weight however deep it nests.",
      "className: string. Merged after the surface classes; radius and padding go here.",
      "...div props: ComponentPropsWithoutRef<\"div\">. Everything else is forwarded to the div, ref included.",
      "SurfaceProvider value: number. Set the substrate for a subtree by hand (1 page, 3 popover, 5 dialog).",
      "useSurface(): number. The current substrate level from context, 1 when no provider is present.",
      "surfaceClasses(bgLevel, shadowLevel = bgLevel): string. Background plus shadow Tailwind classes for a level, for components that do not use Elevated.",
    ],
  },
  accordion: {
    craft: [
      "The trigger label renders twice in a stacked grid: an invisible semibold copy reserves the width, so the visible label animates 'wght' 400 \u2192 550 ('opsz' 14 \u2192 18, holding advance width within \u00b10.4px) on open with zero layout shift.",
      "The chevron points right when collapsed and springs 90\u00b0 down on expand via spring.fast; its strokeWidth also steps 1.5 \u2192 2 when the row is open or hovered.",
      "Panel height animates to a self-measured offsetHeight pixel value, never `height:\"auto\"` \u2014 framer measures \"auto\" visually, so under a scaled ancestor the open would overshoot to scale\u00d7 the real height and snap back.",
      "Open uses spring.fast with bounce 0 so height \"lands with the trigger's chevron\" without overshoot; close takes the quicker 0.06s exit tween because \"a close is a decision already made\". Opacity runs ahead of height (0.06s in / 0.04s out) so the body dissolves rather than being sliced by the clip edge.",
      "Reduced motion is read via useReducedMotion (not trusted to a consumer MotionConfig) and drops the height transition to duration 0; content resizing underneath an open panel (e.g. a nested accordion) also snaps, since a re-targeted spring would chase the child's animation and land late.",
      "highlight=\"item\" (default) tints the whole open row + panel as one accent/20 block (accent/12 dark); highlight=\"trigger\" scopes the fill to the row on hover only, \"the way a sidebar row highlights without colouring its sub-tree\". Hovering a non-open trigger dims the open tint to 0.7.",
      "Closed panels stay mounted for measurement but flip to `hidden` only after the exit finishes, keeping them out of the accessibility tree without cutting the animation short; the keyboard focus ring is one shared rect that springs (spring.fast) between rows at a \u22122px inset, only on :focus-visible.",
    ],
    usage: `import { Accordion, AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// Standalone: one Accordion, one item. Grouped: AccordionGroup with an
// index on every AccordionItem so the fluid hover highlight can track rows.
<AccordionGroup type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>Getting started</AccordionTrigger>
    <AccordionContent>Install the component and import it into your project.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Styling</AccordionTrigger>
    <AccordionContent>Pill or rounded, and every transition is a spring.</AccordionContent>
  </AccordionItem>
</AccordionGroup>`,
    props: [
      "type: \"single\" | \"multiple\" (default \"single\"). Whether one or multiple items can be expanded.",
      "collapsible: boolean (default true). Allow collapsing all items when type is single.",
      "defaultValue: string | string[]. Initially expanded item value(s).",
      "value: string | string[]. Controlled expanded value(s).",
      "onValueChange: (value) => void. Callback when expanded state changes.",
      "highlight: \"trigger\" | \"item\" (default \"item\"). What an open item tints: item fills the row and its panel, trigger scopes the fill to the row and shows it on hover.",
      "AccordionItem value: string. Unique identifier for this item.",
      "AccordionItem index: number. Position for fluid hover. Required inside AccordionGroup, omit for standalone.",
      "AccordionItem disabled: boolean (default false). Whether this item is disabled.",
      "AccordionTrigger / AccordionContent children: ReactNode. Trigger label and collapsible content.",
    ],
    flavorNote: "Radix flavor builds on @radix-ui/react-accordion, Base UI flavor on @base-ui/react Accordion. Same exports and props in both.",
  },
  "ask-user-questions": {
    craft: [
      "Digits 1-9 answer options from a document-level listener (no focus in the card needed); with several instances mounted, only one answers \u2014 the one containing focus, else the most recently mounted \u2014 so stacked docs demos never all fire on the same digit. The digit for the Other row focuses its textarea, and digits are ignored while typing in any input.",
      "\u2191/\u2193 move a highlight that reuses the exact same fluid-hover indicator as the mouse, \"so keyboard and pointer focus look identical\"; \u2190 is Back, \u2192 is Skip, with stopPropagation so the doc page's arrow-key page nav doesn't also fire. Inside the Other textarea, \u2191/\u2193 are stolen only when the caret is at the very start/end \u2014 anywhere else the caret moves natively, so multi-line drafts stay editable.",
      "\u2318+Enter (macOS) / \u2303+Enter commits multi-select and freeText from anywhere inside the card; the platform is detected in a lazy initializer (not an effect) so the very first keydown checks the right modifier, and the ShortcutChip carries suppressHydrationWarning to absorb the server's \u2303-for-\u2318 one-character delta.",
      "The Q/A region animates its REAL height (spring.slow) to a ResizeObserver-measured content height, so the card border and footer reflow frame-by-frame in lockstep with the morph; header and footer live outside the clipped region so neither is yanked.",
      "Contiguous selected rows merge into a single rounded background block; stable run IDs make a growing/shrinking run morph instead of exit+re-enter, and useMergeSplitBlocks draws two abutting halves mid merge/split so a bridging row animates the boundary.",
      "One morphing blue focus ring springs between rows, gated to real keyboard focus: a module-level `pointerFocusRedirect` flag marks the row's mousedown focus() redirect, because Chrome reports script focus as :focus-visible and would otherwise light the ring on every click. The ring is intentionally suppressed on the Other row \u2014 it has its own input-field treatment and the ring \"reads as noise while typing\".",
      "The Other row's textarea auto-resizes (height 0 \u2192 scrollHeight) and only switches to top-aligned chip once content actually exceeds ~1.5\u00d7 the measured line-height \u2014 zoom-safe \u2014 so a single line stays optically centered like sibling rows; plain Enter submits it in single-select (Shift+Enter newlines), and once it has text it joins the merged selected background instead of reading as a detached field.",
      "A11y structure: the visible rows carry role radio/checkbox with a roving tabindex (one tab stop \u2014 first selected row, else first row), while hidden sr-only Base UI primitives carry the group plumbing; every keyboard query is scoped to `[data-fluid-hover-index]` because a bare role selector would also match the hidden primitive and land arrow focus on invisible controls.",
      "Question changes restore keyboard focus to the new question's first row only when the user was actually keyboard-driving (the component's own focusedIndexRef is the modality signal, since the DOM can't distinguish); restoring after a mouse click would leave the ring stuck on screen.",
      "Footer Back/Skip show \u2190/\u2192 icons as keyboard hints on desktop only \u2014 mobile has no equivalent keys \u2014 while the inline per-row submit arrows stay everywhere because \"those are tap affordances, not keyboard hints\"; the single-select submit arrow overlays the numbered chip on hover/focus (chipPosition \"left\" moves it to its own right-edge slot so the action stays where the eye expects).",
    ],
    usage: `import { AskUserQuestions, type AskUserQuestion } from "@/components/ui/ask-user-questions";

const questions: AskUserQuestion[] = [
  {
    id: "role",
    title: "What's your role?",
    options: [
      { id: "design", title: "Designer", description: "Visual / interaction" },
      { id: "eng", title: "Engineer", description: "Frontend / backend" },
      { id: "pm", title: "PM", description: "Product / program" },
    ],
  },
  { id: "tools", title: "Which tool do you use most?", multiSelect: true, options: [/* 2 to 5 options */] },
];

<AskUserQuestions questions={questions} onComplete={(answers) => console.log(answers)} />`,
    props: [
      "questions: AskUserQuestion[]. Ordered list of questions to ask; 2 to 5 options per question is recommended.",
      "currentIndex: number. Controlled index of the active question; pair with onCurrentIndexChange.",
      "defaultCurrentIndex: number (default 0). Initial question index (uncontrolled).",
      "answers: Record<string, AskUserAnswer>. Controlled answers map keyed by question id; pair with onAnswersChange.",
      "onComplete: (answers: Record<string, AskUserAnswer>) => void. Called after the last question is answered or submitted.",
      "onSkip: (questionId: string, index: number) => void. Called when the user clicks Skip on a question.",
      "skipLabel: string (default \"Skip\"). Label for the skip control in the header.",
      "AskUserQuestion: { id, title, options?, multiSelect?, allowOther?, skippable?, layout?: \"inline\" | \"stacked\", chipPosition?: \"left\" | \"right\", freeText?, freeTextValidate? }. multiSelect adds a Next button; allowOther adds an inline textarea; freeText makes a textarea the only answer.",
      "AskUserOption: { id, title, description? }. Bold title plus muted description per row.",
      "AskUserAnswer: { questionId, selectedIds: string[], otherText?, skipped? }. What each question resolves to.",
    ],
  },
  badge: {
    craft: [
      "Solid non-gray badges derive their tint at runtime: `color-mix(in srgb, <color> 15%, var(--background))` with plain `var(--foreground)` text, so one hex per color adapts to light and dark themes.",
      "Solid gray is special-cased to the theme's `--accent` background instead of a mixed tint.",
      "The dot variant keeps a neutral `border-border` outline and foreground text; only the dot itself carries the color \u2014 full-strength hex, or `--muted-foreground` for gray.",
      "Two sizes on the shared ladder: default h-6, px-2.5, 12px text, gap-1.5; compact h-5, px-2, 11px text, gap-1. Legacy sm/md/lg still compile as aliases (sm \u2192 compact, md/lg \u2192 default).",
      "Size resolves explicit prop > surrounding SizeProvider > default, so badges inside a compact region shrink automatically.",
      "The label sits in its own span with `text-box: trim-both cap alphabetic`; the badge height is fixed, so trimming only recenters the letterforms vertically.",
      "Corner radius comes from the shape context (`shape.item`), so badges follow the app's pill/rounded shape system rather than hardcoding a radius.",
    ],
    usage: `import { Badge } from "@/components/ui/badge";

<Badge color="violet">Fiction</Badge>
<Badge color="amber">Science</Badge>
<Badge variant="dot" color="green">Philosophy</Badge>
<Badge size="compact" color="blue">History</Badge>`,
    props: [
      "variant: \"solid\" | \"dot\" (default \"solid\"). Solid uses a tinted background; dot shows a colored indicator.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Step on the size ladder; legacy sm/md/lg values resolve as aliases.",
      "color: BadgeColor (default \"gray\"). Tailwind palette name: gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, blue, indigo, violet, purple, fuchsia, pink, rose.",
    ],
  },
  "button": {
    craft: [
      "Press effect: the surface layer sits 1px inside the button (inset-px) and a same-color 1px box-shadow spread fills it back to full bounds; pressing collapses the spread so the surface shrinks exactly 1px per side at any width \u2014 a scale would warp (2% of a 400px button is 8px sideways but under 1px vertically). Fill colors are opaque color-mix()es rather than alpha so fill and spread ring never seam.",
      "The press geometry releases slowly, presses fast: box-shadow transitions at 180ms cubic-bezier(0.23,1,0.32,1) at rest, dropping to 80ms while :active; background-color always runs 80ms ease.",
      "Tertiary's border is an outer 1px shadow at rest that hands off to an inset 1px shadow when pressed, so the ring moves inward with the shrinking surface.",
      "Icons thicken on hover instead of the label changing: strokeWidth animates 1.5 \u2192 2 over 80ms; icons also sit 4px closer to their edge than text (12px default / 8px compact vs 16px / 12px base padding).",
      "Loading keeps label and icons mounted at opacity-0 so the button's width never changes; the spinner overlays them, its box tracking the button height (h-9 / h-7). The spinner is a figure-eight SVG path with a 15/85 dash driven by two loops: 2s linear movement + 4s ease-in-out dash.",
      "`active` prop forces the pressed colors at full size \u2014 for a button holding a dropdown/popover open \u2014 and the geometric press-collapse still reacts on top.",
      "Size ladder: default h-9 (36px) px-4 13px text, compact h-7 (28px) px-3 12px text; unset size follows the surrounding SizeProvider, legacy sm/md/lg resolve as aliases. asChild clones the user's element with the button's internals as children and drops `disabled` on non-button roots.",
    ],
    usage: `import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

<Button variant="primary">Primary</Button>
<Button variant="secondary" leadingIcon={Plus}>Create</Button>
<Button variant="tertiary" trailingIcon={ArrowRight}>Next</Button>
<Button variant="ghost">Ghost</Button>
<Button loading>Saving</Button>
<Button disabled>Disabled</Button>`,
    props: [
      'variant: "primary" | "secondary" | "tertiary" | "ghost" (default "primary"). Visual style of the button.',
      'size: "default" | "compact" | "icon" | "icon-compact" (default from SizeProvider). Step on the size ladder: 36px default, 28px compact.',
      "loading: boolean (default false). Shows a spinner and disables the button.",
      "active: boolean (default false). Forces the pressed visual, e.g. while a menu the button opened is showing.",
      "leadingIcon: IconComponent. Icon displayed before the label.",
      "trailingIcon: IconComponent. Icon displayed after the label.",
      "asChild: boolean (default false). Merge props onto the child element instead of rendering a <button>.",
      "disabled: boolean (default false). Disables the button.",
    ],
  },
  "card": {
    craft: [
      "Cards are transparent and borderless by default, unlike stock shadcn: they inherit the parent substrate and lean on hairline dividers plus the fluid hover highlight instead of a drawn frame.",
      "Only clickable cards (href/onClick) register with the group's fluid hover \u2014 \"a highlight on an informational card would promise a click that has nowhere to land\".",
      "With columns > 1 the fluid hover resolves the nearest card in two dimensions (axis \"xy\"); gap clicks route to the highlighted card only within 16px, because a card grid has generous whitespace.",
      "Hairline dividers drop next to the active OR selected card so highlight and selection fill read clean (the Table row-border trick); where a bottom and right hairline meet, the vertical one stops 1px short so the horizontal line owns the crossing pixel \u2014 two 60%-alpha lines stacked would read brighter than the grid.",
      "CardTitle uses the ghost-span pattern (invisible semibold copy reserves width) and animates 'wght' 400 \u2192 550 only for the persistent `selected` state \u2014 fluid hover previews via the highlight fill, not by bolding the label. A consumer's `truncate` still ellipsizes via overflow-hidden cell spans clamped by grid-cols-[minmax(0,1fr)].",
      "Clickable cards use a stretched z-20 overlay link/button, with footer actions and dismiss at z-30 above it \u2014 the accessible alternative to nesting interactive elements; a disabled card drops the overlay entirely so keyboard can't reach it (pointer-events-none only blocks the mouse).",
      "The on-hover dismiss \u2715 gates pointer-events alongside opacity (an invisible control must not swallow touch taps meant for the card), gets a bg-card/70 backdrop-blur ground over images so the icon never reads against arbitrary pixels, and in inline rows the header yields pr-10 only while the control is revealed.",
      "An inline card with a CardImage reflows its text + actions into a centred column beside the image (footer drops below the text in natural order); CardImage keeps a fixed 2px corner radius in every state rather than inheriting a frame's larger clip \u2014 a 16:9 banner stacked, a 160px square inline.",
    ],
    usage: `import {
  Card, CardGroup, CardHeader, CardMedia,
  CardTitle, CardDescription, CardFooter, CardButton,
} from "@/components/ui/card";
import { Circle } from "lucide-react";

<CardGroup orientation="inline">
  <Card onClick={() => open(item)}>
    <CardMedia icon={Circle} />
    <CardHeader>
      <CardTitle>Fluid motion</CardTitle>
      <CardDescription>Spring-tuned transitions across three tiers</CardDescription>
    </CardHeader>
    <CardFooter><CardButton>Connect</CardButton></CardFooter>
  </Card>
</CardGroup>`,
    props: [
      "onClick: () => void. Makes the whole card a clickable target (stretched button).",
      "href: string. Makes the whole card a link (stretched anchor).",
      "selected: boolean (default false). Persistent selected fill and title emphasis on top of fluid hover.",
      "disabled: boolean (default false). Dims and disables the card.",
      "dismissible: boolean (default false). Shows a dismiss button, revealed on hover or focus.",
      "onDismiss: () => void. Called when the dismiss button is pressed.",
      'CardGroup orientation: "card" | "inline" (default "card"). Stacked layout or a horizontal row.',
      "CardGroup columns: number (default 1). Grid columns; more than 1 enables 2-D fluid hover.",
      'CardGroup border: "none" | "outlined" (default "none"). Borderless with dividers, or a drawn border.',
      "CardGroup separated: boolean (default false). Individually shaped tiles with a gap instead of one divided block.",
    ],
  },
  "chat-message": {
    craft: [
      "Every message enters with opacity 0, y 8, scale 0.96 \u2192 settled on spring.moderate, with transformOrigin bottom-right for user messages and bottom-left for assistant, so bubbles appear to grow from the composer side they belong to.",
      "`layout=\"position\"` is baked in so earlier messages slide up smoothly when a new one is appended to the transcript.",
      "User = right-aligned accent bubble filled with `color-mix(in oklab, var(--accent), var(--background) 45%)`; assistant = flush-left plain text with no background at all.",
      "`text-pretty` is applied only to user bubbles and deliberately left off assistant replies: `text-wrap: pretty` re-balances the last lines on every content change, so a word-by-word stream would visibly reflow earlier words onto new lines; normal wrapping appends left-to-right and stays put.",
      "The meta row (timestamp + icon actions) is always rendered so it reserves its height and the gap between bubbles never shifts; it fades in over 150ms on hover or focus-within, and stays permanently visible on touch where hover is unreachable.",
      "Timestamps are a user-message-only affordance \u2014 `time` is ignored on assistant replies, which show their actions alone; the timestamp renders tabular-nums.",
      "Messages cap at max-w-[80%]; attachments render as square thumbnails (default 64px) in a row above the bubble, justified toward the message's own side, and an attachment-only message (no children) drops the text bubble entirely.",
    ],
    usage: `import { ChatMessage } from "@/components/ui/chat-message";
import { Copy } from "lucide-react";

const actions = <button aria-label="Copy"><Copy size={13} /></button>;

<div className="flex flex-col gap-2">
  <ChatMessage from="user" time="Wednesday 6:06 PM" actions={actions}>
    What does "good design" actually mean?
  </ChatMessage>
  <ChatMessage from="assistant" actions={actions}>
    Good design is mostly invisible. You only notice it when it is missing.
  </ChatMessage>
</div>`,
    props: [
      'from: "user" | "assistant". Who sent it: user is a right-aligned accent bubble, assistant is left-aligned plain text.',
      "children: ReactNode. Message body. Omit for an attachment-only message.",
      "time: ReactNode. Pre-formatted timestamp in the hover-revealed meta row. User messages only.",
      "actions: ReactNode. Icon-only action buttons next to the timestamp. Row height is always reserved, so nothing shifts.",
      "files: File[]. Optional attachments rendered as square thumbnails above the bubble. Images and PDFs supported.",
      "thumbnailSize: number (default 64). Side length in px of each attachment thumbnail.",
      "className: string. Merged onto the outer motion wrapper, e.g. to tweak max-width.",
    ],
  },
  "checkbox-group": {
    craft: [
      "Contiguous checked rows merge into one rounded selection block: indices group into runs with stable IDs (reused when any member overlaps the previous render) so framer morphs a growing/shrinking block instead of exit+re-enter.",
      "Checking a row that bridges two runs plays a merge: both inner edges glide to the bridging row's midpoint, facing corners straightening to sharp, then swap to one block with no visible motion \u2014 instead of the surviving block spring-growing over the whole union. Unchecking a middle row plays the inverse.",
      "The merge/split edges ride spring.moderate (0.16s, critically damped) \"so converging edges meet exactly instead of overshooting\"; inner corners trail by 0.07s, staying rounded until the halves meet.",
      "The check mark draws itself: pathLength animates 0 \u2192 1 over 0.08s easeOut on check, retracts over 0.04s easeIn on uncheck; items already checked at mount skip the draw.",
      "When checked, the box's 1.5px border turns transparent (the check alone marks the state); hover darkens it from `border` to neutral-400/500. The label animates 'wght' 400 \u2192 550 plus muted \u2192 foreground over 80ms via the invisible-semibold-sizer grid, both spans carrying the text-box trim so their boxes stay identical; rows are fixed-height so the trim doesn't shrink the row.",
      "Mousedown on the checkbox square prevents native focus from landing on the hidden primitive and refocuses the row \u2014 otherwise arrow-key nav dead-zones because the group's keydown handler can't find the target among row wrappers.",
      "Arrow keys wrap, Home/End jump; the item query scopes to row wrappers because the inner primitive also carries role=\"checkbox\" and a bare selector would match twice per row. The focus ring is one shared rect springing (spring.fast) between rows at a \u22122px inset, only on :focus-visible.",
    ],
    usage: `import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group";
import { useState } from "react";

const items = ["Apples", "Bananas", "Cherries", "Dates"];
const [checked, setChecked] = useState<Set<number>>(new Set([0]));
const toggle = (i: number) => setChecked((prev) => {
  const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
});

<CheckboxGroup checkedIndices={checked}>
  {items.map((label, i) => (
    <CheckboxItem key={label} index={i} label={label} checked={checked.has(i)} onToggle={() => toggle(i)} />
  ))}
</CheckboxGroup>`,
    props: [
      "checkedIndices: Set<number>. Set of checked item indices; drives the merged background across contiguous picks.",
      "children: ReactNode. CheckboxItem children.",
      "CheckboxItem label: string. Text label for the checkbox.",
      "CheckboxItem index: number. Position index within the group.",
      "CheckboxItem checked: boolean. Whether this item is checked.",
      "CheckboxItem onToggle: () => void. Called when this item is toggled.",
    ],
  },
  "color-picker": {
    craft: [
      "Switching format (HEX/RGB/HSL/OKLCH) immediately re-emits the current color formatted in the new format through onValueChange, so consumers stay in sync without touching the color.",
      "The eyedropper is the native `window.EyeDropper` API; support is detected in an effect (SSR-safe) and the button renders only when supported \u2014 the docs note it's Chromium-only and auto-hidden elsewhere; user cancellation is silently swallowed.",
      "The saturation square hides the OS cursor (`cursor-none`); a ghost ring cursor follows hover (suppressed while dragging), and the real 18px thumb is filled with the live color, white border + black ring, moving with duration 0 so it never lags the pointer; arrow keys nudge S/V by 0.01, Shift by 0.1.",
      "Hue and alpha rails are the compact Slider engine with `hideFill` and the thumb colored by the current color; the alpha gradient's transparent stop keeps the same hue at alpha 0 \"so the gradient stays chromatically consistent and reaches fully opaque at 100% with no edge gap\", over an 8px conic-gradient checker.",
      "HSV is the canonical internal state with H preserved across S=0/V=0 transitions, and a sticky OKLCH hue preserves the user's stated H across the lossy RGB round-trip and achromatic colors (where RGB-derived H would collapse to 0); L/C edits anchor on that stated H \"so we don't drift along with chroma changes\".",
      "Channel fields are scrubbable (Base UI NumberField ScrubArea with pointer-lock and a virtual cursor); a no-drag press enters edit mode (focus + select), typing commits on blur (per-keystroke parses ignored) while keyboard nudges/scroll/scrub commit immediately, and Escape reverts the draft; nudge steps are 1 / Shift 10 (0.01 / 0.1 for OKLCH chroma).",
      "Hue-like fields wrap modulo instead of clamping (361 \u2192 1, -1 \u2192 359; exactly max stays put) \u2014 used for HSL hue and OKLCH H.",
      "Swatch selection compares hex-normalized values, resolving named CSS colors (\"red\", \"tomato\") through the browser in an effect so render/SSR never touch the DOM; the hex field accepts named colors too, via a canvas fillStyle round-trip.",
    ],
    usage: `import { ColorPicker, ColorPickerPopover } from "@/components/ui/color-picker";
import { useState } from "react";

const [color, setColor] = useState("#6B97FF");

// Inline panel, controlled
<ColorPicker value={color} onValueChange={(v) => setColor(v)} />

// Popover with a trigger tile and label
<ColorPickerPopover triggerLabel="Fill" defaultValue="#6B97FF" />`,
    props: [
      "value: string. Controlled color value in any supported format.",
      'defaultValue: string (default "#6B97FF"). Initial color when uncontrolled.',
      "onValueChange: (value, parsed) => void. Fired on every change with the formatted string and a parsed color object.",
      'format: "hex" | "rgb" | "hsl" | "oklch". Controlled format selection.',
      'defaultFormat: "hex" | "rgb" | "hsl" | "oklch" (default "hex"). Initial format when uncontrolled.',
      "swatches: string[]. Optional preset swatches; the strip is hidden when omitted.",
      "hideEyedropper: boolean (default false). Force-hide the eyedropper button.",
      "ColorPickerPopover triggerLabel: string. Optional label rendered next to the color tile.",
      "ColorPickerPopover triggerShowValue: boolean (default true). Show the hex value next to the tile.",
      "ColorPickerPopover triggerShowRemove: boolean (default false). Render an X button on the trigger; pairs with onTriggerRemove.",
    ],
  },
  "combobox": {
    craft: [
      "Radix has no combobox primitive, so this composes Radix Popover with its own listbox: the input keeps DOM focus the whole time and drives the rows through `aria-activedescendant`; a press on a row is `preventDefault`ed at pointerdown so it never blurs the field, and open/close autofocus is suppressed.",
      "Arrows loop THROUGH the field: past the last row the highlight clears (the input is the stop) and the next press wraps to the first row \u2014 the APG combobox pattern. Enter picks the highlighted row; ArrowDown/ArrowUp on a closed field open it highlighting the first/last row.",
      "The first row is highlighted the moment the list opens, whatever opened it (click, chevron, typing), so Enter always has a target; typing re-highlights index 0. An opener that already chose a row (ArrowUp picks the last) keeps its choice.",
      "The highlight knows keyboard from pointer: a keyboard/auto highlight scrolls its row into view (`block: \"nearest\"` \u2014 the input keeps focus, so the browser won't) and survives the pointer leaving the list; a pointer highlight only makes the row Enter's target and drops on mouse-leave.",
      "What the field shows is split from what filters: opening with a selection shows its label but lists everything until the user types; closing without a pick reverts the field to the selection and clears the query.",
      "The create row (`onCreate`) appears once the trimmed query matches no label exactly and is appended LAST, so Enter picks a real match while one exists and only creates once nothing matches; its value is `\"\u0000create\"` so it can't collide with a consumer's.",
      "Chips (multiple mode) pop in/out on the fast tier and slide into new slots with `layout`; `popLayout` lifts an exiting chip out of the flow at once so the field reflows immediately. The text input itself never animates \u2014 \"chips slide, the field snaps\" \u2014 because animating it read as the placeholder sliding in from the right when the last chip went. Backspace in an empty field removes the last chip.",
      "Multiple-pick close behavior: a pick from an unfiltered list toggles and keeps the popup open for the next pick; a pick made while filtering closes it and clears the query.",
      "Selection visuals: single mode glides ONE marker between rows (a value change springs it to the picked row, moderate tier); multiple mode paints one block per contiguous run of checked rows, merging and splitting like CheckboxGroup as picks bridge or break a run. Checked indices are recomputed against the filtered list as the query shifts them.",
    ],
    usage: `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "@/components/ui/combobox";
import { useState } from "react";

const frameworks = [{ value: "next", label: "Next.js" }, { value: "astro", label: "Astro" }];
const [value, setValue] = useState("");

<Combobox items={frameworks} value={value} onValueChange={setValue}>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item.value} value={item.value}>{item.label}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
    props: [
      "items: readonly (string | { value: string; label: string })[]. The options; a string is its own value and label.",
      "multiple: boolean (default false). Any number of picks; values become string[] and the field is ComboboxChips.",
      'value: string | string[]. Selected value; "" means none, an array when multiple.',
      'onValueChange: (value: string | string[]) => void. Called with the pick, "" when cleared, or the array when multiple.',
      "filter: (item, query: string) => boolean. Match an item against the query. Default is case-insensitive contains on the label.",
      "onCreate: (query: string) => item | void. Adds a create row for the query when no label matches exactly.",
      "hideSelected: boolean (default false). Multiple only; picked items leave the list.",
      "disabled: boolean (default false). Disables the field and the popup.",
      'size: "default" | "compact". Pins field and popup to one size step; otherwise follows the SizeProvider.',
      'ComboboxInput variant: "bordered" | "borderless" (default "bordered"). Also takes icon, placeholder, error, clearable.',
    ],
  },
  "dialog": {
    craft: [
      "Enters and exits on the slow tier: panel fades and scales 0.97\u21921 on a spring (0.24s, bounce 0.12); the exit is a quicker plain tween (0.16s) so a dismissal reads crisp and final rather than replaying the entrance in reverse.",
      "The portal stays mounted through the exit tween (forceMount + `onAnimationComplete`), with a timeout at `exitFallbackMs(spring.slow)` (exit ms + 100) as fallback: a throttled/background tab can stall rAF callbacks, which would leave an invisible full-screen overlay and Radix's scroll lock in place.",
      "Elevation: the panel sits 4 surface steps above the current substrate (capped at 8) and re-provides that level via SurfaceProvider, so popups opened inside a dialog walk further up the ladder automatically.",
      "Three widths \u2014 sm 400, lg 540, xl 880 \u2014 each one notch narrower in compact regions (360/480/800); width only, the padding stays put. `xl` is the canvas for composed layouts (sidebar beside a panel), usually with `p-0` and a fixed height.",
      "`position=\"top\"` anchors the panel 12dvh from the top instead of centering, so a panel whose height follows its content (a command menu) keeps its top edge still.",
      "`container` retargets the portal and switches overlay + panel from `fixed` to `absolute`, scoping the dialog to a positioned, overflow-hidden region \u2014 usually paired with `modal={false}` (e.g. a docs preview).",
      "`showCloseButton` (default true) renders the corner \u2715 as a ghost icon Button; drop it when the content has its own way out, e.g. a command menu that closes on Escape and on a pick.",
    ],
    usage: `import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open dialog</Button>} />
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Create teamspace</DialogTitle>
      <DialogDescription>Add a new teamspace to organize your projects.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    props: [
      "open: boolean. Controlled open state.",
      "defaultOpen: boolean (default false). Initial open state.",
      "onOpenChange: (open: boolean) => void. Called when the dialog opens or closes.",
      "modal: boolean (default true). Traps focus and locks page scroll while open.",
      'DialogContent size: "sm" | "lg" | "xl" (default "sm"). Width 400, 540, or 880; xl is a canvas for layouts.',
      "DialogContent container: HTMLElement | null. Portal target; scopes overlay and panel to a positioned container.",
      "DialogTrigger / DialogClose render: ReactElement. The element that becomes the control, e.g. a Button.",
      "DialogTrigger / DialogClose asChild: boolean (default false). Compose onto the single child instead of render.",
    ],
    flavorNote: "Radix and Base UI flavors share the same API. DialogTrigger and DialogClose accept either render={<Button />} or asChild with a single child in both flavors.",
  },
  "dropdown": {
    craft: [
      "Two forms with different semantics: the inline always-rendered panel is a plain `role=\"group\"` (name it with `aria-label`) \u2014 real `role=\"menu\"` lives only on the popup DropdownContent, so a hand-rolled trigger around the inline panel never announces a falsely popup menu.",
      "The popup enters/exits on the fast tier (0.08s spring in, 0.06s tween out) with opacity + `scaleY 0.96` + a 4px slide; origin and slide direction follow the RESOLVED side after collision flipping via `popupMotionClass`, so a popup that flips above its anchor grows upward from its bottom edge.",
      "Keyboard navigation inside the popup moves the hover background only \u2014 no ring: \"in a menu the highlighted row is the focus indicator\". The inline panel, by contrast, draws an animated focus ring on `:focus-visible`.",
      "The selected background is a separate overlay that springs between rows on the moderate tier (0.16s) with an 0.08s opacity tween, and the fluid hover highlight starts `from` the checked rect so hover appears to grow out of the selection.",
      "`checkedIndices` flips rows to checkbox items that keep the menu open on toggle (Radix's close-on-select is suppressed by preventing the select event \u2014 Base UI `closeOnClick={false}` parity), and contiguous checked rows share one merged background that merges/splits as picks bridge or break a run.",
      "Opens ready to act: two rAFs after the primitive's own open autofocus, focus lands on the first enabled row \u2014 unless a DropdownSearch is mounted, which takes focus itself so a searchable menu opens ready to type.",
      "DropdownSearch: typing while a row is focused is redirected into the field (capture-phase keydown refocuses and appends the character; Backspace too; Space is left alone because on a row it activates). While the field has focus the first row carries the hover background \u2014 what Enter will pick \u2014 recomputed as the query re-filters; \u2193/\u2191 jump to first/last row, Enter clicks the first row.",
      "The search field is sticky at the popup's top, bleeding into the 4px padding so its divider runs edge to edge and rows scroll underneath; the popup drops its scroll fade while a field is pinned there. The query resets on close (`clearOnClose` default true) so the menu reopens unfiltered.",
      "The popup opts out of the global pill/rounded shape and keeps the smaller \"rounded\" radii: heavy pill bubbling distorts perceived padding at this scale and produces corner-shadow asymmetry. Elevation is substrate + 2 with the shadow pinned to level 3, so a dropdown reads the same shadow on the page or inside a dialog. Width: min-w tracks the trigger, max-h is min(480px, available height).",
    ],
    usage: `import { DropdownMenu, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { Button } from "@/components/ui/button";
import { Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const items = [{ icon: Clock, label: "Recents" }, { icon: Star, label: "Favorites" }, { icon: Users, label: "Shared" }];
const [view, setView] = useState(0);

<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Open menu</Button>} />
  <DropdownContent checkedIndex={view}>
    {items.map((item, i) => (
      <MenuItem key={item.label} index={i} icon={item.icon} label={item.label} checked={view === i} onSelect={() => setView(i)} />
    ))}
  </DropdownContent>
</DropdownMenu>`,
    props: [
      "DropdownMenu open: boolean. Controlled open state; defaultOpen and onOpenChange also available.",
      "DropdownTrigger render: ReactElement. The element that becomes the trigger, e.g. a Button.",
      "DropdownContent checkedIndex: number. The checked row; drives the selected background and radio value.",
      "DropdownContent checkedIndices: number[]. Checked rows become checkboxes that keep the menu open; touching picks share one background.",
      'DropdownContent side: "top" | "bottom" | "left" | "right" (default "bottom"). Side of the trigger the popup prefers.',
      'DropdownContent align: "start" | "center" | "end" (default "start"). Alignment against the trigger.',
      "MenuItem icon: IconComponent. Leading icon.",
      "MenuItem label: string. Row text.",
      "MenuItem index: number. Position in the list.",
      "MenuItem checked: boolean (default false). Set it, even to false, for a radio or checkbox row; leave undefined for a plain action.",
    ],
    flavorNote: "Radix and Base UI flavors share the same API. Dropdown (inline panel without a trigger), DropdownLabel, DropdownSeparator, DropdownSearch and DropdownEmpty export from the same file; MenuItem installs alongside at @/components/ui/menu-item.",
  },
  "input-copy": {
    craft: [
      "Icon swap is a wait-mode crossfade: the copy icon exits at scale 0.8, the check (or error \u00d7) enters at scale 0.6\u21921 on spring.fast, and the check/\u00d7 glyph then draws itself with a pathLength 0\u21921 stroke animation in 0.08s easeOut.",
      "Success and error glyphs are keyed by a copy counter (`check-${copyCount}`), so clicking Copy again while already in the \"copied\" state replays the draw animation instead of doing nothing.",
      "Status resets to idle after exactly 2000ms; \"copied\" and \"error\" deliberately occupy the same animation slot on the button.",
      "Tooltip choreography (icon variant): tooltip visibility is captured on pointerdown \u2014 before Radix closes it on press \u2014 and after copying the tooltip is force-opened as \"Copied\" only if it was already showing; otherwise it's suppressed. Leaving the row suppresses it, re-entering re-arms normal 500ms-delay behavior.",
      "Button variant renders an invisible \"Copied\" layer in the same grid cell behind Copy/Copied/Failed, so the label swap never shifts the row's width.",
      "The entire row is one `<button>`; hovering it highlights the mono value with a `<mark>` tinted #6B97FF/20 and thickens icon strokes 1.5\u21922 over 80ms, making the whole value read as the click target.",
      "Accessible name reflects state (\"Copied\" / \"Copy failed\" / \"Copy\"), and when a field label exists `aria-labelledby` chains button-then-label so screen readers hear \"Copy <label>\".",
    ],
    usage: `import { InputCopy } from "@/components/ui/input-copy";

<InputCopy
  label="Install command"
  value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
  onCopy={() => console.log("copied")}
/>`,
    props: [
      "value: string. The text to display and copy to the clipboard.",
      "label: string. Optional label displayed above the input.",
      'variant: "icon" | "button" (default "icon"). Icon-only with tooltip, or a button with a visible label.',
      'align: "right" | "left" (default "right"). Position of the copy action relative to the value.',
      "onCopy: () => void. Fires after the value is successfully copied.",
      "disabled: boolean (default false). Disables the input and the copy button.",
    ],
  },
  "input-group": {
    craft: [
      "A field lights up when it is the hover-nearest item OR focused (`labelActive = isActive || isFocused`): its leading icon shifts muted\u2192foreground and stroke-width 1.5\u21922 over 80ms.",
      "State chrome is a precedence ladder: disabled \u2192 transparent/ring-border; error \u2192 destructive-tinted bg (bg-destructive-light/60 on hover-active) and ring-destructive/50; focused \u2192 bg-card + ring-border; hover-active \u2192 bg-muted/50; rest \u2192 fully transparent with invisible ring.",
      "The label sits one notch tighter (pl-2.5, compact pl-2) than the ladder's control padding because \"the field ring is invisible at rest, so the roomier inset reads as a gap\".",
      "The label stacks an invisible semibold layer under the visible one in one grid cell, reserving the bold width so weight changes never shift layout.",
      "Mousedown anywhere on the input container (icon, padding) focuses the input \u2014 preserving the old one-big-label behavior \u2014 while clicks on the input itself are left alone so caret placement isn't disturbed.",
      "The input container uses a fixed ladder control height (rather than py-2 around the line box) so the field sits exactly on the 36px / 28px size steps.",
      "Base UI Field wires the a11y plumbing: label htmlFor, error id landing in aria-describedby, `invalid` driving aria-invalid; `Field.Error match` pins the message visible while the controlled `error` prop stands, and `labelHidden` renders sr-only so inline fields keep their accessible name.",
    ],
    usage: `import { useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputField } from "@/components/ui/input-group";

const [value, setValue] = useState("");

<InputGroup>
  <InputField index={0} label="Search" placeholder="Search teamspaces..."
    icon={Search} value={value} onChange={setValue} />
</InputGroup>`,
    props: [
      "InputGroup children: ReactNode. One or more InputField children.",
      "index: number. Position of the field within the group (required for fluid hover).",
      "label: string. Label text above the input.",
      "labelHidden: boolean (default false). Keep the label for assistive tech but do not render it.",
      "value: string. Controlled input value.",
      "onChange: (value: string) => void. Called when the value changes.",
      "placeholder: string. Placeholder text.",
      "icon: IconComponent. Leading icon inside the input.",
      "error: string. Error message shown below the input.",
      "disabled: boolean (default false). Disables the input.",
    ],
  },
  "input-message": {
    craft: [
      "Auto-resize clamps the textarea between minRows and maxRows \u00d7 the parsed line-height (cached per element to avoid getComputedStyle on every keystroke); overflow-y only turns on past maxRows. A width-gated ResizeObserver re-runs the measure because a near-zero-width mount wraps the placeholder into many lines and pins the height at maxRows.",
      "Enter sends, Shift+Enter newlines, and IME composition keydowns are ignored (`e.nativeEvent.isComposing`) so committing Japanese/Chinese input never fires a send.",
      "The composer's edge is the box-shadow's 1px hairline ring recolored in place \u2014 drag-over #6B97FF > focus (20% foreground) > hover (border) \u2014 so state changes bump contrast \"without ever appearing to thicken\" the stroke; the 0 1px 1px drop layer is kept so the lift never flickers. Applied inline because Tailwind shadow utilities mangle multi-layer arbitrary values.",
      "File drop only reacts to drags whose dataTransfer types include \"Files\" (text/HTML drags don't trigger), sets dropEffect \"copy\", swaps the placeholder to \"Drop files here to add to chat\", and ignores dragLeave into children; drops are filtered by accept and deduped by a name+size+lastModified fingerprint.",
      "The three collapsible regions (attachments, queue, suggestions) spring to a self-measured PIXEL height, never `height:\"auto\"`, because framer resolves auto from the element's visual (transformed) size \u2014 under a scaled ancestor the region would balloon to scale\u00d7 and snap back. The suggestions region exits height-only (no opacity fade) because a simultaneous fade \"read as a height glitch\".",
      "Send button morphs by state: Stop (streaming + empty draft) \u21c4 arrow-up; Send and Queue intentionally share the arrow glyph so only the Stop\u21c4arrow swap animates. While streaming, a submit enqueues the draft (text + attached files snapshot) instead of sending; on the streaming\u2192idle edge the queue head auto-dispatches through onSend with meta.queuedId, and an sr-only aria-live=\"polite\" region announces \"Message sent. N still queued.\".",
      "Queued rows are fully keyboard-operable: Enter/F2 edits the row back into the composer, Delete/Backspace removes, Alt+\u2191/\u2193 reorders (drag via Reorder also works); the \u00d7 is hover-revealed on pointer devices but persistent on touch, detected via `(hover: none)`.",
      "History recall is readline-style: plain ArrowUp only when the caret is on the first line, ArrowDown on the last, so multi-line editing still works; the in-progress draft is stashed and restored when walking past the newest entry, and real typing exits history mode.",
      "The placeholder suggestion is a real overlay, not the native placeholder, so a Tab keycap can render inline after the text; its typography mirrors the textarea's step exactly \"so it sits where typed text will\", long suggestions truncate on one flex line so the chip is never cut, and an sr-only hint joins the textarea's aria-describedby. Tab fills without sending; Shift+Tab still moves focus back.",
      "Suggestions are a listbox that never steals focus: \u2193 enters/descends, \u2191 walks back up and out, Enter or click fills the composer; the highlighted row is tracked via aria-activedescendant and shares the same sliding fluid-hover overlay as the pointer. While nothing is highlighted the first row shows a \u2193 keycap hint in the slot where the active row shows \u21b5.",
    ],
    usage: `import { useState } from "react";
import { InputMessage } from "@/components/ui/input-message";

const [value, setValue] = useState("");

<div className="w-full max-w-xl">
  <InputMessage
    value={value}
    onValueChange={setValue}
    onSend={(text) => console.log("send:", text)}
  />
</div>`,
    props: [
      "value: string. Controlled textarea value.",
      "onValueChange: (value: string) => void. Called on every textarea change.",
      "onSend: (value: string, files: File[]) => void. Fires on Enter (without Shift) or send click, skipped when empty.",
      'placeholder: string (default "Ask me anything…"). Placeholder shown while the value is empty.',
      'size: "default" | "compact" (default from SizeProvider). Step on the size ladder.',
      "leftSlot / rightSlot: ReactNode | (ctx) => ReactNode. Content in the bottom action areas; render-fn receives { openFilePicker, files }.",
      "files / onFilesChange: File[] / (files: File[]) => void. Controlled attachments; enables drag-and-drop and the file picker.",
      'status: "idle" | "streaming". While streaming, the send button becomes Stop (empty draft) or Queue (non-empty draft).',
      "suggestions: string[]. Suggested prompts listed under the action bar while the draft is empty.",
      "disabled: boolean (default false). Disables the textarea, send button, and drag-and-drop.",
    ],
  },
  "radio-group": {
    craft: [
      "The selected-row background is one shared motion.div that springs (spring.moderate, 0.16s critically damped) from the old row to the new one instead of fading out/in per row.",
      "The dot pops in with spring.fast from scale 0.3 / opacity 0 and exits shrinking over 0.04s; items selected at mount skip the entrance entirely.",
      "When selected, the circle's 1.5px border turns transparent \u2014 the dot alone marks the state; hover darkens the border from `border` to neutral-400 (neutral-500 dark) over 80ms. The circle is 16px (14px compact) with an 8px (7px) dot.",
      "The label animates 'wght' 400 \u2192 550 and muted \u2192 foreground over 80ms when selected or hovered; an invisible semibold sizer span reserves the width, both stacked spans carrying the text-box trim so their boxes stay identical, and rows are fixed-height so the trim doesn't shrink the row.",
      "Arrow keys (all four) move focus AND select in one step, wrapping at the ends; Home/End jump-and-select. The item query scopes to row wrappers because the hidden primitive also carries role=\"radio\" and a bare selector would match twice per row.",
      "Roving tabindex: the selected item is the tab stop, and with no selection the first item takes it \"or the whole group becomes unreachable by keyboard\".",
      "The animated focus ring is a single rect that springs (spring.fast) between rows at a \u22122px inset, only on :focus-visible; a `value`-controlled group still wraps the Radix primitive even without onValueChange because the hidden per-item inputs need its context.",
    ],
    usage: `import { useState } from "react";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";

const options = ["Option A", "Option B", "Option C"];
const [selected, setSelected] = useState(0);

<RadioGroup selectedIndex={selected}>
  {options.map((label, i) => (
    <RadioItem key={label} index={i} label={label} selected={selected === i} onSelect={() => setSelected(i)} />
  ))}
</RadioGroup>`,
    props: [
      "RadioGroup selectedIndex: number. Index of the currently selected item.",
      "RadioGroup children: ReactNode. RadioItem children.",
      "index: number. Position index within the group.",
      "label: string. Text label for the item.",
      "selected: boolean. Whether this item is selected.",
      "onSelect: () => void. Called when this item is selected.",
      "value: string. Optional value forwarded to the underlying primitive for form integration.",
    ],
  },
  select: {
    craft: [
      "Selection acknowledgment: picking an item holds the popup open 300ms (`selectionAckMs`) before closing, so the checkmark drawing in and the selected background springing to the picked row are seen instead of cut off by the ~60ms close fade. Escape, outside press and trigger toggle still close immediately; Radix reports no close reason, so a close arriving within 100ms of `onValueChange` is read as selection-driven.",
      "The checkmark draws in as an SVG path (`pathLength` 0\u21921, 0.08s easeOut) and erases faster (0.04s easeIn); its slot is always rendered at fixed width so a check appearing never changes the row's intrinsic width \u2014 without it the whole popup would resize when a selection lands.",
      "The selected-background overlay keeps its position in `animate` (not `initial`) so an in-session value change springs the marker (moderate tier) from the old row to the picked one; a value change while open deliberately does NOT remeasure \u2014 the rows haven't moved, so only `checkedIndex` switches and the marker glides.",
      "Keyboard focus ring is gated: seeded from the trigger's `:focus-visible` at open and earned by nav keys (arrows/Home/End/PageUp/PageDown/Tab) inside the popup, tracked in the capture phase because the primitive moves focus during its own keydown. Pointer-driven focus never draws the ring.",
      "SelectContent renders unconditionally: while closed, Radix parks its children in a detached DocumentFragment, which the selected label portal into the trigger, closed-trigger typeahead, and the hidden native `<select>` options all depend on \u2014 never gate it behind a mounted flag.",
      "Flavor difference a user feels: the Radix flavor is modal-ish \u2014 it scroll-locks the page and disables outside pointer events while open (and its hidden viewport scrollbar is forced back with `![scrollbar-width:thin]` so long lists keep a scroll affordance); the Base UI flavor is non-modal \u2014 the page keeps scrolling and the positioner tracks the anchor.",
      "The trigger follows the global pill/rounded shape but the popup always keeps the smaller \"rounded\" radii; the popup enters on the fast tier with the side-aware `popupMotionClass`, tracks the trigger width via `--radix-select-trigger-width`, and caps at min(300px, available height).",
    ],
    usage: `import { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

const [value, setValue] = useState("");

<Select value={value} onValueChange={setValue}>
  <SelectTrigger placeholder="Select a fruit" />
  <SelectContent>
    <SelectItem index={0} value="apple">Apple</SelectItem>
    <SelectItem index={1} value="banana">Banana</SelectItem>
    <SelectItem index={2} value="cherry">Cherry</SelectItem>
  </SelectContent>
</Select>`,
    props: [
      "value: string. Controlled selected value.",
      "defaultValue: string. Uncontrolled default value.",
      "onValueChange: (value: string) => void. Called when the selected value changes.",
      "disabled: boolean (default false). Disables the entire select.",
      "name: string. Name for form submission.",
      'SelectTrigger variant: "bordered" | "borderless" (default "bordered"). Visual style of the trigger.',
      'SelectTrigger placeholder: string (default "Select…"). Text shown when no value is selected.',
      "SelectTrigger icon: IconComponent. Optional icon before the value.",
      "SelectTrigger error: string. Error message shown below the trigger.",
      "SelectItem index: number. Position within the content, required for fluid hover. SelectItem also takes value, icon, disabled.",
    ],
  },
  sidebar: {
    craft: [
      "The rail handle does three things: drag to resize clamped 160\u2013360px; drag \u226556px past the minimum (SIDEBAR_COLLAPSE_SLOP) to preview collapse \u2014 \"the same 'throw it at the edge to dismiss' affordance native apps use\" \u2014 with drag-back past the threshold re-expanding, nothing committed until release; and a press that never moves \u22654px is the collapse click.",
      "Toggle shortcut is a bare `[` (left side) / `]` (right side) \u2014 bare \"so the browser's history shortcuts stay untouched\" (\u2318[/\u2318] skipped when a modifier is held), skipped while typing, and focus-scoped: only one mounted provider answers a keypress \u2014 the innermost provider containing focus, else the outermost mounted one.",
      "Peek: the collapsed edge is a 12px (`w-3`) strip whose hairline brightens on hover; hover mode arms the peek after a 150ms intent delay and dismisses after 250ms, with ONE shared timer serving the strip, the collapsed trigger, and the peeked card so crossing between them cancels a pending dismissal; Escape or an outside press dismisses, and peeking never pins the sidebar or writes the cookie.",
      "Hover-peek dismissal uses geometric containment of the pointer, not enter/leave events, because a portalled tooltip or menu covering the card steals the hit-test and fires pointerleave even though the cursor never left the sidebar.",
      "Motion tiers: open/close ride `spring.slow` (\"a whole column moving is the largest thing this component animates\"; the sheet and peek stay on moderate), drag-resize is glued duration-0 tracking, mid-drag collapse/re-expand flips ride `spring.moderate`, and reduced motion snaps instead of sliding.",
      "Desktop open state persists to a `sidebar_state` cookie for 7 days (`persist` prop; read it in a server layout to restore the last visit); the mobile drawer state never persists, and below 768px the sidebar becomes a modal drawer \u2014 crossing the breakpoint DISSOLVES the desktop rail (opacity fade with display allow-discrete) instead of snapping it away.",
      "SidebarMenuSub collapses on the content's measured `offsetHeight`, \"never to 'auto', which framer measures wrong under a scaled ancestor\", and springs only when that sub itself toggles \u2014 a height change from a nested sub collapsing inside it snaps, so the wrapper never chases with a stacked second spring.",
      "One highlight scope per SidebarMenu tree: hover/active/focus overlays glide between all visible rows, sub-rows included; hit-testing measures the row's BUTTON, not the `<li>` (an expanded sub-tree would otherwise hand its gaps to the parent row), and overlay height is clamped to the button box with a 48px fallback.",
      "Active backgrounds are keyed per level so the selection GLIDES when it moves instead of remounting; a rect change on the SAME row (reflow from a sibling collapsing) snaps rather than springing, and hover tracking freezes across every scope while any sidebar-anchored popup is open.",
      "There is deliberately no icon-rail collapsed mode (`collapsible` is only \"offcanvas\" | \"none\"): the docs argue icon rails make \"every destination take a hover, a beat, a tooltip\" and section labels collapse to a divider \u2014 collapsed means gone, and `peek=\"hover\"` floats the REAL sidebar, labels and all, instead.",
    ],
    usage: `import { Home, Inbox } from "lucide-react";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarInset, SidebarTrigger,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";

<SidebarProvider defaultOpen>
  <Sidebar side="left" variant="sidebar">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton icon={Home} isActive>Home</SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton icon={Inbox}>Inbox</SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset><SidebarTrigger />{/* page content */}</SidebarInset>
</SidebarProvider>`,
    props: [
      "SidebarProvider open / onOpenChange: boolean / (open: boolean) => void. Controlled open state.",
      "SidebarProvider defaultOpen: boolean (default true). Uncontrolled initial state; read the sidebar_state cookie in a server layout to restore it.",
      "SidebarProvider persist: boolean (default true). Write the desktop state to the sidebar_state cookie.",
      'SidebarProvider peek: "none" | "hover" | "click" (default "none"). Collapsed edge strip reveals the sidebar as a floating overlay.',
      'SidebarProvider shortcut: string | null (default "[" left, "]" right). Bare-key toggle; null disables.',
      "SidebarProvider mobileBreakpoint: number (default 768). Width below which the sidebar becomes a modal drawer.",
      'SidebarProvider width / widthMobile: string (default "16rem" / "18rem"). Rail and drawer widths.',
      'Sidebar side: "left" | "right" (default "left"). Which edge the rail lives on.',
      'Sidebar variant: "sidebar" | "floating" | "inset" (default "sidebar"). Transparent rail, floating card, or inset pairing where SidebarInset becomes the card.',
      'Sidebar collapsible: "offcanvas" | "none" (default "offcanvas"). Offcanvas slides away; none is a static column. Also: rail (boolean, default true) for the drag-resize handle, bordered (boolean, default true).',
    ],
    flavorNote:
      "Both flavors install sidebar.tsx plus sidebar-core.tsx and sidebar-menu.tsx; import everything from @/components/ui/sidebar. SidebarMenuButton accepts render={<Link href=... />} (Base UI) or asChild (Radix) for custom elements.",
  },
  slider: {
    craft: [
      "One component, two ladder steps: default size renders the pips/scrubber design, compact the dense one; any compact-only prop (array value, `steps`, `showSteps`, `showValue`, `valuePosition`, track/fill styling, thumb colors) forces the compact engine regardless of size \"so no capability is ever lost\".",
      "Compact thumb snaps to the step grid continuously during drag (pixel \u2192 snapped value \u2192 pixel on every move); a track click spring-animates the thumb to the snapped position (`spring.moderate`), and release spring-settles to the final quantized position.",
      "The value label is click-to-edit: clicking swaps in a number input, auto-selected; Enter/blur commits (clamped to min/max then snapped to step or nearest `steps` entry), Escape cancels; an invisible ghost of the widest possible value reserves width so nothing shifts.",
      "Hovering the track previews the change: a 40%-accent bar runs from the nearest thumb center to the snapped hover value (extended to the track edge at min/max \"so there's no gap\", rounded only on its leading edge), plus a tooltip that appears after a 100ms delay and hides while pressed.",
      "The value display shifts normal \u2192 medium weight while hovering/pressing (fontVariationSettings, 100ms transition) with tabular-nums, so interaction is signalled without layout shift.",
      "Range mode: pointer-down grabs the nearest thumb, and thumbs can't cross \u2014 each is clamped half a thumb-width (10px of the 20px thumb) from the other.",
      "Step dots are masked out on the filled side of the track with a 2px feather (a moving linear-gradient mask driven by the thumb's motion value) and grow 1.25x on hover; an invisible Radix slider supplies ARIA + keyboard, and non-uniform `steps` runs it on indices so arrow keys walk the list, with `aria-valuetext` reporting the formatted value.",
      "Comfortable (default-size) designs use a 2px handle line that grows 2px taller (inset 8 \u2192 7) and darkens 25% \u2192 50% \u2192 100% foreground across rest/hover/focus; at min a zeroOffset (8px pips, 17px scrubber) keeps the line visible; scrubber drag sets fill directly (glued, no spring) while pips springs per snap; both add an 8px-beyond-each-edge hit area.",
    ],
    usage: `import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const [value, setValue] = useState(25);

<Slider label="Volume" value={value} onChange={(v) => setValue(v as number)} min={0} max={100} />

// Dense design: pass size="compact"
<Slider size="compact" value={value} onChange={(v) => setValue(v as number)} />`,
    props: [
      "value: number | [number, number]. Current value; an array enables range mode with two thumbs.",
      "onChange: (value: SliderValue) => void. Called on drag, click, or keyboard change.",
      'size: "default" | "compact" (default from SizeProvider). Default renders the pip/scrubber design, compact the dense design.',
      'variant: "pips" | "scrubber" (default "pips"). Default-step layout; ignored when compact renders.',
      "min: number (default 0). Minimum value.",
      "max: number (default 100). Maximum value.",
      "step: number (default 1). Step increment the thumb snaps to.",
      "steps: number[]. Discrete allowed values; min/max derive from the list and step is ignored.",
      'valuePosition: "left" | "right" | "top" | "bottom" | "tooltip" (default "left"). Where the value label renders; showValue (default true) toggles it.',
      "label: string. Accessible label, also shown as a prefix in the value display. formatValue: (v: number) => string customizes the label.",
    ],
  },
  "switch": {
    craft: [
      "The thumb is draggable, not just clickable: pointer capture + a 2px dead zone distinguishes drag from click, the thumb tracks the pointer clamped to the track, and release toggles when past the track midpoint or springs back otherwise.",
      "After a drag, a `didDrag` flag suppresses the click/onCheckedChange that follows the same pointer-up (cleared next animation frame) so a drag never double-toggles; a system-cancelled gesture snaps back without toggling.",
      "Hover extends the thumb into a pill (+2px width); press extends it further (+4px) and squashes it (\u22124px height, recentred). These extents scale down for compact (+3/\u22123) \"so the compact switch keeps the same feel\".",
      "When checked, the extra press/hover width grows leftward (thumbX subtracts extraWidth) so the thumb's outer edge stays pinned to the track end.",
      "All thumb motion rides spring.moderate (0.16s, critically damped); initial mount sets position with duration 0 so a pre-checked switch never animates on load.",
      "Track colors: checked #6B97FF darkening to #5C89F2 on hover; unchecked uses `--accent`, hovered mixing in 10% overlay via color-mix in oklab. Geometry per ladder step: 34\u00d720 track / 16px thumb default, 28\u00d716 / 12px compact, constant 2px inset.",
      "Hover state is only set for mouse pointers (pointerType check), so touch never leaves the switch stuck in its pill-extended hover shape.",
      "The whole row is the pointer target (touch-none stops scroll fighting the drag); the label shifts muted-foreground \u2192 foreground over 80ms when on, with text-box trim recentering letterforms against the taller track without changing layout.",
    ],
    usage: `import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const [checked, setChecked] = useState(false);

<Switch
  label="Notifications"
  checked={checked}
  onToggle={() => setChecked((prev) => !prev)}
/>`,
    props: [
      "label: string. Text label displayed next to the switch.",
      "checked: boolean. Whether the switch is on.",
      "onToggle: () => void. Called when the switch is toggled.",
      "disabled: boolean (default false). Disables the switch.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the switch to one step of the size ladder.",
    ],
  },
  "table": {
    craft: [
      "Row hover is the shared fluid-hover highlight drawn once behind the whole `<table>`; body rows opt in by passing `index`, header rows omit it.",
      "The active row's bottom border AND the border of the row above it (`index === activeIdx - 1`) go transparent while hovered, so the highlight sits on a clean pill; the header row's border hides when row 0 is active.",
      "Borders never pop: they transition border-color from `border-accent/40` to `border-transparent` with `transition-[border-color] duration-80`.",
      "Cell text lifts from `text-muted-foreground` to `text-foreground` when its row is active, via an `is-active` class on the row and `group-[.is-active]/row:text-foreground` on cells, over the same `duration-80`.",
      "Header rows render semibold and body rows normal through `fontVariationSettings` (variable-font axis, not a font-weight class).",
      "Rows sit on the size ladder \u2014 36px default, 28px compact \u2014 via cell padding (`px-3 py-2` vs `px-2.5 py-[5px]`); the comment states \"py + line box lands the row on the ladder (36px / 28px)\".",
      "A `size` prop pins every cell to one ladder step by wrapping the table in a SizeProvider (\"cells read the context\"); omitted, cells follow the surrounding provider.",
    ],
    usage: `import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow index={0}>
      <TableCell>Alice</TableCell>
      <TableCell>Engineer</TableCell>
    </TableRow>
    <TableRow index={1}>
      <TableCell>Bob</TableCell>
      <TableCell>Designer</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    props: [
      "children: ReactNode. TableHeader and TableBody children.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the rows to one step of the size ladder.",
      "TableRow.index: number. Row index for fluid hover; omit for header rows.",
      "TableRow.children: ReactNode. TableCell or TableHead children.",
    ],
  },
  "tabs": {
    craft: [
      "The active pill travels between tabs on `spring.moderate`; clicking sets an optimistic selected index so the indicator jumps immediately instead of waiting for controlled state to round-trip \u2014 the item's onClick is composed, not spread-overridable, so a consumer onClick can't break this.",
      "The hover pill is born AT the selected pill (initial = selectedRect, opacity 0) and springs to the hovered tab at opacity 0.4 on `spring.fast`; when the mouse exits the list it travels back to the selected pill while fading out (spring.moderate, 60ms opacity) rather than just disappearing.",
      "While a non-selected tab is hovered, the active pill dims to opacity 0.85 (0.08s), signalling the split attention.",
      "The active pill's surface level is `min(substrate + 3, 8)` \u2014 \"1 above the muted track + 2 for pop\": surface 4 on the page, but 8 inside a dialog (substrate 5) instead of colliding at 4.",
      "Labels change weight without layout shift: two stacked grid spans, an invisible semibold sizer plus the visible label, both carrying `[text-box:trim-both_cap_alphabetic]` so their boxes stay identical; selected = semibold, color+weight transition `duration-80`.",
      "Items use a fixed height from the size ladder instead of `py` \"so the text-box trim below doesn't shrink the tab \u2014 browsers without text-box support render identically\"; segmentPad + segmentItem sum to the ladder's 36px/28px control height so the control lines up with adjacent buttons/selects/inputs.",
      "Icons animate strokeWidth 1.5 \u2192 2 and muted \u2192 foreground color when the tab is hovered or selected (`transition-[color,stroke-width] duration-80`).",
      "Keyboard focus draws a springing 2px-outset focus ring rect only on `:focus-visible`, and focus also drives the hover highlight; blur clears the highlight only if the mouse isn't inside the list.",
    ],
    usage: `import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs";

<Tabs defaultValue="library">
  <TabsList>
    <TabItem value="library" label="Library" />
    <TabItem value="recents" label="Recents" />
    <TabItem value="favorites" label="Favorites" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`,
    props: [
      "value: string. Controlled active tab value. Takes precedence over selectedIndex.",
      "onValueChange: (value: string) => void. Called when the active tab changes.",
      "defaultValue: string. Default active tab for uncontrolled usage.",
      "selectedIndex: number. Index-based controlled alternative.",
      "onSelect: (index: number) => void. Called with the new index when the active tab changes.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the segmented control to one step of the size ladder.",
      "TabItem.value: string. Unique value identifying this tab.",
      "TabItem.label: string. Text label for the tab.",
      "TabItem.icon: IconComponent. Optional leading icon.",
      "TabPanel.value: string. Must match a TabItem value; content renders when that tab is active.",
    ],
  },
  "tabs-subtle": {
    craft: [
      "Same pill choreography as Tabs: the hover pill starts at the selected pill (opacity 0), springs to the hovered tab at opacity 0.4 (`spring.fast`), and on mouse exit travels back to the selected pill while fading (spring.moderate, 60ms opacity); the selected pill dims to 0.8 while another tab is hovered.",
      "`activeLabel` mode collapses every non-selected tab to its icon; the label expands/collapses by animating width to a MEASURED `offsetWidth`, never `\"auto\"` \u2014 framer resolves an \"auto\" target from the element's visual (transformed) size, so under a scaled ancestor the spring overshoots and snaps.",
      "Until the first measurement lands, width stays plain CSS `auto` instead of handing framer \"auto\": under the /demo card's ~1.76x scale framer would write back a too-wide width and spring back down, making the selected tab visibly pulse on arrival.",
      "The expanding label animates `marginLeft` to 8px (6px compact) so the icon-to-label gap matches the ladder's gap-2/gap-1.5.",
      "Each tab button gets its own ResizeObserver so pill rects re-measure when a label expands/collapses in activeLabel mode; a collapsed tab keeps its name for AT via `aria-label`.",
      "The list wears `-mx-1 px-1 / -my-1 py-1` so the 2px-outset focus ring can draw inside `overflow-x-auto` without clipping, and `max-w-[calc(100%_+_8px)]` because fit-content parents size against the margin box \u2014 a plain max-w-full would clamp the list 8px too small and clip the first/last tab's ring.",
      "Activation is manual (`activationMode=\"manual\"`): arrows move focus, Enter/Space selects; Radix owns role=\"tablist\", roving tabindex, and Arrow/Home/End.",
    ],
    usage: `import { useState } from "react";
import { TabsSubtle, TabsSubtleItem, TabsSubtlePanel } from "@/components/ui/tabs-subtle";

const tabs = ["Teamspaces", "Recents", "Favorites"];
const [selected, setSelected] = useState(0);

<TabsSubtle idPrefix="demo" selectedIndex={selected} onSelect={setSelected}>
  {tabs.map((label, i) => (
    <TabsSubtleItem key={label} index={i} label={label} />
  ))}
</TabsSubtle>
{tabs.map((label, i) => (
  <TabsSubtlePanel key={label} index={i} selectedIndex={selected} idPrefix="demo">
    <p>{label} content</p>
  </TabsSubtlePanel>
))}`,
    props: [
      "selectedIndex: number. Index of the currently selected tab.",
      "onSelect: (index: number) => void. Called when a tab is selected.",
      "idPrefix: string. Prefix for ARIA IDs linking tabs to panels.",
      "activeLabel: boolean (default false). Only the selected tab shows its text label. Requires icons on tabs.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the tabs to one step of the size ladder.",
      "TabsSubtleItem.index: number. Position index within the tab list.",
      "TabsSubtleItem.label: string. Text label for the tab.",
      "TabsSubtleItem.icon: IconComponent. Icon displayed in the tab.",
      "TabsSubtlePanel.index: number. Index of this panel; rendered only when it matches selectedIndex.",
      "TabsSubtlePanel.idPrefix: string. Must match the TabsSubtle idPrefix.",
    ],
  },
  "thinking-indicator": {
    craft: [
      "The glyph is one SVG path morphing circle \u2192 infinity \u2192 reversed circle \u2192 infinity \u2192 circle in equal quarters (`times: [0,.25,.5,.75, 1]`) over 6s easeInOut, repeating forever; the two circle paths trace opposite winding directions so the loop keeps flowing.",
      "The label cycles \"Thinking / Moonwalking / Planning / Refining\" every 4000ms; the incoming word slides up from y 80% (0.24s), the outgoing word exits to y -80% slightly faster (0.16s), both on cubic-bezier(0.4, 0, 0.2, 1) with popLayout so they overlap.",
      "An invisible copy of the longest word sits in the same grid cell to reserve width, so the word cycle never shifts layout.",
      "The shimmer is a shared `.shimmer-text` utility: transparent text over a 300%-wide gradient clipped to the glyphs, animating background-position 0\u2192100%; colors are `light-dark()` pairs so the sweep inverts correctly per theme.",
      "Screen readers hear one static sr-only \"Thinking\u2026\" under role=\"status\"; the cycling display is aria-hidden so it doesn't re-announce every 4 seconds.",
      "Reduced motion drops both the infinite morph and the word cycling \u2014 a static infinity glyph and the first word \"carry the same meaning without the movement\".",
    ],
    usage: `import { ThinkingIndicator } from "@/components/ui/thinking-indicator";

<ThinkingIndicator />

// Text only, inline before a streamed reply
<ThinkingIndicator showIcon={false} />`,
    props: [
      "showIcon: boolean (default true). Show the morphing circle to infinity glyph before the label. Set false for a text-only indicator.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Step on the size ladder. Wins over the surrounding SizeProvider.",
    ],
  },
  "thinking-steps": {
    craft: [
      "Each step enters in two phases: an outer wrapper opens height on spring.slow (to a measured pixel height, never \"auto\") while the inner content fades in after a default 0.08s delay \u2014 space opens first, then content appears. Pixel targets are used because framer resolves an \"auto\" height from the element's visual (transformed) size, so under a scaled ancestor the whole list would overshoot and snap back.",
      "Steps with `status=\"pending\"` render nothing at all; flipping them to active/complete is what streams the list in. The active step's label gets `.shimmer-text` plus an appended \"\u2026\".",
      "The header trigger stacks an invisible semibold label layer to reserve bold width, animates weight normal\u2192semibold when open, recolors muted\u2192foreground on hover/open, thickens the chevron stroke 1.5\u21922, and rotates the chevron 0\u219290\u00b0 on spring.fast.",
      "The collapse panel keeps content force-mounted: Radix/Base UI would apply `hidden` (display:none) the moment it closes, freezing the exit mid-flight, so the component applies `hidden` itself only after the framer exit completes, preserving the trigger\u2194panel aria-controls contract.",
      "A panel that is already open at mount SNAPs (duration 0) to its first measured pixel target instead of springing \u2014 the auto\u2192pixel hand-off would otherwise animate on load; later opens spring normally with `bounce: 0` because \"pure height looks better without overshoot\".",
      "Each step's icon column is a fixed 14px cell with a 1px connector line stretching from below the icon to the step's bottom; `isLast` hides the line so the rail terminates cleanly.",
      "Source badges enter with a blur(4px)\u21920 + scale 0.85\u21921 + fade on spring.moderate, staggerable via per-badge `delay` (docs use 0.05s increments); step images use the same blur-in without the scale.",
    ],
    usage: `import {
  ThinkingSteps, ThinkingStepsHeader, ThinkingStepsContent,
  ThinkingStep, ThinkingStepDetails,
} from "@/components/ui/thinking-steps";

<ThinkingSteps>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep icon="search" label="Searched the web" />
    <ThinkingStep icon="globe" label="Read 3 sources">
      <ThinkingStepDetails summary="Explored 2 files" details={["Read a.tsx", "Read b.tsx"]} />
    </ThinkingStep>
    <ThinkingStep icon="check" label="Done" isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`,
    props: [
      "defaultOpen: boolean (default true). Whether the accordion starts expanded (uncontrolled).",
      "open: boolean. Controlled open state. Use with onOpenChange.",
      "onOpenChange: (open: boolean) => void. Callback when the open state changes.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Step on the size ladder.",
      "ThinkingStepsHeader.children: ReactNode (default \"Thinking\"). Header label text.",
      "ThinkingStep.label: string. Step label text.",
      "ThinkingStep.icon: IconName (default \"dot\"). Icon name from the icon library.",
      "ThinkingStep.status: \"complete\" | \"active\" | \"pending\" (default \"complete\"). Pending steps are hidden; active steps show shimmer text.",
      "ThinkingStep.isLast: boolean (default false). Hides the connector line below this step.",
      "ThinkingStepDetails.summary / details: string / string[]. Collapsed label and the detail lines rendered inside the nested accordion.",
    ],
  },
  "tooltip": {
    craft: [
      "Enters on the fast tier (0.08s spring) with a 4px slide toward the trigger from the chosen side (top\u2192y:4, bottom\u2192y:-4, left\u2192x:4, right\u2192x:-4) and fades out on the quicker 0.06s exit tween; default `sideOffset` is 8.",
      "Hover delay defaults to 200ms; an app-level `TooltipProvider` adds skip-delay grouping (300ms window) so moving between adjacent triggers shows the next tooltip instantly. Each bare Tooltip falls back to a per-instance provider only when no ambient one exists \u2014 a per-instance provider everywhere would defeat the grouping and re-wait the full delay between neighbors.",
      "`followCursor=\"x\" | \"y\"` tracks the pointer along one axis for tall or wide triggers (the Sidebar rail) where a centered tooltip sits far from the pointer; the other axis stays anchored by `side`. The offset is a framer motion value, so per-move updates skip React re-renders; a force-opened follow tooltip rests centered until a real pointer takes over.",
      "The bubble is an inverted surface (`bg-foreground text-background`), 12px at medium weight (`fontVariationSettings`); `text-box: trim-both cap alphabetic` recenters the label, with the padding bump applied only where text-box is supported so overall height stays ~26px on untrimmed browsers.",
      "`contentClassName` exists because Radix copies the content's z-index onto its popper wrapper: pass a z utility there to lift the whole tooltip above other fixed layers (default z-50); `className` styles the bubble itself.",
      "`forceOpen` pins the tooltip open (or closed) over the hover/focus behavior \u2014 `onOpenChange` still reports the internal state before forceOpen is applied.",
    ],
    usage: `import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="Save your changes">
  <button>Hover me</button>
</Tooltip>

<Tooltip content="Right" side="right" delayDuration={0}>
  <button>Right</button>
</Tooltip>`,
    props: [
      "content: ReactNode. The content displayed inside the tooltip.",
      "children: ReactElement. The trigger element. Must accept a ref.",
      "side: \"top\" | \"right\" | \"bottom\" | \"left\" (default \"top\"). Preferred side of the trigger to render the tooltip.",
      "sideOffset: number (default 8). Distance in pixels between the tooltip and the trigger.",
      "delayDuration: number (default 200). Milliseconds to wait before showing the tooltip on hover.",
      "followCursor: \"x\" | \"y\". Track the cursor along one axis while hovering; the other axis stays anchored by side.",
      "forceOpen: boolean. True forces the tooltip open, false forces it closed, undefined uses hover and focus.",
      "onOpenChange: (open: boolean) => void. Called when the internal open state changes.",
      "className: string. Additional classes applied to the tooltip content container.",
      "contentClassName: string. Classes for the portalled element; pass a z-index utility to lift the tooltip above other fixed layers (default z-50).",
    ],
  },
  "command-menu": {
    craft: [
      "The input keeps DOM focus the whole time and points at the highlighted row through `aria-activedescendant`; there is no list primitive \u2014 the one thing a primitive would add, the modal shell, comes from the library's own Dialog. Row mousedown is `preventDefault`ed so a click never blurs the field.",
      "The highlight is the fluid hover fill and nothing else \u2014 no focus ring in the list, like the dropdown and combobox popups; the pointer moves it through useFluidHover, the keyboard through setActiveIndex, and Enter runs whatever it sits on.",
      "The panel's frame springs to its rows' measured height on the moderate tier (0.16s) \u2014 measured via `offsetHeight` (transform-immune), never `height: \"auto\"`, because framer would read the visual size under a scaled ancestor; reduced motion snaps. A max-height on the shell inherits down and the list scrolls past it.",
      "CommandMenuDialog opens centered at its cap min(440px, 76dvh) and keeps that top edge \u2014 `top-[max(12dvh,calc(50dvh-220px))]` \u2014 so the field stays put while the rows under it filter down. It closes on Escape and on a pick (`closeOnSelect`), so no \u2715 button is rendered.",
      "Keyboard scrolling is done at the moment a move is decided, not in an effect: a keyboard move keeps its row at the CENTER of the viewport (as the ends allow) and the viewport travels on the same fast spring as the highlight so row and fill move together; a query reset snaps to the top, heading included. Offsets, never `scrollIntoView`, which would also scroll the page.",
      "Arrows wrap at both ends \u2014 the list is the whole keyboard space, no field stop (unlike the combobox) \u2014 and skip disabled rows; the first enabled row is re-highlighted whenever the row set changes (detected by a NUL-joined values key, so an inline items literal doesn't reset it), so Enter always has a target as the query filters. Pointer leaving the list keeps the highlight where it was.",
      "With CommandMenuTabs mounted, \u2190 and \u2192 in the field switch tabs (wrapping) instead of moving the caret; modified presses keep their editing meaning. IME composition keys are left to the composer (including Safari's keyCode 229 commit). Escape closes the dialog shell, but inline it clears the query.",
      "Shortcut system: `\"mod+k\"` is \u2318K on a Mac, Ctrl+K elsewhere (\"mod\" matches either while listening); physical-key (`code`) fallback applies only when `key` isn't a Latin letter/digit, so Dvorak's \"t\" is never read as physical K; a bare key stays out of editable fields. Among mounted dialogs sharing a combo, an open one answers first (the press closes it), else the most recently mounted one whose `shortcutScope` holds focus.",
      "The footer's Enter hint names the highlighted row's `action` (default: its label) so it reads as the thing Enter does (\"Open Showcase\") rather than a generic \"Run\"; it sits at the trailing edge so its changing width never moves the other hints, which follow the menu (tabs add \u2190 \u2192, a dialog adds Esc).",
      "Suggested rows lead under their own heading while nothing is typed, and leave their original group so nothing is listed twice; the default filter matches every query word against label + description + keywords and never re-sorts, so rows don't move under the cursor as the query grows.",
    ],
    usage: `import {
  CommandMenu, CommandMenuInput, CommandMenuList, CommandMenuEmpty,
} from "@/components/ui/command-menu";
import { Plus, Home } from "lucide-react";

const items = [
  { value: "new-file", label: "New file", icon: Plus, group: "Actions" },
  { value: "home", label: "Home", icon: Home, group: "Go to" },
];

<CommandMenu items={items} onSelect={(item) => run(item)}>
  <CommandMenuInput placeholder="Type a command or search…" />
  <CommandMenuList>
    <CommandMenuEmpty>No results.</CommandMenuEmpty>
  </CommandMenuList>
</CommandMenu>
// Wrap in CommandMenuDialog for the ⌘K modal shell.`,
    props: [
      "items: readonly CommandMenuItemData[] (required). The actions. Keep the array stable (state, module constant, or memo): the highlight resets to the first row when it changes.",
      "onSelect: (item: CommandMenuItemData) => void. Runs when a row is picked, after the item's own onSelect.",
      "filter: (item, query) => boolean (default defaultCommandMenuFilter). Default: every query word matches label, description, or keywords.",
      "query / defaultQuery / onQueryChange. Controlled or uncontrolled query (defaultQuery defaults to an empty string).",
      "suggestions: readonly string[]. Values listed first under suggestionsLabel while nothing is typed; a suggested row leaves its own group so it is listed once.",
      "suggestionsLabel: string (default 'Suggestions'). Heading of the suggestions section.",
      "closeOnSelect: boolean (default true). Inside CommandMenuDialog: picking a row closes the dialog.",
      "size: 'default' | 'compact'. Pins field and rows to one step of the size ladder; omitted, both follow the surrounding SizeProvider.",
      "children (required): CommandMenuInput, optional CommandMenuTabs/Filters, CommandMenuList, optional CommandMenuFooter.",
    ],
  },
};
