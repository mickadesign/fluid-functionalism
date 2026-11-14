"use client";

import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { useIcon } from "@/lib/icon-context";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { apiReference } from "@/lib/docs/api/data-table";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { DataTablePlayground } from "@/lib/docs/playgrounds/data-table";
import {
  TeamTable,
  teamCode,
  ViewsTable,
  viewsCode,
  TasksTable,
  tasksCode,
  FilesTable,
  filesCode,
  ChangelogTable,
  changelogCode,
  ReorderTable,
  reorderCode,
  FrozenTable,
  frozenCode,
  FiltersTable,
  filtersCode,
  ColumnsTable,
  columnsCode,
} from "./capability-demos";
import { SortableTable, SearchTable, LoadingTable } from "./demo-data";
import { KeyboardShortcuts } from "./keyboard";

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
  {/* No column: the field searches every column. collapsible={false}
      keeps it open; without it, an empty search folds to a button. */}
  <div className="flex justify-end">
    <DataTableSearch table={table} placeholder="Search payments…" collapsible={false} />
  </div>
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
              hideTabs
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
      description="A table you can sort, search, select from and edit in place. Turn on only the parts you need."
    >
      <DocSection title="Playground">
        <DataTablePlaygroundSection />
      </DocSection>

      <DocSection title="Selection and actions">
        <p className="text-site-body text-muted-foreground">
          Select a few people, then press ⌘K to act on all of them at once. Right-click a row for its
          menu, or add a filter on a column. Remove someone, then press ⌘Z in the table to bring them
          back.
        </p>
        <ComponentPreview code={teamCode}>
          <TeamTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Filters">
        <p className="text-site-body text-muted-foreground">
          4 kinds of filter, one per kind of column: text, a few values, a number range, a range of
          days. Each filter is a chip above the table: click a part to change it, or the × to remove it.
        </p>
        <ComponentPreview code={filtersCode}>
          <FiltersTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Saved views">
        <p className="text-site-body text-muted-foreground">
          A view is the table&apos;s state, named: filters, sort and visible columns. Save one, then
          switch between them.
        </p>
        <ComponentPreview code={viewsCode}>
          <ViewsTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Editable cells">
        <p className="text-site-body text-muted-foreground">
          6 editors, each one the cell itself: click a cell to edit it, press Enter or Esc to leave.
          Filters follow each editor: a number range on Points, a range of days on Due.
        </p>
        <ComponentPreview code={tasksCode}>
          <TasksTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Resizing and reordering columns">
        <p className="text-site-body text-muted-foreground">
          Drag a column&apos;s right edge to resize it, and drag a header to move it. From the keyboard:
          ← / → on a focused edge steps its width by 16px, Alt + ← / → on a focused header moves its
          column.
        </p>
        <ComponentPreview code={columnsCode}>
          <ColumnsTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Frozen columns">
        <p className="text-site-body text-muted-foreground">
          Scroll sideways: the boxes and the first column stay on the left, the row menus on the
          right. A hairline marks each frozen edge while content passes under it. Open a header&apos;s
          menu to freeze the columns up to it.
        </p>
        <ComponentPreview code={frozenCode}>
          <FrozenTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Reordering rows">
        <p className="text-site-body text-muted-foreground">
          Drag a row by its handle, or press Alt + ↑ / ↓ on the row under the pointer or holding focus. Select a few and drag one
          to move them together: every row you carry shows in the drag, where it was. While a column sorts the table, dropping a row (or pressing the keys) asks whether to remove the sort first.
        </p>
        <ComponentPreview code={reorderCode}>
          <ReorderTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sub-rows">
        <p className="text-site-body text-muted-foreground">
          A folder opens into its files. Click a chevron, or press → on a row and ← to close it.
        </p>
        <ComponentPreview code={filesCode}>
          <FilesTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Wrapped text">
        <p className="text-site-body text-muted-foreground">
          Long text runs onto as many lines as it needs, and the row reads from the top.
        </p>
        <ComponentPreview code={changelogCode}>
          <ChangelogTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sorting">
        <p className="text-site-body text-muted-foreground">
          Click a column header for its menu: sort either way, add a filter, move the column, or
          freeze the columns up to it. Shift-click a second header to sort by both. The arrow turns
          over instead of swapping.
        </p>
        <ComponentPreview code={sortCode}>
          <SortableTable />
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
          Requests that finish within 160ms never show one. This table is held in loading: press
          Finish loading to land its rows.
        </p>
        <ComponentPreview code={loadingCode}>
          <LoadingTable />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Keyboard">
        <p className="text-site-body text-muted-foreground">
          The rows work like a spreadsheet&apos;s: 20 shortcuts, grouped by what they act on.
        </p>
        <KeyboardShortcuts />
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
