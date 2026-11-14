"use client";

// The DataTable page's capability sections: each one a table built for the
// thing it shows, on data that suits it, with the code it runs.

import { useEffect, useRef, useState } from "react";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableSearch,
  DataTableFilters,
  DataTableFilterChips,
  DataTableTitle,
  DataTableViewOptions,
  useUndoableRows,
  type TableState,
  DataTablePagination,
  DataTableSelectionBar,
  selectColumn,
  rowHandleColumn,
  rowActionsColumn,
  moveRows,
  type ColumnDef,
} from "@/components/ui/data-table";
import { MenuItem } from "@/components/ui/menu-item";
import { TooltipGroup } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ViewTabs } from "@/lib/docs/playgrounds/view-tabs";
import { showUndoToast } from "@/lib/docs/settings-toast";
import { useFontsReady } from "@/lib/docs/use-fonts-ready";
import { Badge, type BadgeColor } from "@/registry/default/badge";
import { useIcons } from "@/lib/icon-context";

// ── Selection and actions: a team ────────────────────────

type Role = "Owner" | "Admin" | "Editor" | "Viewer";
type Member = { id: string; name: string; email: string; role: Role; status: "Active" | "Invited" | "Suspended"; lastActive: string };

const MEMBERS: Member[] = [
  { id: "1", name: "Ada Brooks", email: "ada@acme.co", role: "Owner", status: "Active", lastActive: "2026-11-08" },
  { id: "2", name: "Kenji Mori", email: "kenji@acme.co", role: "Admin", status: "Active", lastActive: "2026-11-07" },
  { id: "3", name: "Lena Fischer", email: "lena@acme.co", role: "Editor", status: "Active", lastActive: "2026-11-08" },
  { id: "4", name: "Omar Haddad", email: "omar@acme.co", role: "Editor", status: "Invited", lastActive: "2026-10-30" },
  { id: "5", name: "Priya Nair", email: "priya@acme.co", role: "Viewer", status: "Active", lastActive: "2026-11-05" },
  { id: "6", name: "Tomás Ruiz", email: "tomas@acme.co", role: "Editor", status: "Suspended", lastActive: "2026-09-14" },
  { id: "7", name: "Mia Laurent", email: "mia@acme.co", role: "Viewer", status: "Active", lastActive: "2026-11-02" },
  { id: "8", name: "Sam Okafor", email: "sam@acme.co", role: "Admin", status: "Active", lastActive: "2026-11-06" },
  { id: "9", name: "Yara Haddad", email: "yara@acme.co", role: "Viewer", status: "Invited", lastActive: "2026-10-28" },
  { id: "10", name: "Felix Berg", email: "felix@acme.co", role: "Editor", status: "Active", lastActive: "2026-11-01" },
  { id: "11", name: "Ines Costa", email: "ines@acme.co", role: "Viewer", status: "Active", lastActive: "2026-10-25" },
  { id: "12", name: "Leo Varga", email: "leo@acme.co", role: "Editor", status: "Active", lastActive: "2026-11-04" },
];

/** A column's badge colors as filter options, so the filter shows the dots. */
const badgeOptions = (colors: Record<string, BadgeColor>) =>
  Object.entries(colors).map(([value, color]) => ({ value, color }));

const ROLE_COLOR = { Owner: "purple", Admin: "blue", Editor: "green", Viewer: "gray" } as const;
const STATUS_COLOR = { Active: "green", Invited: "amber", Suspended: "red" } as const;

/** "Nov 8" from "2026-11-08", by hand: an ISO day read as a local Date can
 *  land on the day before and break hydration. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDay = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};

export function TeamTable() {
  const icons = useIcons();
  // Every change is a step ⌘Z takes back (focus in the table) or the
  // toast's Undo does.
  const history = useUndoableRows(MEMBERS, { getId: (m) => m.id });
  const members = history.rows;
  const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
  const update = (ids: string[], change: Partial<Member>, label: string) =>
    history.apply(label, (old) => old.map((m) => (ids.includes(m.id) ? { ...m, ...change } : m)));
  const remove = (ids: string[]) => {
    const label = `Removed ${people(ids.length)}`;
    const before = history.stepCount;
    history.remove(ids, label);
    showUndoToast(label, () => history.undoTo(before));
  };

  const columns: ColumnDef<Member>[] = [
    selectColumn<Member>(),
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      enableHiding: false,
    },
    { accessorKey: "email", header: "Email", meta: { lines: 1 } },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => (
        <span className="flex h-[1lh] items-center">
          <Badge variant="ghost" color={ROLE_COLOR[row.original.role]}>
            {row.original.role}
          </Badge>
        </span>
      ),
      // The filter lists the roles with their badge's dot.
      meta: { filter: { type: "options", options: badgeOptions(ROLE_COLOR) } },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <span className="flex h-[1lh] items-center">
          <Badge variant="ghost" color={STATUS_COLOR[row.original.status]}>
            {row.original.status}
          </Badge>
        </span>
      ),
      meta: { filter: { type: "options", options: badgeOptions(STATUS_COLOR) } },
    },
    {
      accessorKey: "lastActive",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />,
      cell: ({ row }) => shortDay(row.original.lastActive),
      meta: { label: "Last active", className: "tabular-nums whitespace-nowrap w-full" },
    },
    rowActionsColumn<Member>((row) => (
      <>
        <MenuItem index={0} label="Make admin" onSelect={() => update([row.original.id], { role: "Admin" }, `Made ${row.original.name} an admin`)} />
        <MenuItem index={1} label="Remove" destructive onSelect={() => remove([row.original.id])} />
      </>
    )),
  ];

  const table = useDataTable({
    data: members,
    columns,
    pageSize: 8,
    getRowId: (m) => m.id,
    // The section opens on what it shows: three people already selected,
    // so the fill that merges touching rows and the actions bar are there.
    initialState: { rowSelection: { "2": true, "3": true, "5": true } },
  });
  // Skeleton rows until the fonts are in: see useFontsReady.
  const ready = useFontsReady();

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        {/* h3 here: the docs section above is the h2. */}
        <DataTableTitle as="h3" table={table} className="font-heading-display">Team</DataTableTitle>
        <span className="ml-auto" />
        {/* The icons share one tooltip bubble that glides between them. */}
        <TooltipGroup>
          <DataTableFilters table={table} />
          <DataTableViewOptions table={table} />
          <DataTableSearch table={table} column="name" placeholder="Search people…" />
        </TooltipGroup>
      </div>
      <DataTableFilterChips table={table} />
      <DataTable
        table={table}
        loading={!ready}
        loadingRows={8}
        onUndo={history.undo}
        onRedo={history.redo}
      />
      <DataTablePagination table={table} pageSizes={[]} />
      <DataTableSelectionBar
        table={table}
        actions={(rows) => {
          const ids = rows.map((r) => r.original.id);
          return [
            { value: "admin", label: "Make admins", icon: icons.shield, onSelect: () => update(ids, { role: "Admin" }, `Made ${people(ids.length)} admins`) },
            { value: "suspend", label: "Suspend", icon: icons.lock, onSelect: () => update(ids, { status: "Suspended" }, `Suspended ${people(ids.length)}`) },
            {
              value: "remove",
              label: "Remove from team",
              icon: icons.x,
              destructive: true,
              onSelect: () => {
                remove(ids);
                table.resetRowSelection();
              },
            },
          ];
        }}
      />
    </div>
  );
}

