// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/default/field";
import { Input } from "@/registry/default/input";
import { Checkbox as RadixCheckbox } from "@/registry/radix/checkbox";
import { Checkbox as BaseCheckbox } from "@/registry/base/checkbox";

afterEach(cleanup);

const describedBy = (el: HTMLElement) => (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);

describe("Field accessibility", () => {
  it("links its description and error to the control", () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" aria-invalid />
        <FieldDescription>We only send your ticket.</FieldDescription>
        <FieldError>Enter a valid email address</FieldError>
      </Field>
    );
    const ids = describedBy(screen.getByLabelText("Email"));
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0])?.textContent).toBe("We only send your ticket.");
    expect(document.getElementById(ids[1])?.textContent).toContain("Enter a valid email address");
  });

  it("keeps the caller's ids and drops an error once it clears", () => {
    function Form() {
      const [error, setError] = useState("Required");
      return (
        <>
          <p id="hint">Outside hint</p>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" aria-describedby="hint" />
            <FieldError>{error}</FieldError>
          </Field>
          <button onClick={() => setError("")}>Clear</button>
        </>
      );
    }
    render(<Form />);
    const input = screen.getByLabelText("Name");
    expect(describedBy(input)[0]).toBe("hint");
    expect(describedBy(input)).toHaveLength(2);
    fireEvent.click(screen.getByText("Clear"));
    expect(describedBy(input)).toEqual(["hint"]);
  });

  it.each([
    ["radix", RadixCheckbox],
    ["base", BaseCheckbox],
  ] as const)("describes a %s checkbox, not its hidden form input", (_name, Checkbox) => {
    render(
      <Field orientation="horizontal">
        <Checkbox id="news" aria-label="Newsletter" />
        <FieldDescription>Once a month.</FieldDescription>
      </Field>
    );
    expect(describedBy(screen.getByRole("checkbox", { name: "Newsletter" }))).toHaveLength(1);
  });

  it("is a group only when it has a name", () => {
    const { container } = render(
      <>
        <Field>
          <Input aria-label="Plain" />
        </Field>
        <Field aria-label="Billing">
          <Input aria-label="Card" />
        </Field>
      </>
    );
    const fields = container.querySelectorAll("[data-slot=field]");
    expect(fields[0].getAttribute("role")).toBeNull();
    expect(fields[1].getAttribute("role")).toBe("group");
  });

  it("FieldError falls back to errors when children are false", () => {
    render(<FieldError errors={[{ message: "Too short" }]}>{false}</FieldError>);
    expect(screen.getByRole("alert").textContent).toContain("Too short");
  });
});
