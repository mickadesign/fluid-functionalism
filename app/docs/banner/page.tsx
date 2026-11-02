"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";
import {
  Banner,
  BannerTitle,
  BannerDescription,
  BannerActions,
  BannerAction,
  type BannerStatus,
} from "@/registry/default/banner";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { PlaygroundLayout, PlaygroundOverlay } from "@/lib/docs/playground";
import { BannerPlayground, MockPage } from "@/lib/docs/playgrounds/banner";
import { bannerProps, partProps, actionProps } from "@/lib/docs/api/banner";

const STATUSES: BannerStatus[] = ["default", "info", "success", "warning", "error"];

const statusesCode = `import { Banner, BannerTitle } from "./components";

{/* status: "default" | "info" | "success" | "warning" | "error" */}
<Banner status="info">
  <BannerTitle>Info</BannerTitle>
</Banner>
<Banner status="info" contrast="high">
  <BannerTitle>Info</BannerTitle>
</Banner>`;

const actionsCode = `import {
  Banner,
  BannerTitle,
  BannerDescription,
  BannerActions,
  BannerAction,
} from "./components";

{/* Write primary first: that's the tab order. The banner lays the
    actions out by variant. */}

{/* Title only: they trail the title, primary at the edge */}
<Banner status="info">
  <BannerTitle>Enjoying Fluid Functionalism?</BannerTitle>
  <BannerActions>
    <BannerAction variant="primary">Star on GitHub</BannerAction>
    <BannerAction>Share</BannerAction>
    <BannerAction variant="ghost">Later</BannerAction>
  </BannerActions>
</Banner>

{/* With a description: they drop under the text, primary first */}
<Banner status="info">
  <BannerTitle>The registry has new components</BannerTitle>
  <BannerDescription>Run the install command again to pull the latest versions.</BannerDescription>
  <BannerActions>
    <BannerAction variant="primary">Copy command</BannerAction>
    <BannerAction>What's new</BannerAction>
    <BannerAction variant="ghost">Later</BannerAction>
  </BannerActions>
</Banner>`;

const fixedCode = `import { Banner, BannerTitle, BannerActions, BannerAction } from "./components";

{/* Between the header and the content that scrolls */}
<div className="flex h-dvh flex-col">
  <Header />
  <Banner variant="fixed" status="warning" dismissible>
    <BannerTitle>Registry maintenance tonight at 22:00 UTC</BannerTitle>
    <BannerActions>
      <BannerAction>Details</BannerAction>
    </BannerActions>
  </Banner>
  <main className="flex-1 overflow-y-auto">{/* page content */}</main>
</div>`;

const iconCode = `import { Banner, BannerTitle } from "./components";
import { Bell } from "lucide-react";

<Banner icon={Bell}>
  <BannerTitle>3 new components since your last visit</BannerTitle>
</Banner>`;

function BannerPlaygroundSection() {
  return (
    <BannerPlayground>
      {({ preview, controls, code, onReplay, overlay }) => (
        <PlaygroundLayout
          controls={controls}
          preview={
            <ComponentPreview code={code} onReplay={onReplay} minHeightClass="min-h-[340px]">
              {preview}
              <PlaygroundOverlay>{overlay}</PlaygroundOverlay>
            </ComponentPreview>
          }
        />
      )}
    </BannerPlayground>
  );
}

const STATUS_LABEL: Record<BannerStatus, string> = {
  default: "Default",
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

function StatusesDemo() {
  return (
    <div className="grid w-full max-w-[560px] grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
      {(["low", "high"] as const).map((contrast) => (
        <div key={contrast} className="flex flex-col gap-2">
          <span className="px-1 text-site-caption text-muted-foreground">
            {contrast === "low" ? "Low contrast" : "High contrast"}
          </span>
          {STATUSES.map((status) => (
            <Banner key={status} status={status} contrast={contrast}>
              <BannerTitle>{STATUS_LABEL[status]}</BannerTitle>
            </Banner>
          ))}
        </div>
      ))}
    </div>
  );
}

function ActionsDemo() {
  return (
    <div className="flex w-full max-w-[520px] flex-col gap-3">
      <Banner status="info">
        <BannerTitle>Enjoying Fluid Functionalism?</BannerTitle>
        <BannerActions>
          <BannerAction variant="primary">Star on GitHub</BannerAction>
          <BannerAction>Share</BannerAction>
          <BannerAction variant="ghost">Later</BannerAction>
        </BannerActions>
      </Banner>
      <Banner status="info">
        <BannerTitle>The registry has new components</BannerTitle>
        <BannerDescription>
          Run the install command again to pull the latest versions.
        </BannerDescription>
        <BannerActions>
          <BannerAction variant="primary">Copy command</BannerAction>
          <BannerAction>What&apos;s new</BannerAction>
          <BannerAction variant="ghost">Later</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}

function FixedDemo() {
  return (
    <div className="w-full max-w-[560px]">
      <MockPage className="h-[300px]">
        <Banner variant="fixed" status="warning" dismissible>
          <BannerTitle>Registry maintenance tonight at 22:00 UTC</BannerTitle>
          <BannerActions>
            <BannerAction>Details</BannerAction>
          </BannerActions>
        </Banner>
      </MockPage>
    </div>
  );
}

function IconDemo() {
  const Bell = useIcon("bell");
  return (
    <div className="w-full max-w-[520px]">
      <Banner icon={Bell}>
        <BannerTitle>3 new components since your last visit</BannerTitle>
      </Banner>
    </div>
  );
}

export default function BannerDoc() {
  const [fixedKey, setFixedKey] = useState(0);

  return (
    <DocPage
      title="Banner"
      slug="banner"
      description="A status message: 1 colored icon, a title, an optional description and up to 3 actions."
    >
      <DocSection title="Playground">
        <BannerPlaygroundSection />
      </DocSection>

      <DocSection title="Statuses">
        <p className="text-site-body text-muted-foreground">
          5 statuses, 2 contrasts. Low colors only the icon; high washes the whole banner.
        </p>
        <ComponentPreview code={statusesCode}>
          <StatusesDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Actions">
        <p className="text-site-body text-muted-foreground">
          3 variants. Primary sits at the edge next to a one-line title, and leads under a
          description.
        </p>
        <ComponentPreview code={actionsCode}>
          <ActionsDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Fixed">
        <p className="text-site-body text-muted-foreground">
          <code>variant=&quot;fixed&quot;</code> runs edge to edge under your header. Scroll the
          content: the bar stays put. Press ✕: it closes and the content slides up.
        </p>
        <ComponentPreview code={fixedCode} onReplay={() => setFixedKey((k) => k + 1)}>
          <FixedDemo key={fixedKey} />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Custom icon">
        <p className="text-site-body text-muted-foreground">
          <code>icon</code> swaps in any icon, drawn in the status color.
        </p>
        <ComponentPreview code={iconCode}>
          <IconDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference: Banner">
        <PropsTable props={bannerProps} />
      </DocSection>

      <DocSection title="API Reference: Parts">
        <PropsTable props={partProps} />
      </DocSection>

      <DocSection title="API Reference: BannerAction">
        <PropsTable props={actionProps} />
      </DocSection>
    </DocPage>
  );
}
