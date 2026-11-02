"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import { Button } from "@/registry/radix/button";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { ButtonPlayground } from "@/lib/docs/playgrounds/button";
import { buttonProps } from "@/lib/docs/api/button";

const variantsCode = `import { Button } from "./components";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="ghost">Ghost</Button>

{/* Full width: w-full stretches a button to its container. A w-fit
    container hugs the row above, so the column shares its width. */}
<div className="flex w-fit flex-col gap-8">
  <div className="flex items-center gap-2">{/* the 4 buttons above */}</div>
  <div className="flex flex-col gap-2">
    <Button variant="primary" className="w-full">Primary</Button>
    <Button variant="secondary" className="w-full">Secondary</Button>
    <Button variant="tertiary" className="w-full">Tertiary</Button>
    <Button variant="ghost" className="w-full">Ghost</Button>
  </div>
</div>`;

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
        <p className="text-site-body text-muted-foreground">
          4 variants, inline or full width: add <code>className=&quot;w-full&quot;</code>{" "}
          to stretch one to its container.
        </p>
        <ComponentPreview code={variantsCode}>
          {/* w-fit: the frame hugs the inline row, and the full-width column
              below inherits exactly that width. */}
          <div className="flex w-fit max-w-full flex-col gap-8">
            <div className="flex items-center gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="tertiary">Tertiary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="primary" className="w-full">Primary</Button>
              <Button variant="secondary" className="w-full">Secondary</Button>
              <Button variant="tertiary" className="w-full">Tertiary</Button>
              <Button variant="ghost" className="w-full">Ghost</Button>
            </div>
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
