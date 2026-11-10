"use client";

// The DataTable page's capability sections: each one a table built for the
// thing it shows, on data that suits it, with the code it runs.

import { useState } from "react";
import {
  useDataTable,
  DataTable,
  DataTableColumnHeader,
  DataTableSearch,
  DataTableFilters,
  DataTableViewOptions,
  DataTablePagination,
  DataTableSelectionBar,
  selectColumn,
  rowActionsColumn,
  type ColumnDef,
} from "@/components/ui/data-table";
import { MenuItem } from "@/components/ui/menu-item";
import { Badge } from "@/registry/default/badge";
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
  const [members, setMembers] = useState(MEMBERS);
  const update = (ids: string[], change: Partial<Member>) =>
    setMembers((old) => old.map((m) => (ids.includes(m.id) ? { ...m, ...change } : m)));
  const remove = (ids: string[]) => setMembers((old) => old.filter((m) => !ids.includes(m.id)));

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
    },
    {
      accessorKey: "lastActive",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />,
      cell: ({ row }) => shortDay(row.original.lastActive),
      meta: { label: "Last active", className: "tabular-nums whitespace-nowrap w-full" },
    },
    rowActionsColumn<Member>((row) => (
      <>
        <MenuItem index={0} label="Make admin" onSelect={() => update([row.original.id], { role: "Admin" })} />
        <MenuItem index={1} label="Remove" onSelect={() => remove([row.original.id])} />
      </>
    )),
  ];

  const table = useDataTable({ data: members, columns, pageSize: 8, getRowId: (m) => m.id });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DataTableSearch table={table} column="name" placeholder="Search people…" className="max-w-56" />
        <DataTableFilters table={table} />
        <DataTableViewOptions table={table} className="ml-auto" />
      </div>
      <DataTable table={table} />
      <DataTablePagination table={table} pageSizes={[]} />
      <DataTableSelectionBar
        table={table}
        actions={(rows) => {
          const ids = rows.map((r) => r.original.id);
          return [
            { value: "admin", label: "Make admins", icon: icons.shield, onSelect: () => update(ids, { role: "Admin" }) },
            { value: "suspend", label: "Suspend", icon: icons.lock, onSelect: () => update(ids, { status: "Suspended" }) },
            {
              value: "remove",
              label: "Remove from team",
              icon: icons.x,
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
  useDataTable, DataTable, DataTableColumnHeader, DataTableSearch, DataTableFilters, DataTableViewOptions,
  DataTablePagination, DataTableSelectionBar, selectColumn, rowActionsColumn, type ColumnDef,
} from "./components";

const [members, setMembers] = useState(team);

const columns: ColumnDef<Member>[] = [
  selectColumn<Member>(),
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} title="Name" /> },
  { accessorKey: "email", header: "Email", meta: { lines: 1 } },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <Badge variant="ghost" color={ROLE_COLOR[row.original.role]}>{row.original.role}</Badge>,
  },
  // Status, Last active…
  rowActionsColumn<Member>((row) => (
    <>
      <MenuItem index={0} label="Make admin" onSelect={() => makeAdmin([row.original.id])} />
      <MenuItem index={1} label="Remove" onSelect={() => remove([row.original.id])} />
    </>
  )),
];

const table = useDataTable({ data: members, columns, pageSize: 8, getRowId: (m) => m.id });

<div className="flex flex-wrap items-center gap-2">
  <DataTableSearch table={table} column="name" placeholder="Search people…" />
  <DataTableFilters table={table} />
  <DataTableViewOptions table={table} className="ml-auto" />
</div>
<DataTable table={table} />
<DataTablePagination table={table} pageSizes={[]} />
<DataTableSelectionBar
  table={table}
  actions={(rows) => [
    { value: "admin", label: "Make admins", onSelect: () => makeAdmin(rows.map((r) => r.original.id)) },
    { value: "suspend", label: "Suspend", onSelect: () => suspend(rows.map((r) => r.original.id)) },
    { value: "remove", label: "Remove from team", onSelect: () => remove(rows.map((r) => r.original.id)) },
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
  const [tasks, setTasks] = useState(TASKS);
  const table = useDataTable({
    data: tasks,
    columns: taskColumns,
    getRowId: (t) => t.id,
    initialState: { sorting: [{ id: "due", desc: false }] },
  });
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DataTableFilters table={table} />
      </div>
      <DataTable
        table={table}
        resizeColumns
        onCellEdit={({ row, columnId, value }) =>
          setTasks((old) => old.map((t) => (t.id === row.original.id ? { ...t, [columnId]: value } : t)))
        }
      />
    </div>
  );
}

export const tasksCode = `import { useDataTable, DataTable, DataTableColumnHeader, selectColumn, type ColumnDef } from "./components";

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

const [tasks, setTasks] = useState(initialTasks);
const table = useDataTable({ data: tasks, columns, getRowId: (t) => t.id });

<DataTable
  table={table}
  // Each change as it's made: write it back, and the table shows it.
  onCellEdit={({ row, columnId, value }) =>
    setTasks((old) => old.map((t) => (t.id === row.original.id ? { ...t, [columnId]: value } : t)))
  }
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
    initialState: { expanded: { brand: true } },
  });
  return (
    <div className="flex w-full flex-col gap-3">
      <DataTableSearch table={table} column="name" placeholder="Search files…" />
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
  initialState: { expanded: { brand: true } },
});

<DataTableSearch table={table} column="name" placeholder="Search files…" />
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
  return <DataTable table={table} />;
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
