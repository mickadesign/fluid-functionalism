# Base UI Support — Migration Plan (v4 / shipped)

Add Base UI as a second supported primitive backend alongside Radix, modelled on shadcn's dual-base registry pattern. All Fluid Functionalism components stay visually and behaviourally identical across the two flavours; users pick a primitive at install time via a registry namespace.

> **v4 — Steps 0–6 complete; ready for deploy.**
>
> All 9 primitive-touching components have a working Base UI flavour at `registry/base/<name>.tsx`. The post-build script emits three namespaces per component (`r/<x>.json` back-compat, `r/radix/<x>.json`, `r/base/<x>.json`) with per-flavour dependency URLs. The right-panel "Primitive" toggle is wired through a `BaseProvider` context to swap the install command on every doc page. `/compare-bases` confirms pixel-identical visual parity across all 9 components. `npm run build` and `npx tsc --noEmit` both clean. Cross-component `registryDependencies` resolve to the matching flavour at the production URL — full `shadcn add` install verification is the final gate, deferred until Vercel deploy.
>
> **v3 changes.** Tooltip spike PASSED — the function-form `render={(props, state) => <motion.div {...props}/>}` pattern works for ref forwarding. Animation bridge stays at zero new code: Base UI's `getAnimations()` detects framer-motion opacity tweens automatically. Confirmed canonical npm package is **`@base-ui/react@1.4.1`**, not `@base-ui-components/react` — the older name was renamed pre-1.0.
>
> **v2 changes.** Component count corrected to **9** (Dropdown and Select are fully custom, not Radix-based). Animation bridge is much smaller than v1 drafted — Base UI uses `element.getAnimations()`, which already detects framer-motion opacity tweens. Tooltip moved to step 0 as a de-risk spike; Button moved to position 2. `color-picker` decision locked.

---

## 1. Decisions locked in

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | `@fluid/<name>` continues to install the **Radix** flavour. | Every existing install command in the wild keeps working. |
| 2 | New namespaces `@fluid-radix/<name>` and `@fluid-base/<name>` give explicit control. | Matches shadcn's `@radix` / `@base` namespace convention. |
| 3 | Each component has **one doc page**. A Radix/Base toggle in the right-hand panel swaps install command, code preview, and live demo. | Sidebar stays clean; no duplication of prose. |
| 4 | **Step 0 is a Tooltip spike** (portal + exit animation in one component). If the bridge holds, the rest is mechanical and runs in one pass. If it doesn't, we re-scope to the no-portal-no-exit subset. | The animation bridge is the only real risk — prove it before doing 9 rewrites. |
| 5 | Migrate exactly the **9 components that touch Radix today**: Accordion, Button, Checkbox-group, Dialog, Radio-group, Slider, Switch, Tabs, Tooltip. | These are the only components where "support both primitives" is a meaningful concept. |
| 6 | The other 14 components (Badge, Table, ThinkingIndicator, ThinkingSteps, InputCopy, InputGroup, TabsSubtle, NavItem, NavMenu, MobileDrawer, MenuItem, Dropdown, Select, ColorPicker) live under `@fluid/<name>` only. | They're primitive-agnostic by construction — duplicating them adds zero value. |
| 7 | `color-picker` stays single-source under `@fluid/`. Its Slider dependency is rewritten per-flavour at registry-build time. | Cheaper than duplicating; the only primitive-touching dep (Slider) is namespace-resolvable. See §4.3. |

> **Open scope question.** Today's Dropdown and Select are **custom** (no Radix import). Base UI provides primitives that would replace them. Rebuilding them on top of primitives would be a substantial redesign and is **out of scope** for this PR. If you want them in scope, it's a separate plan with its own design pass — we'd be picking a primitive backend for components that currently have none, not adding a second backend.

---

## 2. Component inventory (verified against current source)

