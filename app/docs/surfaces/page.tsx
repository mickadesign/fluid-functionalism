"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { SurfaceProvider } from "@/registry/default/lib/surface-context";
import { Elevated } from "@/lib/elevated";
import { Dropdown, useDropdown } from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { Slider } from "@/registry/radix/slider";
import {
  ColorPicker,
  ColorPickerPortalContainer,
} from "@/registry/default/color-picker";
import { useIcon, type IconComponent } from "@/registry/default/lib/icon-context";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { surfaceClasses } from "@/registry/default/lib/surface-classes";
import { cn } from "@/registry/default/lib/utils";
import { ScrollArea } from "@/registry/base/scroll-area";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// ---------------------------------------------------------------------------
// DarkPreview — wraps ComponentPreview so the whole preview (chrome included)
// renders in dark mode, regardless of the page theme. The painted bg-background
// fills behind the (transparent) tab bar; the radius matches the active shape
// so the dark fill doesn't poke past the preview's rounded corners.
// ---------------------------------------------------------------------------

function DarkPreview(props: ComponentProps<typeof ComponentPreview>) {
  const shape = useShape();
  return (
    <div className={cn("dark bg-background", shape.container)}>
      <ComponentPreview {...props} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code snippets (shown in the Code tab of each ComponentPreview)
// ---------------------------------------------------------------------------

const PROBLEM_CODE = `// An invite dialog sits at surface-5 (#333).
// The role picker hard-codes its own background…

<DialogContent>                       {/* surface-5 · #333 */}
  <RoleSelectTrigger />

  {/* ❌ Real elevation shadow, but the background is
      hard-coded to the dialog's own level */}
  <div className="bg-surface-5 shadow-surface-3 rounded-2xl p-1">
    <RoleItem label="Workspace owner" />
    <RoleItem label="Member" checked />
    <RoleItem label="Restricted member" />
  </div>
</DialogContent>

// surface-5 on surface-5 → the shadow gives a faint
// edge, but the body melts straight into the dialog.`;

const TOKENS_CSS = `:root, .light {
  --surface-1: #FAFAFA;
  --surface-2: #FCFCFC;
  --surface-3: #FFFFFF;
  --surface-4: #FFFFFF;
  --surface-5: #FFFFFF;
  --surface-6: #FFFFFF;
  --surface-7: #FFFFFF;
  --surface-8: #FFFFFF;

  --shadow-color: rgb(0 0 0 / 0.06);
  --shadow-1: 0 0 0 1px var(--shadow-color);
  --shadow-2: 0 0 0 1px var(--shadow-color), 0 1px 1px -0.5px var(--shadow-color);
  /* …doubling drop layers up to --shadow-8 (96px blur) */
}

.dark {
  --surface-1: #171717;
  --surface-2: #1E1E1E;
  --surface-3: #252525;
  --surface-4: #2C2C2C;
  --surface-5: #333333;
  --surface-6: #3A3A3A;
  --surface-7: #414141;
  --surface-8: #484848;

  /* shadow recipe per level:
       inset top highlight + inset ring + outer hairline + stacked drops */
}`;

const SUBSTRATE_CODE = `// Substrate flows through React context.
// Default substrate is 1 (the page background).

<Dropdown />                          // surface-3, on the page

<SurfaceProvider value={3}>           // inside a popover
  <Dropdown />                        // surface-5
</SurfaceProvider>

<SurfaceProvider value={5}>           // inside a dialog
  <Dropdown />                        // surface-7
</SurfaceProvider>

// Inside any elevated component:
const substrate = useSurface();       // 1, 3, or 5
const level = Math.min(substrate + 2, 8);`;

const ELEVATED_SOURCE = `import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

const Elevated = forwardRef<HTMLDivElement, ElevatedProps>(
  ({ offset, shadowLevel, className, children, ...props }, ref) => {
    const substrate = useSurface();
    const level = Math.min(substrate + offset, 8);
    return (
      <SurfaceProvider value={level}>
        <div
          ref={ref}
          className={cn(surfaceClasses(level, shadowLevel ?? level), className)}
          {...props}
        >
          {children}
        </div>
      </SurfaceProvider>
    );
  }
);`;

const ELEVATION_STACK_CODE = `// Drag both knobs to pick the slice of the ladder to nest.
const [[low, high], setRange] = useState([1, 4]);

<SurfaceProvider value={low}>        {/* base = surface-{low} */}
  <Elevated offset={1}>              {/* surface-{low + 1} */}
    {/* …nested up to surface-{high} */}
  </Elevated>
</SurfaceProvider>

<Slider value={[low, high]} min={1} max={8} step={1} showSteps
  onChange={setRange} />`;

const COLOR_PICKER_CODE = `<ColorPicker defaultValue="#6B97FF" />

// FormatDropdown sits inside the picker panel (substrate 3),
// so it lifts to surface-5 automatically.`;

const INVITE_DIALOG_CODE = `<Dialog open>
  <DialogContent>
    {/* DialogContent provides SurfaceProvider value={5} */}
    <RoleSelectTrigger />
    <Dropdown>                        {/* lifts to surface-7 */}
      <RoleItem label="Workspace owner" />
      <RoleItem label="Member" checked />
      <RoleItem label="Restricted member" />
    </Dropdown>
  </DialogContent>
</Dialog>`;

// ---------------------------------------------------------------------------
// Tokens — compact ladder + CSS code
// ---------------------------------------------------------------------------

function SurfaceChip({ level }: { level: number }) {
  const shape = useShape();
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div
        className={cn("w-14 h-14", shape.container, surfaceClasses(level))}
        aria-hidden
      />
      <span className="text-[11px] text-muted-foreground font-mono">
        {level}
      </span>
    </div>
  );
}

function TokensDemo() {
  return (
    <DarkPreview code={TOKENS_CSS} padding="compact">
      <div className="flex flex-col gap-4 w-full">
        <div className="dark flex flex-col gap-2">
          <span
            className="text-[11px] text-muted-foreground tracking-wider"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Dark
          </span>
          <ScrollArea
            orientation="horizontal"
            viewportClassName="scroll-fade-x"
            className="rounded-2xl bg-background"
          >
            <div className="flex gap-3 p-4 w-max">
              {LEVELS.map((n) => (
                <SurfaceChip key={n} level={n} />
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="light flex flex-col gap-2">
          <span
            className="text-[11px] text-muted-foreground tracking-wider"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Light
          </span>
          <ScrollArea
            orientation="horizontal"
            viewportClassName="scroll-fade-x"
            className="rounded-2xl bg-background"
          >
            <div className="flex gap-3 p-4 w-max">
              {LEVELS.map((n) => (
                <SurfaceChip key={n} level={n} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </DarkPreview>
  );
}

// ---------------------------------------------------------------------------
// The problem — annotated invite dialog whose role picker collapses
// ---------------------------------------------------------------------------

// A presentational role row (no Dropdown context) so the broken menu can be
// hard-coded to the dialog's own surface and visibly melt into it.
function StaticRoleItem({
  icon: Icon,
  label,
  description,
  checked,
}: {
  icon: IconComponent;
  label: string;
  description: string;
  checked: boolean;
}) {
  const shape = useShape();
  const CheckIcon = useIcon("check");
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-80",
        shape.item,
        checked ? "bg-active" : "hover:bg-hover"
      )}
    >
      <Icon
        size={18}
        strokeWidth={checked ? 2 : 1.5}
        className={cn(
          "shrink-0 mt-0.5 transition-colors duration-80",
          checked
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span
          className={cn(
            "text-body transition-colors duration-80",
            checked
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
          style={{
            fontVariationSettings: checked
              ? fontWeights.semibold
              : fontWeights.medium,
          }}
        >
          {label}
        </span>
        <span className="text-caption text-muted-foreground leading-snug">
          {description}
        </span>
      </div>
      {checked && (
        <CheckIcon
          size={16}
          strokeWidth={2}
          className="text-foreground shrink-0 mt-0.5"
        />
      )}
    </div>
  );
}

const ANNOTATION_BLUE = "#6B97FF";
// Red marks the collapse: the dialog and the dropdown share one surface, so
// their callouts go red to flag the problem. The page background stays blue
// (it's just orienting context, not part of the bug).
const ANNOTATION_RED = "#FF6B6B";

// Each callout: a label chip plus a curved arrow drawn in the shared
// 600×600 overlay (1 unit = 1px). Coordinates are tuned against the fixed
// canvas below so the arrowheads land on the three surfaces.
type ArrowKey = "page" | "dialog" | "dropdown";

const ANNOTATIONS: {
  key: ArrowKey;
  title: string;
  hex: string;
  swatch: string;
  color: string;
  label: { left: number; top: number; align: "left" | "right" };
  // Base anchor points (in the 600×600 canvas). The control point — and thus
  // the curvature — is derived at render time from the DialKit `curve` value.
  start: { x: number; y: number };
  end: { x: number; y: number };
}[] = [
  {
    key: "page",
    title: "Page background",
    hex: "#171717",
    swatch: "#171717",
    color: ANNOTATION_BLUE,
    label: { left: 14, top: 24, align: "left" },
    start: { x: 118, y: 74 },
    end: { x: 84, y: 150 },
  },
  {
    key: "dialog",
    title: "Dialog",
    hex: "#333333",
    swatch: "#333333",
    color: ANNOTATION_RED,
    label: { left: 8, top: 300, align: "left" },
    start: { x: 118, y: 300 },
    end: { x: 152, y: 214 },
  },
  {
    key: "dropdown",
    title: "Role dropdown",
    hex: "#333333",
    swatch: "#333333",
    color: ANNOTATION_RED,
    label: { left: 442, top: 300, align: "left" },
    start: { x: 500, y: 338 },
    end: { x: 434, y: 306 },
  },
];

// Hand-tuned arrow transforms per annotation. x/y translate the arrow,
// rotation pivots it around its midpoint, curve sets the bow, and labelX/labelY
// nudge the label.
type ArrowDial = {
  x: number;
  y: number;
  rotation: number;
  curve: number;
  labelX: number;
  labelY: number;
};
const ARROW_VALUES: Record<ArrowKey, ArrowDial> = {
  page: { x: -50, y: 0, rotation: -60, curve: 23, labelX: 0, labelY: 10 },
  dialog: { x: -20, y: -10, rotation: 20, curve: -18, labelX: 30, labelY: 0 },
  dropdown: { x: -20, y: -20, rotation: -40, curve: 18, labelX: 60, labelY: 0 },
};

// Compose a quadratic-Bézier path from base anchors + live dial values.
// rotation pivots the chord around its midpoint, x/y translate the whole arrow,
// and curve sets the perpendicular bow of the control point.
function buildArrowPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  dial: { x: number; y: number; rotation: number; curve: number }
) {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const a = (dial.rotation * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const place = (px: number, py: number) => ({
    x: mx + (px - mx) * cos - (py - my) * sin + dial.x,
    y: my + (px - mx) * sin + (py - my) * cos + dial.y,
  });
  const s = place(start.x, start.y);
  const e = place(end.x, end.y);
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = (s.x + e.x) / 2 + nx * dial.curve;
  const cy = (s.y + e.y) / 2 + ny * dial.curve;
  const f = (n: number) => Math.round(n * 10) / 10;
  return `M${f(s.x)},${f(s.y)} Q${f(cx)},${f(cy)} ${f(e.x)},${f(e.y)}`;
}

function ProblemAnnotations() {
  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={600}
        height={640}
        viewBox="0 0 600 640"
        fill="none"
        aria-hidden
      >
        <defs>
          {/* Open line chevron (two strokes) instead of a filled triangle. */}
          <marker
            id="ff-annotation-arrow"
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
        {ANNOTATIONS.map((a) => (
          <path
            key={a.key}
            d={buildArrowPath(a.start, a.end, ARROW_VALUES[a.key])}
            stroke={a.color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            markerEnd="url(#ff-annotation-arrow)"
          />
        ))}
      </svg>
      {ANNOTATIONS.map((a) => (
        <div
          key={a.title}
          className={cn(
            "absolute flex flex-col gap-0.5",
            a.label.align === "right" ? "items-end text-right" : "items-start"
          )}
          style={{
            left: a.label.left + ARROW_VALUES[a.key].labelX,
            top: a.label.top + ARROW_VALUES[a.key].labelY,
            width: 150,
          }}
        >
          <span
            className="text-caption leading-tight"
            style={{
              color: a.color,
              fontVariationSettings: fontWeights.semibold,
            }}
          >
            {a.title}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="w-2.5 h-2.5 rounded-[3px] border border-white/15 shrink-0"
              style={{ backgroundColor: a.swatch }}
            />
            <span
              className="text-[11px] font-mono leading-tight"
              style={{ color: a.color }}
            >
              {a.hex}
            </span>
          </span>
        </div>
      ))}
    </>
  );
}

function ProblemDemo() {
  const XIcon = useIcon("x");
  const Users = useIcon("users");
  const User = useIcon("user");
  const Lock = useIcon("lock");
  const ChevronDown = useIcon("chevron-down");

  return (
    <DarkPreview code={PROBLEM_CODE} padding="none">
      <div className="w-full overflow-x-auto">
        <div className="relative mx-auto w-[600px] h-[640px] shrink-0">
          {/* Page background — true surface-1, no scrim so the pointed
              colors read at their exact hex values. */}
          <div className="absolute inset-0 bg-background" aria-hidden />

          {/* The dialog (surface-5), centered */}
          <SurfaceProvider value={5}>
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 top-8 w-[320px] rounded-2xl p-6 flex flex-col gap-5",
                surfaceClasses(5)
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-caption"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    M
                  </div>
                  <span
                    className="text-[15px] text-foreground"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    Invite to your workspace
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-1 cursor-pointer"
                >
                  <XIcon size={16} strokeWidth={1.5} />
                </button>
              </div>

              <label className="flex flex-col gap-2">
                <span
                  className="text-body text-foreground"
                  style={{ fontVariationSettings: fontWeights.medium }}
                >
                  Email
                </span>
                <textarea
                  readOnly
                  rows={2}
                  placeholder="email@gmail.com, email2@gmail.com..."
                  className="text-body text-foreground placeholder:text-muted-foreground bg-transparent hover:bg-hover border border-border rounded-xl px-3 py-2 resize-none outline-none transition-colors duration-80 cursor-pointer"
                />
              </label>

              <div className="flex flex-col gap-2">
                <span
                  className="text-body text-foreground"
                  style={{ fontVariationSettings: fontWeights.medium }}
                >
                  Select role
                </span>
                <button
                  type="button"
                  aria-expanded
                  className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl bg-active text-body text-foreground border border-border cursor-pointer transition-colors duration-80"
                >
                  <span>Member</span>
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className="text-muted-foreground rotate-180 transition-transform"
                  />
                </button>
                {/* ❌ Same elevation shadow as a real dropdown, but the
                    background is hard-coded to the dialog's own level.
                    surface-5 on surface-5: the shadow gives a faint edge, yet
                    the body melts straight into the dialog. */}
                <div
                  className={cn(
                    "-mt-px rounded-2xl p-1 flex flex-col gap-0.5",
                    surfaceClasses(5, 3)
                  )}
                >
                  <StaticRoleItem
                    icon={Users}
                    label="Workspace owner"
                    description="Can change workspace settings and invite new members"
                    checked={false}
                  />
                  <StaticRoleItem
                    icon={User}
                    label="Member"
                    description="Can't change workspace settings or invite new members"
                    checked={true}
                  />
                  <StaticRoleItem
                    icon={Lock}
                    label="Restricted member"
                    description="Can only see and edit content they created"
                    checked={false}
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  type="button"
                  className="h-9 px-4 rounded-full bg-transparent hover:bg-hover text-body text-foreground cursor-pointer transition-colors duration-80"
                  style={{ fontVariationSettings: fontWeights.medium }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled
                  className="h-9 px-4 rounded-full bg-foreground text-background text-body cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  Send invites
                </button>
              </div>
            </div>
          </SurfaceProvider>

          <ProblemAnnotations />
        </div>
      </div>
    </DarkPreview>
  );
}

// ---------------------------------------------------------------------------
// Substrate context — page → popover → dialog
// ---------------------------------------------------------------------------

// Dark-mode surface hex map — used to label the demo with raw color values.
// Kept in sync with the --surface-N tokens in app/globals.css.
const SURFACE_HEX_DARK: Record<number, string> = {
  1: "#171717",
  2: "#1E1E1E",
  3: "#252525",
  4: "#2C2C2C",
  5: "#333333",
  6: "#3A3A3A",
  7: "#414141",
  8: "#484848",
};

function SwatchRow({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      <span
        aria-hidden
        className="w-3 h-3 rounded-sm border border-border/40 shrink-0"
        style={{ backgroundColor: hex }}
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto text-foreground">{hex}</span>
    </div>
  );
}

function SubstrateDemo() {
  const Star = useIcon("star");
  const Clock = useIcon("clock");
  const Lock = useIcon("lock");

  const items = [
    { icon: Star, label: "Favorites" },
    { icon: Clock, label: "Recents" },
    { icon: Lock, label: "Private" },
  ];

  const scenarios = [
    { substrate: 1, label: "On the page" },
    { substrate: 3, label: "Inside a popover" },
    { substrate: 5, label: "Inside a dialog" },
  ];

  return (
    <DarkPreview code={SUBSTRATE_CODE} padding="compact">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {scenarios.map(({ substrate, label }) => {
          const menuLevel = Math.min(substrate + 2, 8);
          return (
            <div key={substrate} className="flex flex-col gap-3">
              <div
                className="dark flex flex-col gap-3 rounded-2xl p-4 border border-border/40"
                style={{ backgroundColor: `var(--surface-${substrate})` }}
              >
                <span
                  className="text-caption text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  {label}
                </span>
                <SurfaceProvider value={substrate}>
                  <Dropdown className="w-full" checkedIndex={0}>
                    {items.map((item, i) => (
                      <MenuItem
                        key={item.label}
                        index={i}
                        icon={item.icon}
                        label={item.label}
                        checked={i === 0}
                      />
                    ))}
                  </Dropdown>
                </SurfaceProvider>
              </div>
              <div className="flex flex-col gap-1 px-1 pb-4">
                <SwatchRow label="BG" hex={SURFACE_HEX_DARK[substrate]} />
                <SwatchRow label="Menu" hex={SURFACE_HEX_DARK[menuLevel]} />
                <div className="flex items-center gap-2 text-[11px] font-mono pt-1">
                  <span className="text-muted-foreground">Hover</span>
                  <span className="ml-auto text-foreground">+6%</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-muted-foreground">Selected</span>
                  <span className="ml-auto text-foreground">+10%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DarkPreview>
  );
}

// ---------------------------------------------------------------------------
// Elevated primitive — preview shows nested boxes, code shows source
// ---------------------------------------------------------------------------

function ElevatedDemo() {
  return (
    <DarkPreview code={ELEVATED_SOURCE} padding="compact">
      <div className="dark w-full">
        <div
          className={cn(
            "flex flex-col gap-3 p-5 rounded-2xl w-full max-w-[480px] mx-auto",
            surfaceClasses(1)
          )}
        >
          <span className="text-caption text-muted-foreground">Page</span>
          <Elevated offset={2} className="rounded-2xl p-5 flex flex-col gap-3">
            <span className="text-caption text-muted-foreground">Card</span>
            <Elevated
              offset={2}
              className="rounded-2xl p-5 flex flex-col gap-3"
            >
              <span className="text-caption text-muted-foreground">Popover</span>
              <Elevated offset={2} className="rounded-2xl p-5">
                <span className="text-caption text-muted-foreground">Menu</span>
              </Elevated>
            </Elevated>
          </Elevated>
        </div>
      </div>
    </DarkPreview>
  );
}

// ---------------------------------------------------------------------------
// Elevation stack — stepped slider walks up the surface ladder, nesting
// one Elevated layer per level (like the Elevated demo, but interactive)
// ---------------------------------------------------------------------------

// Nested stack from surface-{low} (base) up to surface-{high}, each layer
// lifting +1 off the one it sits in via the real Elevated primitive.
function buildStack(low: number, high: number): ReactNode {
  // Each surface's label is hidden until you hover *that* surface. Because the
  // boxes nest (hovering an inner one also :hovers its ancestors), the second
  // variant hides a label whenever a descendant surface is the one being
  // hovered — so only the surface directly under the cursor shows its name.
  const boxClass =
    "relative rounded-2xl p-6 flex items-center justify-center [&:hover>span]:opacity-100 [&:has([data-surface]:hover)>span]:opacity-0";
  const labelClass =
    "absolute top-2 left-2.5 text-caption text-muted-foreground opacity-0 transition-opacity duration-150";

  let node: ReactNode = null;
  for (let lvl = high; lvl >= low + 1; lvl--) {
    const isInner = node === null;
    const inner = node;
    node = (
      <Elevated
        offset={1}
        data-surface
        // Innermost surface is a square; each enclosing surface wraps it with
        // uniform padding, so the whole stack stays concentric squares.
        className={cn(boxClass, isInner && "size-24")}
      >
        <span className={labelClass}>surface-{lvl}</span>
        {inner}
      </Elevated>
    );
  }
  return (
    <SurfaceProvider value={low}>
      <div
        data-surface
        className={cn(boxClass, surfaceClasses(low), node === null && "size-24")}
      >
        <span className={labelClass}>surface-{low}</span>
        {node}
      </div>
    </SurfaceProvider>
  );
}

function ElevationStackDemo() {
  const [range, setRange] = useState<[number, number]>([1, 4]);
  const [low, high] = range;

  return (
    <DarkPreview code={ELEVATION_STACK_CODE} padding="compact">
      <div className="dark w-full flex flex-col gap-6">
        {/* The stage reserves the full 1→8 height (an invisible ghost stack),
            so the preview stays at its max size as you drag — no resizing. */}
        <div className="relative w-full max-w-[520px] mx-auto">
          <div className="invisible pointer-events-none" aria-hidden>
            {buildStack(1, 8)}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {buildStack(low, high)}
          </div>
        </div>
        <div className="w-full max-w-[520px] mx-auto px-1 pb-2">
          <Slider
            value={range}
            min={1}
            max={8}
            step={1}
            showSteps
            onChange={(v) => setRange(v as [number, number])}
          />
        </div>
      </div>
    </DarkPreview>
  );
}

// ---------------------------------------------------------------------------
// Examples — ColorPicker, InviteDialog
// ---------------------------------------------------------------------------

function ColorPickerDemo() {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  return (
    <DarkPreview code={COLOR_PICKER_CODE} padding="compact">
      <div
        ref={setContainerEl}
        className="dark relative w-full rounded-2xl overflow-hidden flex items-start justify-center min-h-[520px] py-12 bg-background"
      >
        <ColorPickerPortalContainer value={containerEl}>
          <ColorPicker defaultValue="#6B97FF" formatOpen />
        </ColorPickerPortalContainer>
      </div>
    </DarkPreview>
  );
}

function RoleItem({
  index,
  icon: Icon,
  label,
  description,
  checked,
}: {
  index: number;
  icon: IconComponent;
  label: string;
  description: string;
  checked: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerItem, activeIndex, checkedIndex } = useDropdown();
  const shape = useShape();
  const CheckIcon = useIcon("check");

  useEffect(() => {
    registerItem(index, ref.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  const isActive = activeIndex === index;
  const highlighted = isActive || checked;

  return (
    <div
      ref={ref}
      data-proximity-index={index}
      role="menuitemradio"
      aria-checked={checked}
      aria-label={label}
      tabIndex={index === (checkedIndex ?? 0) ? 0 : -1}
      className={cn(
        "relative z-10 flex items-start gap-3 px-3 py-2.5 cursor-pointer outline-none transition-colors duration-80",
        shape.item
      )}
    >
      <Icon
        size={18}
        strokeWidth={highlighted ? 2 : 1.5}
        className={cn(
          "shrink-0 mt-0.5 transition-[color,stroke-width] duration-80",
          highlighted ? "text-foreground" : "text-muted-foreground"
        )}
      />
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span
          className={cn(
            "text-body transition-colors duration-80",
            highlighted ? "text-foreground" : "text-muted-foreground"
          )}
          style={{
            fontVariationSettings: checked
              ? fontWeights.semibold
              : fontWeights.medium,
          }}
        >
          {label}
        </span>
        <span className="text-caption text-muted-foreground leading-snug">
          {description}
        </span>
      </div>
      {checked && (
        <CheckIcon
          size={16}
          strokeWidth={2}
          className="text-foreground shrink-0 mt-0.5"
        />
      )}
    </div>
  );
}

// "rgb(r, g, b)" → "#RRGGBB"
function rgbToHex(rgb: string) {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return (
    "#" +
    m
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

// Hand-tuned transforms for the two solution callouts.
const SOLUTION_VALUES: Record<"dialog" | "dropdown", ArrowDial> = {
  dialog: { x: 0, y: -60, rotation: 20, curve: -10, labelX: 0, labelY: -30 },
  dropdown: { x: 0, y: 0, rotation: 0, curve: 10, labelX: 10, labelY: 10 },
};

// Two blue callouts for the solution demo: one points at the dialog (surface-5)
// and one at the role dropdown (surface-7). Each reports its target's *live*
// background color — so the lift to a distinct surface reads straight off the
// rendered pixels. Positions are measured (the dialog is fluid, not a fixed
// canvas).
function SolutionAnnotations({
  containerRef,
  dialogRef,
  dropdownRef,
}: {
  containerRef: { current: HTMLDivElement | null };
  dialogRef: { current: HTMLDivElement | null };
  dropdownRef: { current: HTMLDivElement | null };
}) {
  const color = ANNOTATION_BLUE;

  type Box = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    w: number;
    h: number;
    hex: string;
  };
  const [geo, setGeo] = useState<{
    w: number;
    h: number;
    dialog: Box;
    dropdown: Box;
  } | null>(null);

  useEffect(() => {
    const c = containerRef.current;
    const dlg = dialogRef.current;
    const dd = dropdownRef.current;
    if (!c || !dlg || !dd) return;
    const measure = () => {
      const cr = c.getBoundingClientRect();
      const rel = (el: HTMLDivElement): Box => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - cr.left,
          top: r.top - cr.top,
          right: r.right - cr.left,
          bottom: r.bottom - cr.top,
          w: r.width,
          h: r.height,
          hex: rgbToHex(getComputedStyle(el).backgroundColor),
        };
      };
      setGeo({ w: cr.width, h: cr.height, dialog: rel(dlg), dropdown: rel(dd) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    ro.observe(dlg);
    ro.observe(dd);
    return () => ro.disconnect();
  }, [containerRef, dialogRef, dropdownRef]);

  if (!geo) return null;

  // Dialog callout — label in the left margin, arrow into the dialog surface.
  const dlg = geo.dialog;
  const dEnd = { x: dlg.left + 12, y: dlg.top + dlg.h * 0.4 };
  const dLabelW = 72;
  const dialog = {
    key: "dialog",
    title: "Dialog",
    hex: dlg.hex,
    labelW: dLabelW,
    left: dlg.left - dLabelW - 16 + SOLUTION_VALUES.dialog.labelX,
    top: dEnd.y + 6 + SOLUTION_VALUES.dialog.labelY,
    path: buildArrowPath(
      { x: dlg.left - 16, y: dEnd.y + 26 },
      dEnd,
      SOLUTION_VALUES.dialog
    ),
  };

  // Role dropdown callout — label in the right margin, arrow into the menu.
  const dd = geo.dropdown;
  const mEnd = { x: dd.right - 2, y: dd.top + dd.h * 0.22 };
  const mLabelW = 92;
  const dropdown = {
    key: "dropdown",
    title: "Role dropdown",
    hex: dd.hex,
    labelW: mLabelW,
    left: geo.w - mLabelW - 4 + SOLUTION_VALUES.dropdown.labelX,
    top: mEnd.y + 10 + SOLUTION_VALUES.dropdown.labelY,
    path: buildArrowPath(
      { x: geo.w - mLabelW - 4, y: mEnd.y + 24 },
      mEnd,
      SOLUTION_VALUES.dropdown
    ),
  };

  const callouts = [dialog, dropdown];

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={geo.w}
        height={geo.h}
        viewBox={`0 0 ${geo.w} ${geo.h}`}
        fill="none"
        aria-hidden
      >
        <defs>
          <marker
            id="ff-solution-arrow"
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
        {callouts.map((c) => (
          <path
            key={c.key}
            d={c.path}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            markerEnd="url(#ff-solution-arrow)"
          />
        ))}
      </svg>
      {callouts.map((c) => (
        <div
          key={c.key}
          className="absolute flex flex-col gap-0.5 items-start"
          style={{ left: c.left, top: c.top, width: c.labelW }}
        >
          <span
            className="text-caption leading-tight"
            style={{
              color,
              fontVariationSettings: fontWeights.semibold,
            }}
          >
            {c.title}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="w-2.5 h-2.5 rounded-[3px] border border-white/15 shrink-0"
              style={{ backgroundColor: c.hex }}
            />
            <span
              className="text-[11px] font-mono leading-tight"
              style={{ color }}
            >
              {c.hex}
            </span>
          </span>
        </div>
      ))}
    </>
  );
}

function InviteDialogDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const XIcon = useIcon("x");
  const Users = useIcon("users");
  const User = useIcon("user");
  const Lock = useIcon("lock");
  const ChevronDown = useIcon("chevron-down");

  return (
    <DarkPreview code={INVITE_DIALOG_CODE} padding="compact">
      <div
        ref={containerRef}
        className="dark relative w-full rounded-2xl overflow-hidden min-h-[640px] flex items-center justify-center p-6 bg-background"
      >
        <SurfaceProvider value={5}>
          <div
            ref={dialogRef}
            className={cn(
              "relative w-full max-w-[320px] rounded-2xl p-6 flex flex-col gap-5",
              surfaceClasses(5)
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-caption"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  M
                </div>
                <span
                  className="text-[15px] text-foreground"
                  style={{ fontVariationSettings: fontWeights.semibold }}
                >
                  Invite to your workspace
                </span>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-1 cursor-pointer"
              >
                <XIcon size={16} strokeWidth={1.5} />
              </button>
            </div>

            <label className="flex flex-col gap-2">
              <span
                className="text-body text-foreground"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Email
              </span>
              <textarea
                readOnly
                rows={2}
                placeholder="email@gmail.com, email2@gmail.com..."
                className="text-body text-foreground placeholder:text-muted-foreground bg-transparent hover:bg-hover border border-border rounded-xl px-3 py-2 resize-none outline-none transition-colors duration-80 cursor-pointer"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span
                className="text-body text-foreground"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Select role
              </span>
              <button
                type="button"
                aria-expanded
                className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl bg-active text-body text-foreground border border-border cursor-pointer transition-colors duration-80"
              >
                <span>Member</span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className="text-muted-foreground rotate-180 transition-transform"
                />
              </button>
              <div className="-mt-px">
                <Dropdown ref={menuRef} checkedIndex={1} className="!w-full">
                  <RoleItem
                    index={0}
                    icon={Users}
                    label="Workspace owner"
                    description="Can change workspace settings and invite new members"
                    checked={false}
                  />
                  <RoleItem
                    index={1}
                    icon={User}
                    label="Member"
                    description="Can't change workspace settings or invite new members"
                    checked={true}
                  />
                  <RoleItem
                    index={2}
                    icon={Lock}
                    label="Restricted member"
                    description="Can only see and edit content they created"
                    checked={false}
                  />
                </Dropdown>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2">
              <button
                type="button"
                className="h-9 px-4 rounded-full bg-transparent hover:bg-hover text-body text-foreground cursor-pointer transition-colors duration-80"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled
                className="h-9 px-4 rounded-full bg-foreground text-background text-body cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                Send invites
              </button>
            </div>
          </div>
        </SurfaceProvider>

        <SolutionAnnotations
          containerRef={containerRef}
          dialogRef={dialogRef}
          dropdownRef={menuRef}
        />
      </div>
    </DarkPreview>
  );
}

// ---------------------------------------------------------------------------
// Theme-switch links (used in the intro copy)
// ---------------------------------------------------------------------------

function UseThemeLink({
  theme,
  children,
}: {
  theme: "dark" | "light";
  children: ReactNode;
}) {
  const { setTheme } = useThemeContext();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme)}
      className="underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

function UseDarkLink({ children }: { children: ReactNode }) {
  return <UseThemeLink theme="dark">{children}</UseThemeLink>;
}

function UseLightLink({ children }: { children: ReactNode }) {
  return <UseThemeLink theme="light">{children}</UseThemeLink>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SurfacesDoc() {
  return (
    <DocPage
      title="Surfaces"
      slug="surfaces"
      installSlug="elevated"
      installNote="Installs the Elevated primitive plus the surface-context and surface-classes libs — the elevation ladder as code."
      description={
        <>
          Eight surface levels that nest. Components read their substrate from
          context and lift relative to it, so popovers, dropdowns, and dialogs
          stay visible at any depth — in both{" "}
          <UseLightLink>light</UseLightLink> and{" "}
          <UseDarkLink>dark</UseDarkLink> mode.
        </>
      }
    >
      <DocSection title="The problem">
        <div className="flex flex-col gap-3 text-body text-muted-foreground leading-relaxed">
          <p>
            In light mode, we use shadow behind white surfaces to signify
            elevation. In dark mode, we use progressively lighter backgrounds
            instead.
          </p>
          <p>
            But traditional components have a fixed background — a dropdown
            often ends up the same color as the dialog it sits in. That makes
            your interface look like this:
          </p>
        </div>
        <ProblemDemo />
      </DocSection>

      <DocSection title="The solution">
        <div className="flex flex-col gap-3 text-body text-muted-foreground leading-relaxed">
          <p>Three pieces: tokens, substrate context, and the primitive.</p>
        </div>

        <h3
          className="text-[15px] text-foreground mt-2"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Tokens
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          Eight bg/shadow pairs. Light mode flattens to white after step 2
          (shadow alone carries elevation). Dark mode keeps adding white-opacity
          plus a layered shadow recipe.
        </p>
        <TokensDemo />

        <h3
          className="text-[15px] text-foreground mt-6"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Substrate
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          Each container knows its own level and tells whatever opens inside.
          A popover on the page and the same popover inside a dialog both
          end up at the right depth, without anything passed between them.
        </p>
        <SubstrateDemo />

        <h3
          className="text-[15px] text-foreground mt-6"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Elevated
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          Wrap a panel and the background settles at the level it belongs to.
          The shadow doesn&apos;t change, so a popover still reads as a popover
          three layers down.
        </p>
        <ElevatedDemo />

        <h3
          className="text-[15px] text-foreground mt-6"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Move through levels
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          Drag both knobs to choose which slice of the ladder to nest. Each
          layer lifts a single step off the one it sits in — whether you span
          two levels or all eight.
        </p>
        <ElevationStackDemo />
      </DocSection>

      <DocSection title="Examples">
        <h3
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Invite dialog
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          Dialog at surface 5, role picker at surface 7 — no props passed
          between them.
        </p>
        <InviteDialogDemo />

        <h3
          className="text-[15px] text-foreground mt-6"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Color picker
        </h3>
        <p className="text-body text-muted-foreground leading-relaxed">
          The format dropdown sits one level above the picker panel.
        </p>
        <ColorPickerDemo />
      </DocSection>
    </DocPage>
  );
}