export const teamCode = `import {
  useDataTable, DataTable, DataTableColumnHeader, DataTableTitle, DataTableSearch, DataTableFilters, DataTableFilterChips, DataTableViewOptions,
  DataTablePagination, DataTableSelectionBar, selectColumn, rowActionsColumn, useUndoableRows,
  type ColumnDef,
} from "./components";
import { TooltipGroup } from "./components";

// Every change is a step: ⌘Z / ⇧⌘Z in the table, or the toast's Undo.
const history = useUndoableRows(team, { getId: (m) => m.id });
const members = history.rows;
const remove = (ids: string[]) => {
  const label = \`Removed \${ids.length} people\`;
  const before = history.stepCount;
  history.remove(ids, label);
  // Your app's toast: the step's label and a way back to before it.
  showToast(label, { action: { label: "Undo", onClick: () => history.undoTo(before) } });
};
const makeAdmin = (ids: string[]) =>
  history.apply("Made admins", (rows) => rows.map((m) => (ids.includes(m.id) ? { ...m, role: "Admin" } : m)));

const columns: ColumnDef<Member>[] = [
  selectColumn<Member>(),
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: "email", header: "Email", meta: { lines: 1 } },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <Badge variant="ghost" color={ROLE_COLOR[row.original.role]}>{row.original.role}</Badge>,
    // The filter lists the roles with their badge's dot.
    meta: { filter: { type: "options", options: Object.entries(ROLE_COLOR).map(([value, color]) => ({ value, color })) } },
  },
  // Status, Last active…
  rowActionsColumn<Member>((row) => (
    <>
      <MenuItem index={0} label="Make admin" onSelect={() => makeAdmin([row.original.id])} />
      <MenuItem index={1} label="Remove" destructive onSelect={() => remove([row.original.id])} />
    </>
  )),
];

const table = useDataTable({
  data: members,
  columns,
  pageSize: 8,
  getRowId: (m) => m.id,
  // Start with a few rows selected (or none: leave this out).
  initialState: { rowSelection: { "2": true, "3": true, "5": true } },
});

<div className="flex flex-col gap-2">
  {/* The title, then the tools at the right end, on one row. */}
  <div className="mb-1 flex flex-wrap items-center gap-1">
    <DataTableTitle table={table}>Team</DataTableTitle>
    <span className="ml-auto" />
    <TooltipGroup>
      <DataTableFilters table={table} />
      <DataTableViewOptions table={table} />
      <DataTableSearch table={table} column="name" placeholder="Search people…" />
    </TooltipGroup>
  </div>
  {/* Added filters, on their own row above the table. */}
  <DataTableFilterChips table={table} />
  <DataTable table={table} onUndo={history.undo} onRedo={history.redo} />
  <DataTablePagination table={table} pageSizes={[]} />
</div>
<DataTableSelectionBar
  table={table}
  actions={(rows) => [
    { value: "admin", label: "Make admins", onSelect: () => makeAdmin(rows.map((r) => r.original.id)) },
    { value: "suspend", label: "Suspend", onSelect: () => suspend(rows.map((r) => r.original.id)) },
    { value: "remove", label: "Remove from team", destructive: true, onSelect: () => remove(rows.map((r) => r.original.id)) },
  ]}
/>`;

// ── Editable cells: a project's tasks ────────────────────

type Task = { id: string; title: string; status: string; estimate: number; due: string; labels: string[]; link: string };

