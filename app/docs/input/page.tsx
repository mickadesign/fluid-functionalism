"use client";

import { Input } from "@/registry/default/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/default/field";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { inputProps } from "@/lib/docs/api/input";

const basicCode = `import { Input } from "./components";

<Input type="email" placeholder="you@company.com" />`;

const fieldCode = `import { Field, FieldDescription, FieldLabel, Input } from "./components";

<Field>
  <FieldLabel htmlFor="username">Username</FieldLabel>
  <Input id="username" placeholder="ada" />
  <FieldDescription>Choose a unique username for your account.</FieldDescription>
</Field>`;

const invalidCode = `<Field data-invalid>
  <FieldLabel htmlFor="email">Work email address</FieldLabel>
  <Input id="email" type="email" defaultValue="ada@anthropic" aria-invalid />
  <FieldError>Enter a valid email address</FieldError>
</Field>`;

const disabledCode = `<Input placeholder="Read-only workspace" disabled />`;

const typesCode = `<Input type="password" placeholder="Password" />
<Input type="number" placeholder="Seats" min={1} />
<Input type="file" />`;

const buttonCode = `<div className="flex gap-2">
  <Input type="email" placeholder="you@company.com" />
  <Button>Subscribe</Button>
</div>`;

export default function InputDoc() {
  return (
    <DocPage
      title="Input"
      slug="input"
      description="A single-line text field in the Select trigger's hairline, with a neutral focus border."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="w-full max-w-xs">
            <Input type="email" placeholder="you@company.com" aria-label="Email" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Field">
        <ComponentPreview code={fieldCode}>
          <div className="w-full max-w-xs">
            <Field>
              <FieldLabel htmlFor="input-username">Username</FieldLabel>
              <Input id="input-username" placeholder="ada" />
              <FieldDescription>Choose a unique username for your account.</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Invalid">
        <ComponentPreview code={invalidCode}>
          <div className="w-full max-w-xs">
            <Field data-invalid>
              <FieldLabel htmlFor="input-email">Work email address</FieldLabel>
              <Input id="input-email" type="email" defaultValue="ada@anthropic" aria-invalid />
              <FieldError>Enter a valid email address</FieldError>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode}>
          <div className="w-full max-w-xs">
            <Input placeholder="Read-only workspace" disabled aria-label="Workspace" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Types">
        <ComponentPreview code={typesCode}>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <Input type="password" placeholder="Password" aria-label="Password" />
            <Input type="number" placeholder="Seats" min={1} aria-label="Seats" />
            <Input type="file" aria-label="Attachment" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With a button">
        <ComponentPreview code={buttonCode}>
          <div className="flex w-full max-w-sm gap-2">
            <Input type="email" placeholder="you@company.com" aria-label="Email" />
            <Button>Subscribe</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={inputProps} />
      </DocSection>
    </DocPage>
  );
}
