"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { SurfaceProvider } from "@/registry/default/lib/surface-context";
import { Elevated } from "@/lib/elevated";
import { Dropdown, useDropdown } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  ColorPicker,
  ColorPickerPortalContainer,
} from "@/registry/default/color-picker";
import { useIcon, type IconComponent } from "@/registry/default/lib/icon-context";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { surfaceClasses } from "@/registry/default/lib/surface-classes";
import { cn } from "@/registry/default/lib/utils";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { InputCopy } from "@/registry/default/input-copy";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// ---------------------------------------------------------------------------
// Code snippets (shown in the Code tab of each ComponentPreview)
// ---------------------------------------------------------------------------

const INSTALL_CMD =
  "npx shadcn@latest add https://www.fluidfunctionalism.com/r/elevated.json";

const COLLAPSE_CODE = `// Inside a dialog (substrate 5):

// ❌ Hardcoded at the dialog's level — invisible.
<div className="bg-surface-5 shadow-surface-3 rounded-3xl p-1">
  <MenuItem icon={Star} label="Favorites" checked />
  <MenuItem icon={Clock} label="Recents" />
  <MenuItem icon={Lock} label="Private" />
</div>

// ✅ Elevation-aware — lifts to surface-7.
<Elevated offset={2} shadowLevel={3} className="rounded-3xl p-1">
  <MenuItem icon={Star} label="Favorites" checked />
  <MenuItem icon={Clock} label="Recents" />
  <MenuItem icon={Lock} label="Private" />
</Elevated>`;

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
    <ComponentPreview code={TOKENS_CSS} padding="compact">
      <div className="flex flex-col gap-4 w-full">
        <div className="dark flex flex-col gap-2">
          <span
            className="text-[11px] text-muted-foreground tracking-wider"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Dark
          </span>
          <div className="flex gap-3 rounded-2xl bg-background p-4 overflow-x-auto">
            {LEVELS.map((n) => (
              <SurfaceChip key={n} level={n} />
            ))}
          </div>
        </div>
        <div className="light flex flex-col gap-2">
          <span
            className="text-[11px] text-muted-foreground tracking-wider"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            Light
          </span>
          <div className="flex gap-3 rounded-2xl bg-background p-4 overflow-x-auto">
            {LEVELS.map((n) => (
              <SurfaceChip key={n} level={n} />
            ))}
          </div>
        </div>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// The problem — collapse demo
// ---------------------------------------------------------------------------