const TASKS: Task[] = [
  { id: "t1", title: "Draft the onboarding checklist", status: "In progress", estimate: 3, due: "2026-11-12", labels: ["Docs"], link: "acme.co/specs/onboarding" },
  { id: "t2", title: "Fix the date picker on Safari", status: "Todo", estimate: 2, due: "2026-11-10", labels: ["Bug", "Web"], link: "acme.co/issues/412" },
  { id: "t3", title: "Ship dark mode for the billing page and the invoices it lists", status: "Review", estimate: 5, due: "2026-11-14", labels: ["Design"], link: "acme.co/specs/billing-dark" },
  { id: "t4", title: "Interview 5 customers about exports", status: "Todo", estimate: 8, due: "2026-11-21", labels: ["Research"], link: "acme.co/research/exports" },
  { id: "t5", title: "Rename workspaces to teams", status: "Done", estimate: 1, due: "2026-11-03", labels: ["Web"], link: "acme.co/issues/398" },
  { id: "t6", title: "Rate-limit the public API", status: "In progress", estimate: 5, due: "2026-11-18", labels: ["API"], link: "acme.co/issues/405" },
];

const STATUS_OPTIONS = [
  { value: "Todo", color: "gray" },
  { value: "In progress", color: "blue" },
  { value: "Review", color: "amber" },
  { value: "Done", color: "green" },
] as const;
const TASK_STATUS_COLOR = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.color])) as Record<string, (typeof STATUS_OPTIONS)[number]["color"]>;

const taskColumns: ColumnDef<Task>[] = [
  selectColumn<Task>(),
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
    meta: { editor: "text", className: "w-full min-w-56" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <span className="flex h-[1lh] items-center">
        <Badge variant="ghost" color={TASK_STATUS_COLOR[row.original.status] ?? "gray"}>
          {row.original.status}
        </Badge>
      </span>
    ),
    meta: { editor: { type: "select", options: STATUS_OPTIONS } },
  },
  {
    accessorKey: "estimate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Points" />,
    meta: { label: "Points", className: "tabular-nums", editor: { type: "number", options: [1, 2, 3, 5, 8, 13] } },
  },
  {
    accessorKey: "due",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    meta: { className: "whitespace-nowrap", editor: "date" },
  },
  {
    accessorKey: "labels",
    header: "Labels",
    enableSorting: false,
    meta: { className: "min-w-56", editor: { type: "tags", options: ["API", "Bug", "Design", "Docs", "Research", "Web"], creatable: true } },
  },
  {
    accessorKey: "link",
    header: "Spec",
    meta: { lines: 1, className: "min-w-52", editor: { type: "text", link: true } },
  },
];

export function TasksTable() {
  // Each edit is a step ⌘Z takes back, as in the playground.
  const history = useUndoableRows(TASKS, { getId: (t) => t.id });
  const tasks = history.rows;
  const ready = useFontsReady();
  const table = useDataTable({
    data: tasks,
    columns: taskColumns,
    getRowId: (t) => t.id,
  });
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Tasks</DataTableTitle>
        <DataTableFilters table={table} className="ml-auto" />
      </div>
      <DataTableFilterChips table={table} />
      <DataTable
        table={table}
        resizeColumns
        loading={!ready}
        loadingRows={6}
        onCellEdit={({ row, columnId, value }) =>
          history.apply(
            `Edited ${row.original.title}`,
            (old) => old.map((t) => (t.id === row.original.id ? { ...t, [columnId]: value } : t)),
            // A burst of typing in one cell is one step.
            `${row.original.id}:${columnId}`
          )
        }
        onUndo={history.undo}
        onRedo={history.redo}
      />
    </div>
  );
}

export const tasksCode = `import { useDataTable, DataTable, DataTableColumnHeader, selectColumn, useUndoableRows, type ColumnDef } from "./components";

const columns: ColumnDef<Task>[] = [
  selectColumn<Task>(),
  { accessorKey: "title", header: "Task", meta: { editor: "text" } },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="ghost" color={STATUS_COLOR[row.original.status]}>{row.original.status}</Badge>,
    // The badge stays the trigger; the menu shows each option's dot.
    meta: { editor: { type: "select", options: [{ value: "Todo", color: "gray" }, { value: "Done", color: "green" }] } },
  },
  { accessorKey: "estimate", header: "Points", meta: { editor: { type: "number", options: [1, 2, 3, 5, 8, 13] } } },
  { accessorKey: "due", header: "Due", meta: { editor: "date" } },
  { accessorKey: "labels", header: "Labels", meta: { editor: { type: "tags", options: ["Bug", "Docs"], creatable: true } } },
  { accessorKey: "link", header: "Spec", meta: { lines: 1, editor: { type: "text", link: true } } },
];

// Each edit is a step: ⌘Z / ⇧⌘Z in the table take it back and redo it.
const history = useUndoableRows(initialTasks, { getId: (t) => t.id });
const table = useDataTable({ data: history.rows, columns, getRowId: (t) => t.id });

<DataTable
  table={table}
  // Each change as it's made: write it back, and the table shows it.
  onCellEdit={({ row, columnId, value }) =>
    // The third argument merges a burst of typing in one cell into one step.
    history.apply(
      "Edited a task",
      (old) => old.map((t) => (t.id === row.original.id ? { ...t, [columnId]: value } : t)),
      \`\${row.original.id}:\${columnId}\`
    )
  }
  onUndo={history.undo}
  onRedo={history.redo}
/>`;

// ── Sub-rows: folders and files ──────────────────────────

type FileRow = { id: string; name: string; kind: string; size: number; modified: string; children?: FileRow[] };

