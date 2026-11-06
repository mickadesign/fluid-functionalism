"use client";

import { Checkbox } from "@/components/flavored/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
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

export default function CheckboxDoc() {
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

      <DocSection title="API Reference">
        <PropsTable props={checkboxProps} />
      </DocSection>
    </DocPage>
  );
}
