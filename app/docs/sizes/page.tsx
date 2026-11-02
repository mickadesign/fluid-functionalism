"use client";

import { useRef, useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { InspectOverlay, type InspectRaw } from "@/lib/docs/InspectOverlay";
import { useShape } from "@/registry/default/lib/shape-context";
import { PropsTable } from "@/lib/docs/PropsTable";
import { ScrollArea } from "@/registry/base/scroll-area";
import { fontWeights } from "@/registry/default/lib/font-weight";
import {
  SizeProvider,
  sizeMap,
  typeScale,
  type SizeVariant,
} from "@/registry/default/lib/size-context";
import { Button } from "@/registry/radix/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import { Tabs, TabsItem } from "@/components/flavored/tabs";
import { CheckboxGroup, CheckboxItem } from "@/registry/radix/checkbox-group";
import { Dropdown } from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { cn } from "@/registry/default/lib/utils";
import { ChevronDown, ListFilter, Plus } from "lucide-react";
import { SORT_OPTIONS, ToolbarDemo } from "@/app/docs/sizes/toolbar-demo";
import { PROVIDER_PROPS, CONSUMER_PROPS } from "@/lib/docs/api/sizes";
import { ACCENT_VAR } from "@/lib/accent";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

// ---------------------------------------------------------------------------
// Token reference
// ---------------------------------------------------------------------------

const TOKEN_ROWS: Array<{
  token: string;
  applies: string;
  def: string;
  compact: string;
}> = [
  { token: "control", applies: "Controls and rows — shared so menu rows line up with their trigger", def: "h-9 · 36px", compact: "h-7 · 28px" },
  { token: "segmentItem + segmentPad", applies: "Segmented tabs inside their padded list", def: "28px + 4px = 36px", compact: "24px + 2px = 28px" },
  { token: "text", applies: "Labels inside controls (the body role)", def: "13px / 20px", compact: "12px / 18px" },
  { token: "field", applies: "Text in editable fields: the body role, 16px on touch screens so iOS doesn't zoom on focus", def: "13px / 20px, 16px on touch", compact: "12px / 18px, 16px on touch" },
  { token: "icon", applies: "Leading/trailing icons, checkbox square, radio circle", def: "16px", compact: "14px" },
  { token: "px / itemPx", applies: "Control / row horizontal padding", def: "12px / 8px", compact: "10px / 6px" },
  { token: "gap", applies: "Icon-to-label and control-to-control gap", def: "8px", compact: "4px" },
];

function TokenTable() {
  return (
    <ScrollArea
      orientation="horizontal"
      viewportClassName="scroll-fade-x"
      className="w-full"
    >
      <table className="w-full min-w-[560px] text-site-body border-collapse [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
        <thead>
          <tr className="border-b border-border">
            {["Token", "Applies to", "Default", "Compact"].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-foreground"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TOKEN_ROWS.map((row) => (
            <tr key={row.token} className="border-b border-border/50">
              <td className="px-3 py-2">
                <code className="rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
                  {row.token}
                </code>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{row.applies}</td>
              <td className="px-3 py-2 text-foreground whitespace-nowrap">
                {row.def}
              </td>
              <td className="px-3 py-2 text-foreground whitespace-nowrap">
                {row.compact}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// Ladder demo — the same B2B toolbar line at both steps
// ---------------------------------------------------------------------------

const TOOLBAR_CODE = `// The same toolbar line at each step. One SizeProvider pins the
// row; every control inside follows. activeLabel collapses inactive
// tabs to their icon, saving room for the search field.

const { gap } = useSize(); // icon-to-label and control-to-control gap: 8px / 4px

<SizeProvider size="compact">
  <div className={cn("flex items-center", gap)}>
    <Tabs activeLabel selectedIndex={view} onSelect={setView}>
      <TabsItem index={0} icon={Table2} label="Table" />
      <TabsItem index={1} icon={SquareKanban} label="Board" />
    </Tabs>
    <div className={cn("ml-auto flex items-center", gap)}>
      <InputGroup className="w-28">
        <InputField index={0} label="Search" labelHidden icon={Search}
          placeholder="Search…" value={query} onChange={setQuery} />
      </InputGroup>
      <Select value={sort} onValueChange={setSort}>…</Select>
      <Button variant="tertiary" size="icon-compact" aria-label="Filter">
        <ListFilter />
      </Button>
      <Button leadingIcon={Plus}>New</Button>
    </div>
  </div>
</SizeProvider>`;


// ---------------------------------------------------------------------------
// Compact region demo — one provider pins the bar AND the menu it opens
// ---------------------------------------------------------------------------

function CompactRegionDemo() {
  const [step, setStep] = useState<SizeVariant>("compact");
  const [sort, setSort] = useState(0);
  const shape = useShape();

  return (
    // Same stripped frame as the token inspector below: the header holds a
    // Default/Compact toggle instead of the Preview/Code + Inspect chrome.
    <div
      className={`relative flex flex-col w-full border border-border/60 ${shape.container}`}
    >
      <div
        className="relative flex items-center px-3 py-3 min-h-[52px] border-b border-border/60 bg-background"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        <Tabs
          selectedIndex={step === "default" ? 0 : 1}
          onSelect={(i) => setStep(i === 0 ? "default" : "compact")}
        >
          <TabsItem index={0} label="Default" />
          <TabsItem index={1} label="Compact" />
        </Tabs>
      </div>
      <div
        className="overflow-hidden"
        style={{
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }}
      >
        <div className="relative flex items-start justify-center min-h-[260px] bg-background px-8 py-12">
    {/* Fixed column width + top alignment keep the wrapper's origin stable
        across steps, so the absolutely-positioned callout doesn't move when
        the region re-renders at the other size. */}
    <div className="relative sm:pr-64">
      <SizeProvider size={step}>
        <div className="flex flex-col items-start gap-2 sm:w-[272px]">
          <div className={cn("flex items-center", sizeMap[step].gap)}>
            <Button variant="tertiary" active trailingIcon={ChevronDown}>
              {SORT_OPTIONS[sort].label}
            </Button>
            <Button
              variant="tertiary"
              size={step === "compact" ? "icon-compact" : "icon"}
              aria-label="Filter"
            >
              <ListFilter />
            </Button>
            <Button leadingIcon={Plus}>New</Button>
          </div>
          {/* The trigger's menu, frozen open (the inline Dropdown panel —
              same trick as the surfaces page) so the inherited step is
              visible without fighting a real portal in the docs. */}
          {/* inert: the frozen-open menu is an illustration — it should
              neither take clicks/focus nor be announced. */}
          <div inert className="select-none">
            <Dropdown checkedIndex={sort} className="!w-48">
              {SORT_OPTIONS.map((o, i) => (
                <MenuItem
                  key={o.value}
                  index={i}
                  label={o.label}
                  checked={sort === i}
                  onSelect={() => setSort(i)}
                />
              ))}
            </Dropdown>
          </div>
        </div>
      </SizeProvider>

      {/* Blue callout — same annotation language as the surfaces page. The
          label's top-left corner sits at the arrow's tail. Annotation is
          desktop-only; on phones it would collide with the panel. */}
      <svg
        className="absolute pointer-events-none hidden sm:block"
        style={{ left: 200, top: 8 }}
        width={130}
        height={100}
        viewBox="0 0 130 100"
        fill="none"
        aria-hidden
      >
        <defs>
          <marker
            id="ff-sizes-annotation-arrow"
            viewBox="0 0 12 12"
            markerWidth="12"
            markerHeight="12"
            refX="8.5"
            refY="6"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path
              d="M3,2.5 L8.5,6 L3,9.5"
              fill="none"
              stroke="context-stroke"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <path
          d="M112,20 Q70,26 22,66"
          style={{ stroke: ACCENT_VAR }}
          strokeWidth={1.5}
          strokeLinecap="round"
          markerEnd="url(#ff-sizes-annotation-arrow)"
        />
      </svg>
      <span
        className="absolute text-site-caption text-foreground select-none hidden sm:block"
        style={{
          left: 318,
          top: 18,
          fontVariationSettings: fontWeights.semibold,
        }}
      >
        The menu inherits
        <br />
        the region&apos;s step
      </span>
    </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token inspector — the reference table, measured live
// ---------------------------------------------------------------------------

/** Maps an inspected element's raw measurements to the ladder tokens they
 *  came from, resolved for the active step — the inspector's tooltip shows
 *  the token table, not generic CSS. */
function tokenReadout(raw: InspectRaw, step: SizeVariant) {
  const t = sizeMap[step];
  // ±1px so fractional browser zoom doesn't knock measurements off their
  // token match.
  const eq = (a: number, b: number) => Math.abs(a - b) < 1;
  const px = step === "default" ? 12 : 10;
  const itemPx = step === "default" ? 8 : 6;
  const gap = step === "default" ? 8 : 4;
  const text = typeScale.body[step];

  const rows: Array<[string, string]> = [];
  if (eq(raw.height, t.controlHeight))
    rows.push(["control", `${t.controlHeight}px`]);
  if (eq(raw.width, t.icon) && eq(raw.height, t.icon))
    rows.push(["icon", `${t.icon}px`]);
  if (raw.fontSize !== null && eq(raw.fontSize, text))
    rows.push(["text", `${text}px`]);
  if (eq(raw.pl, px) || eq(raw.pr, px)) rows.push(["px", `${px}px`]);
  else if (eq(raw.pl, itemPx) || eq(raw.pr, itemPx))
    rows.push(["itemPx", `${itemPx}px`]);
  if (eq(raw.gap, gap)) rows.push(["gap", `${gap}px`]);
  return rows;
}

function TokenInspectorDemo() {
  const [step, setStep] = useState<SizeVariant>("default");
  const [sort, setSort] = useState("updated");
  const [checked, setChecked] = useState<Set<number>>(new Set([0]));
  const shape = useShape();
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    // A stripped-down preview frame: no Preview/Code tabs, no Inspect
    // switch — the overlay is permanently on and the header holds the step
    // toggle instead. The header keeps z-[70] so it sits above the overlay's
    // crosshair layer (z-[60], raised to clear z-50 popups) and stays
    // clickable while the content is frozen — same ladder as ComponentPreview.
    <div
      ref={frameRef}
      className={`relative flex flex-col w-full border border-border/60 ${shape.container}`}
    >
      <div
        className="relative z-[70] flex items-center px-3 py-3 min-h-[52px] border-b border-border/60 bg-background"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        <Tabs
          selectedIndex={step === "default" ? 0 : 1}
          onSelect={(i) => setStep(i === 0 ? "default" : "compact")}
        >
          <TabsItem index={0} label="Default" />
          <TabsItem index={1} label="Compact" />
        </Tabs>
      </div>
      <div
        className="overflow-hidden"
        style={{
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }}
      >
        <div
          ref={contentRef}
          className="relative flex items-center justify-center min-h-[200px] bg-background px-8 py-12"
        >
          <SizeProvider size={step}>
            <div className="flex flex-col items-start gap-4">
              <div
                className={cn("flex flex-wrap items-center", sizeMap[step].gap)}
              >
                <Button leadingIcon={Plus}>New project</Button>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger placeholder="Sort by" />
                  <SelectContent>
                    {SORT_OPTIONS.map((o, i) => (
                      <SelectItem key={o.value} value={o.value} index={i}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CheckboxGroup checkedIndices={checked} className="w-44">
                {["Design", "Engineering"].map((label, i) => (
                  <CheckboxItem
                    key={label}
                    index={i}
                    label={label}
                    checked={checked.has(i)}
                    onToggle={() =>
                      setChecked((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      })
                    }
                  />
                ))}
              </CheckboxGroup>
            </div>
          </SizeProvider>
        </div>
      </div>
      <InspectOverlay
        frameRef={frameRef}
        contentRef={contentRef}
        renderTooltip={(raw) => {
          const rows = tokenReadout(raw, step);
          return (
            <div className="font-mono text-[11px] leading-4 normal-case tracking-normal">
              {rows.length > 0 ? (
                rows.map(([token, value]) => (
                  <div key={token}>
                    <span style={{ fontVariationSettings: fontWeights.semibold }}>
                      {token}
                    </span>{" "}
                    {value}
                  </div>
                ))
              ) : (
                <div>
                  outside the ladder · {Math.round(raw.width)} ×{" "}
                  {Math.round(raw.height)}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SizesPage() {
  return (
    <DocPage
      title="Sizes"
      description={
        <>
          Two component sizes: a 36px default and a 28px compact. Press
          <Code>S</Code> to toggle on the website.
        </>
      }
      slug="sizes"
    >
      <DocSection title="The principle">
        <p className="text-site-body text-muted-foreground">
          An interface reads as one product when its controls share a sizing
          rhythm. A button next to a select next to a tab should land on the
          same height.
        </p>
        <p className="text-site-body text-muted-foreground">
          Each size scales text, icons, and padding together.
        </p>
        <p className="text-site-body text-muted-foreground">
          Compact is for dense, data-heavy tools; default is the right call
          for everything else.
        </p>
        <ComponentPreview code={TOOLBAR_CODE} minHeightClass="min-h-[220px]">
          <ToolbarDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Typography scale">
        <p className="text-site-body text-muted-foreground">
          Type follows the ladder. Compact drops each of the six roles one
          notch, size and leading together, so a dense screen keeps the same
          hierarchy at a smaller size. The full scale lives on
          <a href="/docs/typography" className="mx-1 text-foreground underline underline-offset-4">Typography</a>.
        </p>
      </DocSection>

      <DocSection title="Compact regions">
        <p className="text-site-body text-muted-foreground">
          Density is a region decision, not a per-control one. Wrap the region
          in a<Code>SizeProvider</Code> and everything inside follows — menus
          included, since React context crosses portals.
        </p>
        <CompactRegionDemo />
      </DocSection>

      <DocSection title="Token reference">
        <p className="text-site-body text-muted-foreground">
          The table, measured live: hover a control below and every number in
          the readout is a token from this table. Flip the step and the
          element re-measures under your cursor.
        </p>
        <TokenInspectorDemo />
        <TokenTable />
      </DocSection>

      <DocSection title="SizeProvider props">
        <PropsTable props={PROVIDER_PROPS} />
      </DocSection>

      <DocSection title="Component size prop">
        <PropsTable props={CONSUMER_PROPS} />
      </DocSection>
    </DocPage>
  );
}
