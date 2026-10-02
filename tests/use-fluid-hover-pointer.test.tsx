// @vitest-environment jsdom
/**
 * pointerDrivenRef: whether the pointer is what lights the highlight. It
 * turns on when the pointer enters or moves in the list, and off on a key
 * press anywhere, a press outside the list, or the pointer leaving, so a
 * fresh highlight starts at `from` only for the pointer.
 */
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from "@/registry/default/hooks/use-fluid-hover";

afterEach(cleanup);

type Api = ReturnType<typeof useFluidHover>;

function Row({ index, registerItem }: { index: number; registerItem: Api["registerItem"] }) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return <div ref={ref} data-testid={`row-${index}`}>Row {index}</div>;
}

function List({ expose }: { expose: (api: Api) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useFluidHover(ref);
  expose(api);
  return (
    <div ref={ref} data-testid="list" {...api.handlers}>
      <Row index={0} registerItem={api.registerItem} />
      <Row index={1} registerItem={api.registerItem} />
    </div>
  );
}

function setup() {
  let api!: Api;
  const view = render(<List expose={(a) => (api = a)} />);
  const list = view.getByTestId("list");
  return { list, row: view.getByTestId("row-1"), driven: () => api.pointerDrivenRef.current };
}

it("is off until the pointer arrives", () => {
  expect(setup().driven()).toBe(false);
});

it("turns on with the pointer, off with any key press", () => {
  const { list, driven } = setup();
  fireEvent.mouseEnter(list);
  expect(driven()).toBe(true);
  fireEvent.keyDown(document.body, { key: "ArrowDown" });
  expect(driven()).toBe(false);
  fireEvent.mouseMove(list, { clientX: 10, clientY: 10 });
  expect(driven()).toBe(true);
});

it("stays on for a press inside the list, off for a press outside", () => {
  const { list, row, driven } = setup();
  fireEvent.mouseMove(list, { clientX: 10, clientY: 10 });
  fireEvent.pointerDown(row);
  expect(driven()).toBe(true);
  fireEvent.pointerDown(document.body);
  expect(driven()).toBe(false);
});

it("turns off when the pointer leaves", () => {
  const { list, driven } = setup();
  fireEvent.mouseEnter(list);
  fireEvent.mouseLeave(list);
  expect(driven()).toBe(false);
});

it("only listens on the document while the pointer drives it", () => {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  const { list } = setup();
  const listening = (spy: typeof add) =>
    spy.mock.calls.filter(([type]) => type === "keydown" || type === "pointerdown").length;
  expect(listening(add)).toBe(0);
  fireEvent.mouseEnter(list);
  fireEvent.mouseMove(list, { clientX: 10, clientY: 10 });
  expect(listening(add)).toBe(2);
  cleanup();
  expect(listening(remove)).toBe(2);
  add.mockRestore();
  remove.mockRestore();
});
