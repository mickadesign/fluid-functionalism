import { fontWeights } from "@/registry/default/lib/font-weight";
import { ScrollArea } from "@/registry/base/scroll-area";
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

export type { PropDef };

type PropsTableProps =
  | { props: PropDef[]; groups?: never }
  /** Several groups in ONE table, each under a heading row, so the columns
   *  line up from group to group (separate tables size theirs apart). */
  | { groups: ApiTable[]; props?: never };

function PropRow({ prop, showDefault }: { prop: PropDef; showDefault: boolean }) {
  return (
    <tr className="border-b border-border/40">
      {/* nowrap: a name like .reveal-landing-subtle stays whole and
          the column grows to fit it, instead of breaking at hyphens. */}
      <td className="px-3 py-2 text-foreground font-mono text-site-caption whitespace-nowrap">
        {prop.name}
      </td>
      <td className="px-3 py-2 text-muted-foreground font-mono text-site-caption">
        {prop.type}
      </td>
      {showDefault && (
        <td className="px-3 py-2 text-muted-foreground font-mono text-site-caption">
          {prop.default ?? "—"}
        </td>
      )}
      <td className="px-3 py-2 text-muted-foreground">{prop.description}</td>
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
              className="px-3 py-2 text-left text-foreground"
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
              className="px-3 py-2 text-left text-foreground"
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
