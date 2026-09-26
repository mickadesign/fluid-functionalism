# Component Documentation Guidelines

Checklist and conventions for documenting every new component in this project. Following this ensures consistency across all doc pages and compatibility with the shadcn registry.

---

## Checklist for a New Component

### 1. Component Source (`registry/default/<component-name>.tsx`)

- [ ] `"use client"` directive at the top
- [ ] TypeScript props interface extending native HTML attributes where applicable
- [ ] `forwardRef` with `displayName` set
- [ ] CVA (`class-variance-authority`) for variant/size management if the component has visual variants
- [ ] Named exports for the component, sub-components, variant helper, and props type
- [ ] Any text that changes weight on state (selected/checked/active/open) uses the **ghost-span pattern** (see below) — never animate weight on text without reserving its width
- [ ] Any animation uses a tier from `@/lib/springs` — `spring.<tier>` to enter, `spring.<tier>.exit` to leave (see [motion-guidelines.md](motion-guidelines.md))
- [ ] A list, menu, strip, or grid with hover uses `useFluidHover` **and renders `<FluidHoverHighlight hover={hover} />`** from `@/components/ui/fluid-hover-highlight` — never a hand-rolled `motion.div` fill (`tests/registry-consistency.test.mjs` fails on one). Rows join with `useRegisterFluidHoverItem`, and nothing re-measures on `children` changes (see [motion-guidelines.md](motion-guidelines.md#fluid-hover-registrydefaulthooksuse-fluid-hoverts))
- [ ] Uses `@/` path aliases for all internal imports:
  ```ts
  import { cn } from "@/lib/utils";
  import { springs } from "@/lib/springs";
  import { fontWeights } from "@/lib/font-weight";
  import { useShape } from "@/lib/shape-context";
  import { useIcon } from "@/lib/icon-context";
  import type { IconComponent } from "@/lib/icon-context";
  import { useFluidHover } from "@/hooks/use-fluid-hover";
  import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";
  ```

### 2. Registry Entry (`registry.json`)

Add an item to the `items` array:

```jsonc
{
  "name": "component-name",            // kebab-case, unique
  "type": "registry:ui",               // or registry:lib / registry:hook
  "title": "Component Name",           // human-readable
  "description": "One-two sentence description of what it does and key features.",
  "dependencies": ["framer-motion"],   // npm packages (only those not already in the project)
  "registryDependencies": ["utils"],   // other registry items this depends on
  "files": [
    { "path": "registry/default/component-name.tsx", "type": "registry:ui" }
    // add sub-component files here if any (e.g., menu-item.tsx for dropdown)
  ]
}
```

**Field rules:**
- `dependencies` = external npm packages (framer-motion, @radix-ui/*, lucide-react, class-variance-authority)
- `registryDependencies` = other items in this registry (utils, springs, font-weight, shape-context, icon-context, use-fluid-hover, or other components like button)
- Components that render icons depend on `icon-context` only — never add icon packages beyond `lucide-react` as `dependencies` (consumers bring their own via IconProvider)
- Multi-file components list all files in the `files` array

### 3. Generated Registry JSON (`public/r/<component-name>.json`)

Run the registry build script (`npm run registry:build`) to generate the JSON file. It must contain:
- `$schema: "https://ui.shadcn.com/schema/registry-item.json"`
- Full source code embedded in `files[].content`
- All metadata matching `registry.json`

> **Rebuild on every source edit, not just new components.** The JSONs in `public/r/` embed a *copy* of the source, so editing any registry file — a component **or** a shared lib like `lib/font-weight.ts` — leaves the published registry stale until you re-run `npm run registry:build`. Editing a shared lib only regenerates that lib's JSON (e.g. `font-weight.json`); consumers reference it by `registryDependencies`, so they don't need rebuilding, but the lib does. Commit the regenerated JSONs alongside the source, and rebuild before any `vercel --prod` deploy.

### 4. Component List Entry (`lib/docs/components.ts`)

Add an entry to `componentList`:

```ts
{ slug: "component-name", name: "ComponentName", description: "Short description." }
```

- `slug` must match the folder name under `app/docs/`
- `description` should be concise (one sentence)

### 5. Documentation Page (`app/docs/<component-name>/page.tsx`)

This is the main deliverable. Structure:

```tsx
"use client";

import { useState } from "react";
import { ComponentName } from "@/registry/default/component-name";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

// --- Code snippets as string constants ---
const basicCode = `import { ComponentName } from "./components";

<ComponentName />`;

// --- Props table data ---
const componentProps: PropDef[] = [
  { name: "variant", type: '"a" | "b"', default: '"a"', description: "Visual style." },
  // ...
];

export default function ComponentNameDoc() {
  return (
    <DocPage
      title="ComponentName"
      description="One-two sentence description matching the registry."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          {/* Live interactive preview */}
          <ComponentName />
        </ComponentPreview>
      </DocSection>

      {/* One DocSection per feature/variant */}

      <DocSection title="API Reference">
        <PropsTable props={componentProps} />
      </DocSection>
    </DocPage>
  );
}
```

### 5b. Prompt Entry (`lib/docs/prompt-entries.ts`)

Every doc page has a matching `PROMPT_ENTRIES` entry — it feeds the page's
Copy-prompt brief and the skill's craft reference:

- [ ] `usage`: minimal composition, ~12 lines, imports from the installed
      paths (`@/components/ui/*`), never the repo's registry paths
- [ ] `props`: one line per public prop — `name: type (default X). What it does.`
- [ ] `craft`: 5–10 bullets of the interaction-design decisions built into
      the component — exact behaviors, exact values, the why where the code
      or page states one. One decision per bullet, sourced from the shipped
      code, never aspirational.
- [ ] Regenerate the skill's craft reference:
      `node scripts/build-skill-craft.mjs` (writes
      `skills/fluid-functionalism/references/craft.md`) and commit both files
      together — the script fails if a page's `craft` array is missing.

### 6. Motion System Page (`app/docs/motion/page.tsx`)

If the component animates, add it to the `REFERENCE_TIERS` array on the Motion page so its "Where each speed shows up" list stays complete, and keep [motion-guidelines.md](motion-guidelines.md) in sync. Pick the spring tier by the component's headline motion (small state flip → `fast`; panel/indicator that travels → `moderate`; surface that takes over the view → `slow`), enter on that tier, and exit one tier faster. See [motion-guidelines.md](motion-guidelines.md) for the full motion checklist.

---

### 7. README (`README.md`)

Add a row to the Components table (or Systems / Blocks) with the docs link, the registry name(s), and a one-line description. A dual-flavor component lists both names: `` `name` · `base/name` ``. `tests/readme-consistency.test.mjs` fails when a docs entry has no README link or a listed name has no `public/r` payload. The README carries no roster counts, so nothing else in its copy changes; [README-guidelines.md](README-guidelines.md) says what the file carries and what it defers.

---

## Animated Font Weight — the Ghost-Span Pattern

When text gets heavier on an interactive state (selected, checked, active, open, interacting), **every** instance in this project uses the same structure. A heavier weight is wider, so animating weight on a bare text node causes the layout to reflow as the user interacts. To prevent this, render an invisible "ghost" copy of the label at the **heaviest** weight to reserve the width, and overlay the visible (animating) copy in the same grid cell.

**Required structure — copy verbatim:**

```tsx
<span className="inline-grid">
  {/* Ghost: reserves width at the heaviest weight, hidden from AT */}
  <span
    className="col-start-1 row-start-1 invisible"
    style={{ fontVariationSettings: fontWeights.semibold }}
    aria-hidden="true"
  >
    {label}
  </span>
  {/* Visible: animates between weights in the same cell */}
  <span
    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
    style={{
      fontVariationSettings: isSelected
        ? fontWeights.semibold
        : fontWeights.normal,
    }}
  >
    {label}
  </span>
