"use client";

import { useState, type MouseEvent } from "react";
import { useIcons, type IconName } from "@/lib/icon-context";
import { Switch } from "@/registry/radix/switch";
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
import { Tooltip } from "@/components/ui/tooltip";
import {
  PLAY_SWITCH,
  PlayField,
  PlaySelect,
  PlaySection,
  PlayDivider,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import type { PlaygroundProps } from "./types";

// ── Breadcrumb playground ────────────────────────────────
// One trail driven by every state the component has: how many steps, icons,
// a step that opens a Dropdown, a collapsed middle (in a menu or expanding in
// place), the separator, and a long middle step that truncates at its cap.

type Collapse = "never" | "overflow" | "always";
type Reveal = "menu" | "expand";
type Separator = "chevron" | "slash";

/** Links before the page, in order; the trail takes the first `steps - 1`. */
const LINKS: { label: string; icon: IconName; lucide: string }[] = [
  { label: "Home", icon: "home", lucide: "Home" },
  { label: "Projects", icon: "folder", lucide: "Folder" },
  { label: "Website", icon: "globe", lucide: "Globe" },
  { label: "Design", icon: "palette", lucide: "Palette" },
  { label: "Assets", icon: "image", lucide: "ImageIcon" },
];
const SIBLINGS = ["Drafts", "Published", "Archive"];
const PAGE = "Roadmap.md";
const LONG_STEP = "Quarterly roadmap for the website redesign and launch, 2026";

/** Clicks in the sandbox never navigate. */
const stay = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault();

/** Breadcrumb menus fit their rows instead of the Dropdown's 288px, keep
 *  8rem so a checked row's check has room, and never get narrower than their
 *  trigger (Radix and Base UI name that width differently). */
export const BREADCRUMB_MENU_CLASS =
  "w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]";

const hiddenLabel = (n: number) => `${n} hidden ${n === 1 ? "step" : "steps"}`;

/** The collapsed middle as a menu. A menu that opens on hover already shows
 *  the hidden steps, so only a click-to-open menu gets the tooltip counting
 *  them; it steps aside while the menu is open, so the two never stack.
 *  Shared by the playground and the doc page's examples. */
export function EllipsisMenu({
  hidden,
  openOnHover = true,
}: {
  hidden: string[];
  openOnHover?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = (
    <DropdownTrigger
      openOnHover={openOnHover}
      render={
        <BreadcrumbButton aria-label={`Show ${hiddenLabel(hidden.length)}`}>
          <BreadcrumbEllipsis />
        </BreadcrumbButton>
      }
    />
  );
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {openOnHover ? (
        trigger
      ) : (
        <Tooltip
          content={hiddenLabel(hidden.length)}
          side="bottom"
          forceOpen={open ? false : undefined}
        >
          {trigger}
        </Tooltip>
      )}
      <DropdownContent className={BREADCRUMB_MENU_CLASS}>
        {hidden.map((label, i) => (
          <MenuItem key={label} index={i} label={label} />
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

interface TrailState {
  steps: number;
  icons: boolean;
  dropdownStep: boolean;
  collapse: Collapse;
  reveal: Reveal;
  separator: Separator;
  longName: boolean;
  openOnHover: boolean;
  sibling: number;
}

/** The links the trail shows, and how many hide behind the ellipsis (links
 *  1 to `hiddenCount`). First and last link always stay. "always" hides the
 *  whole middle of a trail with at least 4 links; "overflow" hides what
 *  useBreadcrumbCollapse measured; an expanded trail hides nothing. */
function layout(o: TrailState, autoHidden: number, expanded: boolean) {
  const links = LINKS.slice(0, o.steps - 1).map((l) => ({ ...l }));
  // The dropdown step is the last link before the page, renamed by its menu.
  const dropdownIndex = o.dropdownStep && links.length >= 2 ? links.length - 1 : -1;
  if (dropdownIndex >= 0) links[dropdownIndex].label = SIBLINGS[o.sibling];
  // The long name sits on the first middle step.
  if (o.longName && links.length >= 2) links[1].label = LONG_STEP;
  let hiddenCount = 0;
  if (!expanded) {
    if (o.collapse === "always" && links.length >= 4) hiddenCount = links.length - 2;
    if (o.collapse === "overflow") hiddenCount = Math.min(autoHidden, Math.max(0, links.length - 2));
  }
  const hidden = links.slice(1, 1 + hiddenCount);
  return { links, dropdownIndex, hiddenCount, hidden };
}

function buildCode(o: TrailState, autoHidden: number, expanded: boolean) {
  const { links, dropdownIndex, hiddenCount, hidden } = layout(o, autoHidden, expanded);
  const props: string[] = [];
  if (o.separator === "slash") props.push('separator="/"');
  const lines: string[] = [];
  const item = (body: string[]) => {
    lines.push("    <BreadcrumbItem>");
    body.forEach((l) => lines.push("      " + l));
    lines.push("    </BreadcrumbItem>");
  };
  const icon = (i: number) => (o.icons ? [`  <${links[i].lucide} />`] : []);
  const link = (i: number) => {
    if (i === dropdownIndex) {
      item([
        "<DropdownMenu>",
        o.openOnHover ? "  <DropdownTrigger openOnHover" : "  <DropdownTrigger",
        "    render={",
        "      <BreadcrumbButton>",
        ...icon(i).map((l) => "      " + l),
        `        {sections[section]}`,
        "      </BreadcrumbButton>",
        "    }",
        "  />",
        '  <DropdownContent checkedIndex={section} className="w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]">',
        "    {sections.map((label, i) => (",
        "      <MenuItem key={label} index={i} label={label} checked={section === i} onSelect={() => setSection(i)} />",
        "    ))}",
        "  </DropdownContent>",
        "</DropdownMenu>",
      ]);
      return;
    }
    const iconOnly = o.icons && i === 0;
    item([
      `<BreadcrumbLink href="#"${iconOnly ? ' aria-label="Home"' : ""}>`,
      ...icon(i),
      ...(iconOnly ? [] : [`  ${links[i].label}`]),
      "</BreadcrumbLink>",
    ]);
  };
  const ellipsis = () => {
    if (o.reveal === "menu") {
      item([
        ...(o.openOnHover
          ? [
              "<DropdownMenu>",
              "  <DropdownTrigger",
              "    openOnHover",
              `    render={<BreadcrumbButton aria-label="Show ${hiddenLabel(hidden.length)}"><BreadcrumbEllipsis /></BreadcrumbButton>}`,
              "  />",
            ]
          : [
              "<DropdownMenu open={open} onOpenChange={setOpen}>",
              `  <Tooltip content="${hiddenLabel(hidden.length)}" side="bottom" forceOpen={open ? false : undefined}>`,
              "    <DropdownTrigger",
              `      render={<BreadcrumbButton aria-label="Show ${hiddenLabel(hidden.length)}"><BreadcrumbEllipsis /></BreadcrumbButton>}`,
              "    />",
              "  </Tooltip>",
            ]),
        '  <DropdownContent className="w-max min-w-[max(8rem,var(--radix-dropdown-menu-trigger-width,var(--anchor-width,0px)))]">',
        ...hidden.map((h, i) => `    <MenuItem index={${i}} label="${h.label}" />`),
        "  </DropdownContent>",
        "</DropdownMenu>",
      ]);
    } else {
      item([
        '<BreadcrumbButton aria-label="Show full path" onClick={() => setExpanded(true)}>',
        "  <BreadcrumbEllipsis />",
        "</BreadcrumbButton>",
      ]);
    }
  };

  links.forEach((_, i) => {
    if (i >= 1 && i <= hiddenCount) {
      if (i === 1) ellipsis();
      return;
    }
    link(i);
  });
  item([
    "<BreadcrumbPage>",
    ...(o.icons ? ["  <FileText />"] : []),
    `  ${PAGE}`,
    "</BreadcrumbPage>",
  ]);

  const head = `<Breadcrumb${props.length ? " " + props.join(" ") : ""}>`;
  const auto = o.collapse === "overflow";
  const prelude = auto
    ? [
        "// Hides middle steps, from the second on, while the trail is wider than",
        "// its container. `hidden` is how many; render the ellipsis in their place.",
        `const { listRef, hidden } = useBreadcrumbCollapse({ count: ${links.length + 1}${o.reveal === "expand" ? ", enabled: !expanded" : ""} });`,
        "",
      ]
    : [];
  return [
    ...prelude,
    head,
    auto ? "  <BreadcrumbList ref={listRef}>" : "  <BreadcrumbList>",
    ...lines,
    "  </BreadcrumbList>",
    "</Breadcrumb>",
  ].join("\n");
}

export function BreadcrumbPlayground({ children }: PlaygroundProps) {
  const icons = useIcons();
  const [steps, setSteps] = useState(6);
  const [iconsOn, setIconsOn] = useState(false);
  const [dropdownStep, setDropdownStep] = useState(true);
  const [collapse, setCollapse] = useState<Collapse>("overflow");
  const [reveal, setReveal] = useState<Reveal>("menu");
  const [separator, setSeparator] = useState<Separator>("chevron");
  const [longName, setLongName] = useState(false);
  const [sibling, setSibling] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [openOnHover, setOpenOnHover] = useState(true);

  const state: TrailState = {
    steps,
    icons: iconsOn,
    dropdownStep,
    collapse,
    reveal,
    separator,
    longName,
    openOnHover,
    sibling,
  };
  const linkCount = Math.min(steps - 1, LINKS.length);
  const { listRef, hidden: autoHidden } = useBreadcrumbCollapse({
    count: linkCount + 1,
    enabled: collapse === "overflow" && !expanded,
  });
  const { links, dropdownIndex, hiddenCount, hidden } = layout(state, autoHidden, expanded);
  const code = buildCode(state, autoHidden, expanded);
  // Any change to the trail's shape folds an expanded middle back up.
  const reshape = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setExpanded(false);
  };

  const renderIcon = (name: IconName) => {
    const Icon = icons[name];
    return <Icon />;
  };

  const trail = (
    <Breadcrumb
      separator={separator === "slash" ? "/" : undefined}
      className="w-full"
    >
      <BreadcrumbList ref={listRef} className="justify-center">
        {links.map((l, i) => {
          if (i >= 1 && i <= hiddenCount) {
            if (i !== 1) return null;
            return (
              <BreadcrumbItem key="ellipsis">
                {reveal === "menu" ? (
                  <EllipsisMenu hidden={hidden.map((h) => h.label)} openOnHover={openOnHover} />
                ) : (
                  <BreadcrumbButton aria-label="Show full path" onClick={() => setExpanded(true)}>
                    <BreadcrumbEllipsis />
                  </BreadcrumbButton>
                )}
              </BreadcrumbItem>
            );
          }
          if (i === dropdownIndex) {
            return (
              <BreadcrumbItem key="dropdown">
                <DropdownMenu>
                  <DropdownTrigger
                    openOnHover={openOnHover}
                    render={
                      <BreadcrumbButton>
                        {iconsOn && renderIcon(l.icon)}
                        {l.label}
                      </BreadcrumbButton>
                    }
                  />
                  <DropdownContent checkedIndex={sibling} className={BREADCRUMB_MENU_CLASS}>
                    {SIBLINGS.map((label, j) => (
                      <MenuItem
                        key={label}
                        index={j}
                        label={label}
                        checked={sibling === j}
                        onSelect={() => setSibling(j)}
                      />
                    ))}
                  </DropdownContent>
                </DropdownMenu>
              </BreadcrumbItem>
            );
          }
          const iconOnly = iconsOn && i === 0;
          return (
            <BreadcrumbItem key={l.label}>
              <BreadcrumbLink href="#" onClick={stay} aria-label={iconOnly ? l.label : undefined}>
                {iconsOn && renderIcon(l.icon)}
                {!iconOnly && l.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          );
        })}
        <BreadcrumbItem>
          <BreadcrumbPage>
            {iconsOn && renderIcon("file")}
            {PAGE}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );

  // A bounded block: the edge the trail collapses and truncates against.
  const preview = <div className="w-full max-w-md min-w-0">{trail}</div>;
  const demoPreview = <div className="w-[360px] min-w-0">{trail}</div>;

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    setSteps(pick([3, 4, 5, 6]));
    setIconsOn(Math.random() > 0.5);
    setDropdownStep(Math.random() > 0.5);
    setCollapse(pick(["never", "overflow", "always"] as const));
    setReveal(pick(["menu", "expand"] as const));
    setSeparator(Math.random() > 0.75 ? "slash" : "chevron");
    setLongName(Math.random() > 0.6);
    setOpenOnHover(Math.random() > 0.5);
    setExpanded(false);
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Trail" />
      <div>
        <PlayField label="Steps">
          <PlaySelect
            value={String(steps)}
            onChange={(v) => reshape(setSteps)(Number(v))}
            options={[2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </PlayField>
        <PlayField label="Collapse" disabled={steps < 4}>
          <PlaySelect
            value={collapse}
            onChange={(v) => reshape(setCollapse)(v as Collapse)}
            options={[
              { value: "never", label: "Never" },
              { value: "overflow", label: "When it overflows" },
              { value: "always", label: "Always" },
            ]}
          />
        </PlayField>
        <PlayField label="Show hidden steps" disabled={steps < 4 || collapse === "never"}>
          <PlaySelect
            value={reveal}
            onChange={(v) => reshape(setReveal)(v as Reveal)}
            options={[
              { value: "menu", label: "In a menu" },
              { value: "expand", label: "Expand in place" },
            ]}
          />
        </PlayField>
        <PlayField label="Separator">
          <PlaySelect
            value={separator}
            onChange={(v) => setSeparator(v as Separator)}
            options={[
              { value: "chevron", label: "Chevron" },
              { value: "slash", label: "Slash" },
            ]}
          />
        </PlayField>
      </div>

      <PlayDivider />
      <PlaySection label="Steps" />
      <div>
        <Switch
          label="Icons"
          checked={iconsOn}
          onToggle={() => setIconsOn((v) => !v)}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Dropdown on a step"
          checked={dropdownStep}
          onToggle={() => setDropdownStep((v) => !v)}
          disabled={steps < 3}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Open menus on hover"
          checked={openOnHover}
          onToggle={() => setOpenOnHover((v) => !v)}
          disabled={!(dropdownStep && steps >= 3) && !(hiddenCount > 0 && reveal === "menu")}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Long step name"
          checked={longName}
          onToggle={() => setLongName((v) => !v)}
          disabled={steps < 3}
          className={PLAY_SWITCH}
        />
      </div>
    </PlaygroundPanel>
  );

  return children({
    preview,
    demoPreview,
    controls,
    code,
    onReplay: reveal === "expand" && collapse !== "never" ? () => setExpanded(false) : undefined,
  });
}

