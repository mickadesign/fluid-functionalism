// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useDataTable, useUndoableRows, type ColumnDef } from "@/registry/default/data-table";

// useUndoableRows: each change is a step, a cell typed in a burst is one
// step, and a new change clears redo. useDataTable's default filterFn reads
// the shapes DataTableFilters sets.

type Row = { id: string; name: string; points: number; due: string; tags: string[] };
const ROWS: Row[] = [
  { id: "a", name: "Ada", points: 3, due: "2026-11-12", tags: ["Web"] },
  { id: "b", name: "Kenji", points: 5, due: "2026-11-18", tags: ["API", "Web"] },
  { id: "c", name: "Lena", points: 8, due: "2026-11-21", tags: ["Docs"] },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useUndoableRows", () => {
  const setup = () => renderHook(() => useUndoableRows(ROWS, { getId: (r) => r.id }));

  it("undoes and redoes a removal", () => {
    const { result } = setup();
    act(() => result.current.remove(["a", "b"]));
    expect(result.current.rows.map((r) => r.id)).toEqual(["c"]);
    expect(result.current.lastStep).toBe("Deleted 2 rows");
    act(() => result.current.undo());
    expect(result.current.rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.redo());
    expect(result.current.rows.map((r) => r.id)).toEqual(["c"]);
  });

  it("merges one cell's burst of typing into one step", () => {
    vi.useFakeTimers();
    const { result } = setup();
    for (const name of ["A", "Ad", "Adal"]) {
      act(() => result.current.edit("a", { name }));
      vi.advanceTimersByTime(200);
    }
    act(() => result.current.undo());
    expect(result.current.rows[0].name).toBe("Ada");
    expect(result.current.canUndo).toBe(false);
  });

  it("keeps edits a pause apart as separate steps", () => {
    vi.useFakeTimers();
    const { result } = setup();
    act(() => result.current.edit("a", { name: "Ad" }));
    vi.advanceTimersByTime(1500);
    act(() => result.current.edit("a", { name: "Adele" }));
    act(() => result.current.undo());
    expect(result.current.rows[0].name).toBe("Ad");
  });

  it("clears redo on a new change", () => {
    const { result } = setup();
    act(() => result.current.remove(["a"]));
    act(() => result.current.undo());
    act(() => result.current.insert([{ id: "d", name: "Omar", points: 1, due: "2026-11-01", tags: [] }]));
    expect(result.current.canRedo).toBe(false);
    expect(result.current.rows.map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("the default filterFn", () => {
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "name" },
    { accessorKey: "points" },
    { accessorKey: "due" },
    { accessorKey: "tags" },
  ];
  const ids = (filters: { id: string; value: unknown }[]) => {
    const { result } = renderHook(() =>
      useDataTable({ data: ROWS, columns, getRowId: (r) => r.id, initialState: { columnFilters: filters } })
    );
    return result.current.getRowModel().rows.map((r) => r.id);
  };

  it("reads text, a plain string, options, numbers and days", () => {
    expect(ids([{ id: "name", value: { kind: "text", query: "en" } }])).toEqual(["b", "c"]);
    expect(ids([{ id: "name", value: "ada" }])).toEqual(["a"]);
    expect(ids([{ id: "tags", value: { kind: "options", values: ["Web"] } }])).toEqual(["a", "b"]);
    expect(ids([{ id: "points", value: { kind: "number", min: 4 } }])).toEqual(["b", "c"]);
    expect(ids([{ id: "due", value: { kind: "date", from: "2026-11-13", to: "2026-11-20" } }])).toEqual(["b"]);
  });

  it("keeps every row while a filter is empty", () => {
    expect(ids([{ id: "tags", value: { kind: "options", values: [] } }])).toHaveLength(3);
    expect(ids([{ id: "points", value: { kind: "number" } }])).toHaveLength(3);
  });
});