function NaiveMenu() {
  const Star = useIcon("star");
  const Clock = useIcon("clock");
  const Lock = useIcon("lock");
  const CheckIcon = useIcon("check");
  const items: { icon: IconComponent; label: string; checked?: boolean }[] = [
    { icon: Star, label: "Favorites", checked: true },
    { icon: Clock, label: "Recents" },
    { icon: Lock, label: "Private" },
  ];
  return (
    <div className="relative flex flex-col gap-0.5 w-full rounded-3xl bg-surface-5 shadow-surface-3 p-1 select-none">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative flex items-center gap-2 rounded-[18px] px-2 py-2"
        >
          <item.icon
            size={16}
            strokeWidth={item.checked ? 2 : 1.5}
            className={
              item.checked ? "text-foreground" : "text-muted-foreground"
            }
          />
          <span
            className={cn(
              "text-[13px] flex-1",
              item.checked ? "text-foreground" : "text-muted-foreground"
            )}
            style={{
              fontVariationSettings: item.checked
                ? fontWeights.semibold
                : fontWeights.normal,
            }}
          >
            {item.label}
          </span>
          {item.checked && (
            <CheckIcon size={16} strokeWidth={2} className="text-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

function ElevatedMenu() {
  const Star = useIcon("star");
  const Clock = useIcon("clock");
  const Lock = useIcon("lock");
  return (
    <Dropdown checkedIndex={0} className="!w-full">
      <MenuItem index={0} icon={Star} label="Favorites" checked />
      <MenuItem index={1} icon={Clock} label="Recents" />
      <MenuItem index={2} icon={Lock} label="Private" />
    </Dropdown>
  );
}

function CollapseDemo() {
  return (
    <ComponentPreview code={COLLAPSE_CODE} padding="compact">
      <div className="dark w-full">
        <SurfaceProvider value={5}>
          <div
            className={cn(
              "flex flex-col gap-5 p-6 rounded-2xl w-full max-w-[640px] mx-auto",
              surfaceClasses(5)
            )}
          >
            <span
              className="text-[12px] text-muted-foreground"
              style={{ fontVariationSettings: fontWeights.medium }}
            >
              Dialog surface
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-muted-foreground tracking-wider">
                  Problem
                </span>
                <NaiveMenu />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-muted-foreground tracking-wider">
                  Solution
                </span>
                <ElevatedMenu />
              </div>
            </div>
          </div>
        </SurfaceProvider>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Substrate context — page → popover → dialog
// ---------------------------------------------------------------------------

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
    <ComponentPreview code={SUBSTRATE_CODE} padding="compact">
      <div className="dark grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {scenarios.map(({ substrate, label }) => (
          <div
            key={substrate}
            className="flex flex-col gap-3 rounded-2xl p-4 border border-border/40"
            style={{ backgroundColor: `var(--surface-${substrate})` }}
          >
            <span
              className="text-[12px] text-foreground"
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
        ))}
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Elevated primitive — preview shows nested boxes, code shows source
// ---------------------------------------------------------------------------

function ElevatedDemo() {
  return (
    <ComponentPreview code={ELEVATED_SOURCE} padding="compact">
      <div className="dark w-full">
        <div
          className={cn(
            "flex flex-col gap-3 p-5 rounded-2xl w-full max-w-[480px] mx-auto",
            surfaceClasses(1)
          )}
        >
          <span className="text-[12px] text-muted-foreground">Page</span>
          <Elevated offset={2} className="rounded-2xl p-5 flex flex-col gap-3">
            <span className="text-[12px] text-muted-foreground">Card</span>
            <Elevated
              offset={2}
              className="rounded-2xl p-5 flex flex-col gap-3"
            >
              <span className="text-[12px] text-muted-foreground">Popover</span>
              <Elevated offset={2} className="rounded-2xl p-5">
                <span className="text-[12px] text-muted-foreground">Menu</span>
              </Elevated>
            </Elevated>
          </Elevated>
        </div>
      </div>
    </ComponentPreview>
  );
}

// ---------------------------------------------------------------------------
// Examples — ColorPicker, InviteDialog
// ---------------------------------------------------------------------------

function ColorPickerDemo() {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  return (
    <ComponentPreview code={COLOR_PICKER_CODE} padding="compact">
      <div
        ref={setContainerEl}
        className="dark relative w-full rounded-2xl overflow-hidden flex items-start justify-center min-h-[520px] py-12 bg-background"
      >
        <div
          className="absolute inset-0 bg-black/30 pointer-events-none"
          aria-hidden
        />
        <ColorPickerPortalContainer value={containerEl}>
          <ColorPicker defaultValue="#6B97FF" formatOpen />
        </ColorPickerPortalContainer>
      </div>
    </ComponentPreview>
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
            "text-[13px] transition-colors duration-80",
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
        <span className="text-[12px] text-muted-foreground leading-snug">
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

function InviteDialogDemo() {
  const XIcon = useIcon("x");
  const Users = useIcon("users");
  const User = useIcon("user");
  const Lock = useIcon("lock");
  const ChevronDown = useIcon("chevron-down");

  return (
    <ComponentPreview code={INVITE_DIALOG_CODE} padding="compact">
      <div className="dark relative w-full rounded-2xl overflow-hidden min-h-[640px] flex items-center justify-center p-6 bg-background">
        <div
          className="absolute inset-0 bg-black/30 pointer-events-none"
          aria-hidden
        />
        <SurfaceProvider value={5}>
          <div
            className={cn(
              "relative w-full max-w-[440px] rounded-2xl p-6 flex flex-col gap-5",
              surfaceClasses(5)
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[12px]"
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
                className="text-[13px] text-foreground"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Email
              </span>
              <textarea
                readOnly
                rows={3}
                placeholder="email@gmail.com, email2@gmail.com..."
                className="text-[13px] text-foreground placeholder:text-muted-foreground bg-transparent hover:bg-hover border border-border rounded-xl px-3 py-2 resize-none outline-none transition-colors duration-80 cursor-pointer"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span
                className="text-[13px] text-foreground"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Select role
              </span>
              <button
                type="button"
                aria-expanded
                className="flex items-center justify-between gap-2 h-10 px-3 rounded-xl bg-active text-[13px] text-foreground border border-border cursor-pointer transition-colors duration-80"
              >
                <span>Member</span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  className="text-muted-foreground rotate-180 transition-transform"
                />
              </button>
              <div className="-mt-px">
                <Dropdown checkedIndex={1} className="!w-full">
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
                className="h-9 px-4 rounded-full bg-transparent hover:bg-hover text-[13px] text-foreground cursor-pointer transition-colors duration-80"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled
                className="h-9 px-4 rounded-full bg-foreground text-background text-[13px] cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                Send invites
              </button>
            </div>
          </div>
        </SurfaceProvider>
      </div>
    </ComponentPreview>
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
      <DocSection title="Installation">
        <InputCopy value={INSTALL_CMD} />
      </DocSection>

      <DocSection title="The problem">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>
            Hard-coded surface levels collapse the moment a component nests
            inside something at the same level. Inside a substrate-5 dialog,
            a popover that hard-codes
            <code className="px-1 py-0.5 rounded bg-muted text-[12px] mx-1">
              bg-surface-5
            </code>
            literally disappears into the dialog.
          </p>
        </div>
        <CollapseDemo />
      </DocSection>

      <DocSection title="The system">
        <div className="flex flex-col gap-3 text-[13px] text-muted-foreground leading-relaxed">
          <p>Three pieces: tokens, substrate context, and the primitive.</p>
        </div>

        <h3
          className="text-[15px] text-foreground mt-2"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Tokens
        </h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
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
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            SurfaceProvider
          </code>{" "}
          declares the current level;{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            useSurface()
          </code>{" "}
          reads it (default: 1, the page).
        </p>
        <SubstrateDemo />

        <h3
          className="text-[15px] text-foreground mt-6"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Elevated
        </h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          ~15 lines: read substrate, add offset, apply classes, re-provide.{" "}
          <code className="px-1 py-0.5 rounded bg-muted text-[12px]">
            shadowLevel
          </code>{" "}
          lets the bg track the stack while the shadow signature stays
          fixed per component type.
        </p>
        <ElevatedDemo />
      </DocSection>

      <DocSection title="Examples">
        <h3
          className="text-[15px] text-foreground"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Color picker
        </h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          The format dropdown sits one level above the picker panel.
        </p>
        <ColorPickerDemo />

        <h3
          className="text-[15px] text-foreground mt-6"
          style={{ fontVariationSettings: fontWeights.semibold }}
        >
          Invite dialog
        </h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Dialog at surface 5, role picker at surface 7 — no props passed
          between them.
        </p>
        <InviteDialogDemo />
      </DocSection>
    </DocPage>
  );
}
