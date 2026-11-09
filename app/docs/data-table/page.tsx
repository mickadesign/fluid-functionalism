"use client";

import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { useIcon } from "@/lib/icon-context";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { apiReference } from "@/lib/docs/api/data-table";
import { PlaygroundLayout } from "@/lib/docs/playground";
import {
  DATA_TABLE_PRESETS,
  DataTablePlayground,
  DataTablePresetDemo,
  presetCode,
} from "@/lib/docs/playgrounds/data-table";
import { SortableTable, SearchTable, LoadingTable } from "./demo-data";

const sortCode = `import { useDataTable, DataTable, DataTableColumnHeader, type ColumnDef } from "./components";

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
  },
];

const table = useDataTable({ data: payments, columns });

<DataTable table={table} />`;

const searchCode = `import { useDataTable, DataTable, DataTableSearch } from "./components";

const table = useDataTable({ data: payments, columns });

<div className="flex flex-col gap-3">
  {/* No column: the field searches every column. */}
  <DataTableSearch table={table} placeholder="Search payments…" />
  <DataTable
    table={table}
    empty={{ title: "No payments match", description: "Try an email, a status, or an amount." }}
  />
</div>`;

const loadingCode = `import { useDataTable, DataTable } from "./components";

const { data, isLoading } = useYourRequest();
const table = useDataTable({ data: data ?? [], columns });

// Skeleton rows the size of real ones; set loading back to false with the
// data in place and each cell crossfades from its skeleton.
<DataTable table={table} loading={isLoading} loadingRows={5} />`;

// ── Playground ───────────────────────────────────────────

/** The page's presets, by name. */
const PRESET = Object.fromEntries(DATA_TABLE_PRESETS.map((p) => [p.name, p]));

function DataTablePlaygroundSection() {
  const ReloadIcon = useIcon("rotate-ccw");
  return (
    <DataTablePlayground>
      {({ preview, controls, code, onExpandedChange, onReplay }) => (
        <PlaygroundLayout
          expandable
          onExpandedChange={onExpandedChange}
          label="Customize DataTable"
          controls={controls}
          preview={
            <ComponentPreview
              code={code}
              padding="none"
              align="top"
              playbackButton={
                onReplay && { icon: <ReloadIcon size={16} strokeWidth={1.5} />, tooltip: "Reload data", onClick: onReplay }
              }
            >
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </DataTablePlayground>
  );
}

export default function DataTableDoc() {
  return (
    <DocPage
      title="DataTable"
      slug="data-table"
      description="TanStack Table on the fluid hover Table: sorting, search, resizable and movable columns, selection with spreadsheet keys, editable cells, sub-rows and pagination, each part optional."
    >
      <DocSection title="Playground">
        <DataTablePlaygroundSection />
      </DocSection>

      <DocSection title="Admin list">
        <p className="text-site-body text-muted-foreground">Every part on one table. Select a few rows, then press ⌘K.</p>
        <ComponentPreview code={presetCode(PRESET["Admin list"])}>
          <DataTablePresetDemo preset={PRESET["Admin list"]} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Spreadsheet">
        <p className="text-site-body text-muted-foreground">Every cell edits in place. Click a cell, type, and press Enter.</p>
        <ComponentPreview code={presetCode(PRESET["Spreadsheet"])}>
          <DataTablePresetDemo preset={PRESET["Spreadsheet"]} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Tree">
        <p className="text-site-body text-muted-foreground">Rows open into their parts. Click a chevron, or press → on a row.</p>
        <ComponentPreview code={presetCode(PRESET["Tree"])}>
          <DataTablePresetDemo preset={PRESET["Tree"]} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Report">
        <p className="text-site-body text-muted-foreground">Read only, every row on one page, each summary in full.</p>
        <ComponentPreview code={presetCode(PRESET["Report"])}>
          <DataTablePresetDemo preset={PRESET["Report"]} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sorting">
        <p className="text-site-body text-muted-foreground">
          A column header sorts ascending, then descending, then clears. Shift-click a second header
          to sort by both. The arrow turns over instead of swapping.
        </p>
        <ComponentPreview code={sortCode}>
          <div className="w-full">
            <SortableTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Search and empty">
        <p className="text-site-body text-muted-foreground">
          Without a column, the search covers them all. When nothing matches, the body keeps its
          height and says so.
        </p>
        <ComponentPreview code={searchCode}>
          <SearchTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Loading">
        <p className="text-site-body text-muted-foreground">
          While a request runs, each cell holds a skeleton the size of its text. When the data lands,
          every skeleton fades out as its cell fades in, so nothing jumps and no cell sits empty.
          Requests that finish within 160ms never show one.
        </p>
        <ComponentPreview code={loadingCode}>
          <LoadingTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Keyboard">
        <p className="text-site-body text-muted-foreground">
          The rows work like a spreadsheet&apos;s. A row under the pointer counts as focused, so you can point
          at one and carry on from the keyboard.
        </p>
        <ul className="text-site-body text-muted-foreground flex list-disc flex-col gap-1 pl-5">
          <li>↓ from the search or a header steps into the first row; ↑ / ↓ and Home / End move between rows.</li>
          <li>X or Enter selects or clears a row; Shift + ↑ / ↓ grows or shrinks the selection from where it started.</li>
          <li>⌘A / Ctrl+A selects every row, on every page; Esc clears the selection.</li>
          <li>With sub-rows, → opens a row or steps into it and ← closes it or steps back to its parent.</li>
          <li>In an editable cell, Enter or Esc leaves the field and keeps what you typed; F2 edits a link.</li>
          <li>With a selection, ⌘K opens its actions.</li>
          <li>Alt + ← / → on a focused header moves its column; ← / → on a focused resize handle steps its width by 16px.</li>
        </ul>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
