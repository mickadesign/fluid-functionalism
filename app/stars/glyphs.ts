// Geometry for the "500" glyph mosaic.
//
// The glyph is real type — "500" set in Inter Bold — used two ways:
//   1. a faint stroked outline rendered behind the components, and
//   2. an SVG <text> clip-path that hard-crops the component layer to the
//      letterforms.
// Both render the same <text> (see TEXT_PROPS) so they stay in lockstep.

export const STAGE_W = 1000;
export const STAGE_H = 400;

// The "500" lockup, centered in the stage. Baseline sits near the bottom so the
// cap-height of the digits fills the height.
export const TEXT = {
  x: STAGE_W / 2,
  y: 345,
  fontSize: 420,
} as const;

// Shared attributes for the clip <text> and the outline <text> — keep identical
// so the visible outline and the clip mask align exactly.
export const TEXT_PROPS = {
  x: TEXT.x,
  y: TEXT.y,
  fontSize: TEXT.fontSize,
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  textAnchor: "middle" as const,
};

export const TEXT_STYLE = { fontVariationSettings: "'wght' 700" };

// Approximate per-digit centers in stage space (measured from the rendered
// Inter Bold lockup). Handy anchors when hand-tuning the component layout.
export const DIGIT_CENTERS = {
  five: { x: 227, y: 192 },
  zeroA: { x: 490, y: 192 },
  zeroB: { x: 762, y: 192 },
} as const;
