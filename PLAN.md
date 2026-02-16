# Fluid Functionalism — Shadcn Registry Migration Plan

## Decisions
- **Distribution**: Standalone registry first, then submit to official shadcn index
- **Hosting**: Migrate to Next.js (official registry template pattern)
- **Dependencies**: All components require framer-motion, shape-context, springs, etc.
- **Style name**: `default`

---

## Phase 1: Project restructure to Next.js registry template

### 1.1 Initialize Next.js project structure
- Add Next.js, React 19, and required deps to `package.json`
- Create `next.config.ts`
- Update `tsconfig.json` for Next.js
- Add `postcss.config.mjs` for Tailwind v4

### 1.2 Create `components.json`
- Configure aliases (`@/components`, `@/lib`, `@/hooks`)
- Set Tailwind CSS path
- Set component style to "default"

### 1.3 Create registry directory structure
```
registry/
└── default/
    ├── button/
    │   └── button.tsx
    ├── checkbox/
    │   └── checkbox.tsx
    ├── dialog/
    │   └── dialog.tsx
    ├── dropdown/
    │   ├── dropdown.tsx
    │   └── menu-item.tsx
    ├── input-group/
    │   └── input-group.tsx
    ├── radio-group/
    │   └── radio-group.tsx
    ├── subtle-tab/
    │   └── subtle-tab.tsx
    ├── switch/
    │   └── switch.tsx
    ├── table/
    │   └── table.tsx
    ├── thinking-indicator/
    │   └── thinking-indicator.tsx
    ├── use-proximity-hover/
    │   └── use-proximity-hover.ts
    ├── shape-context/
    │   └── shape-context.tsx
    ├── springs/
    │   └── springs.ts
    ├── font-weight/
    │   └── font-weight.ts
    └── utils/
        └── utils.ts
```

### 1.4 Move and adapt component files
- Copy each component from `src/components/` to `registry/default/[name]/`
- Update import paths to use `@/` aliases
- Ensure each file uses standard shadcn import conventions

---

## Phase 2: Create `registry.json`

### 2.1 Define the registry manifest
```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "fluid-functionalism",
  "homepage": "https://github.com/mickadesign/fluid-functionalism",
  "items": [...]
}
```

### 2.2 Define each registry item with:
- `name`, `title`, `description`
- `type` — `registry:ui` for UI primitives, `registry:block` for compound components
- `dependencies` — npm packages (framer-motion, @radix-ui/*, etc.)
- `registryDependencies` — other registry items (e.g., button depends on utils, shape-context)
- `files` — array of { path, type }
- `cssVars` — theme tokens where applicable

### 2.3 Item type mapping:
| Component | Type | Dependencies (npm) | Registry Dependencies |
|---|---|---|---|
| button | registry:ui | framer-motion, @radix-ui/react-slot, cva, lucide-react | utils, shape-context, springs |
| checkbox | registry:ui | framer-motion, @radix-ui/react-checkbox | utils, shape-context, springs, use-proximity-hover |
| dialog | registry:ui | framer-motion, @radix-ui/react-dialog | utils, springs |
| dropdown | registry:ui | framer-motion, @radix-ui/react-dropdown-menu | utils, shape-context, springs, use-proximity-hover, menu-item |
| menu-item | registry:ui | framer-motion | utils, springs |
| input-group | registry:ui | framer-motion | utils, shape-context, springs, use-proximity-hover |
| radio-group | registry:ui | framer-motion, @radix-ui/react-radio-group | utils, shape-context, springs, use-proximity-hover |
| subtle-tab | registry:ui | framer-motion, @radix-ui/react-tabs | utils, springs |
| switch | registry:ui | framer-motion, @radix-ui/react-switch | utils, shape-context, springs |
| table | registry:ui | framer-motion | utils, shape-context, springs, use-proximity-hover |
| thinking-indicator | registry:ui | — | utils |
| use-proximity-hover | registry:hook | — | — |
| shape-context | registry:lib | — | — |
| springs | registry:lib | — | — |
| font-weight | registry:lib | — | — |
| utils | registry:lib | clsx, tailwind-merge | — |

---

## Phase 3: Build pipeline and hosting

### 3.1 Add shadcn build script
- `"registry:build": "shadcn build"` in package.json
- This generates `public/r/[name].json` for each registry item

### 3.2 Create demo app page
- Move the existing Vite demo (`App.tsx`) into Next.js `app/page.tsx`
- Create a showcase page for all components

### 3.3 Add route handler (optional)
- `app/r/[name]/route.ts` to serve registry items dynamically

---

## Phase 4: CSS variables and theming

### 4.1 Define cssVars in registry items
- Map existing CSS custom properties to shadcn convention
- Include both light and dark mode values
- Document any extra tokens (--neutral-*, --selected, etc.)

### 4.2 Create a theme registry item
- Bundle all CSS variables as a `registry:style` item
- Include font configuration (Inter variable font)

---

## Phase 5: Validation and testing

### 5.1 Build and validate
- Run `shadcn build` to generate registry JSON
- Validate each output file against the schema
- Test installation: `shadcn add http://localhost:3000/r/button.json`

### 5.2 Test in a fresh project
- Create a fresh Next.js app
- Install components via the registry URL
- Verify they render and animate correctly

---

## Phase 6: Submit to official shadcn registry index

### 6.1 Ensure compliance
- Registry is open source and publicly accessible
- All items conform to registry-item schema
- Files array has no `content` property
- Flat registry with no nested items

### 6.2 Submit PR
- Add entry to `apps/v4/registry/directory.json` in shadcn-ui/ui repo
- Run `pnpm registry:build` to update registries.json
- Create PR with description of the Fluid Functionalism design system
