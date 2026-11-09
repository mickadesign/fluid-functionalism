"use client";

import { useState, type FormEvent } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/registry/default/field";
import { Input } from "@/registry/default/input";
import { Textarea } from "@/registry/default/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/flavored/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/flavored/checkbox";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { apiReference } from "@/lib/docs/api/field";

const STAGES = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Public"];

const formCode = `import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet, FieldLegend,
} from "./components";
import { Input, Textarea, Checkbox, Select, SelectTrigger, SelectContent, SelectItem, Button } from "./components";

<form noValidate onSubmit={submit}>
  <FieldSet>
    <FieldLegend>Request to join</FieldLegend>
    <FieldDescription>We read every request before the event.</FieldDescription>
    <FieldGroup>
      <Field data-invalid={!!errors.company}>
        <FieldLabel htmlFor="company">Company *</FieldLabel>
        <Input id="company" name="company" aria-invalid={!!errors.company} />
        <FieldError>{errors.company}</FieldError>
      </Field>
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">Work email address *</FieldLabel>
        <Input id="email" name="email" type="email" placeholder="you@company.com"
          aria-invalid={!!errors.email} />
        <FieldError>{errors.email}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="stage">What stage is your company at?</FieldLabel>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger id="stage" placeholder="Select an option" className="w-full" />
          <SelectContent>
            {stages.map((s, i) => <SelectItem key={s} index={i} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field orientation="horizontal" data-invalid={!!errors.conduct}>
        <Checkbox id="conduct" name="conduct" aria-invalid={!!errors.conduct} />
        <FieldContent>
          <FieldLabel htmlFor="conduct">I agree to the code of conduct *</FieldLabel>
          <FieldError>{errors.conduct}</FieldError>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel htmlFor="notes">Is there anything else you'd like us to know?</FieldLabel>
        <Textarea id="notes" name="notes" />
      </Field>
    </FieldGroup>
  </FieldSet>
  <Button type="submit" className="w-full">Request to Join</Button>
</form>`;

const inputCode = `<Field>
  <FieldLabel htmlFor="username">Username</FieldLabel>
  <Input id="username" placeholder="ada" />
  <FieldDescription>Choose a unique username for your account.</FieldDescription>
</Field>`;

const textareaCode = `<Field>
  <FieldLabel htmlFor="feedback">Feedback</FieldLabel>
  <Textarea id="feedback" placeholder="What worked, what didn't?" />
  <FieldDescription>It grows with your text.</FieldDescription>
</Field>`;

const selectCode = `<Field>
  <FieldLabel htmlFor="department">Department</FieldLabel>
  <Select value={department} onValueChange={setDepartment}>
    <SelectTrigger id="department" placeholder="Choose a department" className="w-full" />
    <SelectContent>
      <SelectItem index={0} value="design">Design</SelectItem>
      <SelectItem index={1} value="engineering">Engineering</SelectItem>
      <SelectItem index={2} value="research">Research</SelectItem>
    </SelectContent>
  </Select>
  <FieldDescription>Where you spend most of your week.</FieldDescription>
</Field>`;

const checkboxCode = `<FieldSet>
  <FieldLegend variant="label">Notify me about</FieldLegend>
  <FieldGroup>
    <Field orientation="horizontal">
      <Checkbox id="replies" defaultChecked />
      <FieldLabel htmlFor="replies">Replies to my comments</FieldLabel>
    </Field>
    <Field orientation="horizontal">
      <Checkbox id="mentions" />
      <FieldContent>
        <FieldLabel htmlFor="mentions">Mentions</FieldLabel>
        <FieldDescription>Only from people in your workspace.</FieldDescription>
      </FieldContent>
    </Field>
  </FieldGroup>
</FieldSet>`;

const choiceCode = `<FieldGroup>
  <FieldLabel htmlFor="kubernetes">
    <Field orientation="horizontal">
      <Checkbox id="kubernetes" defaultChecked />
      <FieldContent>
        <FieldTitle>Kubernetes</FieldTitle>
        <FieldDescription>Run GPU workloads on a K8s cluster.</FieldDescription>
      </FieldContent>
    </Field>
  </FieldLabel>
  <FieldLabel htmlFor="vm">
    <Field orientation="horizontal">
      <Checkbox id="vm" />
      <FieldContent>
        <FieldTitle>Virtual machine</FieldTitle>
        <FieldDescription>Access a cluster to run GPU workloads.</FieldDescription>
      </FieldContent>
    </Field>
  </FieldLabel>
</FieldGroup>`;

