# Changelog guidelines

What a monthly release on `/changelog` carries, how each change is sorted, and
the exact file format. These rules bind the first-Friday changelog routine as
much as a person writing a release by hand. `tests/changelog.test.ts` enforces
the format; the rest is judgment.


## The release

- One Markdown file per calendar month: `content/changelog/YYYY-MM.md`.
- A month covers everything that landed on `main` between the 1st, 00:00 UTC,
  and the 1st of the next month, 00:00 UTC. A merged PR counts on its merge
  date, not its first commit.
- It ships on the first Friday of the next month: the routine drafts it that
  morning as a PR, the maintainer edits, merges, and deploys.
- A month with nothing reader-facing gets no file. The page skips it.


## 3 kinds

| Kind | Means | Examples |
|---|---|---|
| New | A component or system that just landed: a registry item, a system page, or a doc page that shipped publicly this month. | Banner, the Sizes system, the agent skill |
| Updated | A change to something already here: a new prop or variant, new behavior, a visual change, a fix. | Dropdown submenus, 16px fields on touch screens |
| Breaking | An API change that needs a migration: after re-running `shadcn add`, the reader has to change their own code or setup. | A removed or renamed prop, export, or class; a changed default that a prop can turn back; a token or dependency the app now has to add |

Rules of thumb:

- A new prop on an existing component is Updated, never New.
- Breaking needs something to migrate. A behavior change with nothing for the
  reader to change is Updated. A changed default is Breaking when a prop
  brings the old behavior back, and that prop goes in the diff.
- A visual change with no way back (a restyle, a size bump) is Updated, even
  when it is large.
- A registry bug (an install missing a file or a token) is not Breaking. It
  becomes an Updated entry in the month the fix lands.
- Breaking wins: a change that is both Updated and Breaking is Breaking.
- "Shipped publicly" means listed: in the sidebar, the README, or the
  registry index. A page that stays unlisted waits for the month it is listed.
- Something that landed and was reworked in the same month is one New entry
  describing where it ended up.
- A block or registry item with no page of its own folds into the entry of
  the page that documents it. Dependency-only items (a shared hook, `popup`)
  fold into the components that use them.
- Name things as they are called today. An old name appears only where a
  Breaking rename needs it.
- One entry per label per kind. Fold several changes into one sentence (two
  at most). A change across 2 components gets an entry under each.
- Aim for 4 to 15 entries. Below that cut, leave the small fixes out.


## Leave out

- Internal tooling: `evals/`, `tests/`, `scripts/`, CI, git hooks, lint rules
  that only guard this repo.
- `README.md`, the `*-guidelines.md` files, `tone-of-voice.md`, memory notes.
- Hidden or unlisted pages: `/demo`, `/concepts`, `/stars`, `/500stars`,
  `/compare-bases`, `/slider`, `/table`.
- Site chrome: the sidebar and its dots, the "Make them yours" panel, shortcut
  toasts, Showcase tiles, the 404 page, metadata, OG images, favicons,
  analytics, robots and sitemap, deploy config, `LICENSE`.
- Chores, merge commits, registry rebuilds, version bumps.
- Anything added and removed inside the same month, even if a deploy shipped
  it in between: it nets out.
- Docs-only copy edits. A docs change makes the cut when it adds a page, a
  section, or a feature a reader would come back for (Copy prompt, presets).
- A PR that is partly any of the above: cite it on the entries it does touch.


## Format

The example shows the shape, not real history.

````md
---
month: 2026-09
released: 2026-10-02
title: Combobox, the agent skill, and one fluid hover for every list
---

One optional line that says what the month was about.

## New

- [Combobox](/docs/combobox): Type to filter, arrow through, press Enter to pick. (8c1d2e3)

## Breaking

- [Card](/docs/card): On `CardGroup`, `proximityHover` is renamed `fluidHover`. (ef767f3)

  ```diff
  - <CardGroup proximityHover={false}>
  + <CardGroup fluidHover={false}>
  ```

## Updated

