"use client";

import { useState } from "react";
import { useIcon, useIcons } from "@/lib/icon-context";
import {
  ACCORDION_ITEMS,
  BADGE_ITEMS,
  BUTTON_ITEMS,
  CHECKBOX_ITEMS,
  DIALOG_COPY,
  DROPDOWN_ITEMS,
  INPUT_FIELDS,
  RADIO_DEFAULT,
  RADIO_ITEMS,
  SELECT_DEFAULT,
  SELECT_PLACEHOLDER,
  SELECT_ROLES,
  SLIDER_OPACITY,
  SLIDER_VOLUME,
  SWITCH_ITEMS,
  TABLE_COLUMNS,
  TABLE_ROWS,
  TABS_DEFAULT,
  TABS_ITEMS,
  TOOLTIP_COPY,
} from "@/app/components/demo-data";

import {
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/radix/accordion";
import { Badge } from "@/registry/default/badge";
import { Button } from "@/registry/radix/button";
import {
  CheckboxGroup,
  CheckboxItem,
} from "@/registry/radix/checkbox-group";
import { ColorPicker, ColorPickerPortalContainer } from "@/registry/default/color-picker";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/registry/radix/dialog";
import { Dropdown } from "@/components/flavored/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { InputCopy } from "@/registry/default/input-copy";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { RadioGroup, RadioItem } from "@/registry/radix/radio-group";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/flavored/select";
import { Slider, SliderComfortable } from "@/registry/radix/slider";
import { Switch } from "@/registry/radix/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import { Tabs, TabsList, TabItem } from "@/registry/radix/tabs";
import {
  TabsSubtle,
  TabsSubtleItem,
} from "@/components/flavored/tabs-subtle";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepDetails,
  ThinkingStepSources,
  ThinkingStepSource,
} from "@/components/flavored/thinking-steps";
import { Tooltip } from "@/registry/radix/tooltip";
import {
  AskUserQuestions,
  type AskUserQuestion,
} from "@/registry/default/ask-user-questions";

