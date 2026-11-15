/** A scene's layout size in CSS px. It plays at 1280×720 rendered at
 *  ZOOM device pixels per CSS px (the board scales it the same way). */
export const ZOOM = 1.45;
export const LW = Math.round(1280 / ZOOM);
export const LH = Math.round(720 / ZOOM);

/** The teaser's scenes, in order. `motion` is the spec for the real video:
 *  keep it true whenever a scene's motion changes. */
export const SCENES = [
  {
    id: "cuts",
    seconds: 1.6,
    title: "8 tables, hard cuts",
    motion: "8 compositions, 0.2s each, no transition: different data, light and dark, radius, size and accent on every cut.",
  },
  {
    id: "filters",
    seconds: 2,
    title: "Filter the components",
    motion: "The cursor clicks Filter, then Primitives: a “Primitives is any” chip lands and its menu opens. It picks None: the chip reads None and 36 rows narrow to 10. Hold. (The loop then removes the chip, off camera.)",
  },
  {
    id: "search",
    seconds: 1,
    title: "Detail: search",
    motion: "Close on the toolbar's search: it opens and “dropdown” types in.",
  },
  {
    id: "editable",
    seconds: 2,
    title: "Edit a cell in place",
    motion: "The cursor clicks a Props cell, types a new number, Enter. The row holds its place.",
  },
  {
    id: "tooltips",
    seconds: 1,
    title: "Detail: toolbar tooltips",
    motion: "Close on the toolbar: the pointer slides across the icon buttons, one tooltip glides between them.",
  },
  {
    id: "views",
    seconds: 2,
    title: "Saved views",
    motion: "The cursor clicks from the All tab to a saved view: filters and columns switch with it.",
  },
  {
    id: "loading",
    seconds: 1,
    title: "Detail: loading",
    motion: "Close on the rows: skeletons the size of their text cross-fade into data.",
  },
  {
    id: "selection",
    seconds: 2,
    title: "Select, then ⌘K",
    motion: "The cursor ticks 3 rows, ⌘K opens the actions for all 3.",
  },
  {
    id: "select-all",
    seconds: 1,
    title: "Detail: select all 36",
    motion: "Close on the header checkbox: “Select all 36”, every box fills. Cut back to scene 1.",
  },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];