- [Dropdown](/docs/dropdown): `Enter` and `Space` select the focused row on Base UI. (#40)
- **All components**: Installs pass the React Compiler lint in a fresh Next 16 app. (#51)
````

- **Frontmatter**: `month` (`YYYY-MM`, matches the file name), `title`, and
  `released` (`YYYY-MM-DD`, the Friday it shipped). Backfilled months leave
  `released` out. Nothing else.
- **Title**: a headline for the whole month, 90 characters at most. Name
  every New item, system pages before components, then the change most
  readers will notice (a new default, a change across components). Commas
  between items, `and` before the last one, no period. When the New items
  don't fit, count them: `5 components`.
- **Intro**: optional, one line under the frontmatter that adds to the title
  instead of repeating it: what the month changes for someone using the
  library, ending on how many entries need a migration when any do.
- **Sections**: only `## New`, `## Breaking`, `## Updated`, in that order.
  Leave out a section with no entries.
- **Order**: inside a section, system pages first (the sidebar's System
  group: Fluid Hover, Motion, Skill, ...), then component pages, then other
  site routes, then bold labels, each A to Z.
- **Entry**: one list item: a label, a colon, one or two sentences, then the
  refs in parentheses.
  - Label: `[Name](/docs/slug)` when the change has a page, with `Name` as the
    sidebar spells it (`CommandMenu`, `Fluid Hover`). Any other site route
    works too (`/`, `/docs`, `/compare`). A change with no page of its own
    gets a bold label naming it: `**All components**`, `**Base UI flavor**`,
    `**Copy prompt**`.
  - Sentence: starts with a capital, a digit, or inline code, and ends with a
    period. Inline code for anything the reader types. Nothing else inline:
    no links, no bold. Keys read as the reader presses them (`⌘K`,
    `Enter`), not as the string an API takes (`mod+k`).
  - Refs: 1 to 3, comma-separated. `#52` for a merged PR, a 7-character SHA
    for a commit that went straight to `main` (a merge commit is fine). Prefer
    the PR; otherwise cite the commits that carry what the sentence says, not
    the refactors and docs commits around them. A `#4` in a commit message
    can be an issue: check with `gh pr view 4` before citing it as a PR.
- **Breaking entries** carry exactly one ` ```diff ` block, indented under the
  item: the call site before (`-`) and after (`+`). When the migration is not
  a call site (a token to add, an install command), the diff shows that line,
  and a diff with only `+` lines is fine. The page builds the Copy migration
  prompt from the label, the sentence, and this diff. The fence is
  ` ```diff ` for TSX; name another language after it when the lines are
  CSS, TS, JSON, or a shell command: ` ```diff css `.
- **Markers**: the latest release drives every New and Updated marker on
  the site. A `/docs/` label under New dots its sidebar row and badges its
  Showcase card; one under Updated or Breaking reads Updated in ⌘K. The
  markers move on when the next release merges. A page that lands after a
  release can keep its New badge and sidebar dot through
  `AHEAD_OF_RELEASE` in `lib/changelog/load.ts`; its entry lapses once the
  release for its month exists, and the routine deletes it in its PR.


## Voice

Follow `tone-of-voice.md`, including its **Changelog variant**: new state
first, the new name as the subject, instructions only to migrate, 3 code
spans and 25 words per sentence at most. Say what the reader gets, not what
the commit did: "`Enter` selects the focused row" beats "Fix onClick wiring
in MenuItem". The test fails on an em dash, a banned word, or a sentence
over the limits.


## The routine

The first-Friday routine follows these steps. A person backfilling a month
follows the same ones.

1. Run every Friday, stop unless the date is the 1st to the 7th.
2. Work out the previous month. Stop if `content/changelog/<month>.md`
   already exists.
3. `git fetch origin`, then list what landed (`--since`/`--until` filter on
   the committer date, so print that one):
   `git log --first-parent origin/main --since=<month>-01T00:00:00Z --until=<next month>-01T00:00:00Z --format='%h %cd %s' --date=short`,
   and the merged PRs:
   `gh pr list --state merged --search "merged:<month>-01..<last day>" --json number,title,body,mergedAt,files --limit 100`.
4. Read each PR body and each direct commit's message and diff stat. Diff
   `registry.json`, `lib/docs/components.ts`, and `README.md` across the
   month to find what shipped publicly, which is what can be New. Read the
   previous month's file so nothing is listed as New twice.
5. Sort every reader-facing change into a kind, write the file, delete any
   `AHEAD_OF_RELEASE` entry for the month (`lib/changelog/load.ts`), and run
   `npx vitest run tests/changelog.test.ts`.
6. Open a PR from `changelog/<month>` titled `Changelog: <Month YYYY>`. Its
   body lists the entries whose kind was a judgment call, and every left-out
   commit grouped by reason, so the maintainer can overrule either. Never push
   to `main`, never deploy.
