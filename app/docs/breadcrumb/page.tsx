"use client";

import { Fragment, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Home, Folder, Globe, Palette, FileText } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  useBreadcrumbCollapse,
} from "@/registry/default/breadcrumb";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  BREADCRUMB_MENU_CLASS,
  BreadcrumbPlayground,
  EllipsisMenu,
} from "@/lib/docs/playgrounds/breadcrumb";
import { PlaygroundLayout } from "@/lib/docs/playground";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { apiReference } from "@/lib/docs/api/breadcrumb";

const basicCode = `import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage,
} from "./components";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const iconsCode = `import { Home, Folder, Globe, Palette, FileText } from "lucide-react";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/" aria-label="Home">
        <Home />
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects">
        <Folder />
        Projects
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects/website">
        <Globe />
        Website
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects/website/design">
        <Palette />
        Design
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>
        <FileText />
        Roadmap.md
      </BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const longCode = `// Links and buttons stop at 12rem (10rem compact): a long step truncates at
// that cap, and shows its full name on hover once it is cut.
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/reports/q3">
        Quarterly revenue by region and product line, 2026
      </BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Summary</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const dropdownCode = `import {
  Breadcrumb, BreadcrumbButton, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage,
  DropdownMenu, DropdownTrigger, DropdownContent, MenuItem,
} from "./components";

