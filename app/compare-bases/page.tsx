"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useBase, type Base } from "@/lib/base-context";
import { spring } from "@/registry/default/lib/springs";

import { Button as RadixButton } from "@/registry/radix/button";
import { Button as BaseButton } from "@/registry/base/button";

import { Switch as RadixSwitch } from "@/registry/radix/switch";
import { Switch as BaseSwitch } from "@/registry/base/switch";

import { Tooltip as RadixTooltip } from "@/registry/radix/tooltip";
import { Tooltip as BaseTooltip } from "@/registry/base/tooltip";

import { ScrollArea as RadixScrollArea } from "@/registry/radix/scroll-area";
import { ScrollArea as BaseScrollArea } from "@/registry/base/scroll-area";

import {
  Accordion as RadixAccordion,
  AccordionItem as RadixAccordionItem,
  AccordionTrigger as RadixAccordionTrigger,
  AccordionContent as RadixAccordionContent,
} from "@/registry/radix/accordion";
import {
  Accordion as BaseAccordion,
  AccordionItem as BaseAccordionItem,
  AccordionTrigger as BaseAccordionTrigger,
  AccordionContent as BaseAccordionContent,
} from "@/registry/base/accordion";

import {
  Dialog as RadixDialog,
  DialogContent as RadixDialogContent,
  DialogHeader as RadixDialogHeader,
  DialogTitle as RadixDialogTitle,
  DialogDescription as RadixDialogDescription,
  DialogTrigger as RadixDialogTrigger,
} from "@/registry/radix/dialog";
import {
  Dialog as BaseDialog,
  DialogContent as BaseDialogContent,
  DialogHeader as BaseDialogHeader,
  DialogTitle as BaseDialogTitle,
  DialogDescription as BaseDialogDescription,
  DialogTrigger as BaseDialogTrigger,
} from "@/registry/base/dialog";

import {
  Tabs as RadixTabs,
  TabsList as RadixTabsList,
  TabItem as RadixTabItem,
  TabPanel as RadixTabPanel,
} from "@/registry/radix/tabs";
import {
  Tabs as BaseTabs,
  TabsList as BaseTabsList,
  TabItem as BaseTabItem,
  TabPanel as BaseTabPanel,
} from "@/registry/base/tabs";

import { Slider as RadixSlider } from "@/registry/radix/slider";
import { Slider as BaseSlider } from "@/registry/base/slider";

import {
  CheckboxGroup as RadixCheckboxGroup,
  CheckboxItem as RadixCheckboxItem,
} from "@/registry/radix/checkbox-group";
import {
  CheckboxGroup as BaseCheckboxGroup,
  CheckboxItem as BaseCheckboxItem,
} from "@/registry/base/checkbox-group";

import {
  RadioGroup as RadixRadioGroup,
  RadioItem as RadixRadioItem,
} from "@/registry/radix/radio-group";
import {
  RadioGroup as BaseRadioGroup,
  RadioItem as BaseRadioItem,
} from "@/registry/base/radio-group";

// Single-source components built on Base UI primitives — no Radix flavor,
// shown once, spanning both columns.
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/registry/default/select";
import { ColorPickerPopover } from "@/registry/default/color-picker";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
} from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import {
  TabsSubtle as RadixTabsSubtle,
  TabsSubtleItem as RadixTabsSubtleItem,
} from "@/registry/radix/tabs-subtle";
import {
  TabsSubtle as BaseTabsSubtle,
  TabsSubtleItem as BaseTabsSubtleItem,
} from "@/registry/base/tabs-subtle";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
} from "@/registry/default/thinking-steps";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { AskUserQuestions } from "@/registry/default/ask-user-questions";
import { Search, Mail, SquareLibrary, Clock, Star } from "lucide-react";

