# Preset system ("Get code")

Playground configurations encode into short, stateless codes (shadcn's
preset principle) that the registry turns into installable blocks:

```
rail state ──encode──▶  sahYNBB9O  ──/r/preset/<code>.json──▶ registry item
     ▲                      │
     └──── ?preset= ────────┘  (share link hydrates the rail)
```

A code is `<component><version><base62>` — `s` = sidebar, `a` = current
field layout. It is the configuration itself, bit-packed: no storage, no
lookup, decodable forever.

## The files

| File | Role |
|---|---|
| `lib/preset/codec.ts` | generic engine: bit-pack/base62, component tag registry |
| `lib/preset/components.ts` | imports every `*-options` module (side-effect registration) + typed wrappers — **import codes from here, not codec.ts** |
| `lib/preset/<name>-options.ts` | per component: PlayState + **codec field tables** + `registerPresetComponent` + demo content |
| `lib/preset/<name>-install.ts` | state → compilable files + a `PresetGenerator` (installable components only) |
| `lib/preset/generators.ts` | tag → generator map, consumed by the route |
| `lib/docs/preset-ui.tsx` | shared `GetCodeDialog`, `usePresetUrlSync`, `usePresetGlobals` |
| `app/r/preset/[code]/route.ts` | code → registry item, deps flavor-resolved; share-only tags 400 with the docs link |
| `lib/registry-urls.mjs` | bundler-safe twin of the postbuild's `depUrl` (parity-tested) |

Registered tags: `s` sidebar · `c` card · `m` input-message ·
`q` ask-user-questions · `d` dropdown · `b` combobox · `k` command-menu ·
`n` calendar · `p` date-picker — all installable. (`q` began share-only; its
globals fields were APPENDED when it became installable — the worked
example of the append rule: pre-existing `q` codes still decode, with
default globals.)

## Rules that must never break

Codes in the wild are permanent. Therefore, in `SIDEBAR_PRESET_FIELDS`:

1. **Never reorder a value array — only append.**
2. **Every field's default stays at index 0.**
3. **Only append new fields at the end.** Bump the version char (`a` → `b`)
   only for incompatible layout changes, keeping the old table registered
   in `codec.ts` so old codes still decode.
4. **Stay under 53 bits total** (JS safe-integer limit).

`tests/preset-codec.test.mjs` enforces 2 and 4 and pins rule 1/3 with a
golden inline snapshot — if that snapshot changes unexpectedly, you broke
every shared link. Fix the table, don't update the snapshot.

## Adding an option to the sidebar playground

1. Add the field to `PlayState` + `DEFAULT_STATE` + **append** it to
   `SIDEBAR_PRESET_FIELDS` (default first, headroom bits).
2. Teach both generators: the snippet (`buildSidebarPlaygroundCode`) and
   the installer (`sidebar-install.ts`).
3. `npm test` — the codec round-trip, the type-checked install matrix
   (real `ts.createProgram` over the project tsconfig), the parse fuzz,
   and dep-existence guards all must stay green.

## Adding a new playground

1. `lib/preset/<name>-options.ts`: state type, defaults, field table
   (defaults at index 0, globals fields last for installable components),
   `PresetComponentDef` with a fresh one-char tag, self-`register…` at
   module scope, encode/decode wrappers, default code.
2. Installable? `lib/preset/<name>-install.ts` with a `PresetGenerator`;
   add one entry to `generators.ts` and one export line to
   `components.ts`. Share-only? Set `installable: false` — the shared
   dialog turns into "Share" and the route refuses politely.
3. Wire the playground: `usePresetGlobals` + encode + `usePresetUrlSync`
   + `<GetCodeDialog def code>` at the rail bottom.
4. Tests: the generic codec guards in `tests/preset-codec.test.mjs` cover
   every registered def automatically; installable components add a
   `tests/preset-<name>.test.mjs` with the type-checked matrix + parse
   fuzz (copy the ts.createProgram harness).
The route's dependency URLs go through `buildDepResolver` so flavor
resolution can never drift from the static payloads.

## Gotchas learned building it

- The route can't import `scripts/postbuild-registry.mjs` (fs at module
  scope breaks bundling) — hence the resolver twin + parity test.
- Virtual-file type-checking needs `host.directoryExists` overridden too,
  not just `fileExists`/`readFile`.
- React 19 ref callbacks must not return a value (cleanup signature).
- `"utils"` stays a plain name in dependency lists — the default shadcn
  registry provides it, matching the static payloads.