const sections = ["Components", "Systems", "Blocks"];
const [section, setSection] = useState(0);

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownTrigger
          openOnHover
          render={
            <BreadcrumbButton>
              {sections[section]}
            </BreadcrumbButton>
          }
        />
        <DropdownContent checkedIndex={section} className="w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]">
          {sections.map((label, i) => (
            <MenuItem
              key={label}
              index={i}
              label={label}
              checked={section === i}
              onSelect={() => setSection(i)}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const collapsedCode = `const hidden = ["Documentation", "Building blocks", "Navigation"];

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownTrigger
          openOnHover
          render={
            <BreadcrumbButton aria-label="Show 3 hidden steps">
              <BreadcrumbEllipsis />
            </BreadcrumbButton>
          }
        />
        <DropdownContent className="w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]">
          {hidden.map((label, i) => (
            <MenuItem key={label} index={i} label={label} onSelect={() => router.push(hrefs[i])} />
          ))}
        </DropdownContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const clickCode = `// Every other menu on this page opens on hover (openOnHover). Leave it off
// and a menu opens on click only, the Dropdown default. A click-only
// ellipsis doesn't show what it hides until it's opened, so it gets a
// tooltip counting the hidden steps, which steps aside while the menu is open.
const [open, setOpen] = useState(false);
const [section, setSection] = useState(0);

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip content="3 hidden steps" side="bottom" forceOpen={open ? false : undefined}>
          <DropdownTrigger
            render={
              <BreadcrumbButton aria-label="Show 3 hidden steps">
                <BreadcrumbEllipsis />
              </BreadcrumbButton>
            }
          />
        </Tooltip>
        <DropdownContent className="w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]">…</DropdownContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownTrigger render={<BreadcrumbButton>{sections[section]}</BreadcrumbButton>} />
        <DropdownContent checkedIndex={section} className="w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]">…</DropdownContent>
      </DropdownMenu>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const overflowCode = `import { useBreadcrumbCollapse } from "./components";

const steps = ["Home", "Projects", "Website", "Design", "Drafts"];
// Hides middle steps, from the second on, while the trail is wider than its
// container. The first step, the last link and the page always stay.
const { listRef, hidden } = useBreadcrumbCollapse({ count: steps.length + 1 });
const shown = steps.filter((_, i) => i === 0 || i > hidden);

<Breadcrumb>
  <BreadcrumbList ref={listRef}>
    {shown.map((label, i) => (
      <Fragment key={label}>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">{label}</BreadcrumbLink>
        </BreadcrumbItem>
        {i === 0 && hidden > 0 && (
          <BreadcrumbItem>
            <EllipsisMenu hidden={steps.slice(1, hidden + 1)} />
          </BreadcrumbItem>
        )}
      </Fragment>
    ))}
    <BreadcrumbItem>
      <BreadcrumbPage>Roadmap.md</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const expandCode = `const trail = ["Home", "Documentation", "Building blocks", "Navigation", "Components"];
const [expanded, setExpanded] = useState(false);
const shown = expanded ? trail : [trail[0], trail[trail.length - 1]];

<Breadcrumb>
  <BreadcrumbList>
    {shown.map((label, i) => (
      <Fragment key={label}>
        {!expanded && i === 1 && (
          <BreadcrumbItem>
            <BreadcrumbButton aria-label="Show full path" onClick={() => setExpanded(true)}>
              <BreadcrumbEllipsis />
            </BreadcrumbButton>
          </BreadcrumbItem>
        )}
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>{label}</BreadcrumbLink>
        </BreadcrumbItem>
      </Fragment>
    ))}
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const separatorCode = `<Breadcrumb separator="/">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const linkCode = `import Link from "next/link";

<BreadcrumbLink render={<Link href="/docs" />}>Docs</BreadcrumbLink>

// or, as in shadcn
<BreadcrumbLink asChild>
  <Link href="/docs">Docs</Link>
</BreadcrumbLink>`;


// The demos are links, but a click must not navigate or jump the page to
// the top (href="#"), so every live crumb swallows it.
const stay = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault();

const SECTIONS = ["Components", "Systems", "Blocks"];
const HIDDEN = ["Documentation", "Building blocks", "Navigation"];
const TRAIL = ["Home", "Documentation", "Building blocks", "Navigation", "Components"];

function SimpleTrail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Docs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DropdownDemo() {
  const [section, setSection] = useState(0);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownTrigger
              openOnHover
              render={
                <BreadcrumbButton>
                  {SECTIONS[section]}
                </BreadcrumbButton>
              }
            />
            <DropdownContent checkedIndex={section} className={BREADCRUMB_MENU_CLASS}>
              {SECTIONS.map((label, i) => (
                <MenuItem
                  key={label}
                  index={i}
                  label={label}
                  checked={section === i}
                  onSelect={() => setSection(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** One trail where both menus open on click: the ellipsis (with its
 *  hidden-step tooltip) and the Components step. */
function ClickDemo() {
  const [section, setSection] = useState(0);
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <EllipsisMenu hidden={HIDDEN} openOnHover={false} />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownTrigger render={<BreadcrumbButton>{SECTIONS[section]}</BreadcrumbButton>} />
            <DropdownContent checkedIndex={section} className={BREADCRUMB_MENU_CLASS}>
              {SECTIONS.map((label, i) => (
                <MenuItem
                  key={label}
                  index={i}
                  label={label}
                  checked={section === i}
                  onSelect={() => setSection(i)}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function CollapsedDemo({ openOnHover = true }: { openOnHover?: boolean }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <EllipsisMenu hidden={HIDDEN} openOnHover={openOnHover} />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const OVERFLOW_STEPS = ["Home", "Projects", "Website", "Design", "Drafts"];

function OverflowDemo() {
  const [width, setWidth] = useState(340);
  const { listRef, hidden } = useBreadcrumbCollapse({ count: OVERFLOW_STEPS.length + 1 });
  const shown = OVERFLOW_STEPS.filter((_, i) => i === 0 || i > hidden);
  const drag = useRef<{ x: number; width: number } | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* A frame you resize from its right edge: the trail hides and brings
          back steps as its width changes. */}
      <div
        style={{ width }}
        className="relative max-w-full rounded-lg border border-dashed border-border px-2 py-1"
      >
          <Breadcrumb>
            <BreadcrumbList ref={listRef}>
              {shown.map((label, i) => (
                <Fragment key={label}>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={stay}>{label}</BreadcrumbLink>
                  </BreadcrumbItem>
                  {i === 0 && hidden > 0 && (
                    <BreadcrumbItem>
                      <EllipsisMenu hidden={OVERFLOW_STEPS.slice(1, hidden + 1)} />
                    </BreadcrumbItem>
                  )}
                </Fragment>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage>Roadmap.md</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize"
          aria-valuemin={200}
          aria-valuemax={560}
          aria-valuenow={width}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setWidth((w) => Math.max(200, w - 20));
            if (e.key === "ArrowRight") setWidth((w) => Math.min(560, w + 20));
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, width };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const next = drag.current.width + (e.clientX - drag.current.x) * 2;
            setWidth(Math.min(560, Math.max(200, next)));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          className="absolute top-1/2 -right-1.5 flex h-8 w-3 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full bg-background outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        >
          <span className="h-5 w-1 rounded-full bg-muted-foreground" />
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground">Drag the edge to resize</p>
    </div>
  );
}

function ExpandDemo() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? TRAIL : [TRAIL[0], TRAIL[TRAIL.length - 1]];
  return (
    <div className="flex flex-col items-center gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          {shown.map((label, i) => (
            <Fragment key={label}>
              {!expanded && i === 1 && (
                <BreadcrumbItem>
                  <BreadcrumbButton aria-label="Show full path" onClick={() => setExpanded(true)}>
                    <BreadcrumbEllipsis />
                  </BreadcrumbButton>
                </BreadcrumbItem>
              )}
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>{label}</BreadcrumbLink>
              </BreadcrumbItem>
            </Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {expanded && (
        <button
          type="button"
          className="text-[12px] text-muted-foreground underline underline-offset-2"
          onClick={() => setExpanded(false)}
        >
          Collapse again
        </button>
      )}
    </div>
  );
}

export default function BreadcrumbDoc() {
  return (
    <DocPage
      title="Breadcrumb"
      slug="breadcrumb"
      description="A trail of links to the current page: one fluid hover across every crumb, icons, a Dropdown on a step, and a collapsed middle."
    >
      <DocSection title="Playground">
        <BreadcrumbPlayground>
          {({ preview, controls, code, onReplay }) => (
            <PlaygroundLayout
              controls={controls}
              preview={
                <ComponentPreview code={code} minHeightClass="min-h-[280px]" onReplay={onReplay}>
                  {preview}
                </ComponentPreview>
              }
            />
          )}
        </BreadcrumbPlayground>
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <SimpleTrail />
        </ComponentPreview>
      </DocSection>

      <DocSection title="With icons">
        <ComponentPreview code={iconsCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay} aria-label="Home">
                  <Home />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>
                  <Folder />
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>
                  <Globe />
                  Website
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>
                  <Palette />
                  Design
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <FileText />
                  Roadmap.md
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Long step name">
        <ComponentPreview code={longCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>
                  Quarterly revenue by region and product line, 2026
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Summary</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Dropdown on a step">
        <ComponentPreview code={dropdownCode}>
          <DropdownDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Open on click">
        <ComponentPreview code={clickCode}>
          <ClickDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Collapsed">
        <ComponentPreview code={collapsedCode}>
          <CollapsedDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Collapse on overflow">
        <ComponentPreview code={overflowCode}>
          <OverflowDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Expand in place">
        <ComponentPreview code={expandCode}>
          <ExpandDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Custom separator">
        <ComponentPreview code={separatorCode}>
          <Breadcrumb separator="/">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={stay}>Docs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Framework links">
        <ComponentPreview code={linkCode}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/docs/button" />} onClick={stay}>Button</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink asChild onClick={stay}>
                  <Link href="/docs/dropdown">Dropdown</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </ComponentPreview>
      </DocSection>


      <DocSection title="API Reference">
        <PropsTable groups={apiReference} />
      </DocSection>
    </DocPage>
  );
}
