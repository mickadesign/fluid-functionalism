// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Input } from "@/registry/default/input";

afterEach(cleanup);

function Seats({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Input type="number" aria-label="Seats" min={1} max={3} value={value} onChange={(e) => setValue(e.target.value)} />
  );
}

describe("Input type=number stepper", () => {
  it("steps a controlled value through onChange", () => {
    render(<Seats initial="1" />);
    const input = screen.getByLabelText("Seats") as HTMLInputElement;
    fireEvent.click(screen.getByLabelText("Increase"));
    expect(input.value).toBe("2");
    fireEvent.click(screen.getByLabelText("Decrease"));
    fireEvent.click(screen.getByLabelText("Decrease"));
    expect(input.value).toBe("1");
  });

  it("respects max", () => {
    render(<Seats initial="3" />);
    fireEvent.click(screen.getByLabelText("Increase"));
    expect((screen.getByLabelText("Seats") as HTMLInputElement).value).toBe("3");
  });

  it("keeps its buttons out of the tab order", () => {
    render(<Seats />);
    for (const name of ["Increase", "Decrease"]) {
      expect(screen.getByLabelText(name).getAttribute("tabindex")).toBe("-1");
    }
  });
});
