"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/shadcn/accordion";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "@/components/shadcn/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/shadcn/select";
import { Slider } from "@/components/shadcn/slider";
import { Switch } from "@/components/shadcn/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/shadcn/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/shadcn/tooltip";
import { Circle, Star, Plus, Heart, Check, Brain } from "lucide-react";

function AccordionPreview() {
  return (
    <div className="w-full max-w-[420px] mx-auto text-[13px]">
      <Accordion type="single" defaultValue="item-1" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="py-2">What is Fluid Functionalism?</AccordionTrigger>
          <AccordionContent className="text-[13px] pt-1 pb-3">
            A design philosophy where every animation serves a functional purpose — motion is information, not decoration.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="py-2">How does proximity hover work?</AccordionTrigger>
          <AccordionContent className="text-[13px] pt-1 pb-3">
            The closest item to your cursor is highlighted before you click, reducing targeting errors.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger className="py-2">Why spring physics?</AccordionTrigger>
          <AccordionContent className="text-[13px] pt-1 pb-3">
            Springs respond naturally to interruption — if a user reverses mid-transition, the animation adapts.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger className="py-2">Is it compatible with shadcn/ui?</AccordionTrigger>
          <AccordionContent className="text-[13px] pt-1 pb-3">
            Yes. Your existing theme, radius tokens, and setup apply automatically.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-5">
          <AccordionTrigger className="py-2">How do I install a component?</AccordionTrigger>
          <AccordionContent className="text-[13px] pt-1 pb-3">
            One CLI command — dependencies and shared utilities resolve themselves.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-1.5 items-center justify-center">
      <Badge>Published</Badge>
      <Badge variant="secondary">Active</Badge>
      <Badge variant="destructive">Declined</Badge>
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button size="sm">Primary</Button>
      <Button variant="secondary" size="sm">Secondary</Button>
      <Button variant="outline" size="sm">Tertiary</Button>
      <Button variant="ghost" size="sm">Ghost</Button>
    </div>
  );
}