const fieldsetCode = `<FieldSet>
  <FieldLegend>Address</FieldLegend>
  <FieldDescription>We need your address to deliver your order.</FieldDescription>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="street">Street address</FieldLabel>
      <Input id="street" placeholder="123 Main St" />
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field>
        <FieldLabel htmlFor="city">City</FieldLabel>
        <Input id="city" placeholder="Paris" />
      </Field>
      <Field>
        <FieldLabel htmlFor="zip">Postal code</FieldLabel>
        <Input id="zip" placeholder="75001" />
      </Field>
    </div>
  </FieldGroup>
</FieldSet>`;

const errorCode = `<Field data-invalid>
  <FieldLabel htmlFor="work-email">Work email address</FieldLabel>
  <Input id="work-email" type="email" defaultValue="ada@anthropic" aria-invalid />
  <FieldError>Enter a valid email address</FieldError>
</Field>

// Several messages from a form library or a schema render as a list
<FieldError errors={[{ message: "At least 8 characters" }, { message: "One number" }]} />`;

const horizontalCode = `<FieldGroup>
  <Field orientation="horizontal">
    <FieldContent>
      <FieldLabel htmlFor="language">Language</FieldLabel>
      <FieldDescription>Used across the app and in emails.</FieldDescription>
    </FieldContent>
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger id="language" placeholder="Pick one" />
      <SelectContent>
        <SelectItem index={0} value="en">English</SelectItem>
        <SelectItem index={1} value="fr">Français</SelectItem>
      </SelectContent>
    </Select>
  </Field>
</FieldGroup>`;

