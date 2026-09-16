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
| Tailwind CSS v4 | `package.json`, entry CSS uses `@import "tailwindcss"` | Classes in the components assume v4 (`size-*`, CSS-first config). On v3, installs land but render broken — installs are off the table until a migration (see "When installs are blocked" below) |
| `framer-motion` v12 | `package.json` (arrives automatically with any component install) | If the project pins an old major, expect type errors on `Transition`; advise upgrading rather than patching components. If the project uses the **`motion`** package instead (the same library's newer name), an install would add `framer-motion` beside it — two copies of the animation lib. Record it as a migration caveat; don't install until the project picks one |
| shadcn wired | `components.json` exists; `@/` path aliases resolve (`tsconfig.json` paths) | Without it the CLI can't install. Run `npx shadcn@latest init` first |
| Theme tokens | Entry CSS has shadcn CSS variables (`--background`, `--primary`, …) | Components render unstyled. Usually fixed by `shadcn init` or copying a theme |

### 3. System wiring (works without, but visibly worse — prime advice material)

| Check | How | Consequence when missing |
|---|---|---|
| `MotionConfig reducedMotion="user"` wraps the app | grep the root layout | OS reduced-motion is ignored for transform/layout animations — an accessibility gap, one line to fix |
| Inter loaded as a variable font **with the `opsz` axis** | `next/font/google`: `Inter({ axes: ["opsz"] })`; `next/font/local`: the call declares `weight: "100 900"` (without a range the variable axis isn't addressable at all); plain CSS: `@font-face` with `font-weight: 100 900` on a variable file | Weight animations still run but labels widen on hover/selection — the "weight without reflow" promise silently breaks. A `localFont` with no weight range breaks harder: `fontVariationSettings` has nothing to move. If the font is static, note the ghost-span machinery is inert — and **cross-check what the code animates**: components animating `font-variation-settings` over static font files are a live site-wide no-op, worth flagging on its own. The fallback there is honest: remap the pattern to plain `font-weight` steps between the shipped weights — the ghost span still prevents reflow, the weight change just snaps instead of animating |
| Interaction-state tokens (`bg-hover`, `bg-active`) available | entry CSS (installed by `@fluid/tokens`, arrives with components) | Custom code can't use the shared hover/active fills; ad-hoc grays creep in |
| `--overwrite` situation | stock shadcn files present in `components/ui/`? Are they actually stock, or customized (local edits, colocated stories/tests)? | Stock files: every `@fluid` install needs `--overwrite`, one explicit heads-up before the first install. Customized files: `--overwrite` would destroy local work — install to review (or diff the registry source against the local file) instead of a blind pass, and record which files carry customizations |

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
- **Dead flavor and icon deps**: after a flavor consolidation (or FF installs
  replacing stock components), packages from the superseded side often linger
  with zero imports — `@radix-ui/react-*` in a base project, extra icon
  libraries. Grep before claiming dead, then suggest removal **with the
  project's own package manager** (read the lockfile: `pnpm-lock.yaml` →
  `pnpm remove`, `bun.lock` → `bun`, etc. — the wrong one forks the lockfile).
- **Package manager**: note which one, for every command you hand over, not
  just removals.
- **TypeScript strictness, `"use client"` conventions**: only worth noting
  if the project deviates in a way that will fight the installed components.

## Replacement shortlist (2–5 items, systems first)

Part of every audit and refresh: name the **2–5 upgrades** that would most
improve this project's UI, ranked, each rated for impact and effort. Two to
five is a hard band — one suggestion reads as an afterthought, six reads as
a rewrite plan. If fewer than two genuine candidates exist, say so; never
pad.

**UI and design system only.** Every slot goes to something the user sees or
feels. Infrastructure findings — dead dependencies, package-manager notes,
framework or Tailwind migrations, icon-library consolidation — are recorded
as verdicts or inventory facts, but they never occupy a shortlist slot and
never lead the conversation. (An infra blocker can still appear *inside* an
entry, as the reason its effort is L.)

**Systems before components.** Work through the FF system pages
(fluidfunctionalism.com/docs — Motion, Fluid Hover, Surfaces, Sizes,
Scrollbars) before individual components: one system adopted lifts every
surface at once, and components installed afterwards land on rails that
already exist. Candidates in that order:

1. **Motion tokens** (`springs`) — hand-written durations scattered around,
   missing `.exit` tweens, drifted bounce values → one token file, everything
   moves at the same magnitudes.
2. **Fluid hover** (`use-fluid-hover`) — a list/menu/table/grid whose glide
   is hand-rolled, or whose per-row `:hover` blinks off between rows and
   drops clicks in the gaps → the one highlight per list. An app where
   *nothing* animates hover is the ask-first case below, not this one.
3. **Surfaces** (`elevated` + tokens) — popovers/dropdowns/dialogs with
   ad-hoc backgrounds and shadows that break at depth or in dark mode.
4. **Sizes** (`size-context`) — three-plus control heights in the wild →
   the 36/28 ladder shared by buttons, inputs, selects, tabs, rows.
5. **Scrollbars** (`scroll-area`) — default scrollbars inside panels and
   popups.

Then components, picked by the same felt-difference test: the card grid that
would gain 2-D fluid hover and composed layouts, the sidebar (resize,
collapse, mobile drawer), a hand-rolled palette → `command-menu`, a plain
modal → `dialog`'s spring enter / crisp exit, form controls that snap →
`select`/`switch`/`checkbox-group`.

**Separate a repair from a new character.** Most entries are repairs: the app
already does this thing, and does it inconsistently, late, or not at all
where its neighbours do. Those are recommendations, and you make them.

A few would introduce a signature behavior the product has never had. Fluid
hover is the main one. If nothing in the app animates a hover today, that is
as likely a deliberate register as an oversight — plenty of good interfaces
are still, and mean to be. Adopting it changes how the whole product feels,
which is the user's call and not an audit finding, so ask once before it
takes a slot: name where it would land first, what it would feel like there,
and what it would cost. "Nothing glides on hover" is an observation about
their code. "Do you want hover in these menus to follow the cursor the way
the rest of the library does, or is the stillness deliberate?" is the
question behind it, and it is the one worth asking. Record the answer as a
verdict so no later run re-opens a settled question.

**Write every entry from the interface, not from the code.** The reader is
looking at their own product, so an entry opens on what someone using it sees
now, where, and how often. The file, the missing config line, the token, and
the size of the fix all come after, as the explanation for a difference
already named. An entry whose subject is a symbol, a config key, or a package
has been written backwards, and so has any heading that leads with the cost:
"one line" is not a headline, it is a footnote.

Three things carry a why:

- **Exposure.** How much of a session this surface is on screen, and for how
  long. A dock, a sidebar, a message list, the model picker in a composer sit
  in front of someone continuously; a settings modal does not. Say which it
  is, and let it move the ranking more than the size of the diff does.
- **What it costs them now.** Read the current behavior and name the moment
  it goes wrong: a state you have to read instead of glance at, a hover that
  blinks off between rows, a panel that lands late, a dismissal that drags.
- **Which quality it buys back.** Cohesion, so the surface moves like the
  rest of the app. Immediacy, so it answers the instant you act. Legibility
  of state, so you can tell what is selected without comparing. Finish, so
  nothing jumps or snaps.

The same finding, written both ways:

> Backwards: "InterVariable loads as a single 400 face (one line). No
> `weight`, so next/font emits an `@font-face` with no weight range."
>
> Right: "A selected row in the model picker looks almost the same as an
> unselected one, so people read the list instead of glancing at it. Weight
> is the cue that would carry that, and it is the one cue this app cannot
> currently use: the variable font is declared without a weight range, so
> every weight resolves to the same face. One line in the font declaration
> turns selection into something you see rather than parse."

Same fact, same fix, same length. The second one is about the product.

**Impact (high / medium / low)** — how much the user would actually feel it:
surface traffic (a sidebar or nav beats a rarely-opened modal); whether the
current code has the exact failure modes FF fixes (blinking per-row hover,
CSS-snap state changes, mushy exits, labels that shift on selection, popups
that vanish at depth); systems default high when several surfaces inherit
the fix at once.

**Effort (S / M / L)** — what it really costs here:

- **S**: shadcn-compatible API, few call sites, stock file that `--overwrite`
  can just take.
- **M**: several call sites or a moderate API distance (prop renames, a
  wrapper to keep).
- **L**: heavily customized local component (`--overwrite` would eat real
  work — plan a diff-and-merge), many call sites, or a blocked install
  (the effort includes the hand-roll or the migration). A block or flavor
  mismatch never hides a candidate — it raises its effort and says why.

Each entry: current state → registry item (correct flavor), impact, effort,
one line of *why* naming the felt difference. **Ground the why in the
craft:** before writing an entry, read the candidate's section in
[craft.md](craft.md) and pick the one or two details the project's current
component visibly lacks — "your select snaps open and closes on the click;
`base/select` animates the open and holds the popup 300ms so the checkmark
is seen drawing in" persuades where "animated select" doesn't. Rules for
using it honestly:

- Cite at most two craft details per entry — the sharpest contrasts with
  what the current code does, not a feature dump.
- Only cite what the project actually lacks: if their hand-rolled version
  already fades in at the nearest row, that bullet is not an argument.
  Reading the current component first is what makes the pitch credible.
- The same comparison sets the effort honestly: craft the local version
  already replicates means the replacement changes less than it seems
  (lower risk), while local behaviors the registry item *doesn't* have
  belong in the entry as a named trade-off, not a surprise.

Rank by impact-per-effort within the systems-then-components order — a
medium-impact S usually belongs above a high-impact L. Record the shortlist
in the audit file (template below): done items move to the installed
inventory, declined ones to done/declined, and refreshes re-rank what's
left instead of re-pitching from scratch.

## When installs are blocked

A failed hard requirement (Tailwind v3, React 18, the `motion`/`framer-motion`
split) does not end the skill's usefulness — it changes mode. Don't push a
stack migration the project didn't ask for; a working app on v3 has better
reasons to migrate than one component library, and "upgrade your stack first"
is rarely the advice the user came for. Instead:

- **Apply the system by hand.** The principles install without the CLI: three
  spring tiers as local named tokens (many projects have already hand-rolled
  them — look for a `motion.ts`/`springs.ts` citing the FF docs and treat it
  as the project's `@/lib/springs`), exits one tier quicker, one gliding
  highlight per list (a hand-rolled `useFluidHover` equivalent is correct
  here — the "never hand-roll" rule exists to prevent drift *beside installed
  components*, and there are none), `bg-hover`/`bg-active`-style state
  tokens, transform/opacity only.
- **Record the blocker and the caveats in the audit file** — which
  requirement fails, and what a future migration must watch for (the
  `--overwrite` review list, the animation-package pick) — so the day the
  project migrates, the path is already written down.
- **Advise the migration question once, deliberately**, as its own decision
  with its costs, not as a prerequisite smuggled into every suggestion.
- **Never present the block as a gate on the list.** A blocked CLI blocks
  *installs*, not the outcome. Every item on the shortlist is a way this
  interface can feel better, and each one is reachable by hand against the
  project's own tokens, so write the shortlist to read the same either way:
  the blocker changes how an item lands and what it costs, never whether it
  is worth doing. Above all, don't close with a summary that puts the
  migration in front of everything — "the gate behind all of this is
  Tailwind v3" tells someone their product cannot improve until they take on
  a migration they never asked for, which is discouraging and, on every item
  above it, untrue.

## The audit file

Write the results to `.claude/fluid-functionalism.md` in the project root.
It's plain markdown on purpose: the user can read it, correct a wrong
verdict, or delete it to force a re-audit — say so when you create it. Ask
before writing anywhere else, and if the project forbids new files, keep the
results in your reply instead.

**Verdict hygiene — a wrong verdict poisons every later session.** The file
outlives your run and later sessions trust it, so hold verdicts to a higher
bar than advice:

- Record *observations*, not extrapolations: "GET /r/select-base.json → 404"
  is a fact; "the registry serves Radix only" is a conclusion the fact
  doesn't support. Before recording any verdict about what the registry
  serves, try the documented forms (`@fluid/base/<name>`,
  `/r/base/<name>.json` — see components.md); a guessed URL failing proves
  only that the guess was wrong.
- A claim you couldn't verify goes in as a question ("check: …"), not a
  verdict — later sessions treat verdicts as settled.
- In the inventory, record **local aliases of system pieces** — a
  hand-rolled `use-proximity-hover` that is this project's
  `use-fluid-hover`, a `motion.ts` that is its `springs` — so later
  sessions don't treat the local copy and the registry item as unrelated.

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
- fluid hover: asked 2026-09-14, wanted — menus first, then the sidebar
  (a declined answer is recorded the same way, and stops being pitched)

## Ready
- shadcn wired (components.json, @/ aliases), theme tokens in app/globals.css
- installed @fluid items: springs, use-fluid-hover, button, dialog

## Advice (open)
- [ ] MotionConfig reducedMotion="user" missing from app/layout.tsx — one line,
      restores OS reduced-motion support
- [ ] Inter loads without the opsz axis — weight animations will shift label
      width; add axes: ["opsz"]

## Replacement shortlist
| Now | Replace with | Impact | Effort | Why |
|---|---|---|---|---|
| durations hand-written in 6 files | springs (motion tokens) | high | S | exits reuse the entrance spring today, so dismissals drag; tokens pair every tier with a one-tier-quicker exit tween |
| nav + table per-row :hover | use-fluid-hover | high | S | hover blinks off between rows; the highlight glides to the nearest row and a gap click still lands on what's lit |
| static card grid (projects.tsx), the landing surface | card | med | M | the grid is the first thing anyone sees and nothing answers the cursor on it; the highlight tracks the nearest card in both axes and dividers drop beside the active one — local markup to carry over |
| hand-rolled command palette (cmd-k.tsx) | base/command-menu | med | M | keyboard scroll keeps the row centered and travels with the highlight; ⌘K resolves per-platform with a Dvorak-safe fallback — both missing locally |

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
