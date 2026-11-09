"use client";

import { Textarea } from "@/registry/default/textarea";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/default/field";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { textareaProps } from "@/lib/docs/api/textarea";

const basicCode = `import { Textarea } from "./components";

<Textarea placeholder="Type your message here." />`;

const fieldCode = `import { Field, FieldDescription, FieldLabel, Textarea } from "./components";

<Field>
  <FieldLabel htmlFor="feedback">Feedback</FieldLabel>
  <Textarea id="feedback" placeholder="What worked, what didn't?" />
  <FieldDescription>It grows with your text.</FieldDescription>
</Field>`;

const invalidCode = `<Field data-invalid>
  <FieldLabel htmlFor="bio">Bio</FieldLabel>
  <Textarea id="bio" defaultValue="Hi" aria-invalid />
  <FieldError>Write at least 20 characters</FieldError>
</Field>`;

const disabledCode = `<Textarea placeholder="Comments are closed." disabled />`;

const buttonCode = `<div className="flex flex-col gap-2">
  <Textarea placeholder="Type your message here." />
  <Button>Send message</Button>
</div>`;

export default function TextareaDoc() {
  return (
    <DocPage
      title="Textarea"
      slug="textarea"
      description="A multi-line text field with the Input's hairline that grows with its content."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <div className="w-full max-w-sm">
            <Textarea placeholder="Type your message here." aria-label="Message" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Field">
        <ComponentPreview code={fieldCode}>
          <div className="w-full max-w-sm">
            <Field>
              <FieldLabel htmlFor="textarea-feedback">Feedback</FieldLabel>
              <Textarea id="textarea-feedback" placeholder="What worked, what didn't?" />
              <FieldDescription>It grows with your text.</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Invalid">
        <ComponentPreview code={invalidCode}>
          <div className="w-full max-w-sm">
            <Field data-invalid>
              <FieldLabel htmlFor="textarea-bio">Bio</FieldLabel>
              <Textarea id="textarea-bio" defaultValue="Hi" aria-invalid />
              <FieldError>Write at least 20 characters</FieldError>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode}>
          <div className="w-full max-w-sm">
            <Textarea placeholder="Comments are closed." disabled aria-label="Comment" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With a button">
        <ComponentPreview code={buttonCode}>
          <div className="flex w-full max-w-sm flex-col gap-2">
            <Textarea placeholder="Type your message here." aria-label="Message" />
            <Button>Send message</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={textareaProps} />
      </DocSection>
    </DocPage>
  );
}
