# Fluid Functionalism — project stack audit

Run this the first time the skill fires in a project, before installing or
writing anything. It takes under a minute, produces the audit file the skill
reads on every later run, and is where most of the skill's *advice* comes
from: every check below maps to a concrete consequence you can explain to the
user. Skip the audit entirely when `.claude/fluid-functionalism.md` exists
and `package.json` has not changed since it was written — just read the file
and act on it.

## What to check

Read these files (all cheap, none require running anything):
`package.json`, `components.json`, the Tailwind entry CSS (e.g.
`app/globals.css`), the root layout (`app/layout.tsx` or the app's
equivalent), and a directory listing of the shadcn components dir (usually
`components/ui/`) plus `lib/` and `hooks/`.

### 1. Flavor verdict (decides every future install)

| Found in package.json | Verdict |
|---|---|
| `@base-ui/react` | **base** — every flavored install uses the `base/` prefix |
| any `@radix-ui/react-*` | **radix** — bare names |
| both | Mixed primitives. Pick the side the app's own code imports more; flag the other as advice ("consider consolidating") |
| neither | **radix** by default (bare names), but note it's an open choice until the first primitive lands |

Record the verdict explicitly. Later runs must not re-derive it — that is how
flavor mixing happens.

### 2. Hard requirements (installs break or misbehave without these)

| Check | Where | If missing / off |
|---|---|---|
| React 19 | `package.json` | Registry components target React 19; React 18 will fail on `use client` + new ref semantics in places. Flag before installing anything |
| Tailwind CSS v4 | `package.json`, entry CSS uses `@import "tailwindcss"` | Classes in the components assume v4 (`size-*`, CSS-first config). On v3, installs land but render broken — advise upgrading first |
| `framer-motion` v12 | `package.json` (arrives automatically with any component install) | If the project pins an old major, expect type errors on `Transition`; advise upgrading rather than patching components |
| shadcn wired | `components.json` exists; `@/` path aliases resolve (`tsconfig.json` paths) | Without it the CLI can't install. Run `npx shadcn@latest init` first |
| Theme tokens | Entry CSS has shadcn CSS variables (`--background`, `--primary`, …) | Components render unstyled. Usually fixed by `shadcn init` or copying a theme |

### 3. System wiring (works without, but visibly worse — prime advice material)

| Check | How | Consequence when missing |
|---|---|---|
| `MotionConfig reducedMotion="user"` wraps the app | grep the root layout | OS reduced-motion is ignored for transform/layout animations — an accessibility gap, one line to fix |
| Inter loaded as a variable font **with the `opsz` axis** | `next/font`: `Inter({ axes: ["opsz"] })`; or `@font-face` with `font-weight: 100 900` on a variable file | Weight animations still run but labels widen on hover/selection — the "weight without reflow" promise silently breaks. If the project doesn't use Inter at all, note that weight animation quality is untuned for other fonts (the `fontWeights` opsz pairings are calibrated for Inter) |
| Interaction-state tokens (`bg-hover`, `bg-active`) available | entry CSS (installed by `@fluid/tokens`, arrives with components) | Custom code can't use the shared hover/active fills; ad-hoc grays creep in |
| `--overwrite` situation | stock shadcn files present in `components/ui/`? | If yes, every `@fluid` install needs `--overwrite` and replaces those files — worth one explicit heads-up before the first install |

### 4. Inventory (context for suggestions, not warnings)

- **Installed @fluid items**: presence of `lib/springs.ts`,
  `hooks/use-fluid-hover.ts`, `components/ui/fluid-hover-highlight.tsx`,
  `lib/font-weight.ts`, `lib/icon-context.tsx`, and which `components/ui/*`
  files match registry items. This tells later runs what can be imported
  right now versus what needs an install.
- **Framework**: Next.js (app router?), Vite, Remix — decides where the root
  layout and font loading live.
- **Icon library**: `lucide-react` is the default and arrives automatically.
  If the app standardizes on another set (`@phosphor-icons/react`, etc.),
  suggest the `IconProvider` mapping once, instead of per-component overrides.
- **`pdfjs-dist`**: only needed by `file-thumbnail` (PDF previews). Don't
  flag its absence unless that component is in play.
- **TypeScript strictness, `"use client"` conventions**: only worth noting
  if the project deviates in a way that will fight the installed components.

## The audit file

Write the results to `.claude/fluid-functionalism.md` in the project root.
It's plain markdown on purpose: the user can read it, correct a wrong
verdict, or delete it to force a re-audit — say so when you create it. Ask
before writing anywhere else, and if the project forbids new files, keep the
results in your reply instead.

Template (fill every section; keep it under ~40 lines):

```markdown
# Fluid Functionalism — project audit
<!-- Written by the fluid-functionalism skill. Edit freely; delete to force a re-audit. -->

- audited: 2026-09-14
- package.json: react 19.2, tailwindcss 4.1, framer-motion 12.34, next 15.5

## Verdicts
- flavor: base (@base-ui/react 1.4.1 present) — all flavored installs use base/<name>
- framework: Next.js app router; root layout at app/layout.tsx
- stock shadcn files present → always pass --overwrite

## Ready
- shadcn wired (components.json, @/ aliases), theme tokens in app/globals.css
- installed @fluid items: springs, use-fluid-hover, button, dialog

## Advice (open)
- [ ] MotionConfig reducedMotion="user" missing from app/layout.tsx — one line,
      restores OS reduced-motion support
- [ ] Inter loads without the opsz axis — weight animations will shift label
      width; add axes: ["opsz"]

## Advice (done / declined)
- (move items here instead of deleting, so they aren't re-raised)
```

## Using it on later runs

- **Read it first**; trust its verdicts (flavor, `--overwrite`) without
  re-deriving them.
- **Refresh when stale**: if `package.json` changed since the audit date or
  a check obviously no longer matches reality, re-run the relevant checks
  and update the file — don't start over.
- **Keep the inventory current**: after you install components, add them to
  the installed list in the same edit session.
- **Surface open advice at natural moments**, once: when a task touches the
  affected area (mention the missing `opsz` axis when a task involves
  selected/active labels, not on every run). If the user declines, move the
  item to "done / declined" so it stays visible but stops being raised.
