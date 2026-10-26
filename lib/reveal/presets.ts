// The reveal presets' values: the one source for the CSS that
// scripts/generate-reveal.mjs writes into app/globals.css and the `reveal`
// registry item, and for the values the /docs/reveal page shows. Plain data
// so Node can import it to generate.

export interface RevealPreset {
  /** The motion tier the on-load steps ride, from @/lib/springs. */
  spring: "slow" | "moderate";
  /** Rise in px, from below on the way in. Omitted: no rise. */
  distance?: number;
  /** Scale the content grows from. Omitted: no scale. */
  scale?: number;
  /** Seconds between siblings. */
  step: number;
  /** Scroll in px from the viewport edge where a section starts and ends.
   *  Omitted: nothing moves on scroll. */
  scrollStart?: number;
  scroll?: number;
}

export const revealPresets = {
  "reveal-landing": { spring: "slow", distance: 12, scale: 0.94, step: 0.1, scrollStart: 12, scroll: 120 },
  "reveal-landing-subtle": { spring: "slow", distance: 8, scale: 0.98, step: 0.06, scrollStart: 8, scroll: 60 },
  // The app's blocks are panels, not page sections: the tier panels use.
  "reveal-product": { spring: "moderate", step: 0.06 },
  "reveal-product-subtle": { spring: "moderate", step: 0.04 },
} as const satisfies Record<string, RevealPreset>;

export type RevealPresetName = keyof typeof revealPresets;
