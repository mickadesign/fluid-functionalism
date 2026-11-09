// @vitest-environment jsdom
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
  ACTIVE_ATTR,
} from "@/registry/standard/hooks/use-fluid-hover";

function Row({ index, register, onClick }: { index: number; register: (i: number, el: HTMLElement | null) => void; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useRegisterFluidHoverItem(register, index, ref);
  return (
    <button ref={ref} data-testid={`row-${index}`} onClick={onClick}>
      Row {index}
    </button>
  );
}

function List({ onRowClick }: { onRowClick: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(ref, { nearest: true });
  return (
    <div ref={ref} data-testid="list" data-active={hover.activeIndex ?? ""} {...hover.handlers}>
      <span data-testid="gap">gap</span>
      {[0, 1, 2].map((i) => (
        <Row key={i} index={i} register={hover.registerItem} onClick={() => onRowClick(i)} />
      ))}
    </div>
  );
}

afterEach(cleanup);

describe("standard hover", () => {
  it("lights the item under the pointer, and nothing over empty space even with nearest", () => {
    const { getByTestId } = render(<List onRowClick={() => {}} />);
    const list = getByTestId("list");
    fireEvent.mouseEnter(list);
    fireEvent.mouseMove(getByTestId("row-1"));
    expect(list.dataset.active).toBe("1");
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(true);
    fireEvent.mouseMove(getByTestId("gap"));
    expect(list.dataset.active).toBe("");
    fireEvent.mouseMove(getByTestId("row-2"));
    fireEvent.mouseLeave(list);
    expect(list.dataset.active).toBe("");
  });

  it("never routes a click from a gap to a row", () => {
    const onRowClick = vi.fn();
    const { getByTestId } = render(<List onRowClick={onRowClick} />);
    fireEvent.mouseMove(getByTestId("row-0"));
    fireEvent.click(getByTestId("gap"));
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