const separatorCode = `<FieldGroup>
  <Field>
    <FieldLabel htmlFor="sso">Work email</FieldLabel>
    <Input id="sso" type="email" placeholder="you@company.com" />
  </Field>
  <FieldSeparator>Or continue with</FieldSeparator>
  <Button variant="secondary" className="w-full">Continue with SSO</Button>
</FieldGroup>`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RequestForm() {
  const [stage, setStage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!String(data.get("company") ?? "").trim()) next.company = "Company is required";
    const email = String(data.get("email") ?? "").trim();
    if (!email) next.email = "Work email is required";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address";
    if (!data.get("conduct")) next.conduct = "Required to join the event";
    setErrors(next);
    setSent(Object.keys(next).length === 0);
  };

  return (
    <form noValidate onSubmit={submit} className="flex w-full max-w-sm flex-col gap-6">
      <FieldSet>
        <FieldLegend>Request to join</FieldLegend>
        <FieldDescription>We read every request before the event.</FieldDescription>
        <FieldGroup>
          <Field data-invalid={!!errors.company}>
            <FieldLabel htmlFor="field-company">Company *</FieldLabel>
            <Input id="field-company" name="company" aria-invalid={!!errors.company} />
            <FieldError>{errors.company}</FieldError>
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="field-email">Work email address *</FieldLabel>
            <Input
              id="field-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
            />
            <FieldError>{errors.email}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="field-stage">What stage is your company at?</FieldLabel>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="field-stage" placeholder="Select an option" className="w-full" />
              <SelectContent>
                {STAGES.map((s, i) => (
                  <SelectItem key={s} index={i} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal" data-invalid={!!errors.conduct}>
            <Checkbox id="field-conduct" name="conduct" aria-invalid={!!errors.conduct} />
            <FieldContent>
              <FieldLabel htmlFor="field-conduct">I agree to the code of conduct *</FieldLabel>
              <FieldError>{errors.conduct}</FieldError>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="field-notes">Is there anything else you&apos;d like us to know?</FieldLabel>
            <Textarea id="field-notes" name="notes" />
          </Field>
        </FieldGroup>
      </FieldSet>
      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full">
          Request to Join
        </Button>
        {sent && (
          <FieldDescription role="status" className="text-center">
            Request sent.
          </FieldDescription>
        )}
      </div>
    </form>
  );
}

export default function FieldDoc() {
  const [department, setDepartment] = useState("");
  const [language, setLanguage] = useState("en");

  return (
    <DocPage
      title="Field"
      slug="field"
      description="Labels, controls, help text, and errors composed into accessible form fields."
    >
      <DocSection title="Form">
        <ComponentPreview code={formCode}>
          <RequestForm />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Input">
        <ComponentPreview code={inputCode}>
          <div className="w-full max-w-sm">
            <Field>
              <FieldLabel htmlFor="field-username">Username</FieldLabel>
              <Input id="field-username" placeholder="ada" />
              <FieldDescription>Choose a unique username for your account.</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Textarea">
        <ComponentPreview code={textareaCode}>
          <div className="w-full max-w-sm">
            <Field>
              <FieldLabel htmlFor="field-feedback">Feedback</FieldLabel>
              <Textarea id="field-feedback" placeholder="What worked, what didn't?" />
              <FieldDescription>It grows with your text.</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Select">
        <ComponentPreview code={selectCode}>
          <div className="w-full max-w-sm">
            <Field>
              <FieldLabel htmlFor="field-department">Department</FieldLabel>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="field-department" placeholder="Choose a department" className="w-full" />
                <SelectContent>
                  <SelectItem index={0} value="design">Design</SelectItem>
                  <SelectItem index={1} value="engineering">Engineering</SelectItem>
                  <SelectItem index={2} value="research">Research</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>Where you spend most of your week.</FieldDescription>
            </Field>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Checkbox">
        <ComponentPreview code={checkboxCode}>
          <div className="w-full max-w-sm">
            <FieldSet>
              <FieldLegend variant="label">Notify me about</FieldLegend>
              <FieldGroup>
                <Field orientation="horizontal">
                  <Checkbox id="field-replies" defaultChecked />
                  <FieldLabel htmlFor="field-replies">Replies to my comments</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="field-mentions" />
                  <FieldContent>
                    <FieldLabel htmlFor="field-mentions">Mentions</FieldLabel>
                    <FieldDescription>Only from people in your workspace.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Choice card">
        <ComponentPreview code={choiceCode}>
          <div className="w-full max-w-sm">
            <FieldGroup>
              <FieldLabel htmlFor="field-kubernetes">
                <Field orientation="horizontal">
                  <Checkbox id="field-kubernetes" defaultChecked />
                  <FieldContent>
                    <FieldTitle>Kubernetes</FieldTitle>
                    <FieldDescription>Run GPU workloads on a K8s cluster.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="field-vm">
                <Field orientation="horizontal">
                  <Checkbox id="field-vm" />
                  <FieldContent>
                    <FieldTitle>Virtual machine</FieldTitle>
                    <FieldDescription>Access a cluster to run GPU workloads.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Fieldset">
        <ComponentPreview code={fieldsetCode}>
          <div className="w-full max-w-sm">
            <FieldSet>
              <FieldLegend>Address</FieldLegend>
              <FieldDescription>We need your address to deliver your order.</FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="field-street">Street address</FieldLabel>
                  <Input id="field-street" placeholder="123 Main St" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="field-city">City</FieldLabel>
                    <Input id="field-city" placeholder="Paris" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="field-zip">Postal code</FieldLabel>
                    <Input id="field-zip" placeholder="75001" />
                  </Field>
                </div>
              </FieldGroup>
            </FieldSet>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Validation and errors">
        <ComponentPreview code={errorCode}>
          <div className="flex w-full max-w-sm flex-col gap-4">
            <Field data-invalid>
              <FieldLabel htmlFor="field-work-email">Work email address</FieldLabel>
              <Input id="field-work-email" type="email" defaultValue="ada@anthropic" aria-invalid />
              <FieldError>Enter a valid email address</FieldError>
            </Field>
            <FieldError errors={[{ message: "At least 8 characters" }, { message: "One number" }]} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Horizontal">
        <ComponentPreview code={horizontalCode}>
          <div className="w-full max-w-md">
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="field-language">Language</FieldLabel>
                  <FieldDescription>Used across the app and in emails.</FieldDescription>
                </FieldContent>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="field-language" placeholder="Pick one" />
                  <SelectContent>
                    <SelectItem index={0} value="en">English</SelectItem>
                    <SelectItem index={1} value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Separator">
        <ComponentPreview code={separatorCode}>
          <div className="w-full max-w-sm">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="field-sso">Work email</FieldLabel>
                <Input id="field-sso" type="email" placeholder="you@company.com" />
              </Field>
              <FieldSeparator>Or continue with</FieldSeparator>
              <Button variant="secondary" className="w-full">
                Continue with SSO
              </Button>
            </FieldGroup>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
