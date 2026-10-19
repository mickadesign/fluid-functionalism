---
name: fluid-functionalism
description: >-
  Build React UIs with Fluid Functionalism — a shadcn/ui registry (@fluid) of
  animated components with a shared motion system: three spring speeds, a
  hover highlight that glides to the item nearest the cursor, labels that
  change weight without layout shift. Use whenever the user mentions Fluid
  Functionalism, @fluid, or fluidfunctionalism.com, asks for UI with
  satisfying/fluid/polished motion in a React, Next.js, shadcn, Radix, or
  Base UI project, builds any interface (settings dialogs, sidebars, command
  menus, chat UIs, forms, lists, tables) in a project with @fluid components
  installed, asks to review/audit existing UI motion against the system, or
  asks to update installed @fluid components or what changed in a release.
  Also use before hand-writing animation code (hover highlights, icon swaps,
  weight changes, enter/exit transitions) there, so custom code follows the
  system instead of inventing timings. Bundled scripts read the stack fresh
  each run (deps, flavor, MotionConfig, Inter opsz) and write nothing.
---

# Fluid Functionalism

A [shadcn/ui](https://ui.shadcn.com) registry of components where every
transition makes a state change legible: springs instead of durations, one
hover highlight per list that glides to the item nearest the cursor, and
labels that get heavier without moving their neighbours. Components that touch
a primitive ship in two flavors — Radix and Base UI — with the same API.

Docs and live demos: <https://www.fluidfunctionalism.com> — every component
page has a playground and a **Copy prompt** button whose text is a
self-contained brief (install command, usage snippet, props, docs URL).

Four jobs this skill covers:

1. **Know the project** — read the stack at the start of every run (next
   section). The read is fast and exact, so nothing is cached and nothing
   can go stale.
2. **Install and compose the components** — pick the right registry item and
   flavor, wire it in, and compose around what's already built in. The
   catalog is [references/components.md](references/components.md); the craft
   for every doc page and top-level block — the exact behaviors, values, and
   reasons baked into them — is [references/craft.md](references/craft.md).
   The catalog maps separately installable parts to the parent section that
   governs them. Reading that section before composing is what separates
   using this library from merely installing it.
3. **Write custom UI that belongs next to them** — when you build something
   the library doesn't ship, follow the motion system so it moves like the
   rest of the app. Read
   [references/custom-motion.md](references/custom-motion.md) before writing
   any animation, hover, or state-change styling by hand.
4. **Keep it current** — bring installed items up to the latest release
   without losing local work: [when asked to update](#when-asked-to-update).

## Every run: read the stack

Before installing, composing, or advising, run the stack script on the app's
directory, the one holding its `package.json` and `components.json`. That is
the current directory in most projects; in a monorepo, pass it:

```bash
node <skill>/scripts/stack.mjs [apps/web]
```

It needs only Node, finishes in under a second, and writes nothing. It reads
the dependencies FF needs (React 19, Tailwind v4, motion, shadcn
wiring), settles the flavor verdict, checks the two silent quality killers
(`MotionConfig reducedMotion="user"` around the app, Inter without the `opsz`
axis), and lists which FF pieces are installed and which same-named files are
stock or local. Every line cites the `file:line` it came from. Without Node,
read the same files by hand:
[what to check](references/stack-audit.md#what-to-check).

**Facts are read, never remembered.** Every stack fact can be read again
faster than a cached copy can be verified, and a cached verdict that drifts
from the code misleads every session after it. The flavor verdict stays
stable without a record because it is derived the same way each time:
installed FF components first, then `package.json`. So don't write audit
results into the project; they go in your reply.

**Decisions are the exception.** The code cannot show what the user decided:
fluid hover declined, a stillness or an off-token duration kept on purpose.
The script's `DECISIONS` line points at where earlier ones live, from the
app's directory up to the repository root. Read them,
honor them, and never re-raise what they settle. Recording a new one is
opt-in and goes where the project already keeps intent; see
[decisions](references/stack-audit.md#decisions). If the script reports a
legacy audit file from an earlier version of this skill, honor its decisions
and ignore its facts
([earlier audit files](references/stack-audit.md#earlier-audit-files)).

Before every install, verify the target's current files and diff any
same-named file; only pass `--overwrite` when that check shows the targets
are still stock.

## When asked to audit or advise

Run the full audit in [references/stack-audit.md](references/stack-audit.md):
on top of the stack read, it picks the 2–5 UI upgrades that would help
most. Systems come first (motion tokens, fluid hover, surfaces, sizes), then
components, each rated impact / effort and ranked by impact-per-effort. UI
and design system only: infrastructure findings are stated as facts, never
pitched as recommendations. Three rules decide how those land, and they are
what separates advice from a lint report:

- **Write each one from the interface**, not from the code that causes it:
  what someone using the product sees now, on which surface, how often they
  are looking at it, and which quality it buys back. The file and the size
  of the fix are the footnote, never the headline.
- **A behavior the app has never had is a question, not a finding.** Fixing
  something the product already does badly is advice you give; introducing a
  new signature motion — fluid hover above all — changes how the whole thing
  feels, so ask before spending a slot on it. Stillness is often deliberate.
- **A blocked install is never a gate on the outcome.** Old Tailwind or React
  blocks the CLI, not the product getting better; every item is reachable by
  hand. Never front a migration the user didn't ask for.

**Measure, then advise.** When the app runs, point
[`scripts/audit.mjs`](scripts/audit.mjs) at its most-used routes before
recommending anything: it moves a real pointer and reports whether each
list's hover glides or blinks off between rows, whether selecting a tab
shoves its neighbours, which transition durations and control heights
actually ship, and whether the loaded font can render a weight change. Every
advice item and shortlist entry then passes the
[evidence gate](references/stack-audit.md#the-evidence-gate): a quoted
measurement or `file:line`, a surface people actually use, exactly one FF
correction — and a falsification pass that deletes whatever doesn't hold.
"No changes recommended" is a valid outcome; an audit that always finds
something teaches people to ignore it.

The shortlist goes in your reply. Because every entry cites its evidence,
the next audit rebuilds it from the code as it is then: fixed items drop out
on their own, and only declined ones need a decision to stay settled.

## When asked to update

When the user asks to update or upgrade Fluid Functionalism, or what changed
since they installed it:

1. **Read the stack** (above). An update never moves a file to the other
   flavor: each file stays on the primitive its imports show.
2. **Check what's behind:**

   ```bash
   node <skill>/scripts/upgrade.mjs [apps/web]
   ```

   It compares every installed FF file with the item the registry ships
   today, in the flavor the file's own imports show, ignoring what an
   install rewrites (import aliases, line endings, the `"use client"` line).
   `CURRENT` files need nothing. `DIFFERS` lists the rest with their line
   counts; `--diff <name>` (or a path) prints one, local on the `-` side,
   registry on the `+`. A `REWRITES` line means the CLI rewrites more than
   that (JavaScript output, a Tailwind prefix): compare those by hand. It
   writes nothing and needs network access to fluidfunctionalism.com.
3. **Read the changelog:** <https://www.fluidfunctionalism.com/changelog.md>,
   newest month first. Every entry names its install URL; every Breaking
   entry carries migration steps and a before/after diff.
4. **Sort each difference.** A change the changelog explains is the registry
   moving on: re-install that item with its line from the report. A change
   it doesn't explain is a local edit: show it and ask before overwriting.
   Both in one file: re-install, then re-apply the edit, or better, move it
   into a wrapper so the next update keeps it (see Gotchas). `--overwrite`
   also rewrites the item's dependencies, which its line names: check those
   for local edits before running it.
5. **Migrate call sites** for every Breaking entry that touches an item the
   project uses: find the diff's `-` lines across the app and rewrite them to
   its `+` lines. Renames fail the type checker, so let it find them.
6. **Verify:** run the type checker and the build, run `upgrade.mjs` again
   (every file reads `CURRENT`, or is a local edit the user kept), and report
   item by item what changed and what you left alone.

Never update by re-installing everything blind: `--overwrite` erases local
work, and a release can break call sites the install never touches.

## One-time project setup

The stack read tells you which of these are already done. Skip those.

1. **Add the registry** (or install per-URL, next section):

   ```bash
   npx shadcn@latest registry add @fluid
   ```

2. **Pick the flavor once, per project.** The bare name installs the Radix
   flavor; prefix `base/` for Base UI. The stack script settles the verdict
   from what the project already uses: installed FF components first, then
   `@base-ui/react` in `package.json` → `base/` names everywhere;
   `@radix-ui/react-*` (or nothing yet) → bare names. `input-group`,
   `color-picker`, and `ask-user-questions` import Base UI under both
   flavors, so they never count as evidence. Never mix flavors in
   one project — dependencies follow the flavor you pick, so a Base UI
   dialog pulls in the Base UI button.

3. **Enable reduced motion at the root.** One line in the app layout, like a
   ThemeProvider:

   ```tsx
   import { MotionConfig } from "motion/react";

   <MotionConfig reducedMotion="user">{/* providers + app */}</MotionConfig>
   ```

   This makes every Motion component honour the OS
   `prefers-reduced-motion` setting: transforms and layout animations drop,
   opacity and colour fades stay (they aid comprehension).

4. **Load Inter with its optical-size axis** if the project uses Inter and
   you want the weight animations to hold width. With `next/font/google`:
   `Inter({ subsets: ["latin"], axes: ["opsz"] })`. Self-hosted: a
   `@font-face` with `font-weight: 100 900` pointing at `InterVariable.ttf`.
   Without the `opsz` axis everything still works — labels just widen
   slightly when they get heavier.

## Installing components

```bash
npx shadcn@latest add @fluid/button            # Radix flavor
npx shadcn@latest add @fluid/base/button       # Base UI flavor
# URL form (no registry entry needed) - the flavor lives in the path, so a
# base project needs the /base/ segment here too:
npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json       # Radix
npx shadcn@latest add https://www.fluidfunctionalism.com/r/base/button.json  # Base UI
```

Dependencies, shared libs (`springs`, `font-weight`, contexts), and hooks
resolve on their own — install the component you want, not its plumbing.

**Pass `--overwrite`** when the project's shadcn files are stock: this
library installs under the same names (`button.tsx`, `dialog.tsx`, …), and
without the flag the CLI asks per file — a non-interactive shell (you) exits
at the first question. But if those files carry local customizations or
colocated stories/tests (diff each target to find out), `--overwrite` destroys
that work — review or diff instead of a blind pass.

```bash
npx shadcn@latest add @fluid/dialog --overwrite
```

Prefer a **block** when one matches the ask — `sidebar-app` (complete app
shell), `dialog-sidebar` (settings dialog), `queued-stack` (queued composer
messages) install as one item with every component they use, already composed.

The full catalog — every component, system, and block, with registry names,
flavors, and what each does — is in
[references/components.md](references/components.md). Read it when choosing
what to install; guessing names wastes an install round-trip.

**Presets:** the Sidebar, Card, InputMessage, AskUserQuestions, Dropdown,
Combobox, and CommandMenu playgrounds encode a configuration into a short
code. If the user gives you a preset code or a doc URL with `?preset=`,
install it directly as a composed block:
`npx shadcn@latest add https://www.fluidfunctionalism.com/r/preset/<code>.json`.

## Composing with the system

Installed components already follow every rule. The rules matter when you
write UI *around* them — a custom list, a bespoke card grid, an animated icon
of your own. The recipes and code snippets live in
[references/custom-motion.md](references/custom-motion.md); the shape of the
system:

- **Three spring speeds, tokenised.** `spring.fast` (0.08s) / `spring.moderate`
  (0.16s) / `spring.slow` (0.24s) from `@/lib/springs`. The bigger the thing
  that moves, the slower the spring. Never hand-write a `duration` — import
  the token, and use its paired `.exit` tween for dismissals so exits read
  crisp instead of replaying the entrance backwards.
- **One hover highlight per list.** Any custom list, menu, strip, or grid with
  hover uses `useFluidHover` + `<FluidHoverHighlight />` (install
  `@fluid/use-fluid-hover`) — never a per-row `:hover` background next to
  components whose highlight glides.
- **Weight without reflow.** Text that gets heavier on state
  (selected/active/open) uses the ghost-span pattern with `fontWeights`
  tokens, so the layout never shifts.
- **Type comes from six roles.** Size text with `typeClass(role, variant)` or
  `useSize().type.<role>` from `@/lib/size-context` (display, title,
  subtitle, body, caption, micro; each a size and a line height); a server
  component imports `typeClass` from `@/lib/type-scale`. Text uses 3 weights:
  `fontWeights.normal` for text, `fontWeights.semibold` for headings and
  selected items, `fontWeights.bold` only for the display style; never a
  Tailwind `font-*`. 2 text colors, foreground and muted, never
  an opacity step of them; no uppercase, no letter-spacing, no eyebrows. Never a raw
  `text-[13px]`, and never a bare `text-caption` inside `cn()`: stock
  tailwind-merge reads it as a color and drops it. A text field takes
  `useSize().field`, which adds 16px on touch screens so iOS Safari doesn't
  zoom the page into it on focus. Rendered markdown goes in
  `.typeset` (install `@fluid/typography`), not hand-styled elements.
- **Icon swaps crossfade in one cell.** Two glyphs mounted in the same grid
  cell, fading with a touch of blur and scale — the slot never resizes.
- **Nested corners are concentric.** When a rounded surface sits close inside
  another, derive `inner radius = max(0, outer radius - inset - border)`; the
  inset is the interior spacing, usually parent padding, and the border is the
  parent's border width. The shipped shape pair (`container` 12/24px → `bg`
  8/20px) is fixed for a 4px total inset. For any other inset use
  `nestedRadius()` from `@/lib/shape-context` rather than reusing the pair. Past
  24px, with asymmetric gaps, or when the inner surface does not reach the
  corner, treat the layers independently and tune by eye.
- **Move with `transform`/`opacity`**, never `top`/`left`/`width`/`height` —
  that keeps motion on the compositor and lets `MotionConfig` reduce it for
  free.
- **Theming is stock shadcn.** The project's existing theme tokens (colors,
  radii, fonts) apply as they are; don't invent parallel tokens. Icons are
  Lucide by default; swap libraries app-wide via `IconProvider` from
  `@/lib/icon-context`, not by editing installed components.

## The last 1%: where the deep craft lives

The references here teach the system; the fine grain of each component —
its exact choreography, edge-case behavior, and the reasons — is also
written down. In order of reach:

- **[references/craft.md](references/craft.md)** — craft for every documented
  system and component plus each top-level block: the built-in behaviors,
  exact values, and the why. The catalog routes separately installable parts
  to their governing parent section. Read that section **before composing
  with, wrapping, extending, or imitating a component** — it keeps composed
  code from fighting behaviors it didn't know existed (the button already
  handles its own press geometry; select already acknowledges a pick for
  300ms; the panel already snaps under a collapsing child).
- **The installed source is the final word.** These components ship with
  their rationale in comments. Before modifying one, read its installed
  file (`components/ui/*`, `hooks/*`, `lib/*`) — never restyle or re-time
  from memory of what the stock shadcn version does.
- **The craft lives in [references/craft.md](references/craft.md).** Copy-prompt
  briefs carry only install, usage, and props. Before composing a
  component, read its craft section and treat the bullets as constraints,
  not suggestions.

## Gotchas

- **Don't edit installed components to change timing or hover behaviour** —
  wrap or compose instead. Edits are lost on the next `--overwrite` install
  and drift the app away from the system.
- Components built on a flavored one (AskUserQuestions, ColorPicker,
  CommandMenu, InputCopy, InputMessage, and the blocks) also take the `base/`
  prefix. Single-source items (badge, card, table, input-group, chat-message,
  thinking-indicator, the libs and hooks) have one name for both kinds of
  project.
- The registry expects Tailwind CSS v4, React 19, and `motion` (imported as
  `motion/react`). On older stacks, flag the mismatch to the user before
  installing half a tree.
- If an install fails on a name, check the catalog in
  [references/components.md](references/components.md) — the registry name is
  not always the component's display name (e.g. TabsSubtle → `tabs-subtle`,
  Fluid Hover → `use-fluid-hover`, Motion → `springs`).
- The base flavor lives at the `base/<name>` **path** — `@fluid/base/select`,
  URL `/r/base/select.json`. Names like `<name>-base` are internal build
  names; `/r/<name>-base.json` 404s **by design** (the build moves those
  files into `base/`). A 404 there is not evidence the registry lacks base
  flavors — try the documented `base/<name>` forms before concluding
  anything, and never record "registry is Radix-only" from a guessed URL.
