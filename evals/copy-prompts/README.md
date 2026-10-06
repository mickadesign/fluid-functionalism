# Copy-prompt sweep

A weekly check that each doc page's Copy prompt still gets a component working when someone pastes it into Claude Code, Cursor or Codex, with no Fluid Functionalism skill installed.

## What one run does

1. Builds the brief with the site's own code (`lib/docs/install-prompt.ts`), so it is the exact text the Copy prompt button gives. One line goes on the end: "Show it on the home page".
2. Scaffolds a fresh Next app with `shadcn@latest init`, in the brief's flavor. It uses `@latest` on purpose: changes to the shadcn CLI land here before users hit them.
3. Runs the brief's install command with no agent. If that fails, the registry or the brief is broken, and the agents skip that brief.
4. Gives each agent the brief in its own copy of the project, with permission to edit files and run commands.
5. Grades the project each agent leaves behind:

| Check | Passes when |
|---|---|
| `installed` | every file the no-agent install wrote exists |
| `untouched` | those files match the no-agent install exactly. The brief says to compose, not edit, so an edit usually means the agent worked around a broken brief |
| `flavor` | no file the agent wrote or edited imports the other flavor's primitives (`@radix-ui` in a Base UI project, `@base-ui` in a Radix one). Files that match the no-agent install don't count: a few Radix payloads use Base UI on purpose |
| `deps` | the npm packages the install adds are in `package.json` |
| `used` | an app file imports the brief's component |
| `typecheck`, `build` | `tsc --noEmit` and `next build` pass |
| `render` | `next start` serves `/` with no uncaught or console errors |
| `looks` | a vision model compares the page with the docs demo (a preset compares with its no-agent render) and finds nothing broken. A stock shadcn theme looks different from the site, and the rubric allows for that |

A failed run gets one retry in a fresh copy. Passing on the retry shows as `~`.

A run whose page rendered but got no `looks` verdict shows as `?`, unverified: the judge timed out, hit a usage limit, or gave a malformed answer twice, or a screenshot is missing. It doesn't count as a pass, lands under "Needs a look", and doesn't get an agent retry, since running the agent again wouldn't fix the judge.

2 more signals never fail a run but land under "Needs a look":

- **Lint:** the no-agent install is checked with the fresh project's own `eslint.config.mjs`. Anyone who runs `npm run lint` after installing sees those problems.
- **Slow passes:** a pass that took an agent 1.75× its usual time. A brief with a mistake the agent had to work around still passes, and its time is the only sign.

## Which briefs run

70 briefs: every doc page in each flavor it ships, plus each installable playground's default preset. Each week runs about 25 of them:

- **Top 10:** the most installed briefs over the last 28 days, from the "Registry fetch" analytics in `middleware.ts`. Reading them needs a logged-in `vercel` CLI and a linked project (`.vercel/project.json`). Systems are left out, because every component install fetches springs and the other shared libs as dependencies.
- **Rotation:** everything else, in 4 buckets by ISO week, so every brief runs at least once every 4 weeks.

## Running it

```bash
npm run eval:copy-prompts -- --dry-run
```

`--dry-run` prints this week's selection and the agents it found. Without it, the sweep runs and writes to `evals/copy-prompts/results/<timestamp>/` (gitignored):

- `report.html`: the matrix, what needs a look, and the screenshots of anything that failed
- `summary.md`: a few lines for a chat message
- `results.json`: everything, compared next week to show what broke and what got fixed
- `logs/` and `shots/`: transcripts, build output, screenshots

Useful flags: `--briefs dropdown@base,preset:card@radix`, `--agents claude`, `--agents none` (no-agent installs and builds only, a 10-minute registry health check), `--list`, `--no-retry`, `--no-judge`, `--concurrency 2`, `--keep-work`, `--results-dir <path>`.

## What it needs

- Node 22+, Google Chrome (for screenshots), and the agent CLIs logged in: `claude`, Cursor's `agent` (or `cursor-agent`), and `codex`. A missing CLI shows as "not installed" in the report.
- The judge runs on `claude` with `--judge-model` (default `opus`).
- Runs happen in a temp folder outside the repo, deleted afterwards. Claude Code and Cursor run with full permissions there. Codex runs in its workspace sandbox with network on.
- Each agent starts as cold as its CLI allows. Claude Code runs without skills, MCP servers or user settings. Codex runs with memories off. Cursor runs as configured, on its default `Auto` model. The brief itself suggests adding the skill, so an agent may install it mid-run: that is the brief working as written.
- Each run installs from the live registry, so it also counts in the "Registry fetch" numbers: about 25 briefs × 4 installs a week.