const FILES: FileRow[] = [
  {
    id: "brand", name: "Brand", kind: "Folder", size: 0, modified: "2026-11-06",
    children: [
      { id: "brand/logo", name: "logo.svg", kind: "SVG", size: 12, modified: "2026-10-02" },
      { id: "brand/guide", name: "guidelines.pdf", kind: "PDF", size: 4300, modified: "2026-11-06" },
      {
        id: "brand/type", name: "Type", kind: "Folder", size: 0, modified: "2026-09-18",
        children: [
          { id: "brand/type/inter", name: "Inter.var.woff2", kind: "Font", size: 336, modified: "2026-09-18" },
          { id: "brand/type/mono", name: "Mono.woff2", kind: "Font", size: 98, modified: "2026-09-18" },
        ],
      },
    ],
  },
  {
    id: "product", name: "Product", kind: "Folder", size: 0, modified: "2026-11-08",
    children: [
      { id: "product/roadmap", name: "roadmap.md", kind: "Markdown", size: 18, modified: "2026-11-08" },
      { id: "product/research", name: "interviews.csv", kind: "CSV", size: 640, modified: "2026-11-01" },
    ],
  },
  { id: "readme", name: "README.md", kind: "Markdown", size: 6, modified: "2026-08-21" },
  { id: "deck", name: "pitch.key", kind: "Keynote", size: 52800, modified: "2026-10-12" },
];

/** A folder's size is the sum of what it holds. */
const totalSize = (row: FileRow): number =>
  row.children ? row.children.reduce((sum, child) => sum + totalSize(child), 0) : row.size;

const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

const fileColumns: ColumnDef<FileRow>[] = [
  selectColumn<FileRow>(),
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: { className: "w-full" },
  },
  { accessorKey: "kind", header: "Kind" },
  {
    id: "size",
    accessorFn: totalSize,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
    cell: ({ getValue }) => formatSize(getValue<number>()),
    meta: { label: "Size", className: "tabular-nums whitespace-nowrap" },
  },
  {
    accessorKey: "modified",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Modified" />,
    cell: ({ row }) => shortDay(row.original.modified),
    meta: { className: "tabular-nums whitespace-nowrap" },
  },
];

export function FilesTable() {
  const [data] = useState(FILES);
  const table = useDataTable({
    data,
    columns: fileColumns,
    getRowId: (f) => f.id,
    getSubRows: (f) => f.children,
    // Two levels open, so the indent and the guides show.
    initialState: { expanded: { brand: true, "brand/type": true } },
  });
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Files</DataTableTitle>
        <span className="ml-auto" />
        <DataTableSearch table={table} column="name" placeholder="Search files…" />
      </div>
      <DataTable table={table} />
    </div>
  );
}

export const filesCode = `import { useDataTable, DataTable, DataTableColumnHeader, DataTableSearch, selectColumn, type ColumnDef } from "./components";

// A folder's size is the sum of what it holds.
const totalSize = (row: FileRow): number =>
  row.children ? row.children.reduce((sum, child) => sum + totalSize(child), 0) : row.size;

const columns: ColumnDef<FileRow>[] = [
  selectColumn<FileRow>(),
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: "kind", header: "Kind" },
  { id: "size", accessorFn: totalSize, header: "Size", cell: ({ getValue }) => formatSize(getValue<number>()) },
  { accessorKey: "modified", header: "Modified" },
];

const table = useDataTable({
  data: files,
  columns,
  getRowId: (f) => f.id,
  // The first column gets a chevron and an indent per level.
  getSubRows: (f) => f.children,
  initialState: { expanded: { brand: true, "brand/type": true } },
});

<div className="flex justify-end">
  <DataTableSearch table={table} column="name" placeholder="Search files…" />
</div>
<DataTable table={table} />`;

// ── Wrapped text: a changelog ────────────────────────────

type Entry = { id: string; kind: "New" | "Updated" | "Fixed"; title: string; date: string; summary: string };

const ENTRIES: Entry[] = [
  { id: "e1", kind: "New", title: "Data tables", date: "2026-11-08", summary: "Sort, search, resize and reorder columns, select rows with spreadsheet keys, edit cells in place, and open rows into their sub-rows." },
  { id: "e2", kind: "Updated", title: "Breadcrumb menus", date: "2026-11-07", summary: "Collapsed crumbs open on hover as well as on click, and the menu keeps focus where it was." },
  { id: "e3", kind: "Fixed", title: "Calendar in Safari", date: "2026-11-04", summary: "A range picked across two months no longer jumps back to the first month when the second click lands." },
  { id: "e4", kind: "New", title: "Field and text inputs", date: "2026-11-04", summary: "Labels, help text and errors compose into one accessible field, around an input that mirrors the Select trigger." },
  { id: "e5", kind: "Updated", title: "Sharp corners", date: "2026-11-02", summary: "A third shape setting, 1px corners on every surface, joins rounded and pill." },
];

const KIND_COLOR = { New: "blue", Updated: "amber", Fixed: "red" } as const;

const entryColumns: ColumnDef<Entry>[] = [
  {
    accessorKey: "kind",
    header: "Kind",
    cell: ({ row }) => (
      <span className="flex h-[1lh] items-center">
        <Badge variant="ghost" color={KIND_COLOR[row.original.kind]}>
          {row.original.kind}
        </Badge>
      </span>
    ),
  },
  { accessorKey: "title", header: "Title", meta: { className: "whitespace-nowrap" } },
  {
    accessorKey: "summary",
    header: "Summary",
    // Runs onto as many lines as it needs; the row grows with it.
    meta: { lines: "wrap", className: "w-full min-w-64" },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => shortDay(row.original.date),
    meta: { className: "tabular-nums whitespace-nowrap" },
  },
];

export function ChangelogTable() {
  const [data] = useState(ENTRIES);
  const table = useDataTable({ data, columns: entryColumns, getRowId: (e) => e.id });
  return (
    <div className="flex w-full flex-col gap-2">
      <DataTableTitle as="h3" table={table} className="mb-1 font-heading-display">Changelog</DataTableTitle>
      <DataTable table={table} />
    </div>
  );
}