function AccordionPreview() {
  return (
    <div className="w-full max-w-[420px]">
      <AccordionGroup type="single" defaultValue="item-1" className="w-full">
        {ACCORDION_ITEMS.map((item, i) => (
          <AccordionItem key={item.value} value={item.value} index={i}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </AccordionGroup>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {BADGE_ITEMS.map((item) => (
        <Badge key={item.label} variant="dot" color={item.color}>
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.variant} size="sm">
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function CheckboxPreview() {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <div className="w-full max-w-[220px]">
      <CheckboxGroup checkedIndices={checked}>
        {CHECKBOX_ITEMS.map((item, i) => (
          <CheckboxItem
            key={item.id}
            index={i}
            label={item.label}
            checked={checked.has(i)}
            onToggle={() => {
              setChecked((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              });
            }}
          />
        ))}
      </CheckboxGroup>
    </div>
  );
}

function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">{DIALOG_COPY.trigger}</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{DIALOG_COPY.title}</DialogTitle>
          <DialogDescription>{DIALOG_COPY.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{DIALOG_COPY.cancel}</Button>
          </DialogClose>
          <Button>{DIALOG_COPY.confirm}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DropdownPreview() {
  const icons = useIcons();
  const [selected, setSelected] = useState<number | null>(0);
  return (
    <div className="w-full max-w-[280px]">
      <Dropdown checkedIndex={selected ?? undefined}>
        {DROPDOWN_ITEMS.map((item, i) => (
          <MenuItem
            key={item.value}
            index={i}
            icon={icons[item.icon]}
            label={item.label}
            checked={selected === i}
            onSelect={() => setSelected(selected === i ? null : i)}
          />
        ))}
      </Dropdown>
    </div>
  );
}

function InputCopyPreview() {
  return (
    <div className="w-full max-w-[420px] relative z-10">
      <InputCopy value="npx shadcn@latest registry add @fluid" />
    </div>
  );
}

function InputGroupPreview() {
  const icons = useIcons();
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div className="w-full max-w-[320px]">
      <InputGroup>
        {INPUT_FIELDS.map((field, i) => (
          <InputField
            key={field.key}
            index={i}
            label={field.label}
            placeholder={field.placeholder}
            icon={icons[field.icon]}
            value={values[field.key] ?? ""}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        ))}
      </InputGroup>
    </div>
  );
}

function RadioGroupPreview() {
  const [value, setValue] = useState<string>(RADIO_DEFAULT);
  return (
    <div className="w-full max-w-[220px]">
      <RadioGroup value={value} onValueChange={setValue}>
        {RADIO_ITEMS.map((item, i) => (
          <RadioItem key={item.value} value={item.value} index={i} label={item.label} />
        ))}
      </RadioGroup>
    </div>
  );
}

function SelectPreview() {
  const [value, setValue] = useState<string>(SELECT_DEFAULT);
  return (
    <div className="w-full max-w-[280px]">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger placeholder={SELECT_PLACEHOLDER} variant="bordered" />
        <SelectContent>
          {SELECT_ROLES.map((role, i) => (
            <SelectItem key={role} index={i} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderPreview() {
  const [basic, setBasic] = useState<number>(SLIDER_OPACITY.initial);
  const [volume, setVolume] = useState<number>(SLIDER_VOLUME.initial);
  return (
    <div className="flex flex-col gap-8 w-full max-w-[280px]">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">{SLIDER_OPACITY.label}</span>
          <span className="text-muted-foreground tabular-nums">{basic}</span>
        </div>
        <Slider value={basic} onChange={(v) => setBasic(v as number)} showValue={false} />
      </div>
      <SliderComfortable
        variant="scrubber"
        label={SLIDER_VOLUME.label}
        value={volume}
        onChange={setVolume}
        min={0}
        max={100}
        formatValue={(v) => `${v}%`}
      />
    </div>
  );
}

function SwitchPreview() {
  const [on, setOn] = useState<Set<string>>(
    () => new Set(SWITCH_ITEMS.filter((item) => item.initial).map((item) => item.id))
  );
  return (
    <div className="flex flex-col gap-3">
      {SWITCH_ITEMS.map((item) => (
        <Switch
          key={item.id}
          label={item.label}
          checked={on.has(item.id)}
          onToggle={() =>
            setOn((prev) => {
              const next = new Set(prev);
              if (next.has(item.id)) next.delete(item.id);
              else next.add(item.id);
              return next;
            })
          }
        />
      ))}
    </div>
  );
}

function TablePreview() {
  return (
    <div className="w-full max-w-[420px]">
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_COLUMNS.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {TABLE_ROWS.map((row, i) => (
            <TableRow key={row[0]} index={i}>
              {row.map((cell) => (
                <TableCell key={cell}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TabsPreview() {
  const [tab, setTab] = useState<string>(TABS_DEFAULT);
  return (
    <div className="w-full max-w-[360px]">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS_ITEMS.map((item) => (
            <TabItem key={item.value} value={item.value} label={item.label} />
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function TabsSubtlePreview() {
  const Home = useIcon("home");
  const MessageCircle = useIcon("message-circle");
  const Inbox = useIcon("inbox");
  const [tab, setTab] = useState(0);
  const items = [
    { icon: Home, label: "Home" },
    { icon: MessageCircle, label: "Chat" },
    { icon: Inbox, label: "Inbox" },
  ];
  return (
    <div className="w-fit mx-auto">
      <TabsSubtle idPrefix="bento-tabs" selectedIndex={tab} onSelect={setTab} activeLabel aria-label="Navigation">
        {items.map((item, i) => (
          <TabsSubtleItem key={item.label} index={i} icon={item.icon} label={item.label} />
        ))}
      </TabsSubtle>
    </div>
  );
}

function ThinkingIndicatorPreview() {
  return <ThinkingIndicator />;
}

// Same eight questions as the docs page's first "Example" section, so the
// home-page bento card and demo slide stay in sync with the canonical demo
// the docs link to.
const askUserExampleQuestions: AskUserQuestion[] = [
  {
    id: "role",
    title: "How do you plan to use Fluid Functionalism?",
    options: [
      { id: "design", title: "Designer", description: "Prototyping flows and pages" },
      { id: "eng", title: "Engineer", description: "Shipping production UI" },
      { id: "pm", title: "PM", description: "Aligning the team on patterns" },
      { id: "founder", title: "Founder", description: "Bootstrapping a product" },
    ],
  },
  {
    id: "shape",
    title: "Which shape language fits your brand?",
    options: [
      { id: "rounded", title: "Rounded", description: "Soft, familiar corners" },
      { id: "pill", title: "Pill", description: "Fully rounded, friendly" },
    ],
  },
  {
    id: "components",
    title: "Which components are you reaching for first?",
    multiSelect: true,
    options: [
      { id: "input", title: "InputMessage", description: "Chat-style composer with attachments" },
      { id: "thinking", title: "ThinkingSteps", description: "Streamed reasoning steps" },
      { id: "ask", title: "AskUserQuestions", description: "Stepped question flows" },
      { id: "tabs", title: "TabsSubtle", description: "Quiet segmented tabs" },
      { id: "nav", title: "NavMenu", description: "Sidebar navigation" },
    ],
    nextLabel: "Continue",
  },
  {
    id: "drew",
    title: "What drew you to Fluid Functionalism?",
    options: [
      { id: "motion", title: "Motion", description: "Springs that feel alive" },
      { id: "craft", title: "Craft", description: "Pixel-level polish" },
      { id: "tokens", title: "Tokens", description: "Shape and elevation systems" },
    ],
    allowOther: true,
    otherPlaceholder: "Something else?",
  },
  {
    id: "frameworks",
    title: "Where will you ship these components?",
    multiSelect: true,
    options: [
      { id: "next", title: "Next.js", description: "App Router projects" },
      { id: "remix", title: "Remix", description: "Full-stack apps" },
      { id: "vite", title: "Vite + React", description: "SPAs and dashboards" },
      { id: "astro", title: "Astro", description: "Content-first sites" },
    ],
  },
  {
    id: "themes",
    title: "Which theme mode do you support?",
    options: [
      { id: "light", title: "Light only" },
      { id: "dark", title: "Dark only" },
      { id: "system", title: "System-aware" },
      { id: "toggle", title: "User toggle" },
    ],
  },
  {
    id: "missing",
    title: "What's missing from the registry today?",
    multiSelect: true,
    options: [
      { id: "data", title: "Data table", description: "Sortable, filterable rows" },
      { id: "calendar", title: "Calendar", description: "Date picker and range" },
      { id: "command", title: "Command menu", description: "Fast keyboard launcher" },
    ],
    allowOther: true,
    otherPlaceholder: "Tell us what to build next…",
    nextLabel: "Send feedback",
  },
  {
    id: "recommend",
    title: "Would you recommend Fluid Functionalism to a teammate?",
    skippable: false,
    options: [
      { id: "yes", title: "Yes", description: "Already have" },
      { id: "soon", title: "Soon", description: "Once it covers more ground" },
      { id: "unsure", title: "Not sure yet", description: "Still evaluating" },
    ],
  },
];

function AskUserQuestionsPreview() {
  // self-end overrides the BentoCard's `items-center` so the AskUserQuestions
  // card sits flush with the bottom of the preview area — its content height
  // changes per question (taller multi-select vs short single-select), so
  // anchoring the bottom keeps the footer button + chip column in the same
  // spot instead of drifting up and down as the user navigates.
  return (
    <div className="w-full max-w-[420px] self-end">
      <AskUserQuestions questions={askUserExampleQuestions} />
    </div>
  );
}

function ThinkingStepsPreview() {
  return (
    <div className="w-full max-w-[380px]">
      <ThinkingSteps defaultOpen>
        <ThinkingStepsHeader>Research Agent</ThinkingStepsHeader>
        <ThinkingStepsContent>
          <ThinkingStep status="complete" icon="search" label="Searching profiles">
            <ThinkingStepSources>
              <ThinkingStepSource>x.com</ThinkingStepSource>
              <ThinkingStepSource>github.com</ThinkingStepSource>
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep status="complete" icon="globe" label="Reading portfolio">
            <ThinkingStepDetails
              summary="Explored 4 pages"
              details={[
                "Read about.html",
                "Read projects.html",
                "Read resume.pdf",
                "Read contact.html",
              ]}
            />
          </ThinkingStep>
          <ThinkingStep status="complete" icon="search" label="Searching recent work">
            <ThinkingStepSources>
              <ThinkingStepSource>figma.com</ThinkingStepSource>
              <ThinkingStepSource>behance.net</ThinkingStepSource>
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep status="active" icon="brain" label="Analyzing results"
            description="Compiling findings into a summary." isLast />
        </ThinkingStepsContent>
      </ThinkingSteps>
    </div>
  );
}

function TooltipPreview() {
  return (
    <div className="relative z-10">
      <Tooltip content={TOOLTIP_COPY.content}>
        <Button variant="secondary" size="sm">{TOOLTIP_COPY.trigger}</Button>
      </Tooltip>
    </div>
  );
}

function ColorPickerPreview() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  // `relative` is load-bearing: the FormatDropdown (HEX/RGB/HSL/OKLCH) portals
  // INTO this wrapper and uses absolute positioning computed against the
  // wrapper's bounding rect. Without `relative`, the menu's absolute coords
  // resolve against the next positioned ancestor (the BentoCard's `.relative`
  // outer wrapper), so the dropdown lands far to the left of the picker.
  return (
    <div ref={setContainer} className="relative w-full max-w-[280px]">
      <ColorPickerPortalContainer value={container}>
        <ColorPicker defaultValue="#6B97FF" />
      </ColorPickerPortalContainer>
    </div>
  );
}

export const previewMap: Record<string, React.FC> = {
  accordion: AccordionPreview,
  "ask-user-questions": AskUserQuestionsPreview,
  badge: BadgePreview,
  button: ButtonPreview,
  "checkbox-group": CheckboxPreview,
  "color-picker": ColorPickerPreview,
  dialog: DialogPreview,
  dropdown: DropdownPreview,
  "input-copy": InputCopyPreview,
  "input-group": InputGroupPreview,
  "radio-group": RadioGroupPreview,
  select: SelectPreview,
  slider: SliderPreview,
  switch: SwitchPreview,
  table: TablePreview,
  tabs: TabsPreview,
  "tabs-subtle": TabsSubtlePreview,
  "thinking-indicator": ThinkingIndicatorPreview,
  "thinking-steps": ThinkingStepsPreview,
  tooltip: TooltipPreview,
};
