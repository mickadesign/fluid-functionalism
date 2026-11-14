"use client";

import { Fragment } from "react";
import { KeyCaps } from "@/lib/key-cap";
import { fontWeights } from "@/registry/default/lib/font-weight";

// The DataTable page's keys, grouped by what they act on. Each row is its
// keys as caps (the one key cap design) and what they do, so the section
// reads as a reference to scan rather than a paragraph to parse.
//
// A shortcut is a list of combos that do the same thing; a combo is a list
// of keys pressed together. [["↑"], ["↓"]] reads "↑ / ↓"; [["Shift", "↑"]]
// reads as two caps side by side.

type Shortcut = { keys: string[][]; does: string };

const GROUPS: { title: string; where: string; shortcuts: Shortcut[] }[] = [
  {
    title: "Rows",
    where: "On a row, or with the pointer over one",
    shortcuts: [
      { keys: [["↑"], ["↓"]], does: "The row above or below." },
      { keys: [["Home"], ["End"]], does: "The first or the last row." },
      { keys: [["↓"]], does: "From the search or a header: into the first row." },
    ],
  },
  {
    title: "Selection",
    where: "With a selection column",
    shortcuts: [
      { keys: [["X"], ["Enter"]], does: "Selects or clears the row." },
      { keys: [["Shift", "↑"], ["Shift", "↓"]], does: "Grows or shrinks the selection from where it started." },
      { keys: [["⌘", "A"]], does: "Selects every row, on every page, with the pointer anywhere over the table." },
      { keys: [["Space"], ["Enter"]], does: "On the header's box: selects or clears every row." },
      { keys: [["Esc"]], does: "Clears the selection." },
      { keys: [["⌘", "K"]], does: "Opens the selection's actions." },
    ],
  },
  {
    title: "Sub-rows",
    where: "On a row that opens",
    shortcuts: [
      { keys: [["→"]], does: "Opens the row, then steps into it." },
      { keys: [["←"]], does: "Closes the row, or steps back to its parent." },
      { keys: [["Enter"], ["Space"]], does: "Opens and closes it, where rows neither select nor click." },
    ],
  },
  {
    title: "Editing",
    where: "In an editable cell",
    shortcuts: [
      { keys: [["Enter"], ["Esc"]], does: "Leaves the field and keeps what you typed." },
      { keys: [["F2"]], does: "Edits a link." },
      { keys: [["⌘", "Z"]], does: "Takes back the last change." },
      { keys: [["⇧", "⌘", "Z"]], does: "Brings it back." },
    ],
  },
  {
    title: "Moving rows",
    where: "With row reordering",
    shortcuts: [
      { keys: [["Alt", "↑"], ["Alt", "↓"]], does: "Moves the selected rows a place, else the row under the pointer or holding focus." },
      { keys: [["Esc"]], does: "During a drag: puts the row back." },
    ],
  },
  {
    title: "Columns",
    where: "On a header",
    shortcuts: [
      { keys: [["Alt", "←"], ["Alt", "→"]], does: "Moves the column." },
      { keys: [["←"], ["→"]], does: "On a column's edge: steps its width by 16px." },
    ],
  },
];

export function KeyboardShortcuts() {
  return (
    <div className="flex flex-col gap-6">
      {/* Two groups a row from the tablet width up: 6 short lists read
          faster side by side than as one long column. */}
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {GROUPS.map((group) => (
          <section key={group.title} className="flex flex-col">
            <h3
              className="text-site-body text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              {group.title}
            </h3>
            <p className="pb-2 text-site-caption text-muted-foreground">{group.where}</p>
            <dl className="flex flex-col border-t border-border/60">
              {group.shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-border/60 py-2">
                  <dt className="flex w-28 shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 pt-px">
                    {shortcut.keys.map((combo, c) => (
                      <Fragment key={c}>
                        {c > 0 && <span className="text-site-caption text-muted-foreground">/</span>}
                        <KeyCaps keys={combo} />
                      </Fragment>
                    ))}
                  </dt>
                  <dd className="text-site-body text-muted-foreground">{shortcut.does}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <p className="text-site-caption text-muted-foreground">
        ⌘ is Ctrl on Windows and Linux. A row under the pointer counts as focused, so you can point at
        one and carry on from the keyboard.
      </p>
    </div>
  );
}
