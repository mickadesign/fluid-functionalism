---
name: fluid-functionalism
description: Optionally use or reference Fluid Functionalism shadcn registry components when building or refining React and Tailwind interfaces. Apply it for component inspiration, direct integration, Radix/Base payload selection, or adapting its motion, sizing, surface, icon, and accessibility patterns; never force the library when another approach better fits the user's project or intent.
---

# Fluid Functionalism

Use this repository as an optional component source and design reference. Direct adoption, partial adaptation, and reference-only use are all valid. Do not force Fluid Functionalism into a target or replace an established design system unless the user requests it. When its components are selected, prefer the public registry contracts over re-creating them from screenshots.

Preserve the user's requested scope. A request to inspect, recommend, or plan is read-only; install or edit components only when the user asked for implementation.

## Establish the target

Before selecting or installing components, inspect the target project's `package.json`, `components.json`, global CSS, import aliases, Tailwind version, existing Radix/Base UI dependencies, variable font setup, and root providers. Preserve an established primitive backend and theme unless the user requests a migration.

Use `node <skill-dir>/scripts/query-registry.mjs <component> --flavor radix|base` to retrieve the current source, docs, dependencies, and install payload without loading the full registry. Use `--search <terms>` when choosing a component by capability.

## Read only what the task needs

- For component selection and public/support boundaries, read [references/component-catalog.md](references/component-catalog.md).
- For installation URLs, flavor choice, host CSS, fonts, providers, and imports, read [references/integration-and-flavors.md](references/integration-and-flavors.md).
- For motion, hover, weight, size, shape, surface, icon, focus, keyboard, and reduced-motion rules, read [references/system-invariants.md](references/system-invariants.md).
- For composing complete product surfaces, read [references/composition-patterns.md](references/composition-patterns.md).

Then inspect only the selected component's `registry/**` source and `app/docs/<slug>/page.tsx`. For ScrollArea, use `app/docs/scrollbars/page.tsx`.

## Source authority

Use sources in this order:

1. `registry.json` and the referenced `registry/{default,radix,base}/**` source.
2. The matching documentation page and `lib/docs/components.ts`.
3. `motion-guidelines.md`, `component-documentation-guidelines.md`, `app/globals.css`, and `eslint.config.mjs` for system behavior.
4. `public/r/**` for the actual committed install payload and flavor-specific dependency graph.

Treat `BASE-UI-MIGRATION-PLAN.md` as historical. Do not derive the current flavor inventory from it. `public/design-notes.pdf` is a placeholder, not a specification.

## Integration boundaries

- Install or adapt the smallest component set that satisfies the requested interaction. Let shadcn resolve declared registry dependencies.
- Choose flavor from the target stack and the actual available payloads. A component can have one source yet still need a flavor-specific payload because it composes dual-flavor dependencies.
- After installation, import from the target project's shadcn aliases, normally `@/components/ui/*`, `@/lib/*`, and `@/hooks/*`. Never ship imports from this repository's `@/registry/*` paths.
- Do not copy `components/flavored/*`, `lib/docs/*`, `app/components/*`, or docs-site shortcut/providers into a consumer. They are site infrastructure.
- Use the target application's theme provider. `registry/default/lib/theme-context.tsx` is not a published registry item.
- Preserve public component semantics and primitive behavior. Customize through props, target theme tokens, and composition before editing component internals.

## Preserve the system

Do not invent animation durations, raw font weights, isolated control sizes, arbitrary elevation, or component-specific icon-library imports. Use the repository's tokens and patterns described in [references/system-invariants.md](references/system-invariants.md).

Do not claim complete reduced-motion, touch, accessibility, or Radix/Base parity from static source alone. The repository documents remaining layout-animation stragglers, and the comparison page is a manual regression surface.

## Verify proportionally

For consumer integration, run the target's available typecheck, lint, tests, and build. Exercise the affected interactions in a real browser when behavior matters: pointer proximity, keyboard navigation, focus/blur, open/close and exit motion, controlled state, dark mode, compact size, narrow/mobile layout, touch behavior, and reduced-motion settings.

For changes to this component repository, also run:

```text
npm run registry:build
npm test
npm run lint
npm run build
```

Commit regenerated `public/r/**` payloads with source changes. If dependencies are unavailable or browser checks cannot run, label each unrun gate `NOT_RUN` and state the remaining risk.
