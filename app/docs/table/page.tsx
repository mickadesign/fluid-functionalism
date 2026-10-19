"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { tableProps, rowProps } from "@/lib/docs/api/table";

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

export default function TableDoc() {
  return (
    <DocPage
      title="Table"
      slug="table"
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
