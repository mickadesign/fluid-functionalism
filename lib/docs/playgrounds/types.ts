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
  controls: ReactNode;
  /** Source snippet kept in sync with the controls, for the doc Code tab. */
  code: string;
}

export interface PlaygroundProps {
  children: (parts: PlaygroundParts) => ReactNode;
}

export type PlaygroundComponent = ComponentType<PlaygroundProps>;
