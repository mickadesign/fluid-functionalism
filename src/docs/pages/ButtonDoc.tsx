import { useState } from "react";
import { Plus, ArrowRight, Search, Loader } from "lucide-react";
import { Button } from "../../components";
import { ComponentPreview } from "../ComponentPreview";
import { PropsTable, type PropDef } from "../PropsTable";
import { DocPage, DocSection } from "../DocPage";

const variantsCode = `import { Button } from "./components";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>`;

const sizesCode = `import { Button } from "./components";
import { Plus } from "lucide-react";

<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="icon-sm"><Plus /></Button>
<Button size="icon"><Plus /></Button>
<Button size="icon-lg"><Plus /></Button>`;

const iconsCode = `import { Button } from "./components";
import { Plus, ArrowRight, Search } from "lucide-react";

<Button leadingIcon={Plus}>Create</Button>
<Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
<Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>
  Search
</Button>`;

const loadingCode = `import { Button } from "./components";
import { Loader } from "lucide-react";

<Button loading>Loading</Button>
<Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>
<Button disabled>Disabled</Button>`;

const buttonProps: PropDef[] = [
  { name: "variant", type: '"primary" | "secondary" | "tertiary" | "ghost"', default: '"primary"', description: "Visual style of the button." },
  { name: "size", type: '"sm" | "md" | "lg" | "icon-sm" | "icon" | "icon-lg"', default: '"md"', description: "Size of the button." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner and disables the button." },
  { name: "leadingIcon", type: "LucideIcon", description: "Icon displayed before the label." },
  { name: "trailingIcon", type: "LucideIcon", description: "Icon displayed after the label." },
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto the child element instead of rendering a <button>." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
];

export function ButtonDoc() {
  const [loading, setLoading] = useState(false);

  return (
    <DocPage
      title="Button"
      description="Versatile button with variants, sizes, loading state, and icon support."
    >
      <DocSection title="Variants">
        <ComponentPreview code={variantsCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sizes">
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon-sm"><Plus /></Button>
            <Button size="icon"><Plus /></Button>
            <Button size="icon-lg"><Plus /></Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With Icons">
        <ComponentPreview code={iconsCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button leadingIcon={Plus}>Create</Button>
            <Button variant="secondary" trailingIcon={ArrowRight}>Next</Button>
            <Button variant="tertiary" leadingIcon={Search} trailingIcon={ArrowRight}>Search</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Loading & Disabled">
        <ComponentPreview code={loadingCode}>
          <div className="flex flex-wrap items-center gap-2">
            <Button loading={loading} onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}>
              {loading ? "Loading" : "Click me"}
            </Button>
            <Button variant="secondary" loading leadingIcon={Loader}>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={buttonProps} />
      </DocSection>
    </DocPage>
  );
}
