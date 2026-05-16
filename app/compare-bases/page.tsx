"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Button as RadixButton } from "@/registry/radix/button";
import { Button as BaseButton } from "@/registry/base/button";

import { Switch as RadixSwitch } from "@/registry/radix/switch";
import { Switch as BaseSwitch } from "@/registry/base/switch";

import { Tooltip as RadixTooltip } from "@/registry/radix/tooltip";
import { Tooltip as BaseTooltip } from "@/registry/base/tooltip";

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

export default function CompareBasesPage() {
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(true);
  const [sliderA, setSliderA] = useState(50);
  const [sliderB, setSliderB] = useState(50);
  const [checkedA, setCheckedA] = useState<Set<number>>(new Set([0, 2]));
  const [checkedB, setCheckedB] = useState<Set<number>>(new Set([0, 2]));
  const [radioA, setRadioA] = useState("a");
  const [radioB, setRadioB] = useState("a");

  const toggle = (set: Set<number>, setSet: (s: Set<number>) => void) => (i: number) => {
    const n = new Set(set);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    setSet(n);
  };

  return (
    <div className="min-h-screen p-12 bg-background">
      <h1 className="text-2xl mb-2" style={{ fontVariationSettings: "'wght' 700" }}>
        /compare-bases
      </h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-2xl">
        Side-by-side Radix (left) vs Base UI (right) for all 9 primitive-touching
        components. Visual parity check — interact with each, both columns should
        feel identical.
      </p>

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
    </div>
  );
}