</span>
```

**Rules:**
- Weight comes from `fontVariationSettings` + the `fontWeights` tokens (`@/lib/font-weight`), **never** `font-weight` / `fontWeight` — the design uses Inter's variable `wght` axis.
- Each `fontWeights` token also pairs in an optical-size (`opsz`) value (e.g. `"'wght' 550, 'opsz' 20"`). This is intentional, **not** a stray axis: a heavier `wght` widens the text and a tighter (higher) `opsz` pulls it back, so animating between weights keeps the advance width nearly constant — the closed→bold delta drops from ~3px to ~0.6px (≈±0.5%), centered on zero. A sub-pixel residual remains because a single opsz value can't zero every string (glyph mixes scale differently); the ghost span still pins the container, so nothing reflows regardless. `font-variation-settings` interpolates `opsz` alongside `wght` during the transition. The explicit `opsz` overrides `font-optical-sizing: auto` on purpose — weight, not font-size, drives optical size here. Always read these from the tokens; never hand-write a bare `'wght' N` string.
- The ghost span is always set to the **heaviest** weight the visible span can reach, carries `invisible` + `aria-hidden="true"`, and renders the identical content.
- Both spans share the cell via `col-start-1 row-start-1` inside an `inline-grid` (or `grid`/`inline-grid flex-1` when it must fill a row).
- The transition **must** include `font-variation-settings` in its property list (e.g. `transition-[color,font-variation-settings] duration-80`). Plain `transition-colors` / `transition-opacity` will *not* animate weight — it snaps. Use `duration-80` (the slider's value readout is the one intentional exception at `duration-100`).
- Skip the ghost span only when the weight is **static** for the lifetime of the node (e.g. table header vs body rows never change) or the element is already a **fixed-size box** (e.g. a `w-5 h-5` chip holding a single digit) — there is nothing to reflow.
- **Standard weight pairs:** resting `normal` → active `semibold` (400 → 550) is the default for selected/checked/active/open states. Use `medium` as the *resting* weight only when the component's default text is already medium and you want a smaller jump to `semibold` (e.g. ask-user options, 450 → 550). The slider's value readout is the lone `normal` → `medium` case. Don't invent new pairs — pick from these so the whole system animates at consistent magnitudes.
- **If you change the weight tokens or introduce much larger text,** re-measure and re-tune the paired `opsz` values. Method: render the label in an offscreen `<span style="font-optical-sizing:none">`, measure `getBoundingClientRect().width` at the resting `wght/opsz` vs each candidate bold `opsz`, and pick the `opsz` that centers the closed→bold width delta on zero across representative labels (longer strings dominate the perceived shift). The current values were tuned this way against real component labels.

Reference implementations: `menu-item.tsx`, `nav-item.tsx`, `tabs-subtle.tsx`, `accordion.tsx`, `checkbox-group.tsx`, `radio-group.tsx`, `color-picker.tsx`, `ask-user-questions.tsx`.

---

## Global Keyboard Shortcuts — the Mounted-Instance Registry Pattern

When a component owns a **global** key (AskUserQuestions' 1-9 digits, Sidebar's
`[` / `]` toggle), the listener must be window/document-level so the key works
without focus in the component — but doc pages mount many instances, and the
site may add its own. Without scoping, every instance answers the same
keypress. The established pattern (source: `ask-user-questions.tsx`
`mountedInstances`, replicated in `sidebar-core.tsx` `mountedProviders`):

1. **Module-level registry**: `const mountedInstances: HTMLElement[] = []`.
   Each instance pushes its root element in a mount effect and splices it out
   on unmount.
2. **Exactly one instance answers a keypress**, resolved in the global handler:
   - the instance **containing focus** (`root.contains(e.target)`) — and when
     instances can NEST (an app-shell provider wrapping doc previews), only
     the **innermost** containing instance (skip if another registered root
     inside yours also contains the target);
   - if focus is inside a *different* instance → return (that one answers);
   - if focus is outside every instance → when instances can nest, the
     **outermost** registered instance answers (the one not contained by any
     other) — do NOT use mount order for this: a persistent app-shell
     instance mounts once while doc demos mount later on client-side
     navigation, so "most recently mounted" picks a demo.
     (AskUserQuestions' flat sibling demos use most-recently-mounted, which
     is fine there because its instances never nest.)
3. **Standard guards first**: bail on `metaKey`/`ctrlKey`/`altKey` and on
   editable targets (INPUT / TEXTAREA / SELECT / `isContentEditable`).
4. **Handled arrows call `e.stopPropagation()`** so window-level listeners
   (the docs site's ←/→ page navigation in `sidebar-layout.tsx`) don't also
   fire — roles like `radiogroup`/`menu` are auto-skipped by that handler, but
   unrole'd containers (multi-select groups, `data-sidebar` menus) are not.

With this scoping in place, doc previews do NOT need to disable the shortcut —
a focused preview answers its own key while the site-level instance answers
everywhere else.

---

## Documentation Page Conventions

### Imports

- Always use `@/` path aliases, never relative paths like `../../`
- Component: `@/registry/default/<component-name>`
- Doc utilities: `@/lib/docs/ComponentPreview`, `@/lib/docs/PropsTable`, `@/lib/docs/DocPage`
- Icons: `@/lib/icon-context` (`useIcon`, `useIcons` hooks, `IconComponent` type)
  - Components with internal icons: `import { useIcon } from "@/lib/icon-context";`
  - Components accepting icon props: `import type { IconComponent } from "@/lib/icon-context";`
  - Doc pages: call `useIcon("icon-name")` inside the component function for each icon needed
  - Icon prop type is `IconComponent`, not `LucideIcon`
  - **Adding a new icon name**: add it to `IconName` + `defaultIcons` (Lucide) in
    `registry/default/lib/icon-context.tsx`, **and** to all four maps in the docs-only
    `lib/docs/icon-map.tsx` (Tabler, Phosphor, HugeIcons, Untitled UI) so the site's
    library switcher keeps working
  - **Installed vs docs-only**: only the Lucide slot system ships to consumers
    (`icon-context`, deps = `lucide-react` alone). The multi-library map and the I/R
    keyboard shortcuts live in `lib/docs/` and must never be imported from `registry/`
    files — same for `document`-level key listeners in general (GitHub issue #19)

### Code Snippets

- Define as `const` string literals at the top of the file, before the component
- Use simplified import paths in snippets (e.g., `from "./components"`) since these are display-only
- Show only the relevant JSX, not full boilerplate
- Each snippet should be self-contained and copy-pasteable

### Sections

Every doc page must include these sections (in order):

1. **Feature sections** - One `<DocSection>` per distinct feature or variant group. Each wraps a `<ComponentPreview>` with:
   - `code` prop: the matching code snippet string
   - `children`: the live interactive preview
2. **API Reference** - Final section with `<PropsTable>` listing all public props

Typical section breakdown by component type:
- **Components with variants**: Variants, Sizes, With Icons, States (loading/disabled)
- **Group components**: Basic, Controlled, With descriptions/icons
- **Layout components**: Basic, Responsive, Custom content

### Props Table (`PropDef`)

```ts
interface PropDef {
  name: string;        // prop name
  type: string;        // TypeScript type as a string (use quotes for union literals)
  default?: string;    // default value as string, omit if required
  description: string; // one sentence
}
```

- List every public prop
- For sub-components with their own props, add a separate `<PropsTable>` under a sub-heading
- Use exact TypeScript union syntax: `'"primary" | "secondary"'`

### Live Previews

- Wrap interactive demos in `<div className="flex flex-wrap items-center gap-2">` (or `gap-3`, `flex-col` as needed)
- Use `useState` for interactive examples (toggles, loading states, selections)
- Keep previews focused: show the feature the section is about, nothing more

---

## Naming Conventions

| Item | Format | Example |
|---|---|---|
| Component file | kebab-case | `radio-group.tsx` |
| Component export | PascalCase | `RadioGroup` |
| Registry name | kebab-case | `radio-group` |
| Doc page folder | kebab-case | `app/docs/radio-group/` |
| Doc page file | `page.tsx` | `app/docs/radio-group/page.tsx` |
| Doc component list slug | kebab-case | `radio-group` |
| Props type | PascalCase + Props | `RadioGroupProps` |

---

## Quick Reference: File Locations

```
registry/default/
  component-name.tsx          ← component source
  lib/utils.ts                ← shared utilities
  lib/springs.ts              ← animation tokens
  lib/font-weight.ts          ← font weight tokens
  lib/shape-context.tsx        ← shape provider (no key shortcut — that's docs-only)
  lib/icon-context.tsx         ← icon slots, Lucide defaults, IconProvider override
  hooks/use-fluid-hover.ts ← fluid hover hook

lib/docs/
  ComponentPreview.tsx         ← preview + code tabs
  PropsTable.tsx               ← props documentation table
  DocPage.tsx                  ← DocPage + DocSection wrappers
  components.ts                ← component list for sidebar nav
  highlight.ts                 ← Shiki syntax highlighting
  icon-map.tsx                 ← docs-only multi-library icon map (Tabler/Phosphor/…)
  icon-playground.tsx          ← docs-only library switcher provider + "I" shortcut
  shape-shortcut.tsx           ← docs-only "R" radius shortcut

app/docs/
  layout.tsx                   ← sidebar layout (reads componentList)
  page.tsx                     ← index page (lists all components)
  <component-name>/page.tsx    ← individual doc pages

registry.json                  ← shadcn registry source of truth
public/r/<name>.json           ← generated registry JSONs
components.json                ← shadcn CLI config
```