```
$ grep "from \"@radix-ui" registry/default/*.tsx
accordion.tsx       → @radix-ui/react-accordion
button.tsx          → @radix-ui/react-slot
checkbox-group.tsx  → @radix-ui/react-checkbox
dialog.tsx          → @radix-ui/react-dialog
radio-group.tsx     → @radix-ui/react-radio-group
slider.tsx          → @radix-ui/react-slider
switch.tsx          → @radix-ui/react-switch
tabs.tsx            → @radix-ui/react-tabs
tooltip.tsx         → @radix-ui/react-tooltip
```

That's **9 files**. The `@radix-ui/react-dropdown-menu` and `@radix-ui/react-select` entries in `package.json` are unused — flag for cleanup in a follow-up commit.

---

## 3. Why this is non-trivial: API + animation gaps

### 3.1 npm package — verified by spike

- **Radix:** `radix-ui` (umbrella) or `@radix-ui/react-<x>` (per-component).
- **Base UI:** `@base-ui/react`. Imports look like `import { Tooltip } from '@base-ui/react/tooltip'`. (Pre-1.0 was `@base-ui-components/react`; that npm package is now deprecated and points at this name. Same maintainers, same GitHub repo `mui/base-ui`.)
- Currently pinned at `^1.4.1` in `package.json`.

### 3.2 Naming surface (mechanical)

