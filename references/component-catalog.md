# Component catalog

Use this as a decision map. The exact props, exports, dependencies, and payload paths remain authoritative in `registry.json`, the selected source file, and its docs page.

## Query the snapshot

Resolve the script path against the directory containing `SKILL.md`:

```text
node scripts/query-registry.mjs --list
node scripts/query-registry.mjs --search "chat attachment queue"
node scripts/query-registry.mjs input-message --flavor base
node scripts/query-registry.mjs select --flavor radix --json
```

The repository currently exposes 27 logical UI registry entries: 24 documented product components and 3 lower-level support components.

## Actions and information

| Need | Prefer | Decision cue |
|---|---|---|
| Primary or secondary action | `button` | Variants, loading, icon-only, active/pressed state |
| Compact status or taxonomy | `badge` | Solid/dot styles and palette colors; not an interactive control |
| Structured content block | `card` | Stacked, inline, grid, selected, actions, media, and 2-D proximity |
| Tabular data | `table` | Semantic table structure with row proximity; bring sorting/paging state yourself |
| Contextual explanation | `tooltip` | Placement, rich content, delay, and cursor-following |

## Navigation, disclosure, and overlays

| Need | Prefer | Decision cue |
|---|---|---|
| Expandable sections | `accordion` | Standalone or grouped, single/multiple expansion |
| Modal task or confirmation | `dialog` | Large surface with managed focus and exit motion |
| Inline action list or triggered menu | `dropdown` | Actions, checked items, labels, separators, popup positioning |
| Choose one value from a list | `select` | Trigger/content/items, groups, icons, errors, long scrollable lists |
| Segmented view switch | `tabs` | Strong segmented control with active indicator |
| Quiet page-level navigation | `tabs-subtle` | Subtle pill, optional icons and active-label mode |
| Application navigation rail | `sidebar` | Left/right, floating/inset, offcanvas, peek, resize, nested groups |

## Inputs and selection

| Need | Prefer | Decision cue |
|---|---|---|
| Multiple independent choices | `checkbox-group` | Contiguous selected rows merge visually |
| Exactly one visible choice | `radio-group` | Use when options should stay visible instead of hiding in Select |
| Binary state | `switch` | Immediate on/off setting; do not use for a one-shot action |
| Numeric or stepped value | `slider` | Single/range, uniform or non-uniform steps, value display, formatters |
| One or more text fields | `input-group` | Labels, multiple fields, errors, and proximity hover |
| Read-only value with copy | `input-copy` | Icon/button actions, alignment, disabled state, copy callback |
| Color value editing | `color-picker` | HEX/RGB/HSL/OKLCH, alpha, swatches, eyedropper, inline/popover |

## AI and guided workflows

| Need | Prefer | Decision cue |
|---|---|---|
| Structured questions | `ask-user-questions` | Multi-step, single/multi-select, other/free text, validation, skip, controlled answers |
| Transcript row | `chat-message` | User/assistant roles, attachment thumbnails, timestamp/actions |
| Prompt composer | `input-message` | Auto-resize, attachments, slots, streaming stop/queue, history, suggestions |
| Lightweight busy status | `thinking-indicator` | Morphing status indicator and cycling text |
| Inspectable progress/reasoning trail | `thinking-steps` | Collapsible steps, streaming, sources, images, active/complete/pending states |

Use `ThinkingSteps` for user-facing progress and sources, not for exposing private hidden reasoning.

## Support components

| Component | Role | Guidance |
|---|---|---|
| `scroll-area` | Styled scrollbar plus viewport | The documentation route is `app/docs/scrollbars/page.tsx`. Prefer native scrolling on touch. |
| `mobile-drawer` | Sidebar/mobile overlay support | Usually arrives through higher-level components; use directly only after reading its source. |
| `file-thumbnail` | Image/PDF/file preview support | Usually arrives through `input-message` or `chat-message`; PDF previews depend on `pdfjs-dist`. |

Other files such as `menu-item`, `sidebar-core`, and `sidebar-menu` are multi-file implementation parts shipped through their owning registry items, not independent component choices.

## System entries

- `surfaces`: eight-level theme and shadow ladder.
- `springs`: `fast`, `moderate`, and `slow` enter/exit motion tokens.
- `font-weight`: Inter variable-font weight/optical-size pairs.
- `shape-context`, `size-context`, `icon-context`: cross-component runtime systems.
- `surface-context`, `surface-classes`, `elevated`: nested elevation mechanics.
- `use-proximity-hover`, `use-merge-split`, `use-touch-primary`: shared interaction hooks.

Install these directly only when composing new components or system-level behavior. Ordinary component installs should resolve them through `registryDependencies`.
