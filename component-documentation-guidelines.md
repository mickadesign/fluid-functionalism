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
- [ ] Uses `@/` path aliases for all internal imports:
  ```ts
  import { cn } from "@/lib/utils";
  import { springs } from "@/lib/springs";
  import { fontWeights } from "@/lib/font-weight";
  import { useShape } from "@/lib/shape-context";
  import { useProximityHover } from "@/hooks/use-proximity-hover";
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
- `registryDependencies` = other items in this registry (utils, springs, font-weight, shape-context, use-proximity-hover, or other components like button)
- Multi-file components list all files in the `files` array

### 3. Generated Registry JSON (`public/r/<component-name>.json`)

Run the registry build script to generate the JSON file. It must contain:
- `$schema: "https://ui.shadcn.com/schema/registry-item.json"`
- Full source code embedded in `files[].content`
- All metadata matching `registry.json`

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

---

## Documentation Page Conventions

### Imports

- Always use `@/` path aliases, never relative paths like `../../`
- Component: `@/registry/default/<component-name>`
- Doc utilities: `@/lib/docs/ComponentPreview`, `@/lib/docs/PropsTable`, `@/lib/docs/DocPage`
- Icons: `lucide-react`

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
  lib/shape-context.tsx        ← shape provider
  hooks/use-proximity-hover.ts ← proximity hook

lib/docs/
  ComponentPreview.tsx         ← preview + code tabs
  PropsTable.tsx               ← props documentation table
  DocPage.tsx                  ← DocPage + DocSection wrappers
  components.ts                ← component list for sidebar nav
  highlight.ts                 ← Shiki syntax highlighting

app/docs/
  layout.tsx                   ← sidebar layout (reads componentList)
  page.tsx                     ← index page (lists all components)
  <component-name>/page.tsx    ← individual doc pages

registry.json                  ← shadcn registry source of truth
public/r/<name>.json           ← generated registry JSONs
components.json                ← shadcn CLI config
```
