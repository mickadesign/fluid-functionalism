// The mask is a uniform FIELD of Switch components — one kind, one scale —
// tiling the whole stage; the cells inside the "GitHub mark + live star count"
// are the glyph switches that the cascade fills. The layout is generated
// procedurally at runtime (see buildSwitchField in page.tsx). Tune the field here.

export const SWITCH_FIELD = {
  /** Every switch renders at this scale (30%). */
  scale: 0.3,
  /** Grid spacing in stage px (switches are wider than tall, so x > y).
   *  Field switches are stripped to the bare pill (no padding), so each box
   *  matches what's drawn — these steps give tight gaps with no overlap, so
   *  every switch stays independently hover/clickable. */
  stepX: 12,
  stepY: 7,
  /** Cascade stagger when the footer button flips every glyph switch ON (ms/switch). */
  cascadeOnMs: 10,
  /** Cascade stagger for the inverse (all OFF) sweep (ms/switch). */
  cascadeOffMs: 5,
};
