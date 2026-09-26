# README guidelines

What `README.md` carries, what it defers, and what guards it. The README is
the front page for a visitor arriving from GitHub, not a second docs site.
These rules bind the weekly README audit routine as much as a person editing
the file.


## 4 jobs

1. Say what this is in 10 seconds: name, tagline, one paragraph, links to
   the docs, the component list, and the compare page.
2. Get a component installed without a failed first run.
3. Index everything that ships, one line each, with a link to its page.
4. Tell a contributor how the repo works.

A section earns its place only if a GitHub visitor needs it before reaching
the site.


## Carries

| Section | Source of truth | Guard |
|---|---|---|
| Wordmark: tracked caps between two rules, top of the file | this file | test: present, first thing in the file |
| Tagline and intro | `app/page.tsx` tagline; the docs Introduction for the principles | routine |
| Install: `registry add @fluid`, `@fluid/<name>`, the URL form | shadcn CLI; the registry is listed in shadcn's directory | routine |
| Flavor rule: the `base/` prefix | `lib/dual-flavor-slugs.mjs` | test: names resolve to `public/r` |
| `--overwrite` note | `lib/docs/install-prompt.ts` | routine |
| Inter with its `opsz` axis | `registry/default/lib/font-weight.ts`, `app/globals.css` | routine |
| Copy prompt paragraph | `lib/docs/install-prompt.ts` | routine |
| Agent skill paragraph | `skills/fluid-functionalism/SKILL.md` | routine |
| Components table | `componentList` in `lib/docs/components.ts` | test: every slug linked |
| Systems table | `systemList` in `lib/docs/components.ts`; `installSlug` on each system page | test |
| Blocks table: top-level compositions only | `registry:block` items in `registry.json`, minus the parts of `sidebar-app` | test: names resolve |
| Presets: the named playgrounds and the URL shapes | `lib/preset/*-options.ts`, `app/r/preset/[code]/route.ts` | routine |
| Icons: the `IconProvider` example | `registry/default/lib/icon-context.tsx` | routine |
| Principles | the docs Introduction, `app/docs/page.tsx` | stable; changes only with the site |
| Tech stack | `package.json` | routine, major versions only |
| Development: scripts, the `public/r` commit rule, guide links | `package.json` scripts, `.github/workflows/ci.yml`, the root `*-guidelines.md` files | routine |
| Contributing: issue first, then the checklist | this file | stable |
| License | `LICENSE` | stable |


## Defers

- Props, usage snippets, demos, per-component motion: the doc pages and
  the Copy prompt own them. Duplicating them here guarantees drift.
- System internals (spring values, the elevation ladder, the size ladder):
  the system pages. One line each in the Systems table.
- Preset and playground mechanics: `preset-guidelines.md`.
- Plans and migration records (`*-PLAN.md`): history, not linked.
- Changelogs: git history and the routine's pull requests. A CHANGELOG
  earns its place once versions are tagged, not before.
- Media: none. The README is text-only; the site shows the motion. The
  one exception is the wordmark at the top: tracked capitals between two
  rules, in a code block padded with 5 empty rows above and below. It is
  fixed, the test checks for it, and no other art joins it.
- Badges: none for now. A single CI badge is the only one worth adding,
  and only once main is reliably green.


## Rules

1. **The README documents main.** Prod may lag. The weekly audit reports
   the gap; it never trims rows for items that are not live yet.
2. **Every claim has a source file** (the table above). No source, no claim.
3. **No roster counts.** Never write "26 components" or "7 playgrounds":
   rosters change weekly and the number drifts first. The tables are the
   count. Numbers inside a description (`3 widths`, `8 levels`, `36px`)
   are component facts and stay, per `tone-of-voice.md` rule 2.
4. **Tables:** one row per roster entry, one line per row, components in
   alphabetical order. The second cell holds only registry names in
   backticks, `name` alone or `name` · `base/name` when the Base UI
   prefix works. The test parses that cell.
5. **Tone:** `tone-of-voice.md`. No em dashes; the test blocks them.
6. **Size:** about 200 lines. Add a section only by removing or shortening
   another.
7. **Edit the minimum.** A section that is still accurate is not rewritten.
8. **Contributions:** open an issue before a pull request. The README says
   so in 2 sentences and points at `component-documentation-guidelines.md`.


## Guards

- `tests/readme-consistency.test.mjs`: every docs entry is linked, every
  advertised registry name has a `public/r` payload, no em dashes, no
  roster counts.
- The weekly README audit, a claude.ai routine that runs Mondays at 9am
  Pacific: it reads the week's merges on main, audits the README against
  the sources above, and opens a pull request on `readme-audit/<date>`
  only when something drifted.
- `component-documentation-guidelines.md`, step 7: the README row is part
  of shipping a component.
