"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { ButtonPlayground } from "@/lib/docs/playgrounds/button";

const variantsCode = `import { Button } from "./components";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>`;

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
  { name: "size", type: '"default" | "compact" | "icon" | "icon-compact"', default: "from SizeProvider", description: "Step on the size ladder (36px default, 28px compact — see /docs/sizes). Legacy sm/md/lg values resolve as aliases." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner and disables the button." },
  { name: "active", type: "boolean", default: "false", description: "Forces the pressed/held visual — e.g. while a dropdown or popover the button opened is showing." },
  { name: "leadingIcon", type: "IconComponent", description: "Icon displayed before the label." },
  { name: "trailingIcon", type: "IconComponent", description: "Icon displayed after the label." },
  { name: "asChild", type: "boolean", default: "false", description: "Merge props onto the child element instead of rendering a <button>." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the button." },
];

// ── Playground ───────────────────────────────────────────
// The state + controls live in the shared module (lib/docs/playgrounds) so
// the /demo slide can drive the same sandbox from its pen menu; this page
// wraps the live preview in ComponentPreview with the synced code snippet.

function ButtonPlaygroundSection() {
  return (
    <ButtonPlayground>
      {({ preview, controls, code }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} minHeightClass="min-h-[280px]">
              {preview}
            </ComponentPreview>
          }
        />
      )}
    </ButtonPlayground>
  );
}

export default function ButtonDoc() {
  const Plus = useIcon("plus");
  const ArrowRight = useIcon("arrow-right");
  const Search = useIcon("search");
  const Loader = useIcon("loader");

  const [loading, setLoading] = useState(false);

  return (
    <DocPage
      title="Button"
      slug="button"
      description="Versatile button with variants, sizes, loading state, and icon support."
    >
      <DocSection title="Playground">
        <ButtonPlaygroundSection />
      </DocSection>

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
