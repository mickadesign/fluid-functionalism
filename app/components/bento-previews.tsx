"use client";

import { useState } from "react";
import { useIcon } from "@/lib/icon-context";

import {
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/registry/default/accordion";
import { Badge } from "@/registry/default/badge";
import { Button } from "@/registry/default/button";
import {
  CheckboxGroup,
  CheckboxItem,
} from "@/registry/default/checkbox-group";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/registry/default/dialog";
import { Dropdown } from "@/registry/default/dropdown";
import { MenuItem } from "@/registry/default/menu-item";
import { InputCopy } from "@/registry/default/input-copy";
import { InputGroup, InputField } from "@/registry/default/input-group";
import { RadioGroup, RadioItem } from "@/registry/default/radio-group";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/registry/default/select";
import { Slider, SliderComfortable } from "@/registry/default/slider";
import { Switch } from "@/registry/default/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import { Tabs, TabsList, TabItem } from "@/registry/default/tabs";
import {
  TabsSubtle,
  TabsSubtleItem,
} from "@/registry/default/tabs-subtle";
import { ThinkingIndicator } from "@/registry/default/thinking-indicator";
import {
  ThinkingSteps,
  ThinkingStepsHeader,
  ThinkingStepsContent,
  ThinkingStep,
  ThinkingStepDetails,
  ThinkingStepSources,
  ThinkingStepSource,
} from "@/registry/default/thinking-steps";
import { Tooltip } from "@/registry/default/tooltip";

function AccordionPreview() {
  return (
    <div className="w-full max-w-[420px]">
      <AccordionGroup type="single" defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1" index={0}>
          <AccordionTrigger>What is Fluid Functionalism?</AccordionTrigger>
          <AccordionContent>
            A design philosophy where every animation serves a functional purpose — motion is information, not decoration.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" index={1}>
          <AccordionTrigger>How does proximity hover work?</AccordionTrigger>
          <AccordionContent>
            The closest item to your cursor is highlighted before you click, reducing targeting errors.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" index={2}>
          <AccordionTrigger>Why spring physics?</AccordionTrigger>
          <AccordionContent>
            Springs respond naturally to interruption — if a user reverses mid-transition, the animation adapts.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4" index={3}>
          <AccordionTrigger>Is it compatible with shadcn/ui?</AccordionTrigger>
          <AccordionContent>
            Yes. Your existing theme, radius tokens, and setup apply automatically.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5" index={4}>
          <AccordionTrigger>How do I install a component?</AccordionTrigger>
          <AccordionContent>
            One CLI command — dependencies and shared utilities resolve themselves.
          </AccordionContent>
        </AccordionItem>
      </AccordionGroup>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <Badge variant="dot" color="blue">Published</Badge>
      <Badge variant="dot" color="green">Active</Badge>
      <Badge variant="dot" color="red">Declined</Badge>
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="sm">Primary</Button>
      <Button variant="secondary" size="sm">Secondary</Button>
      <Button variant="tertiary" size="sm">Tertiary</Button>
      <Button variant="ghost" size="sm">Ghost</Button>
    </div>
  );
}

function CheckboxPreview() {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const items = ["Spring physics", "Proximity hover", "Font weight transitions", "Keyboard navigation", "Dark mode support"];
  return (
    <div className="w-full max-w-[220px]">
      <CheckboxGroup checkedIndices={checked}>
        {items.map((label, i) => (
          <CheckboxItem
            key={label}
            index={i}
            label={label}
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
        <Button variant="secondary" size="sm">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Create teamspace</DialogTitle>
          <DialogDescription>
            Add a new teamspace to organize your projects.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DropdownPreview() {
  const CircleIcon = useIcon("circle");
  const StarIcon = useIcon("star");
  const PlusIcon = useIcon("plus");
  const HeartIcon = useIcon("heart");
  const CheckIcon = useIcon("check");
  const BrainIcon = useIcon("brain");
  const [selected, setSelected] = useState<number | null>(0);
  const items = [
    { icon: CircleIcon, label: "Spring animations" },
    { icon: StarIcon, label: "Proximity hover" },
    { icon: PlusIcon, label: "Font weight shifts" },
    { icon: HeartIcon, label: "Accessible by default" },
    { icon: CheckIcon, label: "Radix primitives" },
    { icon: BrainIcon, label: "Functional clarity" },
  ];
  return (
    <div className="w-full max-w-[280px]">
      <Dropdown checkedIndex={selected ?? undefined}>
        {items.map((item, i) => (
          <MenuItem
            key={item.label}
            index={i}
            icon={item.icon}
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
  const Search = useIcon("search");
  const Mail = useIcon("mail");
  const User = useIcon("user");
  const Globe = useIcon("globe");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  return (
    <div className="w-full max-w-[320px]">
      <InputGroup>
        <InputField
          index={0}
          label="Name"
          placeholder="Your name"
          icon={User}
          value={name}
          onChange={setName}
        />
        <InputField
          index={1}
          label="Email"
          placeholder="you@example.com"
          icon={Mail}
          value={email}
          onChange={setEmail}
        />
        <InputField
          index={2}
          label="Website"
          placeholder="fluidfunctionalism.com"
          icon={Globe}
          value={website}
          onChange={setWebsite}
        />
        <InputField
          index={3}
          label="Search"
          placeholder="Search components..."
          icon={Search}
          value={search}
          onChange={setSearch}
        />
      </InputGroup>
    </div>
  );
}

function RadioGroupPreview() {
  const [value, setValue] = useState("moderate");
  return (
    <div className="w-full max-w-[220px]">
      <RadioGroup value={value} onValueChange={setValue}>
        <RadioItem value="fast" index={0} label="Fast spring" />
        <RadioItem value="moderate" index={1} label="Moderate spring" />
        <RadioItem value="slow" index={2} label="Slow spring" />
        <RadioItem value="comfortable" index={3} label="Comfortable" />
        <RadioItem value="none" index={4} label="No animation" />
      </RadioGroup>
    </div>
  );
}

function SelectPreview() {
  const [value, setValue] = useState("Viewer");
  return (
    <div className="w-full max-w-[280px]">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger placeholder="Select role..." variant="bordered" />
        <SelectContent>
          <SelectItem index={0} value="Owner">Owner</SelectItem>
          <SelectItem index={1} value="Editor">Editor</SelectItem>
          <SelectItem index={2} value="Viewer">Viewer</SelectItem>
          <SelectItem index={3} value="Guest">Guest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderPreview() {
  const [basic, setBasic] = useState(35);
  const [volume, setVolume] = useState(60);
  return (
    <div className="flex flex-col gap-8 w-full max-w-[280px]">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">Opacity</span>
          <span className="text-muted-foreground tabular-nums">{basic}</span>
        </div>
        <Slider value={basic} onChange={(v) => setBasic(v as number)} showValue={false} />
      </div>
      <SliderComfortable
        variant="scrubber"
        label="Volume"
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
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Switch label="Notifications" checked={a} onToggle={() => setA(!a)} />
      <Switch label="Sound effects" checked={b} onToggle={() => setB(!b)} />
    </div>
  );
}

function TablePreview() {
  return (
    <div className="w-full max-w-[420px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow index={0}>
            <TableCell>Alice</TableCell>
            <TableCell>Engineer</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow index={1}>
            <TableCell>Bob</TableCell>
            <TableCell>Designer</TableCell>
            <TableCell>Away</TableCell>
          </TableRow>
          <TableRow index={2}>
            <TableCell>Carol</TableCell>
            <TableCell>PM</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
          <TableRow index={3}>
            <TableCell>Dan</TableCell>
            <TableCell>Engineer</TableCell>
            <TableCell>Offline</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function TabsPreview() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="w-full max-w-[360px]">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabItem value="overview" label="Overview" />
          <TabItem value="analytics" label="Analytics" />
          <TabItem value="settings" label="Settings" />
          <TabItem value="logs" label="Logs" />
        </TabsList>
      </Tabs>
    </div>
  );
}

function TabsSubtlePreview() {
  const SquareLibrary = useIcon("square-library");
  const Clock = useIcon("clock");
  const Star = useIcon("star");
  const [tab, setTab] = useState(0);
  const items = [
    { icon: SquareLibrary, label: "Library" },
    { icon: Clock, label: "Recents" },
    { icon: Star, label: "Favorites" },
  ];
  return (
    <div className="w-full max-w-[360px]">
      <TabsSubtle idPrefix="bento-tabs" selectedIndex={tab} onSelect={setTab} aria-label="Navigation">
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

function ThinkingStepsPreview() {
  return (
    <div className="w-full max-w-[380px]">
      <ThinkingSteps defaultOpen>
        <ThinkingStepsHeader>Research Agent</ThinkingStepsHeader>
        <ThinkingStepsContent>
          <ThinkingStep status="complete" index={0} icon="search" label="Searching profiles">
            <ThinkingStepSources>
              <ThinkingStepSource>x.com</ThinkingStepSource>
              <ThinkingStepSource>github.com</ThinkingStepSource>
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep status="complete" index={1} icon="globe" label="Reading portfolio">
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
          <ThinkingStep status="complete" index={2} icon="search" label="Searching recent work">
            <ThinkingStepSources>
              <ThinkingStepSource>figma.com</ThinkingStepSource>
              <ThinkingStepSource>behance.net</ThinkingStepSource>
            </ThinkingStepSources>
          </ThinkingStep>
          <ThinkingStep status="active" index={3} icon="brain" label="Analyzing results"
            description="Compiling findings into a summary." isLast />
        </ThinkingStepsContent>
      </ThinkingSteps>
    </div>
  );
}

function TooltipPreview() {
  return (
    <div className="relative z-10">
      <Tooltip content="Copy to clipboard">
        <Button variant="secondary" size="sm">Hover me</Button>
      </Tooltip>
    </div>
  );
}

export const previewMap: Record<string, React.FC> = {
  accordion: AccordionPreview,
  badge: BadgePreview,
  button: ButtonPreview,
  "checkbox-group": CheckboxPreview,
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
