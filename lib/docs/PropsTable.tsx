import { Fragment } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { ScrollArea } from "@/registry/base/scroll-area";
import type { ApiTable, PropDef } from "@/lib/docs/api/types";
import { ApiReferenceTable } from "@/lib/docs/ApiReferenceTable";

export type { PropDef };

type PropsTableProps =
  | { props: PropDef[]; groups?: never }
  /** Several groups in ONE table, each under a heading row, so the columns
   *  line up from group to group (separate tables size theirs apart). */
  | {
      groups: ApiTable[];
      props?: never;
      /** For a reference that folds its groups: the section's heading, on
       *  the table's toolbar row with its search. */
      title?: string;
    };

/** A description's `code` spans as inline code (the same text the .md
 *  pages render as Markdown), the rest as plain text. */
export function Description({ text }: { text: string }) {
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

function PropRow({ prop, showDefault }: { prop: PropDef; showDefault: boolean }) {
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
      <td className="px-3 py-2 text-muted-foreground font-mono text-site-caption [overflow-wrap:anywhere]">
        {prop.type}
      </td>
      {showDefault && (
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

export function PropsTable(all: PropsTableProps) {
  const { props, groups } = all;
  // A reference long enough to fold its groups (ApiTable `collapsed`) is
  // the library's own DataTable, each group a row with its props under it.
  if (groups?.some((group) => group.collapsed !== undefined)) return <ApiReferenceTable groups={groups} title={all.title} />;
  return <PlainPropsTable {...(groups ? { groups } : { props })} />;
}

function PlainPropsTable({ props, groups }: PropsTableProps) {
  const all = groups ? groups.flatMap((g) => g.props) : props;
  // Horizontal ScrollArea gives narrow viewports the shape-system scrollbar +
  // a scroll-fade-x edge; min-w keeps columns legible before it scrolls.
  // Drop the Default column when nothing has a default (e.g. token references,
  // or a table where every prop is required) — an all-"—" column is noise.
  const showDefault = all.some((prop) => prop.default !== undefined);
  const columns = showDefault ? 4 : 3;

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
          groups.map((group) => (
            <tbody key={group.title}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={columns}
                  className="pb-2 pt-6 text-left text-site-subtitle text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {group.title}
                </th>
              </tr>
              {group.props.map((prop) => (
                <PropRow key={prop.name} prop={prop} showDefault={showDefault} />
              ))}
            </tbody>
          ))
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
