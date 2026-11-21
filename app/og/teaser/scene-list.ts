/** A scene's layout size in CSS px. It plays at 1280×720 rendered at
 *  ZOOM device pixels per CSS px (the board scales it the same way). */
export const ZOOM = 1.45;
export const LW = Math.round(1280 / ZOOM);
export const LH = Math.round(720 / ZOOM);

/** The teaser's scenes, in order. `motion` is the spec for the real video:
 *  keep it true whenever a scene's motion changes. `label` names it on
 *  the video page's tabs. `seconds` is what the
 *  video page plays: each script's on-camera steps (roll to end) add up
 *  to it, so change both together. */
export const SCENES = [
  {
    id: "cuts",
    label: "Cuts",
    seconds: 1.6,
    title: "8 tables, hard cuts",
    motion: "8 compositions, 0.2s each, no transition: different data, light and dark, radius, size and accent on every cut. The last cut is the default Components table, the one every scene after it uses.",
  },
  {
    id: "search",
    label: "Search",
    seconds: 1.1,
    title: "Detail: search",
    motion: "Close on the toolbar's search, on the table the cuts landed on: it opens and “dropdown” types in.",
  },
  {
    id: "tooltips",
    label: "Tooltips",
    seconds: 1.5,
    title: "Detail: toolbar tooltips",
    motion: "Close on the same toolbar: the pointer slides across Filter, Columns and Search, and one tooltip glides between them. Runs about 1.5s.",
  },
  {
    id: "filters",
    label: "Filters",
    seconds: 2.9,
    title: "Filter to this month",
    motion: "Opens on an “Added between any day” chip with its calendar open, one month and no presets. The cursor clicks the 1st, then today: the second click closes the calendar, and the rows narrow to the 7 added this month. Hold. (The loop sets up and removes the chip off camera.)",
  },
  {
    id: "views",
    label: "Saved views",
    seconds: 2.6,
    title: "Save the filter as a view",
    motion: "Carries on from Filters, same frame: the cursor clicks Save view, a new tab opens for its name, “Recent” types in, Enter keeps it. (The view is deleted off camera.)",
  },
  {
    id: "loading",
    label: "Loading",
    seconds: 1.3,
    title: "Detail: loading",
    motion: "Close on the rows the view switch reloads: skeletons hold, then cross-fade into data.",
  },
  {
    id: "editable",
    label: "Editing",
    seconds: 2.3,
    title: "Edit from the keyboard",
    motion: "No cursor, keys shown as dark key caps bottom centre: focus lands on the row\'s Primitives cell, Tab moves it into Props, 2 and 4 type 24 over 13 (the cell\'s suggestion list stays hidden), ↵ commits. Sorted by date, the row holds its place.",
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    seconds: 3.3,
    title: "Power user: shortcuts",
    motion: "No cursor, keys shown as dark key caps bottom centre: focus lands on the first row, ↓ ↓ steps to the third, ⇧↓ ↓ extends a range of 3, ⌥↑ ↑ lifts them 2 places up the list, ⌘Z ⌘Z puts them back. The selection bar stays hidden: only the keys show. (Removing the date sort, which moving rows needs, happens off camera.)",
  },
  {
    id: "select-all",
    label: "Select all",
    seconds: 3.1,
    title: "Select all 36, then ⌘K",
    motion: "Close on the header checkbox: the cursor ticks it and all 36 rows fill. Pull out to the full table, ⌘K opens “Act on 36 rows”, the cursor picks Delete 36 rows: the table empties at the same height, reading “No components” and “Let’s do it again”. Hard cut back to scene 1. (Undo, off camera, brings the rows back.)",
  },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];
