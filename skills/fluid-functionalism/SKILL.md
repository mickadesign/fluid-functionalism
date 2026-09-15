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
  installed, or asks to review/audit existing UI motion against the system.
  Also use before hand-writing animation code (hover highlights, icon swaps,
  weight changes, enter/exit transitions) there, so custom code follows the
  system instead of inventing timings. On first use in a
  project it audits the stack (deps, Radix vs Base UI flavor, MotionConfig,
  Inter opsz axis) and records verdicts in .claude/fluid-functionalism.md
  for later runs.
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

Three jobs this skill covers:

1. **Know the project** — the first time this skill runs in a project, audit
   the stack and record it (next section). Every later run reads that record
   instead of re-guessing.
2. **Install and compose the components** — pick the right registry item and
   flavor, wire it in. See the workflow below and
   [references/components.md](references/components.md) for the full catalog.
3. **Write custom UI that belongs next to them** — when you build something
   the library doesn't ship, follow the motion system so it moves like the
   rest of the app. Read
   [references/motion-system.md](references/motion-system.md) before writing
   any animation, hover, or state-change styling by hand.

## First run in a project: the stack audit

Check for `.claude/fluid-functionalism.md`. If it exists and `package.json`
hasn't changed since it was written, read it and trust its verdicts — flavor,
`--overwrite`, what's installed — without re-deriving them; surface any still-
open advice items only when the current task touches what they affect. If it
doesn't exist (or is stale), run the audit in
[references/stack-audit.md](references/stack-audit.md) first: it checks the
dependencies FF needs (React 19, Tailwind v4, framer-motion, shadcn wiring),
settles the flavor verdict from what the project already depends on, catches
the two silent quality killers (`MotionConfig reducedMotion="user"` missing,
Inter without the `opsz` axis), inventories what's already installed, and
picks the 2–5 UI upgrades that would help most — systems first (motion
tokens, fluid hover, surfaces, sizes), then components — each rated
impact / effort and ranked by impact-per-effort. UI and design system only:
infrastructure findings are recorded as facts, never pitched as
recommendations. It writes the results to that file so the project
remembers.

## One-time project setup

The audit above tells you which of these are already done — skip those.

1. **Add the registry** (or install per-URL, next section):

   ```bash
   npx shadcn@latest registry add @fluid
   ```

2. **Pick the flavor once, per project.** The bare name installs the Radix
   flavor; prefix `base/` for Base UI. The audit records the verdict: decide
   by what the project already depends on — `@base-ui/react` in
   `package.json` → use `base/` names everywhere; `@radix-ui/react-*` (or
   nothing yet) → bare names. Never mix flavors in one project —
   dependencies follow the flavor you pick, so a Base UI dialog pulls in the
   Base UI button.

3. **Enable reduced motion at the root.** One line in the app layout, like a
   ThemeProvider:

   ```tsx
   import { MotionConfig } from "framer-motion";

   <MotionConfig reducedMotion="user">{/* providers + app */}</MotionConfig>
   ```

   This makes every framer-motion component honour the OS
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
colocated stories/tests (the audit records which), `--overwrite` destroys
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
[references/motion-system.md](references/motion-system.md); the shape of the
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
- **Icon swaps crossfade in one cell.** Two glyphs mounted in the same grid
  cell, fading with a touch of blur and scale — the slot never resizes.
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

- **[references/craft.md](references/craft.md)** — per-component craft for
  every system and component: the built-in behaviors, exact values, and the
  why. Read the relevant section **before composing with, wrapping,
  extending, or imitating a component** — it is what keeps composed code
  from fighting behaviors it didn't know existed (the button already
  handles its own press geometry; select already acknowledges a pick for
  300ms; the panel already snaps under a collapsing child).
- **The installed source is the final word.** These components ship with
  their rationale in comments. Before modifying one, read its installed
  file (`components/ui/*`, `hooks/*`, `lib/*`) — never restyle or re-time
  from memory of what the stock shadcn version does.
- **Each doc page's Copy-prompt brief carries the same "Craft" section.**
  When a user pastes one, treat those bullets as constraints, not
  suggestions.

## Gotchas

- **Don't edit installed components to change timing or hover behaviour** —
  wrap or compose instead. Edits are lost on the next `--overwrite` install
  and drift the app away from the system.
- Components built on a flavored one (AskUserQuestions, ColorPicker,
  CommandMenu, InputCopy, InputMessage, and the blocks) also take the `base/`
  prefix. Single-source items (badge, card, table, input-group, chat-message,
  thinking-indicator, the libs and hooks) have one name for both kinds of
  project.
- The registry expects Tailwind CSS v4, React 19, and framer-motion. On older
  stacks, flag the mismatch to the user before installing half a tree.
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