function PrimitiveToggle() {
  const { base, setBase } = useBase();
  const options: { value: Base; label: string }[] = [
    { value: "radix", label: "Radix" },
    { value: "base", label: "Base UI" },
  ];
  return (
    <div className="relative inline-flex items-center gap-1 p-1 rounded-full bg-muted">
      {options.map((o) => {
        const selected = base === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setBase(o.value)}
            className={cn(
              "relative px-5 py-2 text-[13px] rounded-full outline-none transition-colors duration-150",
              "focus-visible:ring-1 focus-visible:ring-[#6B97FF] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected ? "text-background" : "text-muted-foreground hover:text-foreground"
            )}
            style={{ fontVariationSettings: "'wght' 500" }}
            aria-pressed={selected}
          >
            {selected && (
              <motion.span
                layoutId="primitive-toggle-pill"
                className="absolute inset-0 bg-foreground rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr_1fr] gap-6 items-start py-8 border-t border-border">
      <div className="text-sm" style={{ fontVariationSettings: "'wght' 600" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// Row for single-source components: one demo spanning both primitive columns.
function SingleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr_1fr] gap-6 items-start py-8 border-t border-border">
      <div className="text-sm" style={{ fontVariationSettings: "'wght' 600" }}>
        {label}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

export default function CompareBasesPage() {
  const [heroHovered, setHeroHovered] = useState(false);
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(true);
  const [sliderA, setSliderA] = useState(50);
  const [sliderB, setSliderB] = useState(50);
  const [checkedA, setCheckedA] = useState<Set<number>>(new Set([0, 2]));
  const [checkedB, setCheckedB] = useState<Set<number>>(new Set([0, 2]));
  const [radioA, setRadioA] = useState("a");
  const [radioB, setRadioB] = useState("a");

  // Single-source section state
  const [fruit, setFruit] = useState("");
  const [view, setView] = useState(0);
  const [tabA, setTabA] = useState(0);
  const [tabB, setTabB] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [emailValue, setEmailValue] = useState("");

  const toggle = (set: Set<number>, setSet: (s: Set<number>) => void) => (i: number) => {
    const n = new Set(set);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    setSet(n);
  };

  return (
    <div className="min-h-screen p-12 bg-background text-foreground">
      <section
        className="flex flex-col items-center text-center pt-40 pb-20 mb-8"
        onMouseEnter={() => setHeroHovered(true)}
        onMouseLeave={() => setHeroHovered(false)}
      >
        <h1
          className="text-6xl leading-[1.1] tracking-tight text-foreground"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          Fluid Functionalism
        </h1>
        <p
          className="text-6xl leading-[1.1] tracking-tight text-muted-foreground"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          built on Radix
        </p>
        <motion.p
          className="text-6xl leading-[1.1] tracking-tight text-foreground mb-8"
          style={{ fontVariationSettings: "'wght' 700" }}
          initial={false}
          animate={{
            opacity: heroHovered ? 1 : 0,
            y: heroHovered ? 0 : 24,
          }}
          transition={spring.moderate}
        >
          or Base UI.
        </motion.p>
        <motion.div
          initial={false}
          animate={{
            opacity: heroHovered ? 1 : 0,
            y: heroHovered ? 0 : 24,
          }}
          transition={spring.moderate}
        >
          <PrimitiveToggle />
        </motion.div>
      </section>

      <div className="grid grid-cols-[180px_1fr_1fr] gap-6 items-end pb-2">
        <div />
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Radix
        </div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Base UI
        </div>
      </div>

      <Row label="Button">
        <div className="flex flex-wrap gap-2">
          <RadixButton variant="primary">Primary</RadixButton>
          <RadixButton variant="secondary">Secondary</RadixButton>
          <RadixButton variant="tertiary">Tertiary</RadixButton>
          <RadixButton variant="ghost">Ghost</RadixButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <BaseButton variant="primary">Primary</BaseButton>
          <BaseButton variant="secondary">Secondary</BaseButton>
          <BaseButton variant="tertiary">Tertiary</BaseButton>
          <BaseButton variant="ghost">Ghost</BaseButton>
        </div>
      </Row>

      <Row label="Switch">
        <RadixSwitch label="Notifications" checked={switchA} onToggle={() => setSwitchA(!switchA)} />
        <BaseSwitch label="Notifications" checked={switchB} onToggle={() => setSwitchB(!switchB)} />
      </Row>

      <Row label="Tooltip">
        <RadixTooltip content="A helpful tooltip" side="top">
          <button className="px-4 py-2 bg-foreground text-background text-[13px] rounded-lg">
            Hover me
          </button>
        </RadixTooltip>
        <BaseTooltip content="A helpful tooltip" side="top">
          <button className="px-4 py-2 bg-foreground text-background text-[13px] rounded-lg">
            Hover me
          </button>
        </BaseTooltip>
      </Row>

      <Row label="Accordion">
        <RadixAccordion type="single" defaultValue="a">
          <RadixAccordionItem value="a">
            <RadixAccordionTrigger>What is this?</RadixAccordionTrigger>
            <RadixAccordionContent>A demo accordion.</RadixAccordionContent>
          </RadixAccordionItem>
          <RadixAccordionItem value="b">
            <RadixAccordionTrigger>Another item</RadixAccordionTrigger>
            <RadixAccordionContent>More content here.</RadixAccordionContent>
          </RadixAccordionItem>
        </RadixAccordion>
        <BaseAccordion type="single" defaultValue="a">
          <BaseAccordionItem value="a">
            <BaseAccordionTrigger>What is this?</BaseAccordionTrigger>
            <BaseAccordionContent>A demo accordion.</BaseAccordionContent>
          </BaseAccordionItem>
          <BaseAccordionItem value="b">
            <BaseAccordionTrigger>Another item</BaseAccordionTrigger>
            <BaseAccordionContent>More content here.</BaseAccordionContent>
          </BaseAccordionItem>
        </BaseAccordion>
      </Row>

      <Row label="Dialog">
        <RadixDialog>
          <RadixDialogTrigger asChild>
            <RadixButton variant="secondary">Open dialog</RadixButton>
          </RadixDialogTrigger>
          <RadixDialogContent>
            <RadixDialogHeader>
              <RadixDialogTitle>Radix Dialog</RadixDialogTitle>
              <RadixDialogDescription>
                Spring-based scale + opacity. Animated overlay.
              </RadixDialogDescription>
            </RadixDialogHeader>
          </RadixDialogContent>
        </RadixDialog>
        <BaseDialog>
          <BaseDialogTrigger
            render={<BaseButton variant="secondary">Open dialog</BaseButton>}
          />
          <BaseDialogContent>
            <BaseDialogHeader>
              <BaseDialogTitle>Base Dialog</BaseDialogTitle>
              <BaseDialogDescription>
                Spring-based scale + opacity. Animated overlay.
              </BaseDialogDescription>
            </BaseDialogHeader>
          </BaseDialogContent>
        </BaseDialog>
      </Row>

      <Row label="Tabs">
        <RadixTabs defaultValue="one">
          <RadixTabsList>
            <RadixTabItem value="one" label="One" />
            <RadixTabItem value="two" label="Two" />
            <RadixTabItem value="three" label="Three" />
          </RadixTabsList>
          <RadixTabPanel value="one" className="pt-3 text-sm text-muted-foreground">First panel</RadixTabPanel>
          <RadixTabPanel value="two" className="pt-3 text-sm text-muted-foreground">Second panel</RadixTabPanel>
          <RadixTabPanel value="three" className="pt-3 text-sm text-muted-foreground">Third panel</RadixTabPanel>
        </RadixTabs>
        <BaseTabs defaultValue="one">
          <BaseTabsList>
            <BaseTabItem value="one" label="One" />
            <BaseTabItem value="two" label="Two" />
            <BaseTabItem value="three" label="Three" />
          </BaseTabsList>
          <BaseTabPanel value="one" className="pt-3 text-sm text-muted-foreground">First panel</BaseTabPanel>
          <BaseTabPanel value="two" className="pt-3 text-sm text-muted-foreground">Second panel</BaseTabPanel>
          <BaseTabPanel value="three" className="pt-3 text-sm text-muted-foreground">Third panel</BaseTabPanel>
        </BaseTabs>
      </Row>

      <Row label="Slider">
        <div className="pt-1">
          <RadixSlider value={sliderA} onChange={(v) => setSliderA(v as number)} min={0} max={100} step={1} />
        </div>
        <div className="pt-1">
          <BaseSlider value={sliderB} onChange={(v) => setSliderB(v as number)} min={0} max={100} step={1} />
        </div>
      </Row>

      <Row label="Checkbox Group">
        <RadixCheckboxGroup checkedIndices={checkedA}>
          <RadixCheckboxItem label="Option A" index={0} checked={checkedA.has(0)} onToggle={() => toggle(checkedA, setCheckedA)(0)} />
          <RadixCheckboxItem label="Option B" index={1} checked={checkedA.has(1)} onToggle={() => toggle(checkedA, setCheckedA)(1)} />
          <RadixCheckboxItem label="Option C" index={2} checked={checkedA.has(2)} onToggle={() => toggle(checkedA, setCheckedA)(2)} />
        </RadixCheckboxGroup>
        <BaseCheckboxGroup checkedIndices={checkedB}>
          <BaseCheckboxItem label="Option A" index={0} checked={checkedB.has(0)} onToggle={() => toggle(checkedB, setCheckedB)(0)} />
          <BaseCheckboxItem label="Option B" index={1} checked={checkedB.has(1)} onToggle={() => toggle(checkedB, setCheckedB)(1)} />
          <BaseCheckboxItem label="Option C" index={2} checked={checkedB.has(2)} onToggle={() => toggle(checkedB, setCheckedB)(2)} />
        </BaseCheckboxGroup>
      </Row>

      <Row label="Radio Group">
        <RadixRadioGroup value={radioA} onValueChange={setRadioA}>
          <RadixRadioItem label="Apple" index={0} value="a" />
          <RadixRadioItem label="Banana" index={1} value="b" />
          <RadixRadioItem label="Cherry" index={2} value="c" />
        </RadixRadioGroup>
        <BaseRadioGroup value={radioB} onValueChange={setRadioB}>
          <BaseRadioItem label="Apple" index={0} value="a" />
          <BaseRadioItem label="Banana" index={1} value="b" />
          <BaseRadioItem label="Cherry" index={2} value="c" />
        </BaseRadioGroup>
      </Row>

      <Row label="Scroll Area">
        <RadixScrollArea className="h-48 w-full max-w-[260px] border border-border rounded-xl">
          <ScrollAreaRows />
        </RadixScrollArea>
        <BaseScrollArea className="h-48 w-full max-w-[260px] border border-border rounded-xl">
          <ScrollAreaRows />
        </BaseScrollArea>
      </Row>

      <Row label="Tabs Subtle">
        <RadixTabsSubtle selectedIndex={tabA} onSelect={setTabA}>
          <RadixTabsSubtleItem index={0} label="Overview" />
          <RadixTabsSubtleItem index={1} label="Activity" />
          <RadixTabsSubtleItem index={2} label="Settings" />
        </RadixTabsSubtle>
        <BaseTabsSubtle selectedIndex={tabB} onSelect={setTabB}>
          <BaseTabsSubtleItem index={0} label="Overview" />
          <BaseTabsSubtleItem index={1} label="Activity" />
          <BaseTabsSubtleItem index={2} label="Settings" />
        </BaseTabsSubtle>
      </Row>

      {/* ── Single-source components ─────────────────────────────────── */}
      <section className="pt-24 pb-4">
        <h2
          className="text-2xl tracking-tight text-foreground"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          Built on Base UI
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-[560px]">
          These components ship as a single source sitting on Base UI
          primitives — Select, Menu, Popover, Field, Collapsible — and are
          used as-is under either flavor.
        </p>
      </section>

      <SingleRow label="Select">
        <Select value={fruit} onValueChange={setFruit}>
          <SelectTrigger placeholder="Select a fruit…" />
          <SelectContent>
            <SelectItem index={0} value="apple">Apple</SelectItem>
            <SelectItem index={1} value="banana">Banana</SelectItem>
            <SelectItem index={2} value="cherry">Cherry</SelectItem>
            <SelectItem index={3} value="mango">Mango</SelectItem>
          </SelectContent>
        </Select>
      </SingleRow>

      <SingleRow label="Dropdown Menu">
        <DropdownMenu>
          <DropdownTrigger
            render={<RadixButton variant="secondary">Open menu</RadixButton>}
          />
          <DropdownContent checkedIndex={view}>
            <MenuItem index={0} icon={SquareLibrary} label="Teamspaces" checked={view === 0} onSelect={() => setView(0)} />
            <MenuItem index={1} icon={Clock} label="Recents" checked={view === 1} onSelect={() => setView(1)} />
            <MenuItem index={2} icon={Star} label="Favorites" checked={view === 2} onSelect={() => setView(2)} />
          </DropdownContent>
        </DropdownMenu>
      </SingleRow>

      <SingleRow label="Color Picker">
        <ColorPickerPopover defaultValue="#6B97FF" />
      </SingleRow>

      <SingleRow label="Thinking Steps">
        <ThinkingSteps>
          <ThinkingStepsHeader />
          <ThinkingStepsContent>
            <ThinkingStep icon="search" label="Searched the web" />
            <ThinkingStep icon="globe" label="Read 3 sources" />
          </ThinkingStepsContent>
        </ThinkingSteps>
      </SingleRow>

      <SingleRow label="Input Group">
        <div className="max-w-[360px]">
          <InputGroup>
            <InputField
              index={0}
              label="Search"
              placeholder="Search teamspaces…"
              icon={Search}
              value={searchValue}
              onChange={setSearchValue}
            />
            <InputField
              index={1}
              label="Email"
              placeholder="you@company.com"
              icon={Mail}
              value={emailValue}
              onChange={setEmailValue}
            />
          </InputGroup>
        </div>
      </SingleRow>

      <SingleRow label="Ask User Questions">
        <AskUserQuestions
          questions={[
            {
              title: "How will you use Fluid Functionalism?",
              options: [
                { title: "Design system" },
                { title: "Product UI" },
                { title: "Prototyping" },
              ],
            },
          ]}
        />
      </SingleRow>
    </div>
  );
}

function ScrollAreaRows() {
  return (
    <div className="flex flex-col p-2">
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="px-3 py-2 text-[13px] whitespace-nowrap">
          v1.{19 - i}.0 — maintenance release
        </div>
      ))}
    </div>
  );
}
