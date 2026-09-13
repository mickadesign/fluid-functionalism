---
name: fluid-functionalism
description: >-
  Build React UIs with Fluid Functionalism — a shadcn/ui registry (@fluid) of
  animated components with a shared motion system: three spring speeds, one
  hover highlight that glides to the item nearest the cursor, and labels that
  change weight without shifting layout. Use this skill whenever the user
  mentions Fluid Functionalism, @fluid, fluidfunctionalism.com, or asks for UI
  with "satisfying"/"fluid"/"polished" motion in a React, Next.js, shadcn,
  Radix, or Base UI project — and whenever building any interface (settings
  dialogs, sidebars, command menus, chat UIs, forms, lists, tables) in a
  project that already has @fluid components installed. Also use it before
  hand-writing animation code (hover highlights, icon swaps, font-weight
  changes, enter/exit transitions) in such a project, so custom code follows
  the same system instead of inventing its own timings.
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

Two jobs this skill covers:

1. **Install and compose the components** — pick the right registry item and
   flavor, wire it in. See the workflow below and
   [references/components.md](references/components.md) for the full catalog.
2. **Write custom UI that belongs next to them** — when you build something
   the library doesn't ship, follow the motion system so it moves like the
   rest of the app. Read
   [references/motion-system.md](references/motion-system.md) before writing
   any animation, hover, or state-change styling by hand.

## One-time project setup

Skip any step that's already done (check `components.json`, `package.json`,
and the app layout before redoing them).

1. **Add the registry** (or install per-URL, next section):

   ```bash
   npx shadcn@latest registry add @fluid
   ```

2. **Pick the flavor once, per project.** The bare name installs the Radix
   flavor; prefix `base/` for Base UI. Decide by what the project already
   depends on: `@base-ui-components/react` in `package.json` → use `base/`
   names everywhere; `@radix-ui/*` (or nothing yet) → bare names. Never mix
   flavors in one project — dependencies follow the flavor you pick, so a
   Base UI dialog pulls in the Base UI button.

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
npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json  # no registry entry needed
```

Dependencies, shared libs (`springs`, `font-weight`, contexts), and hooks
resolve on their own — install the component you want, not its plumbing.

**Always pass `--overwrite`** when the project already has stock shadcn files:
this library installs under the same names (`button.tsx`, `dialog.tsx`, …),
and without the flag the CLI asks per file — a non-interactive shell (you)
exits at the first question.

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