export const changelogCode = `import { useDataTable, DataTable, type ColumnDef } from "./components";

const columns: ColumnDef<Entry>[] = [
  { accessorKey: "kind", header: "Kind", cell: ({ row }) => <Badge variant="ghost" color={KIND_COLOR[row.original.kind]}>{row.original.kind}</Badge> },
  { accessorKey: "title", header: "Title" },
  // "wrap" runs the text onto as many lines as it needs; with it, cells
  // align to the top (cellAlign="auto").
  { accessorKey: "summary", header: "Summary", meta: { lines: "wrap", className: "w-full" } },
  { accessorKey: "date", header: "Date" },
];

const table = useDataTable({ data: entries, columns });

<DataTable table={table} />`;

// ── Saved views: the table's state, named ─────────────────

type View = { id: number; name: string; state: Pick<TableState, "columnFilters" | "sorting" | "columnVisibility" | "globalFilter"> };

// The table as it starts: the first tab, which stays put.
const EVERYONE: View["state"] = { columnFilters: [], sorting: [], columnVisibility: {}, globalFilter: "" };

const viewColumns: ColumnDef<Member>[] = [
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: "role", header: ({ column }) => <DataTableColumnHeader column={column} title="Role" /> },
  { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} title="Status" /> },
  { accessorKey: "lastActive", header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />, cell: ({ row }) => shortDay(row.original.lastActive) },
];

/** A view's state as one string, to tell two apart: only the hidden
 *  columns count (an empty visibility and one listing every column as
 *  shown are the same view), and an unset search is an empty one. */
const viewKey = (state: View["state"]) =>
  JSON.stringify([
    state.columnFilters,
    state.sorting,
    Object.keys(state.columnVisibility ?? {}).filter((id) => state.columnVisibility[id] === false).sort(),
    state.globalFilter ?? "",
  ]);

const VIEWS: View[] = [
  {
    id: 1,
    name: "Pending invites",
    state: {
      columnFilters: [{ id: "status", value: { kind: "options", values: ["Invited"] } }],
      sorting: [{ id: "lastActive", desc: true }],
      columnVisibility: {},
      globalFilter: "",
    },
  },
  {
    id: 2,
    name: "Admins",
    state: {
      columnFilters: [{ id: "role", value: { kind: "options", values: ["Owner", "Admin"] } }],
      sorting: [{ id: "name", desc: false }],
      columnVisibility: {},
      globalFilter: "",
    },
  },
  {
    id: 3,
    name: "Recently active",
    state: {
      columnFilters: [{ id: "status", value: { kind: "options", values: ["Active"] } }],
      sorting: [{ id: "lastActive", desc: true }],
      columnVisibility: { role: false },
      globalFilter: "",
    },
  },
];
// The section opens on a saved view: its tab picked, its filter set.
const OPEN_VIEW = 2;

export function ViewsTable() {
  const table = useDataTable({
    data: MEMBERS,
    columns: viewColumns,
    pageSize: 6,
    getRowId: (m) => m.id,
    initialState: VIEWS[OPEN_VIEW - 1].state,
    // The filter row starts tucked away, so the tabs lead: the Filter
    // button (its dot says filters apply) brings it back.
    filtersHidden: true,
  });
  const [views, setViews] = useState(VIEWS);
  // The open tab: 0 is Everyone, a saved view is its index + 1.
  const [open, setOpen] = useState(OPEN_VIEW);
  // A view just saved opens for naming in its tab.
  const [nameNext, setNameNext] = useState<number | null>(null);
  const show = (state: View["state"]) =>
    table.setState((old) => ({ ...old, ...state, pagination: { ...old.pagination, pageIndex: 0 } }));
  const pick = (tab: number) => {
    const state = tab === 0 ? EVERYONE : views[tab - 1]?.state;
    if (!state) return;
    show(state);
    setOpen(tab);
  };
  const save = () => {
    const { columnFilters, sorting, columnVisibility, globalFilter } = table.getState();
    const id = views.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    setViews((old) => [...old, { id, name: `View ${old.length + 1}`, state: { columnFilters, sorting, columnVisibility, globalFilter } }]);
    setOpen(views.length + 1);
    setNameNext(views.length + 1);
  };
  const remove = (at: number) => {
    const view = views[at];
    if (!view) return;
    setViews((old) => old.filter((_, i) => i !== at));
    show(EVERYONE);
    setOpen(0);
    // Its way back: the view returns to its place, open.
    showUndoToast(`Deleted ${view.name}`, () => {
      setViews((old) => [...old.slice(0, at), view, ...old.slice(at)]);
      show(view.state);
      setOpen(at + 1);
    });
  };
  // Save view shows once the table differs from the open view: before
  // that there is nothing new to save.
  const openState = open === 0 ? EVERYONE : views[open - 1]?.state;
  const now = table.getState();
  const changed =
    !openState ||
    viewKey({ columnFilters: now.columnFilters, sorting: now.sorting, columnVisibility: now.columnVisibility, globalFilter: now.globalFilter }) !==
      viewKey(openState);
  const ready = useFontsReady();
  const move = (from: number, to: number) => {
    setViews((old) => {
      const next = [...old];
      const [moved] = next.splice(from - 1, 1);
      next.splice(to - 1, 0, moved);
      return next;
    });
    // The open view stays open wherever it lands.
    setOpen((cur) =>
      cur === from ? to : cur > Math.min(from, to) && cur <= Math.max(from, to) ? cur + (from < to ? -1 : 1) : cur
    );
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">People</DataTableTitle>
        <span className="ml-auto" />
        <DataTableFilters table={table} />
      </div>
      {/* The views as subtle tabs: one gliding hover, the open view's pill.
          Click the open tab to rename it (its × deletes it), drag a tab or
          press Alt + ← / → to move it. Everyone alone needs no tabs. */}
      {views.length > 0 && (
        <ViewTabs
          first="Everyone"
          views={views}
          selected={open}
          onSelect={pick}
          onRename={(at, name) => setViews((old) => old.map((v, i) => (i === at ? { ...v, name } : v)))}
          onDelete={remove}
          onMove={move}
          nameRequest={nameNext}
          onNameRequested={() => setNameNext(null)}
        />
      )}
      {/* Save view after the chips' + Add filter, with the first filter. */}
      <DataTableFilterChips table={table}>
        {changed && (
          <Button variant="ghost" onClick={save}>
            Save view
          </Button>
        )}
      </DataTableFilterChips>
      <DataTable table={table} loading={!ready} loadingRows={3} />
    </div>
  );
}