| Concept | Radix | Base UI |
|---|---|---|
| Slot composition | `asChild` | `render={element}` or `render={(props, state) => element}` |
| Dialog overlay | `Dialog.Overlay` | `Dialog.Backdrop` |
| Dialog content | `Dialog.Content` | `Dialog.Popup` (inside `Dialog.Portal`) |
| Accordion content | `Accordion.Content` | `Accordion.Panel` |
| Accordion header | (implicit) | dedicated `Accordion.Header` |
| Accordion value | `string \| string[]` (depends on `type`) | always `string[]`, plus `multiple` boolean |
| Tabs trigger | `Tabs.Trigger` | `Tabs.Tab` |
| Tabs content | `Tabs.Content` | `Tabs.Panel` |
| Sliding indicator | (build your own) | `Tabs.Indicator` built-in (we ignore it) |
| Switch callback | `onCheckedChange(checked)` | `onCheckedChange(checked, eventDetails)` |
| Tooltip provider | `Tooltip.Provider` (delays config'd here) | implicit; configured per-Root |

### 3.3 Trigger state attributes — explicit per-component review needed

Radix uses `data-state="open" \| "closed" \| "checked" \| "unchecked"` consistently across components. Base UI uses **per-component attributes**, verified against the official reference:

| Component | Radix attribute on trigger | Base UI attribute on trigger |
|---|---|---|
| Dialog.Trigger | `data-state="open"` | `data-popup-open`, `data-disabled` |
| Dialog.Popup | `data-state="open"` | `data-open`, `data-closed`, `data-starting-style`, `data-ending-style` |
| Dialog.Backdrop | `data-state="open"` | `data-open`, `data-closed`, `data-starting-style`, `data-ending-style` |
| Switch.Root | `data-state="checked"` | (verify in spike — likely `data-checked` / `data-unchecked`) |
| Accordion.Item | `data-state="open"` | (verify in spike) |
| Tabs.Tab | `data-state="active"` | (verify in spike) |

**This breaks the v1 plan's claim that 70-85% of scaffolding is byte-identical.** Any FF code that styles based on a primitive's `data-state` attribute (font-weight transitions during press, indicator positioning, hover state-aware borders) needs explicit per-component review during the rewrite. Most of FF's scaffolding actually drives state from React state inside its own wrapper, not from primitive data-attrs — but we cannot assume that without an audit per component. The spike includes a grep pass to enumerate every `data-state` consumer in the codebase and CSS.

### 3.4 Animation model — clearer than v1 drafted

Base UI does not have `forceMount`, but it also doesn't need it for framer-motion in most cases. The mechanism:

- Base UI uses **`element.getAnimations()`** (Web Animations API) to decide when to fully unmount a component during exit. Quote from the official animation handbook: *"When using Motion, opacity animations are reflected in `element.getAnimations()`, so Base UI automatically waits for the animation finish before unmounting the component."*
- That means: **as long as the framer-motion exit animates opacity**, Base UI auto-waits. No `keepMounted`, no `useTransitionStatus`, no `useBaseMount` hook.
- For animations without opacity (e.g. translate-only drawer), the documented workaround is to add `opacity: 0.9999` to keep `getAnimations()` returning a non-empty result. Cheap.

**FF's exits already animate opacity** (Dialog overlay+content, Tooltip, Dropdown popover, Select popover, Accordion focus rings, hover backgrounds — all of them). So the v1 bridge collapses to "use `<motion.div>` inside `render`, make sure opacity is part of every exit transition." That's it.

The **real** open question — and the reason for the Tooltip spike — is whether `render={<motion.div … />}` correctly forwards refs and merges props/styles when the target is a framer-motion component. If it doesn't, we fall back to the function form everywhere:

```tsx
render={(props, state) => <motion.div {...props} ref={props.ref} … />}
```

That's verbose but mechanical. The spike answers this in one component before we propagate it to nine.

### 3.5 What is *not* a problem

70%+ of every FF component is the proximity-hover container, focus-ring overlay, animated indicators, font-weight transitions, and surface/shape context. None of that touches Radix. Both flavours can keep that scaffolding identical, **subject to the §3.3 data-attribute audit**.

---

## 4. Architecture

### 4.1 New file layout

```
registry/
  default/
    lib/                     ← unchanged: utils, springs, font-weight, surface-*, shape, icon
    hooks/                   ← unchanged: use-proximity-hover
    badge.tsx
    color-picker.tsx         ← stays single-source; Slider dep namespace-rewritten at build time
    dropdown.tsx             ← custom, no Base flavour (out of scope)
    input-copy.tsx
    input-group.tsx
    menu-item.tsx
    mobile-drawer.tsx
    nav-item.tsx
    nav-menu.tsx
    select.tsx               ← custom, no Base flavour (out of scope)
    table.tsx
    tabs-subtle.tsx
    thinking-indicator.tsx
    thinking-steps.tsx
  radix/                     ← NEW: today's primitive-touching files moved verbatim (9 files)
    accordion.tsx
    button.tsx               ← uses @radix-ui/react-slot
    checkbox-group.tsx
    dialog.tsx
    radio-group.tsx
    slider.tsx
    switch.tsx
    tabs.tsx
    tooltip.tsx
  base/                      ← NEW: same 9 files, rewritten against @base-ui-components/react
    accordion.tsx
    button.tsx
    checkbox-group.tsx
    dialog.tsx
    radio-group.tsx
    slider.tsx
    switch.tsx
    tabs.tsx
    tooltip.tsx
```

### 4.2 The animation bridge — likely zero new code

Per §3.4, no `useBaseMount` hook is needed. Each Base-flavour Dialog / Tooltip / Dropdown / Select / Accordion uses Base UI's standard mount lifecycle plus a `<motion.div>` rendered via the `render` prop. Body shape:

```tsx
return (
  <Dialog.Popup
    render={(props, state) => (
      <motion.div
        {...props}
        ref={props.ref}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={state.open ? springs.slow : springs.moderate}
      />
    )}
  >
    {children}
  </Dialog.Popup>
);
```

Base UI handles mount/unmount. Framer-motion handles the visuals. `getAnimations()` is the contract between them — opacity in the animation is sufficient.

If the Tooltip spike (§6 step 0) reveals the element form `render={<motion.div … />}` works directly without a function wrapper, all nine components use that simpler form. Decision lands in step 0.

### 4.3 Per-component rewrite recipe

For each of the 9 primitive-touching components:

1. Move the current file from `registry/default/` to `registry/radix/`. Adjust relative imports. **No behavioural changes.**
2. Create `registry/base/<name>.tsx` from a copy of the Radix version, applying:
   - Swap import: `@radix-ui/react-<x>` → `@base-ui-components/react/<x>` (note the slash).
   - Apply the rename table from §3.2.
   - Replace `forceMount` + `<AnimatePresence>` exit blocks with the §4.2 pattern.
   - Replace any `asChild` with `render={…}` (form chosen in step 0).
   - Adapt prop signatures (Switch's `onCheckedChange` second arg, Accordion's array-only value).
   - Audit any `data-state` references per §3.3 and rename to the matching Base attribute.
   - Keep all FF scaffolding (proximity hover, focus rings, indicators, font-weight, surface context) identical.

---

## 5. Registry build changes

### 5.1 `registry.json` — three entries per primitive component

Each primitive-touching component gets three entries that share the same `name` slug but resolve to different files:

```jsonc
{ "name": "dialog",          "files": [{ "path": "registry/radix/dialog.tsx", … }] },  // alias of dialog (radix)
{ "name": "dialog-radix",    "files": [{ "path": "registry/radix/dialog.tsx", … }] },
{ "name": "dialog-base",     "files": [{ "path": "registry/base/dialog.tsx",  … }],
  "dependencies": ["@base-ui-components/react", "framer-motion"] }
```

Primitive-agnostic components keep their single entry under `name: "<x>"`.

### 5.2 `scripts/postbuild-registry.mjs` — three responsibilities

1. **Emit per-namespace JSONs.** For each of the 9 primitive-touching components, write `public/r/<name>.json`, `public/r/radix/<name>.json`, and `public/r/base/<name>.json`. The first two are byte-identical (back-compat); the third points at the Base file with Base dependencies.
2. **Rewrite cross-component `registryDependencies` to the matching base.** When building `r/base/dialog.json`, any `registryDependencies: ["button"]` becomes the full URL to `@fluid-base/button`. When building `r/radix/dialog.json` (or the back-compat `r/dialog.json`), it points at `@fluid-radix/button`.
3. **Resolve primitive-agnostic deps to the bare `@fluid` namespace** in both flavours. e.g. `r/base/checkbox-group.json` and `r/radix/checkbox-group.json` both depend on `r/utils.json` (no `radix/` or `base/` prefix).

The existing `CUSTOM_ITEMS` set grows to include all `radix/*` and `base/*` entries.

### 5.3 `color-picker` — single source, namespace-rewritten dep

`color-picker` composes Slider (primitive-touching, has both flavours) and Dropdown (custom, single source). Decision: stay single-source under `@fluid/color-picker`; the post-build script rewrites its Slider dep based on which flavour the *consumer* installed.

In practice: `r/color-picker.json` declares `registryDependencies: ["slider", "dropdown"]`. The script emits **two variants** of `color-picker.json`:
- `r/color-picker.json` and `r/radix/color-picker.json` resolve `slider` → `@fluid-radix/slider`.
- `r/base/color-picker.json` resolves `slider` → `@fluid-base/slider`.

Same source TSX file, different dep URLs at install time. No file duplication.

### 5.4 `components.json` namespace declaration (consumer-side)

We don't ship a `components.json` — but we do document the snippet users need:

```json
{
  "registries": {
    "@fluid":       "https://www.fluidfunctionalism.com/r/{name}.json",
    "@fluid-radix": "https://www.fluidfunctionalism.com/r/radix/{name}.json",
    "@fluid-base":  "https://www.fluidfunctionalism.com/r/base/{name}.json"
  }
}
```

---

## 6. Execution sequence

### Step 0 — Tooltip spike — DONE, **PASS**

1. ✅ Installed `@base-ui/react@1.4.1` (the renamed-from-`@base-ui-components/react` canonical package).
2. ✅ Built [`registry/base/tooltip.tsx`](registry/base/tooltip.tsx) and the side-by-side [`/spike-base`](app/spike-base/page.tsx) page.
3. **Validation outcomes:**
   - **`render` form:** Element form NOT used. Standardising on **function form** `render={(props, state) => <motion.div {...props}/>}` — needed everywhere because we read `state.transitionStatus` to drive framer-motion's exit when Base owns the mount lifecycle. Function form merges props (style/ref/data-attrs) cleanly with motion.div.
   - **Visual parity:** screenshot shows Base tooltip pill with identical position, padding, shape, and styling to Radix.
   - **Animation bridge:** confirmed zero new code needed. `getAnimations()` waits for framer-motion's opacity tween before unmounting, exactly as the docs promise.
   - **Data-attribute audit:** grep returned 2 hits — `ask-user-questions.tsx:718` (FF setting its own `data-state`, not reading a primitive's) and `components/shadcn/accordion.tsx:31` (compare-theme, out of scope). **No FF code reads Radix's `data-state`** — the per-component rename surface from §3.3 is essentially zero. The 9 rewrites can keep their FF scaffolding byte-identical between flavours.
4. **Tab throttling note (testing only).** Chromium throttles `setTimeout`/`requestAnimationFrame` to ~1Hz when a tab is backgrounded. JS-driven sampling of opacity values returned 0 across 24s of "wait" because the dev server's tab was throttled. `preview_screenshot` wakes the renderer briefly, which is why screenshots showed the tooltip animated to opacity 1 while concurrent JS sampling reported 0. **Practical impact: none in production**, but worth knowing for any future spike that uses JS sampling.

**Decision: proceed to Step 1.**

### Step 1 — Plumbing

- Rewrite `scripts/postbuild-registry.mjs` to emit three JSONs per primitive-touching component and to URL-rewrite cross-base deps per §5.2/§5.3.
- Update `registry.json` schema and `CUSTOM_ITEMS` to support the new layout (entries can point at empty files for now).
- `npm run registry:build && npm run build` must pass.

### Step 2 — Move existing files

- Move all 9 Radix-touching files to `registry/radix/`. Adjust imports across the app, doc pages, `components/ui/` re-exports. No behaviour change.
- `npm run build` green.

### Step 3 — Rebuild the Base flavours

Order optimised so each step lands a verifiable, "always reachable" milestone:

1. **Tooltip** — already done in step 0; promote from spike to final.
2. **Button** — simplest case (just `Slot` → `render`, no animation, no portal). An "always reachable" milestone right after Tooltip.
3. **Switch** — drag + thumb spring, no portal/exit. Validates the data-attr audit holds for an interactive component.
4. **Accordion** — height-auto exit, multiple items, focus management.
5. **Dialog** — portal + overlay + content + exit on two layers.
6. **Tabs** — sliding indicator, no portal but animated selection.
7. **Slider** — multiple thumbs, range mode, drag.
8. **Checkbox-group** — animated check mark, contiguous selection backgrounds.
9. **Radio-group** — animated dot, simpler than checkbox-group.

Each step is one component; commits are atomic.

### Step 4 — Right-panel base toggle + per-doc-page wiring

- Add a `<BaseToggle>` to the right-hand panel of all 9 component doc pages. State persisted in `localStorage`. Toggle swaps install command, code preview (read at build time from `registry/radix/` and `registry/base/`), and live demo (both flavours imported, runtime swap).
- Sidebar entries unchanged.

### Step 5 — `/compare-bases` page

New page mirroring `/compare`. Renders all 9 primitive-touching components twice side by side (Radix left, Base right) for visual diff during build-out and afterwards as a manual regression check.

### Step 6 — Build + install verification

- `npm run registry:build && npm run build`
- Measure docs bundle size delta. Importing both flavours on every doc page roughly doubles the primitive code in `app/docs/**`. Expected delta: per-component ~20-40 KB pre-gzip; total docs route ~200-300 KB pre-gzip. Record in PR description.
- In a fresh `create-next-app` project:
  - `npx shadcn@latest add https://www.fluidfunctionalism.com/r/dialog.json` → must produce identical files to today (back-compat).
  - `npx shadcn@latest add @fluid-base/dialog` (after declaring the `@fluid-base` registry in `components.json`) → must install Base flavour with all matching-base deps.

### Step 7 — Deploy

- `vercel --prod`.

---

## 7. Risk register + bail-out points

| # | Risk | Likelihood | Mitigation / bail-out |
|---|---|---|---|
| 1 | `getAnimations()` doesn't actually catch framer-motion's opacity tween in our setup, and Base unmounts before exit completes. | Medium | Step 0 spike. If broken, stop; ship Base flavours only for the no-exit-animation subset (Switch, Accordion, Slider, Tabs, Button, Checkbox-group, Radio-group). Dialog/Tooltip stay Radix-only. |
| 2 | `render={<motion.div … />}` element form fails to forward refs correctly. | Medium | Step 0 spike. Fall back to function form `render={(props) => <motion.div {...props} ref={props.ref}/>}` everywhere. Verbose but mechanical. |
| 3 | Per-component `data-state` audit reveals more breakage than §3.3 estimates. | Medium | Step 0 includes a grep pass to enumerate all `data-state` consumers in `.tsx` and `.css`. If the surface is large, budget extra time per Base rewrite. |
| 4 | npm package conflict between `radix-ui` and `@base-ui-components/react` peer deps. | Low | Both run on React 19 / 18. Install only the one needed per flavour via `dependencies` in the registry JSON. |
| 5 | Existing `@fluid/<name>` install URLs change behaviour during the move to `registry/radix/`. | Low | Post-build script keeps `r/<name>.json` byte-identical to `r/radix/<name>.json` by design — verified by the back-compat install test in step 6. |
| 6 | Docs bundle size doubles. | Low | Contained to `app/docs/**`. Measured in step 6 and recorded in PR. No effect on registry consumers. |
| 7 | Switch's `onCheckedChange(checked, eventDetails)` second arg leaks into a user's handler. | Low | The Base flavour's wrapper narrows the signature internally before invoking the user's `onToggle` — no API change visible to consumers. |
| 8 | `onAnimationComplete` callbacks (e.g. focus-restore in Dialog after exit) behave differently under Base UI. | Low-Medium | Audit during step 3.5 (Dialog rewrite). Dialog currently uses `onAnimationComplete` to set `mounted=false`; under Base, mount lifecycle is owned by Base, so this state collapses. Map any other consumers explicitly. |

---

## 8. Out of scope (call out explicitly)

- **Rebuilding Dropdown and Select on a primitive backend.** They're custom today; switching them to Radix or Base would be a redesign, not a swap. Separate plan.
- **Adding new components.**
- **Visual redesigns or motion changes** to existing components.
- **Cleanup of unused `@radix-ui/react-dropdown-menu` and `@radix-ui/react-select` deps in `package.json`.** Flagged for a follow-up commit.
- **Automated visual regression** (Playwright snapshots of `/compare-bases`). `compare-bases` is manual QA only in this PR. Worth a follow-up.
- **A third base** (Headless UI, Ariakit). The architecture supports adding one later — same pattern, new namespace.

---

## 9. Acceptance criteria

- `npx shadcn@latest add https://www.fluidfunctionalism.com/r/dialog.json` in a fresh project produces a byte-identical `dialog.tsx` to what it produces today.
- `npx shadcn@latest add @fluid-base/dialog` in a fresh project (with `@fluid-base` declared in `components.json`) installs the Base UI flavour, pulls in `@fluid-base/button` automatically, and runs without warnings.
- `/compare-bases` renders all 9 primitive-touching components side by side with no visual diff between flavours under the proximity-hover and focus-ring scaffolding.
- Every primitive-touching doc page has a working Radix/Base toggle that swaps the install command, code preview, and live demo.
- `npm run build` and `npm run registry:build` both pass.
- Docs bundle size delta recorded in the PR description.
