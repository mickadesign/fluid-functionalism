"use client";

import { Fragment, useState } from "react";
import { useIcon } from "@/lib/icon-context";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { ScrollArea } from "@/registry/base/scroll-area";
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export type { PropDef };

type PropsTableProps =
  | { props: PropDef[]; groups?: never }
  /** Several groups in ONE table, each under a heading row, so the columns
   *  line up from group to group (separate tables size theirs apart). */
  | { groups: ApiTable[]; props?: never };

/** A description's `code` spans as inline code (the same text the .md
 *  pages render as Markdown), the rest as plain text. */
function Description({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="font-mono text-site-caption text-foreground">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

/** `showDefault`: the table has a Default column. `ownDefault`: this row's
 *  group uses it; a group where nothing has a default gives the column's
 *  room to its types, rather than a run of dashes. */
function PropRow({ prop, showDefault, ownDefault = true }: { prop: PropDef; showDefault: boolean; ownDefault?: boolean }) {
  return (
    <tr className="border-b border-border/40">
      {/* A one-word name stays whole and the column grows to fit it
          (.reveal-landing-subtle must not break at its hyphens). A name of
          several words (a hook's whole signature, a list of methods) wraps
          past 160px: left to grow, one took 400px and pushed the
          descriptions off the table. The cap sits on a block inside the
          cell, since a table cell ignores its own max-width; w-max keeps
          the column from squeezing a short name onto several lines. */}
      <td className="px-3 py-2 text-foreground font-mono text-site-caption">
        <div className={/\s/.test(prop.name) ? "w-max max-w-40" : "whitespace-nowrap"}>
          {/* A signature may break after its "(". */}
          {prop.name.split("(").map((part, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <>
                  (<wbr />
                </>
              )}
              {part}
            </Fragment>
          ))}
        </div>
      </td>
      {/* A long type breaks anywhere rather than holding the column open:
          its longest token alone set a 180px floor. */}
      <td
        colSpan={showDefault && !ownDefault ? 2 : undefined}
        className="px-3 py-2 text-muted-foreground font-mono text-site-caption [overflow-wrap:anywhere]"
      >
        {prop.type}
      </td>
      {showDefault && ownDefault && (
        <td className="px-3 py-2 text-muted-foreground font-mono text-site-caption [overflow-wrap:anywhere]">
          {prop.default ?? "—"}
        </td>
      )}
      <td className="px-3 py-2 text-muted-foreground">
        <Description text={prop.description} />
      </td>
    </tr>
  );
}

export function PropsTable({ props, groups }: PropsTableProps) {
  const all = groups ? groups.flatMap((g) => g.props) : props;
  // Horizontal ScrollArea gives narrow viewports the shape-system scrollbar +
  // a scroll-fade-x edge; min-w keeps columns legible before it scrolls.
  // Drop the Default column when nothing has a default (e.g. token references,
  // or a table where every prop is required) — an all-"—" column is noise.
  const showDefault = all.some((prop) => prop.default !== undefined);
  const columns = showDefault ? 4 : 3;
  // Groups that open and close (ApiTable `collapsed`): the ones open now.
  const [open, setOpen] = useState(
    () => new Set((groups ?? []).filter((g) => g.collapsed !== true).map((g) => g.title))
  );
  const Chevron = useIcon("chevron-right");

  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className="w-full"
    >
      <table className="w-full min-w-[520px] text-site-body border-collapse [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
        <thead>
          <tr className="border-b border-border">
            <th
              className="px-3 py-2 text-left text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Prop
            </th>
            <th
              // A floor here too: types break anywhere, and without one
              // the descriptions took the room and left them a word wide.
              className="min-w-32 px-3 py-2 text-left text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Type
            </th>
            {showDefault && (
              <th
                className="px-3 py-2 text-left text-foreground"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                Default
              </th>
            )}
            <th
              // A floor for the column people read: a long prop or type
              // wraps before the descriptions get squeezed.
              className="min-w-64 px-3 py-2 text-left text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Description
            </th>
          </tr>
        </thead>
        {groups ? (
          groups.map((group) => {
            const folds = group.collapsed !== undefined;
            const isOpen = !folds || open.has(group.title);
            const ownDefault = group.props.some((prop) => prop.default !== undefined);
            return (
              <tbody key={group.title}>
                <tr className={isOpen ? undefined : "border-b border-border/40"}>
                  <th
                    scope="rowgroup"
                    colSpan={columns}
                    className={
                      // Closed, the headings stack as a list of rows.
                      (isOpen ? "pb-2 pt-6" : "py-0") + " text-left text-site-subtitle text-foreground"
                    }
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    {folds ? (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpen((old) => {
                            const next = new Set(old);
                            if (!next.delete(group.title)) next.add(group.title);
                            return next;
                          })
                        }
                        className={
                          "group/fold flex w-full cursor-pointer items-center gap-2 text-left " + (isOpen ? "" : "py-3")
                        }
                      >
                        <span>{group.title}</span>
                        {/* How much is behind it, while it is closed. */}
                        {!isOpen && (
                          <span className="font-mono text-site-caption text-muted-foreground" style={{ fontVariationSettings: fontWeights.normal }}>
                            {group.props.length}
                          </span>
                        )}
                        <Chevron
                          size={14}
                          strokeWidth={1.75}
                          aria-hidden
                          className={
                            "ml-auto shrink-0 text-muted-foreground transition-[rotate,color] duration-80 group-hover/fold:text-foreground " +
                            (isOpen ? "rotate-90" : "")
                          }
                        />
                      </button>
                    ) : (
                      group.title
                    )}
                  </th>
                </tr>
                {isOpen &&
                  group.props.map((prop) => (
                    <PropRow key={prop.name} prop={prop} showDefault={showDefault} ownDefault={ownDefault} />
                  ))}
              </tbody>
            );
          })
        ) : (
          <tbody>
            {props.map((prop) => (
              <PropRow key={prop.name} prop={prop} showDefault={showDefault} />
            ))}
          </tbody>
        )}
      </table>
    </ScrollArea>
  );
}
