import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components";
import { ComponentPreview } from "../ComponentPreview";
import { PropsTable, type PropDef } from "../PropsTable";
import { DocPage, DocSection } from "../DocPage";

const basicCode = `import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "./components";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow index={0}>
      <TableCell>Alice</TableCell>
      <TableCell>Engineer</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
    <TableRow index={1}>
      <TableCell>Bob</TableCell>
      <TableCell>Designer</TableCell>
      <TableCell>Away</TableCell>
    </TableRow>
    <TableRow index={2}>
      <TableCell>Carol</TableCell>
      <TableCell>Manager</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

const tableProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "TableHeader and TableBody children." },
];

const rowProps: PropDef[] = [
  { name: "index", type: "number", description: "Row index for proximity hover. Omit for header rows." },
  { name: "children", type: "ReactNode", description: "TableCell or TableHead children." },
];

export function TableDoc() {
  return (
    <DocPage
      title="Table"
      description="Data table with row hover effects and semantic markup."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow index={0}>
                  <TableCell>Alice</TableCell>
                  <TableCell>Engineer</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
                <TableRow index={1}>
                  <TableCell>Bob</TableCell>
                  <TableCell>Designer</TableCell>
                  <TableCell>Away</TableCell>
                </TableRow>
                <TableRow index={2}>
                  <TableCell>Carol</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Active</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Table">
        <PropsTable props={tableProps} />
      </DocSection>

      <DocSection title="API Reference — TableRow">
        <PropsTable props={rowProps} />
      </DocSection>
    </DocPage>
  );
}
