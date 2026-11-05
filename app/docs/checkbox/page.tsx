"use client";

import { useState } from "react";
import { Checkbox } from "@/components/flavored/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/registry/default/field";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { checkboxProps } from "@/lib/docs/api/checkbox";

const basicCode = `import { Checkbox, Field, FieldLabel } from "./components";

<Field orientation="horizontal">
  <Checkbox id="terms" />
  <FieldLabel htmlFor="terms">Accept terms and conditions</FieldLabel>
</Field>`;

const descriptionCode = `<Field orientation="horizontal">
  <Checkbox id="updates" defaultChecked />
  <FieldContent>
    <FieldLabel htmlFor="updates">Product updates</FieldLabel>
    <FieldDescription>One email a month, never more.</FieldDescription>
  </FieldContent>
</Field>`;

const groupCode = `<FieldSet>
  <FieldLegend variant="label">Show these items on the desktop</FieldLegend>
  <FieldGroup>
    {items.map((item) => (
      <Field key={item.id} orientation="horizontal">
        <Checkbox
          id={item.id}
          checked={shown.includes(item.id)}
          onCheckedChange={(on) => toggle(item.id, on)}
        />
        <FieldLabel htmlFor={item.id}>{item.label}</FieldLabel>
      </Field>
    ))}
  </FieldGroup>
</FieldSet>`;

const statesCode = `<Field orientation="horizontal" data-invalid>
  <Checkbox id="consent" aria-invalid />
  <FieldContent>
    <FieldLabel htmlFor="consent">I agree to the code of conduct</FieldLabel>
    <FieldError>Required to join the event</FieldError>
  </FieldContent>
</Field>

<Field orientation="horizontal">
  <Checkbox id="locked" defaultChecked disabled />
  <FieldLabel htmlFor="locked">Managed by your admin</FieldLabel>
</Field>`;

const cardCode = `<FieldLabel htmlFor="gpu">
  <Field orientation="horizontal">
    <Checkbox id="gpu" />
    <FieldContent>
      <FieldTitle>GPU workers</FieldTitle>
      <FieldDescription>Add 2 workers to the cluster.</FieldDescription>
    </FieldContent>
  </Field>
</FieldLabel>`;

const ITEMS = [
  { id: "cb-disks", label: "Hard disks" },
  { id: "cb-external", label: "External disks" },
  { id: "cb-servers", label: "Connected servers" },
];

export default function CheckboxDoc() {
  const [shown, setShown] = useState<string[]>(["cb-disks"]);
  const toggle = (id: string, on: boolean) =>
    setShown((cur) => (on ? [...cur, id] : cur.filter((s) => s !== id)));

  return (
    <DocPage
      title="Checkbox"
      slug="checkbox"
      description="A single checkbox: a hairline square that darkens on hover and a check that draws itself."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Field orientation="horizontal" className="w-auto">
            <Checkbox id="cb-terms" />
            <FieldLabel htmlFor="cb-terms">Accept terms and conditions</FieldLabel>
          </Field>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With a description">
        <ComponentPreview code={descriptionCode}>
          <div className="w-full max-w-xs">
            <Field orientation="horizontal">
              <Checkbox id="cb-updates" defaultChecked />
              <FieldContent>
                <FieldLabel htmlFor="cb-updates">Product updates</FieldLabel>
                <FieldDescription>One email a month, never more.</FieldDescription>
              </FieldContent>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Group">
        <ComponentPreview code={groupCode}>
          <div className="w-full max-w-xs">
            <FieldSet>
              <FieldLegend variant="label">Show these items on the desktop</FieldLegend>
              <FieldGroup>
                {ITEMS.map((item) => (
                  <Field key={item.id} orientation="horizontal">
                    <Checkbox
                      id={item.id}
                      checked={shown.includes(item.id)}
                      onCheckedChange={(on) => toggle(item.id, on)}
                    />
                    <FieldLabel htmlFor={item.id}>{item.label}</FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
            </FieldSet>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Invalid and disabled">
        <ComponentPreview code={statesCode}>
          <div className="flex w-full max-w-xs flex-col gap-5">
            <Field orientation="horizontal" data-invalid>
              <Checkbox id="cb-consent" aria-invalid />
              <FieldContent>
                <FieldLabel htmlFor="cb-consent">I agree to the code of conduct</FieldLabel>
                <FieldError>Required to join the event</FieldError>
              </FieldContent>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="cb-locked" defaultChecked disabled />
              <FieldLabel htmlFor="cb-locked">Managed by your admin</FieldLabel>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Choice card">
        <ComponentPreview code={cardCode}>
          <div className="w-full max-w-xs">
            <FieldLabel htmlFor="cb-gpu">
              <Field orientation="horizontal">
                <Checkbox id="cb-gpu" />
                <FieldContent>
                  <FieldTitle>GPU workers</FieldTitle>
                  <FieldDescription>Add 2 workers to the cluster.</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={checkboxProps} />
      </DocSection>
    </DocPage>
  );
}
