# Fluid Functionalism — project stack audit

The stack read runs at the start of every session that installs, composes,
or advises. The full audit (the stack read, measurements, and a shortlist)
runs when the user asks for one. Neither writes into the project: facts are
read again each time, results go in the reply, and only the user's own
decisions are kept, with their OK ([decisions](#decisions)). Every check
below maps to a concrete consequence you can explain to the user, which is
where most of the skill's *advice* comes from.

## What to check

`scripts/stack.mjs` reads all of it in under a second and cites the
`file:line` behind each fact:

```bash
node <skill>/scripts/stack.mjs [app dir] [--json]
```

Point it at the app's directory (in a monorepo, `apps/web` or wherever
`components.json` lives). It reads `package.json`, `components.json`,
tsconfig paths (following `extends`), the Tailwind entry CSS, the root layout
and the providers it imports, the shadcn `ui/`, `lib/`, `hooks/`, and
`components/` dirs (block parts one folder down), and the agent notes from
there up to the repository root. Without Node, read those same files by
hand. The tables below say what each fact means.

### 1. Flavor verdict (decides every future install)

Checked in this order; the first row that applies decides.

| Found | Verdict |
|---|---|
| Installed FF components import one flavor's primitives | **that flavor**: every later install has to match what is already there. `input-group`, `color-picker`, and `ask-user-questions` import Base UI under both flavors, so they never count here |
| Installed FF components import both | **mixed**: ask the user which side to consolidate on before installing more |
| `@base-ui/react` in package.json, but no app code imports it and a shared item above is installed | The shared item brought it, so it doesn't count: read the rows below without it. If that leaves neither, the choice is **open**: Radix by default, but ask the user before the first flavored install, since a project that chose Base UI looks the same from its files |
| only `@base-ui/react` in package.json | **base**: every flavored install uses the `base/` prefix |
| only Radix: any `@radix-ui/react-*`, or `radix-ui` | **radix**: bare names |
| both in package.json | Mixed primitives. Pick the side the app's own code imports more; flag the other as advice ("consider consolidating") |
| neither | **radix** by default (bare names), but note it's an open choice until the first primitive lands |

The script derives it the same way every run, so the same project always
gets the same answer. Don't override it from memory of an earlier session:
that is how flavor mixing happens.

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
| Interaction-state tokens (`bg-hover`, `bg-active`) available | entry CSS (installed by `@fluid/tokens`, arrives with components and `use-fluid-hover`) | Custom code can't use the shared hover/active fills; ad-hoc grays creep in |
| `--overwrite` situation | stock shadcn files present in `components/ui/`? Are they actually stock, or customized (local edits, colocated stories/tests)? | Stock files: every `@fluid` install needs `--overwrite`, one explicit heads-up before the first install. Customized files: `--overwrite` would destroy local work — install to review (or diff the registry source against the local file) instead of a blind pass, and name the customized files in the reply |

### 4. Inventory (context for suggestions, not warnings)

- **Installed @fluid items**: presence of `lib/springs.ts`,
  `hooks/use-fluid-hover.ts`, `components/fluid-hover-highlight.tsx`,
  `lib/font-weight.ts`, `lib/icon-context.tsx`, and which `components/ui/*`
  files match registry items. The script lists them, and separates
  same-named files that are stock or local (diff those before any
  `--overwrite`). This tells you what can be imported right now versus what
  needs an install. It can't see a hand-rolled stand-in for a system piece (a
  local `use-proximity-hover` that is this project's `use-fluid-hover`, a
  `motion.ts` that is its `springs`); look for those, and offer to record one
  as a [decision](#decisions) so later sessions extend it instead of
  installing beside it.
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

## Measure before you advise

Source shows what a component asks for; only the rendered page shows what it
does. Most FF advice turns on questions source cannot settle — whether a
list's hover glides or blinks off between rows, whether selecting a tab
shoves its neighbours, which transition durations survive the cascade, which
control heights ship, whether the loaded font can render a weight change at
all. When the app runs, measure those instead of inferring them:

```bash
cd <skill>/scripts && npm install        # once: playwright-core
node audit.mjs http://localhost:3000/<route> [--widths 1280,390] [--json out.json]
```

Point it at the surfaces with the most exposure — the ones the shortlist is
going to be about — not at every route. It needs a Chromium (the Playwright
download, a local Chrome, or `CHROME_PATH`). What it reports, per viewport:

- **HOVER** — each labelled list of 3+ rows, classified by moving a real
  pointer: `glide` (FF's hook, identified by `data-fluid-hover-active-index`),
  `custom-glide` (a moving overlay that is not FF's hook), `per-row` (each
  row repaints its own fill, with whether it goes dark in the gap between
  rows), or `none`; plus any row that moves when a neighbour is hovered.
- **SELECT** — whether selecting a tab moves the other tabs (a weight change
  without a ghost span).
- **TRANSITIONS** — CSS durations off FF's tokens (0/60/80/120/160/180/240ms)
  and `transition-property: all`, with example elements.
- **LADDER** — the distribution of control heights against 36 / 28px.
- **FONT** — for each family that sets `font-variation-settings: 'wght'`,
  whether a variable face actually loaded. A static face means every weight
  change on the page is silently inert.
- **OVERFLOW** — horizontal overflow and the element causing it.

What it cannot see, so do not read silence as a pass: framer-motion springs
(they run in JS, not CSS transitions), popups and menus closed at load, states
behind auth, reduced-motion behavior, and taste. Screenshots at the same
widths still carry the judgment call; the numbers carry the claims.

Run it in bounded passes: once before advising, once after a change to confirm
it, then stop. If the app cannot run — no dev server, no browser — say so and
file any entry that depended on a measurement as a `check:` question rather
than a finding.

## The evidence gate

Every advice item and every shortlist entry passes this gate before it is
written, and it is what lets the audit be trusted on the next run:

1. **Evidence.** A line `audit.mjs` printed, quoted with its route and
   width, or a `file:line`. A hunch, a grep hit, a similar name, or "this
   looks hand-rolled" is a lead to measure, not evidence.
2. **Reach.** The evidence is on a surface people actually use in this
   product — the measured route renders it, or the file is on that route's
   render path. A problem in a demo page, a storybook, or a depicted mockup is
   not the product's problem.
3. **One correction.** The entry names exactly one FF replacement — the
   token, component, or registry item, in the project's flavor. If the
   evidence supports two corrections, or the fix needs product intent nobody
   has stated, it is a question for the user, not an entry.

Then try to break each survivor. Re-open what it cites and delete it when:

- the measurement or the file does not match what the entry claims;
- the difference is a documented exception or a recorded decision (a
  deliberate stillness, an off-token duration someone chose on purpose,
  explained by a comment beside the code or a line in the project's agent
  notes);
- the surface is depicted UI rather than the app's own chrome;
- another entry has the same root cause — merge them into one;
- it is infrastructure, which the shortlist never carries.

Evidence is the footnote, not the headline: the interface-first rule below
still decides how an entry reads. It sits on its own `evidence:` line in the
reply, so the user, or the next session, can re-check it instead of trusting
it.

If fewer than two entries survive, say so rather than pad. If none survive,
that is a result, not a failure — write *"No changes recommended: nothing
measured on <routes> departs from the system"* and stop. An audit that always
finds something teaches people to ignore it.

## Replacement shortlist (2–5 items, systems first)

Part of every audit and refresh: name the **2–5 upgrades** that would most
improve this project's UI, ranked, each rated for impact and effort. Two to
five is a hard band — one suggestion reads as an afterthought, six reads as
a rewrite plan. If fewer than two genuine candidates exist, say so; never
pad.

**UI and design system only.** Every slot goes to something the user sees or
feels. Infrastructure findings — dead dependencies, package-manager notes,
framework or Tailwind migrations, icon-library consolidation — are stated
as stack facts, but they never occupy a shortlist slot and
never lead the conversation. (An infra blocker can still appear *inside* an
entry, as the reason its effort is L.)

**Systems before components.** Work through the FF system pages
(fluidfunctionalism.com/docs — Motion, Fluid Hover, Surfaces, Sizes,
Typography, Scrollbars) before individual components: one system adopted lifts every
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
5. **Typography** (`size-context`, `typography`): five-plus text sizes or
   line heights in the wild, or chat replies and docs rendering markdown
   with stock or plugin prose styles → six roles with paired leading, and
   `.typeset` for the markdown.
6. **Scrollbars** (`scroll-area`) — default scrollbars inside panels and
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
question behind it, and it is the one worth asking. Offer to record the
answer as a [decision](#decisions) so no later run re-opens a settled
question.

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
medium-impact S usually belongs above a high-impact L. The shortlist goes in
the reply ([format below](#where-the-results-go)). A later audit rebuilds it
from fresh evidence: a done item has no evidence left and drops out, and a
declined one is settled by its decision.

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
- **State the blocker and its caveats once**: which requirement fails, and
  what a future migration must watch for (the `--overwrite` review list, the
  animation-package pick). `stack.mjs` reports both on every run, so the day
  the project migrates, the path is read from what is there then.
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

## Where the results go

In the reply, not a file. Lead with the shortlist; the stack facts are
context, one or two lines. Keep it under ~40 lines:

```markdown
**Stack**: Next.js app router, pnpm. Flavor base (installed select imports
@base-ui/react). Requirements met; stock shadcn card.tsx and tabs.tsx need a
diff before any --overwrite.

**Shortlist**
| Now | Replace with | Impact | Effort | Why | Evidence |
|---|---|---|---|---|---|
| durations hand-written in 6 files | springs (motion tokens) | high | S | exits reuse the entrance spring today, so dismissals drag; tokens pair every tier with a one-tier-quicker exit tween | components/panel.tsx:44, dock.tsx:18 (+4) |
| nav + table per-row :hover | use-fluid-hover | high | S | hover blinks off between rows; the highlight glides to the nearest row and a gap click still lands on what's lit | audit.mjs / @1280: per-row, dark in the 4px gap |
| static card grid (projects.tsx), the landing surface | card | med | M | the grid is the first thing anyone sees and nothing answers the cursor on it; the highlight tracks the nearest card in both axes and dividers drop beside the active one, with local markup to carry over | audit.mjs / @1280: none on 9 cards |
| hand-rolled command palette (cmd-k.tsx) | base/command-menu | med | M | keyboard scroll keeps the row centered and travels with the highlight; ⌘K resolves per-platform with a Dvorak-safe fallback, both missing locally | cmd-k.tsx:88 scrollIntoView, :31 metaKey only |

**Also worth fixing**
- Selecting a tab on /settings shoves the tabs beside it, so the row jumps
  each time the section changes; the label needs a ghost span.
  evidence: audit.mjs /settings @1280 — SELECT "General / Billing / Team":
  selecting tab 2 moved tab 3 by 2.8px
```

## Decisions

The only thing worth carrying between sessions is what the user decided,
because nothing in the code shows it: fluid hover declined, a stillness kept
on purpose, an off-token duration chosen deliberately, a hand-rolled hook
that stands in for `use-fluid-hover`. A decision is intent, not a snapshot
of the code, so it stays true until the user changes their mind. Record one
only when the user makes it, and only with their OK:

- **Tied to one place** (a duration, one still list): a one-line comment
  beside the code saying what was kept and why. The falsification pass
  re-opens the cited code and finds it, and the note goes away with the code
  it explains.

  ```tsx
  // 150ms on purpose: matches the OS sheet it sits on, not an FF token.
  ```

- **Project-wide** (fluid hover declined, a local alias of a system piece):
  one line under a `## Fluid Functionalism` heading in the agent notes the
  project already keeps (`AGENTS.md`, `CLAUDE.md`). `stack.mjs` finds that
  heading, in the app's directory or any directory above it up to the
  repository root, and prints it under `DECISIONS`.

  ```markdown
  ## Fluid Functionalism
  - Fluid hover: declined 2026-09-14, menus stay still on purpose.
  - hooks/use-proximity-hover.ts is this project's use-fluid-hover: extend
    it, don't install beside it.
  ```

Never create a new file for decisions. If the project keeps no agent notes,
or the user would rather not write any, keep the decision in your own memory
if you have one, or just in the reply. A lost decision costs one repeated
question, never a wrong install.

A written decision outlives your session and later sessions trust it, so
hold it to a higher bar than advice:

- Record what the user said or what you observed, not what you concluded
  from it: "GET /r/select-base.json → 404" is a fact; "the registry serves
  Radix only" is a conclusion the fact doesn't support. Before stating
  anything about what the registry serves, try the documented forms
  (`@fluid/base/<name>`, `/r/base/<name>.json`; see components.md).
- A claim you couldn't verify is a question for the user, not a decision.

## Earlier audit files

Earlier versions of this skill wrote `.agents/fluid-functionalism.md` (or
`.claude/fluid-functionalism.md`). When `stack.mjs` reports one, read it for
decisions only (answered questions, the done/declined list, local aliases of
system pieces) and honor them. Ignore its versions, inventory, verdicts, and
open advice: the script and a fresh measurement replace those. Don't update
it. Mention once that the skill no longer needs it, and offer to move its
decisions into the project's agent notes and delete it. Never delete it
unasked.

## Later runs

- **Run `stack.mjs` again**; it is the record. Trust what it prints over
  anything remembered from an earlier session.
- **Read the decisions it points at** before suggesting anything, and don't
  re-raise what they settle.
- **Before every install**, inspect or diff every same-named target file.
  Pass `--overwrite` only when that current check shows the targets are
  still stock.
- **Confirm with one more measurement**: after a change lands, re-run
  `audit.mjs` on the route it touched and call the item done only when the
  line that justified it is gone. One confirming run, not a loop.
- **Surface stack-level advice at natural moments**: a missing `opsz` axis
  when a task involves selected or active labels, a missing `MotionConfig`
  when it adds motion, not on every run. If the user declines, offer to
  record it as a decision so it stops being raised.