export const viewsCode = `import { useDataTable, DataTable, DataTableFilters, DataTableFilterChips, Tabs, TabsItem, type TableState } from "./components";

// A view is the table's state, named: filters, sort, visible columns.
// Keep views wherever your app keeps settings (the URL, localStorage, your
// database); the table only reads and sets them.
type View = { name: string; state: Pick<TableState, "columnFilters" | "sorting" | "columnVisibility" | "globalFilter"> };

const table = useDataTable({ data, columns });

const saveView = (name: string) => {
  const { columnFilters, sorting, columnVisibility, globalFilter } = table.getState();
  setViews((old) => [...old, { name, state: { columnFilters, sorting, columnVisibility, globalFilter } }]);
};

const openView = (view: View) =>
  table.setState((old) => ({ ...old, ...view.state, pagination: { ...old.pagination, pageIndex: 0 } }));

{views.length > 1 && (
  <Tabs selectedIndex={views.indexOf(current)} onSelect={(i) => openView(views[i])}>
    {views.map((view, i) => (
      <TabsItem key={view.name} index={i} label={view.name} />
    ))}
  </Tabs>
)}
<DataTableFilters table={table} />
<DataTableFilterChips table={table} />
<DataTable table={table} />`;

// ── Frozen columns: a wide list of accounts ──────────────

type Account = { id: string; company: string; contact: string; email: string; plan: "Free" | "Team" | "Scale"; seats: number; mrr: number; renewal: string; country: string; owner: string };

const ACCOUNTS: Account[] = [
  { id: "a1", company: "Northwind Labs", contact: "Ada Brooks", email: "ada@northwind.io", plan: "Scale", seats: 120, mrr: 4800, renewal: "2027-01-14", country: "Germany", owner: "Kenji" },
  { id: "a2", company: "Halden Studio", contact: "Omar Haddad", email: "omar@halden.studio", plan: "Team", seats: 18, mrr: 540, renewal: "2026-12-02", country: "Norway", owner: "Lena" },
  { id: "a3", company: "Brightside", contact: "Priya Nair", email: "priya@brightside.co", plan: "Team", seats: 42, mrr: 1260, renewal: "2027-03-20", country: "India", owner: "Kenji" },
  { id: "a4", company: "Costa & Sons", contact: "Ines Costa", email: "ines@costa.pt", plan: "Free", seats: 3, mrr: 0, renewal: "2026-11-30", country: "Portugal", owner: "Sam" },
  { id: "a5", company: "Varga Systems", contact: "Leo Varga", email: "leo@varga.systems", plan: "Scale", seats: 260, mrr: 10400, renewal: "2027-06-01", country: "Hungary", owner: "Lena" },
  { id: "a6", company: "Okafor Health", contact: "Sam Okafor", email: "sam@okafor.health", plan: "Team", seats: 27, mrr: 810, renewal: "2027-02-11", country: "Nigeria", owner: "Sam" },
];

const PLAN_COLOR = { Free: "gray", Team: "blue", Scale: "purple" } as const;
const euros = (n: number) => `€${n.toLocaleString("en-US")}`;

const accountColumns: ColumnDef<Account>[] = [
  selectColumn<Account>(),
  { accessorKey: "company", header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />, enableHiding: false },
  // A floor per column (min-w): short of room a column gives up width
  // down to its header's, and these would cut their text before the table
  // scrolled.
  { accessorKey: "contact", header: "Contact", meta: { className: "whitespace-nowrap min-w-28" } },
  { accessorKey: "email", header: "Email", meta: { className: "whitespace-nowrap min-w-44" } },
  {
    accessorKey: "plan",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
    cell: ({ row }) => (
      <span className="flex h-[1lh] items-center">
        <Badge variant="ghost" color={PLAN_COLOR[row.original.plan]}>
          {row.original.plan}
        </Badge>
      </span>
    ),
  },
  { accessorKey: "seats", header: ({ column }) => <DataTableColumnHeader column={column} title="Seats" />, meta: { className: "tabular-nums" } },
  {
    accessorKey: "mrr",
    header: ({ column }) => <DataTableColumnHeader column={column} title="MRR" />,
    cell: ({ row }) => euros(row.original.mrr),
    meta: { label: "MRR", className: "tabular-nums whitespace-nowrap min-w-20" },
  },
  {
    accessorKey: "renewal",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Renews" />,
    cell: ({ row }) => shortDay(row.original.renewal),
    meta: { label: "Renews", className: "tabular-nums whitespace-nowrap" },
  },
  { accessorKey: "country", header: "Country", meta: { className: "whitespace-nowrap min-w-24" } },
  { accessorKey: "owner", header: "Owner", meta: { className: "whitespace-nowrap" } },
  rowActionsColumn<Account>((row) => (
    <>
      <MenuItem index={0} label="Copy email" onSelect={() => navigator.clipboard?.writeText(row.original.email)} />
      <MenuItem index={1} label="Copy company" onSelect={() => navigator.clipboard?.writeText(row.original.company)} />
    </>
  )),
];

