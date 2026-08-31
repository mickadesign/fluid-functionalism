# Integration and flavors

## Preflight the consumer

Inspect before changing anything:

- `package.json`: React, Tailwind, Framer Motion, Radix, Base UI, and icon dependencies.
- `components.json`: aliases, RSC mode, TypeScript mode, CSS entry point, and icon library.
- Global CSS: shadcn semantic variables, Tailwind theme mappings, dark-mode strategy, focus tokens, and FF-specific tokens.
- Root layout/providers: reduced motion, theme, shape, size, and icon decisions.
- Existing component sources: preserve the project's established backend and local customizations.

This snapshot targets React 19, Tailwind CSS 4, Framer Motion 12, and the shadcn registry protocol. Do not assume Tailwind 3 or a non-React target is drop-in compatible.

## Choose the payload, not just the source flavor

The 16 dual-source components are:

```text
accordion
button
checkbox-group
dialog
dropdown
mobile-drawer
radio-group
scroll-area
select
sidebar
slider
switch
tabs
tabs-subtle
thinking-steps
tooltip
```

Four additional components are single-source but have both Radix and Base payloads because they compose dual-flavor dependencies:

```text
ask-user-questions
color-picker
input-copy
input-message
```

For those four, choosing the Base payload changes transitive installs even though their own source file remains under `registry/default/`.

Use the query script rather than inferring availability:

```text
node scripts/query-registry.mjs input-message --flavor base
```

## Install URLs

The documented namespace installs the backward-compatible Radix/default payload:

```text
npx shadcn@latest registry add @fluid
npx shadcn@latest add @fluid/button
```

Direct URLs make flavor selection explicit:

```text
# Backward-compatible Radix payload
npx shadcn@latest add https://www.fluidfunctionalism.com/r/button.json

# Explicit Radix namespace
npx shadcn@latest add https://www.fluidfunctionalism.com/r/radix/button.json

# Base UI namespace
npx shadcn@latest add https://www.fluidfunctionalism.com/r/base/button.json
```

For a primitive-agnostic item with no flavor-specific payload, always use the flat URL. Do not invent a `/base/` URL; check `public/r/base/` or use the query script.

Network installation is an external mutation. Run it only when implementation is authorized. If the target is offline, use the committed `public/r/**` payload and referenced `registry/**` sources as the snapshot, preserve the dependency graph, and state that live registry freshness was not verified.

## Imports after installation

The shadcn CLI maps files through the consumer's aliases. Typical imports are:

```tsx
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/springs";
import { useProximityHover } from "@/hooks/use-proximity-hover";
```

Follow the paths the CLI actually wrote. Never leave consumer code importing this repository's `@/registry/radix/*`, `@/registry/base/*`, or `@/registry/default/*` paths.

Do not copy the docs site's `components/flavored/*` wrappers. A consumer installs one coherent flavor; it does not need a runtime primitive switcher.

## Host CSS contract

The components use ordinary shadcn semantic tokens such as `background`, `foreground`, `card`, `muted`, `accent`, `border`, `input`, and `destructive`. They also use FF-specific tokens and Tailwind mappings that are defined in `app/globals.css` but are not all declared by each component's registry metadata:

```text
--hover / --color-hover
--active / --color-active
--selected / --color-selected
--focus-ring
--overlay                    (an RGB triplet consumed with alpha)
--surface-1 .. --surface-8
--shadow-1 .. --shadow-8
--checker-a / --checker-b    (ColorPicker)
```

After installation, search the selected source for `bg-hover`, `bg-active`, `bg-selected`, `var(--overlay)`, `surface-*`, and checker tokens. If the host lacks the matching definitions, add only the relevant token block and Tailwind theme mappings from `app/globals.css`. Do not copy the entire site stylesheet: it also contains documentation chrome, page scroll behavior, responsive rails, and demo utilities.

The `surfaces` registry theme supplies the surface/shadow ladder. Elevated components reach it through `elevated`, but it does not replace every interactive token above. Treat a successful shadcn command as dependency installation, not proof that the visual token contract is complete.

## Providers and fonts

- Wrap the application or relevant tree in `<MotionConfig reducedMotion="user">` when Framer Motion components are used.
- `ShapeProvider` is optional. Without one, `useShape()` falls back to `pill`; this docs site explicitly chooses `rounded` at its root.
- `SizeProvider` is optional. Without one, components use the 36px `default` step. Use a controlled compact provider for dense regions rather than raw height/font overrides.
- `IconProvider` is optional. Lucide is the default; override named slots to use another library. Do not add per-component icon-library imports.
- `SurfaceProvider` is normally managed by elevated components. Use it directly when composing a new nested substrate.
- Use the consumer's theme solution. The repository's `theme-context.tsx` is site infrastructure and is not a published registry item.
- Weight animation requires a variable Inter font with `wght` and `opsz` support. If the host keeps another font, verify behavior and either provide equivalent calibrated tokens or accept static weight; do not pretend the Inter calibration transfers unchanged.

## Preserve local ownership

Registry components are copied into the consumer. Inspect existing copies before reinstalling or overwriting them. If local edits exist, merge intentionally and preserve the target's behavior, naming, tests, and design tokens.