function CheckboxPreview() {
  const items = [
    { id: "spring", label: "Spring physics" },
    { id: "proximity", label: "Proximity hover" },
    { id: "weight", label: "Font weight transitions" },
    { id: "kbd", label: "Keyboard navigation" },
    { id: "dark", label: "Dark mode support" },
  ];
  const [checked, setChecked] = useState<Set<string>>(new Set());
  return (
    <div className="w-full max-w-[220px] mx-auto space-y-2.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox
            id={`shadcn-cb-${item.id}`}
            checked={checked.has(item.id)}
            onCheckedChange={(v) => {
              setChecked((prev) => {
                const next = new Set(prev);
                if (v) next.add(item.id);
                else next.delete(item.id);
                return next;
              });
            }}
          />
          <Label htmlFor={`shadcn-cb-${item.id}`} className="text-sm">
            {item.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

function DialogPreview() {
  return (
    <div className="flex justify-center">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="shadcn-theme">
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
    </div>
  );
}

/**
 * Static-open dropdown markup — replicates shadcn's DropdownMenu open state
 * inline (no Portal) so it stays inside the .shadcn-theme scope and visibly
 * compares to the always-visible Fluid Functionalism dropdown.
 */
function DropdownPreview() {
  const [value, setValue] = useState("spring");
  const items = [
    { value: "spring", label: "Spring animations", icon: Circle },
    { value: "proximity", label: "Proximity hover", icon: Star },
    { value: "weight", label: "Font weight shifts", icon: Plus },
    { value: "a11y", label: "Accessible by default", icon: Heart },
    { value: "radix", label: "Radix primitives", icon: Check },
    { value: "clarity", label: "Functional clarity", icon: Brain },
  ];
  return (
    <div
      role="menu"
      className="mx-auto w-fit rounded-md border bg-popover p-1 text-popover-foreground shadow-md min-w-[14rem]"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            role="menuitemradio"
            aria-checked={selected}
            onClick={() => setValue(item.value)}
            className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-2 pl-8 pr-2 text-[13px] outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              {selected && <Check className="h-3.5 w-3.5" />}
            </span>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function InputGroupPreview() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  return (
    <div className="w-full max-w-[320px] mx-auto space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="shadcn-name" className="text-xs">Name</Label>
        <Input
          id="shadcn-name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="shadcn-email" className="text-xs">Email</Label>
        <Input
          id="shadcn-email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="shadcn-website" className="text-xs">Website</Label>
        <Input
          id="shadcn-website"
          placeholder="fluidfunctionalism.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
    </div>
  );
}

function RadioGroupPreview() {
  const [value, setValue] = useState("moderate");
  const items = [
    { value: "fast", label: "Fast spring" },
    { value: "moderate", label: "Moderate spring" },
    { value: "slow", label: "Slow spring" },
    { value: "comfortable", label: "Comfortable" },
    { value: "none", label: "No animation" },
  ];
  return (
    <div className="w-full max-w-[220px] mx-auto">
      <RadioGroup value={value} onValueChange={setValue}>
        {items.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <RadioGroupItem value={item.value} id={`shadcn-rg-${item.value}`} />
            <Label htmlFor={`shadcn-rg-${item.value}`} className="text-sm">
              {item.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function SelectPreview() {
  const [value, setValue] = useState("Viewer");
  return (
    <div className="w-full max-w-[280px] mx-auto">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select role..." />
        </SelectTrigger>
        <SelectContent className="shadcn-theme">
          <SelectItem value="Owner">Owner</SelectItem>
          <SelectItem value="Editor">Editor</SelectItem>
          <SelectItem value="Viewer">Viewer</SelectItem>
          <SelectItem value="Guest">Guest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderPreview() {
  const [basic, setBasic] = useState([35]);
  const [volume, setVolume] = useState([60]);
  return (
    <div className="flex flex-col gap-8 w-full max-w-[280px] mx-auto">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">Opacity</span>
          <span className="text-muted-foreground tabular-nums">{basic[0]}</span>
        </div>
        <Slider value={basic} onValueChange={setBasic} max={100} step={1} />
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">Volume</span>
          <span className="text-muted-foreground tabular-nums">{volume[0]}%</span>
        </div>
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
      </div>
    </div>
  );
}

function SwitchPreview() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="flex flex-col gap-3 w-fit mx-auto">
      <div className="flex items-center gap-2">
        <Switch id="shadcn-sw-a" checked={a} onCheckedChange={setA} />
        <Label htmlFor="shadcn-sw-a" className="text-sm">Notifications</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="shadcn-sw-b" checked={b} onCheckedChange={setB} />
        <Label htmlFor="shadcn-sw-b" className="text-sm">Sound effects</Label>
      </div>
    </div>
  );
}

function TablePreview() {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-auto px-3 py-2">Name</TableHead>
            <TableHead className="h-auto px-3 py-2">Role</TableHead>
            <TableHead className="h-auto px-3 py-2">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="p-0 px-3 py-2">Alice</TableCell>
            <TableCell className="p-0 px-3 py-2">Engineer</TableCell>
            <TableCell className="p-0 px-3 py-2">Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="p-0 px-3 py-2">Bob</TableCell>
            <TableCell className="p-0 px-3 py-2">Designer</TableCell>
            <TableCell className="p-0 px-3 py-2">Away</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="p-0 px-3 py-2">Carol</TableCell>
            <TableCell className="p-0 px-3 py-2">PM</TableCell>
            <TableCell className="p-0 px-3 py-2">Active</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="p-0 px-3 py-2">Dan</TableCell>
            <TableCell className="p-0 px-3 py-2">Engineer</TableCell>
            <TableCell className="p-0 px-3 py-2">Offline</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function TabsPreview() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="w-full max-w-[360px] mx-auto flex justify-center">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

function TabsSubtlePreview() {
  const [tab, setTab] = useState("library");
  return (
    <div className="w-full max-w-[360px] mx-auto flex justify-center">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="recents">Recents</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

function TooltipPreview() {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative z-10 flex justify-center">
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="secondary">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent className="shadcn-theme">Copy to clipboard</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const shadcnPreviewMap: Record<string, React.FC> = {
  accordion: AccordionPreview,
  badge: BadgePreview,
  button: ButtonPreview,
  "checkbox-group": CheckboxPreview,
  dialog: DialogPreview,
  dropdown: DropdownPreview,
  "input-group": InputGroupPreview,
  "radio-group": RadioGroupPreview,
  select: SelectPreview,
  slider: SliderPreview,
  switch: SwitchPreview,
  table: TablePreview,
  tabs: TabsPreview,
  "tabs-subtle": TabsSubtlePreview,
  tooltip: TooltipPreview,
};
