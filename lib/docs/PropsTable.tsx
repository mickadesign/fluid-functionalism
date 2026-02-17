import { fontWeights } from "@/registry/default/lib/font-weight";

export interface PropDef {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface PropsTableProps {
  props: PropDef[];
}

export function PropsTable({ props }: PropsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
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
            <th
              className="px-3 py-2 text-left text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Default
            </th>
            <th
              className="px-3 py-2 text-left text-foreground"
              style={{ fontVariationSettings: fontWeights.semibold }}
            >
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-border/40">
              <td className="px-3 py-2 text-foreground font-mono text-[12px]">
                {prop.name}
              </td>
              <td className="px-3 py-2 text-muted-foreground font-mono text-[12px]">
                {prop.type}
              </td>
              <td className="px-3 py-2 text-muted-foreground font-mono text-[12px]">
                {prop.default ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
