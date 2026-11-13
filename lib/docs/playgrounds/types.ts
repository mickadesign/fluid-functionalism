import type { ComponentType, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Shared playground contract. Each component playground module owns ONE copy
// of the playground state and renders it three ways:
//   preview     — the canonical live preview for the doc page (the doc page
//                 wraps it in ComponentPreview with the matching `code`).
//   demoPreview — a compact variant sized for a bento/demo card, driven by
//                 the same state as `controls`.
//   controls    — the PlaygroundPanel with the control rows. The doc page
//                 parks it in the right rail; the /demo page opens it from
//                 the pen menu on the slide's card.
// The render-prop shape keeps the state above both the preview and the
// controls, so callers are free to place them in different containers.
// ---------------------------------------------------------------------------

export interface PlaygroundParts {
  preview: ReactNode;
  demoPreview: ReactNode;
  /** Max width (px) the /demo stage gives demoPreview. Defaults to the
   *  stage's 420; shell-sized previews (sidebar) opt into a wider slide. */
  demoMaxWidth?: number;
  controls: ReactNode;
  /** Source snippet kept in sync with the controls, for the doc Code tab. */
  code: string;
  /** Restart the live preview from its initial state (e.g. stepped flows).
   *  The doc page wires this to ComponentPreview's playback (replay) button. */
  onReplay?: () => void;
  /** A control pinned to the bottom centre of the preview area, outside the
   *  /demo stage's scaling (e.g. Banner's "Show banner" once dismissed).
   *  Hosts render it through PlaygroundOverlay. */
  overlay?: ReactNode;
  /** Tabs for the preview's header, in place of Preview / Code: what the
   *  playground shows (DataTable's sample tables). */
  tabs?: { labels: readonly string[]; selected: number; onSelect: (index: number) => void };
  /** For an expandable doc playground: hears the preview expand and settle
   *  back, so the module can use the extra room. */
  onExpandedChange?: (expanded: boolean) => void;
}

export interface PlaygroundProps {
  children: (parts: PlaygroundParts) => ReactNode;
}

export type PlaygroundComponent = ComponentType<PlaygroundProps>;