export function FrozenTable() {
  const [data] = useState(ACCOUNTS);
  const table = useDataTable({
    data,
    columns: accountColumns,
    getRowId: (a) => a.id,
  });
  const ready = useFontsReady();
  // The section opens a little way into its scroll: the frozen edges'
  // hairlines and both fades only show while content passes under them.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ready) return;
    const viewport = box.current?.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
    const frame = requestAnimationFrame(() => {
      if (viewport && viewport.scrollLeft === 0) viewport.scrollLeft = 96;
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  return (
    <div ref={box} className="flex w-full flex-col gap-2">
      <DataTableTitle as="h3" table={table} className="mb-1 font-heading-display">Accounts</DataTableTitle>
      <DataTable table={table} resizeColumns loading={!ready} loadingRows={6} />
    </div>
  );
}

export const frozenCode = `import { useDataTable, DataTable, DataTableTitle, selectColumn, rowActionsColumn, type ColumnDef } from "./components";

const columns: ColumnDef<Account>[] = [
  selectColumn<Account>(),
  { accessorKey: "company", header: "Company" },
  // Contact, Email, Plan, Seats, MRR, Renews, Country, Owner…
  rowActionsColumn<Account>((row) => <MenuItem index={0} label="Copy email" onSelect={() => copy(row.original.email)} />),
];

// Out of the box: the boxes and the first data column stay on the left,
// the row menus on the right, once the table scrolls sideways.
const table = useDataTable({ data: accounts, columns });

// Or choose them (ids, in order), or turn pinning off:
// useDataTable({ data, columns, initialState: { columnPinning: { left: ["select", "company", "contact"], right: [] } } })
// useDataTable({ data, columns, enableColumnPinning: false })

<DataTableTitle table={table}>Accounts</DataTableTitle>
<DataTable table={table} resizeColumns />`;

// ── Filters: invoices ────────────────────────────────────

type Invoice = { id: string; customer: string; status: "Paid" | "Open" | "Overdue" | "Draft"; amount: number; due: string };

const INVOICES: Invoice[] = [
  { id: "INV-1042", customer: "Northwind Labs", status: "Overdue", amount: 4800, due: "2026-10-28" },
  { id: "INV-1043", customer: "Halden Studio", status: "Open", amount: 540, due: "2026-11-20" },
  { id: "INV-1044", customer: "Brightside", status: "Paid", amount: 1260, due: "2026-11-02" },
  { id: "INV-1045", customer: "Costa & Sons", status: "Draft", amount: 90, due: "2026-12-01" },
  { id: "INV-1046", customer: "Varga Systems", status: "Open", amount: 10400, due: "2026-11-25" },
  { id: "INV-1047", customer: "Okafor Health", status: "Overdue", amount: 810, due: "2026-11-05" },
  { id: "INV-1048", customer: "Northwind Labs", status: "Paid", amount: 4800, due: "2026-09-28" },
  { id: "INV-1049", customer: "Brightside", status: "Open", amount: 1260, due: "2026-12-02" },
];

const INVOICE_COLOR = { Paid: "green", Open: "blue", Overdue: "red", Draft: "gray" } as const;

const invoiceColumns: ColumnDef<Invoice>[] = [
  { accessorKey: "id", header: "Invoice", meta: { className: "tabular-nums whitespace-nowrap", filter: false } },
  {
    accessorKey: "customer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    // Text: contains, is, starts with…
    meta: { className: "w-full", filter: "text" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <span className="flex h-[1lh] items-center">
        <Badge variant="ghost" color={INVOICE_COLOR[row.original.status]}>
          {row.original.status}
        </Badge>
      </span>
    ),
    // A few values: pick any of them, each with its badge's dot.
    meta: { filter: { type: "options", options: badgeOptions(INVOICE_COLOR) } },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => euros(row.original.amount),
    // A number: a least, a most, or both.
    meta: { className: "tabular-nums whitespace-nowrap", filter: "number" },
  },
  {
    accessorKey: "due",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    cell: ({ row }) => shortDay(row.original.due),
    // A day: between two, before one, or after one.
    meta: { className: "tabular-nums whitespace-nowrap", filter: "date" },
  },
];

export function FiltersTable() {
  const [data] = useState(INVOICES);
  const table = useDataTable({
    data,
    columns: invoiceColumns,
    getRowId: (i) => i.id,
    // The section opens filtered: two chips set, one of each kind.
    initialState: {
      columnFilters: [
        { id: "status", value: { kind: "options", values: ["Open", "Overdue"] } },
        { id: "amount", value: { kind: "number", min: 500 } },
      ],
    },
  });
  const ready = useFontsReady();
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Invoices</DataTableTitle>
        <DataTableFilters table={table} className="ml-auto" />
      </div>
      <DataTableFilterChips table={table} />
      <DataTable
        table={table}
        loading={!ready}
        loadingRows={5}
        empty={{ title: "No invoices match" }}
      />
    </div>
  );
}

export const filtersCode = `import { useDataTable, DataTable, DataTableTitle, DataTableFilters, DataTableFilterChips, type ColumnDef } from "./components";

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: "id", header: "Invoice", meta: { filter: false } }, // not filterable
  { accessorKey: "customer", header: "Customer", meta: { filter: "text" } },
  // A few values, each with its badge's dot.
  { accessorKey: "status", header: "Status", meta: { filter: { type: "options", options: [{ value: "Open", color: "blue" }, { value: "Overdue", color: "red" }] } } },
  { accessorKey: "amount", header: "Amount", meta: { filter: "number" } },
  { accessorKey: "due", header: "Due", meta: { filter: "date" } },
];

const table = useDataTable({
  data: invoices,
  columns,
  // Filters are TanStack's columnFilters: start with some, or read them back.
  initialState: {
    columnFilters: [
      { id: "status", value: { kind: "options", values: ["Open", "Overdue"] } },
      { id: "amount", value: { kind: "number", min: 500 } },
    ],
  },
});

<div className="flex items-center">
  <DataTableTitle table={table}>Invoices</DataTableTitle>
  {/* The button lists the columns that can filter. */}
  <DataTableFilters table={table} className="ml-auto" />
</div>
{/* The filters set, as chips on their own row. */}
<DataTableFilterChips table={table} />
<DataTable table={table} empty={{ title: "No invoices match" }} />`;

// ── Resizing and reordering columns ──────────────────────

const layoutColumns: ColumnDef<Member>[] = [
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />, enableHiding: false },
  { accessorKey: "email", header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />, meta: { lines: 1 } },
  { accessorKey: "role", header: ({ column }) => <DataTableColumnHeader column={column} title="Role" /> },
  { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} title="Status" /> },
  {
    accessorKey: "lastActive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />,
    cell: ({ row }) => shortDay(row.original.lastActive),
    meta: { label: "Last active", className: "tabular-nums whitespace-nowrap" },
  },
];

