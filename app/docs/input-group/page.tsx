"use client";

import { useState } from "react";
import { Search, Mail } from "lucide-react";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import { InputGroup, InputField } from "./components";
import { Search } from "lucide-react";
import { useState } from "react";

const [value, setValue] = useState("");

<InputGroup>
  <InputField
    index={0}
    label="Search"
    placeholder="Search teamspaces..."
    icon={Search}
    value={value}
    onChange={setValue}
  />
</InputGroup>`;

const multipleCode = `import { InputGroup, InputField } from "./components";
import { Mail, Search } from "lucide-react";

<InputGroup>
  <InputField
    index={0}
    label="Name"
    placeholder="Your name"
    value={name}
    onChange={setName}
  />
  <InputField
    index={1}
    label="Email"
    placeholder="you@example.com"
    icon={Mail}
    value={email}
    onChange={setEmail}
  />
</InputGroup>`;

const errorCode = `<InputGroup>
  <InputField
    index={0}
    label="Email"
    placeholder="you@example.com"
    icon={Mail}
    value={email}
    onChange={setEmail}
    error="Please enter a valid email address."
  />
</InputGroup>`;

const groupProps: PropDef[] = [
  { name: "children", type: "ReactNode", description: "InputField children." },
];

const fieldProps: PropDef[] = [
  { name: "label", type: "string", description: "Label text above the input." },
  { name: "index", type: "number", description: "Position index within the group." },
  { name: "value", type: "string", description: "Controlled input value." },
  { name: "onChange", type: "(value: string) => void", description: "Called when the input value changes." },
  { name: "placeholder", type: "string", description: "Placeholder text." },
  { name: "icon", type: "LucideIcon", description: "Leading icon inside the input." },
  { name: "error", type: "string", description: "Error message shown below the input." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the input." },
];

export default function InputGroupDoc() {
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorEmail, setErrorEmail] = useState("bad@");

  return (
    <DocPage
      title="InputGroup"
      slug="input-group"
      description="Input field group with proximity hover and validation."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <InputGroup>
            <InputField
              index={0}
              label="Search"
              placeholder="Search teamspaces..."
              icon={Search}
              value={search}
              onChange={setSearch}
            />
          </InputGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Multiple Fields">
        <ComponentPreview code={multipleCode}>
          <InputGroup>
            <InputField
              index={0}
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={setName}
            />
            <InputField
              index={1}
              label="Email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={setEmail}
            />
          </InputGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Error State">
        <ComponentPreview code={errorCode}>
          <InputGroup>
            <InputField
              index={0}
              label="Email"
              placeholder="you@example.com"
              icon={Mail}
              value={errorEmail}
              onChange={setErrorEmail}
              error="Please enter a valid email address."
            />
          </InputGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — InputGroup">
        <PropsTable props={groupProps} />
      </DocSection>

      <DocSection title="API Reference — InputField">
        <PropsTable props={fieldProps} />
      </DocSection>
    </DocPage>
  );
}
