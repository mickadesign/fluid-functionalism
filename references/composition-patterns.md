# Composition patterns

Use these as component-bundle references, not as complete product templates. The concept pages contain fixtures, simulated state, docs-site chrome, and some direct Radix imports.

## Reusable bundles

### AI conversation workspace

Use `ChatMessage` for transcript rows, `InputMessage` for the composer, `ThinkingIndicator` for lightweight response state, `ThinkingSteps` for inspectable progress/sources, `ScrollArea` for the transcript, and `Button`/`Tooltip` for actions.

Keep conversation, streaming, queue, history, attachment, and abort state in the page or feature controller. Let `InputMessage` render and emit its public state transitions; do not bury transport or model calls inside the component.

Reference: `app/concepts/atlas/page.tsx`.

### Research answer with sources

Combine `ChatMessage`, `ThinkingSteps`, `Badge`, `TabsSubtle`, and `InputMessage`. Use steps to report observable work, sources, and images. Keep final answer content separate from execution/progress UI.

Reference: `app/concepts/lumen/page.tsx`.

### Operational workbench

Combine `Sidebar`, `TabsSubtle`, `Table`, `Badge`, `Dropdown`, `Select`, `Switch`, `InputGroup`, and `AskUserQuestions`. Use compact sizing for dense filters and rows; keep modal/guided flows at the default size unless density is intentional.

Reference: `app/concepts/beacon/page.tsx`.

### Project or document workspace

Combine `Table`, `Badge`, `Dropdown`, `TabsSubtle`, `ChatMessage`, `InputMessage`, and `ThinkingSteps`. Keep editing state, comments, AI progress, and block/menu state owned by the feature, not by visual wrappers.

Reference: `app/concepts/quill/page.tsx`.

## Composition rules

- Start with the task flow and data ownership, then choose the smallest FF components that express it.
- Use controlled props when server state, routing, undo, collaboration, or persistence owns the value. Use uncontrolled props only for genuinely local ephemeral state.
- Apply one coherent primitive flavor across a compound tree and its transitive dependencies.
- Use the size ladder regionally: default for ordinary forms and dialogs, compact for toolbars, navigation, filters, and dense data.
- Let nested overlays raise themselves through the surface system. Avoid manual z-index escalation.
- Reserve animated `ThinkingSteps` for useful user-visible progress. Do not fabricate progress or expose hidden chain-of-thought.
- Keep proximity hover subordinate to semantic hover, focus, selected, checked, open, and disabled states.
- Prefer component public APIs and composition slots. Fork internals only when the requested behavior cannot be expressed otherwise.

## What not to copy

- Fixture data, fake timeouts, and demo-only in-memory files.
- `ConceptFrame`, `RightPanel`, settings shortcuts, playground controls, or docs navigation.
- `components/flavored/*` runtime switching.
- Direct `@/registry/*` imports.
- The concepts' fixed page layouts without checking the target's responsive, routing, and accessibility requirements.

When a concept is visually useful, inspect its component relationships and state boundaries, then rebuild the surface with installed consumer imports and real application data.