export function ColumnsTable() {
  const [data] = useState(() => MEMBERS.slice(0, 6));
  const table = useDataTable({
    data,
    columns: layoutColumns,
    getRowId: (m) => m.id,
    // The section opens on a layout already changed: Status moved up
    // beside the name. (Widths start from the content; a saved
    // `columnSizing` would need every column's.)
    initialState: { columnOrder: ["name", "status", "email", "role", "lastActive"] },
  });
  const ready = useFontsReady();
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <DataTableTitle as="h3" table={table} className="font-heading-display">Members</DataTableTitle>
        <DataTableViewOptions table={table} className="ml-auto" />
      </div>
      <DataTable table={table} resizeColumns reorderColumns loading={!ready} loadingRows={6} />
    </div>
  );
}

export const columnsCode = `import { useDataTable, DataTable, DataTableTitle, DataTableViewOptions } from "./components";

const table = useDataTable({
  data: members,
  columns,
  // Both are TanStack state (columnOrder, columnSizing): start from a saved
  // layout, or read it back to save one. A saved columnSizing lists every column.
  initialState: { columnOrder: ["name", "status", "email", "role", "lastActive"] },
});

<div className="flex items-center">
  <DataTableTitle table={table}>Members</DataTableTitle>
  {/* The Columns menu hides and shows columns, and reorders them too. */}
  <DataTableViewOptions table={table} className="ml-auto" />
</div>
{/* Drag a column's right edge to resize it; drag a header to move it. */}
<DataTable table={table} resizeColumns reorderColumns />`;

// ── Reordering rows: a launch checklist ──────────────────

type Step = { id: string; step: string; owner: string; when: string };

const STEPS: Step[] = [
  { id: "1", step: "Freeze the release branch", owner: "Kenji", when: "Mon" },
  { id: "2", step: "Run the migration on staging", owner: "Lena", when: "Mon" },
  { id: "3", step: "Write the changelog", owner: "Ada", when: "Tue" },
  { id: "4", step: "Record the demo video", owner: "Omar", when: "Tue" },
  { id: "5", step: "Email the beta group", owner: "Priya", when: "Wed" },
  { id: "6", step: "Flip the feature flag", owner: "Kenji", when: "Thu" },
  { id: "7", step: "Post the announcement", owner: "Ada", when: "Thu" },
];

export function ReorderTable() {
  // Each move is a step ⌘Z takes back.
  const history = useUndoableRows(STEPS, { getId: (s) => s.id });
  // No sortable headers: a sorted column would decide the order instead.
  const columns: ColumnDef<Step>[] = [
    rowHandleColumn<Step>(),
    selectColumn<Step>(),
    { accessorKey: "step", header: "Step", enableSorting: false, meta: { className: "w-full" } },
    { accessorKey: "owner", header: "Owner", enableSorting: false },
    { accessorKey: "when", header: "When", enableSorting: false },
  ];
  const table = useDataTable({
    data: history.rows,
    columns,
    getRowId: (s) => s.id,
    // Two steps already selected: drag either and both move.
    initialState: { rowSelection: { "3": true, "4": true } },
  });
  return (
    <div className="flex w-full flex-col gap-2">
      <DataTableTitle as="h3" table={table} className="mb-1 font-heading-display">Launch checklist</DataTableTitle>
      <DataTable
        table={table}
        onRowReorder={(move) =>
          history.apply(move.rows.length === 1 ? "Moved a row" : `Moved ${move.rows.length} rows`, (rows) => moveRows(rows, move))
        }
        onUndo={history.undo}
        onRedo={history.redo}
      />
    </div>
  );
}

export const reorderCode = `import { useState } from "react";
import { useDataTable, DataTable, rowHandleColumn, selectColumn, moveRows, type ColumnDef } from "./components";

const columns: ColumnDef<Step>[] = [
  rowHandleColumn<Step>(), // the grip, before the boxes
  selectColumn<Step>(),
  { accessorKey: "step", header: "Step" },
  { accessorKey: "owner", header: "Owner" },
  { accessorKey: "when", header: "When" },
];

const [rows, setRows] = useState(steps);
const table = useDataTable({ data: rows, columns, getRowId: (s) => s.id });

// The table reports the move; moveRows writes it to your data.
<DataTable table={table} onRowReorder={(move) => setRows((old) => moveRows(old, move))} />`;
