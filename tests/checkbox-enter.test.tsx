// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Checkbox as RadixCheckbox } from "@/registry/radix/checkbox";
import { Checkbox as BaseCheckbox } from "@/registry/base/checkbox";
import { Field, FieldLabel } from "@/registry/default/field";

afterEach(cleanup);

const flavors = [
  ["radix", RadixCheckbox],
  ["base", BaseCheckbox],
] as const;

describe.each(flavors)("%s Checkbox and Enter", (_name, Checkbox) => {
  it("toggles inside a choice card", () => {
    render(
      <FieldLabel htmlFor="gpu">
        <Field orientation="horizontal">
          <Checkbox id="gpu" aria-label="GPU workers" />
        </Field>
      </FieldLabel>
    );
    const box = screen.getByRole("checkbox", { name: "GPU workers" });
    expect(box.getAttribute("aria-checked")).toBe("false");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.getAttribute("aria-checked")).toBe("false");
  });

  it("leaves Enter alone on a plain checkbox", () => {
    render(
      <Field orientation="horizontal">
        <Checkbox id="terms" aria-label="Terms" />
      </Field>
    );
    const box = screen.getByRole("checkbox", { name: "Terms" });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box.getAttribute("aria-checked")).toBe("false");
  });
});
