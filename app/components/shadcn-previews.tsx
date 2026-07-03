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
import {
  Circle,
  Star,
  Plus,
  Heart,
  Check,
  Brain,
  type LucideIcon,
} from "lucide-react";
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

function AccordionPreview() {
  return (
    <div className="w-full max-w-[420px] mx-auto text-[13px]">
      <Accordion type="single" defaultValue="item-1" collapsible className="w-full">
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger className="py-2">{item.title}</AccordionTrigger>
            <AccordionContent className="text-[13px] pt-1 pb-3">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-1.5 items-center justify-center">
      {BADGE_ITEMS.map((item) => (
        <Badge key={item.label} variant={item.shadcnVariant}>
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {BUTTON_ITEMS.map((item) => (
        <Button key={item.label} variant={item.shadcnVariant} size="sm">
          {item.label}
        </Button>
      ))}
    </div>
  );
}

function CheckboxPreview() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  return (
    <div className="w-full max-w-[220px] mx-auto space-y-2.5">
      {CHECKBOX_ITEMS.map((item) => (
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
          <Button variant="secondary">{DIALOG_COPY.trigger}</Button>
        </DialogTrigger>
        <DialogContent className="shadcn-theme">
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
    </div>
  );
}

/**
 * Static-open dropdown markup — replicates shadcn's DropdownMenu open state
 * inline (no Portal) so it stays inside the .shadcn-theme scope and visibly
 * compares to the always-visible Fluid Functionalism dropdown.
 */
const dropdownLucideIcons: Record<string, LucideIcon> = {
  circle: Circle,
  star: Star,
  plus: Plus,
  heart: Heart,
  check: Check,
  brain: Brain,
};

function DropdownPreview() {
  const [value, setValue] = useState<string>(DROPDOWN_ITEMS[0].value);
  return (
    <div
      role="menu"
      className="mx-auto w-fit rounded-md border bg-popover p-1 text-popover-foreground shadow-md min-w-[14rem]"
    >
      {DROPDOWN_ITEMS.map((item) => {
        const Icon = dropdownLucideIcons[item.icon];
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
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div className="w-full max-w-[320px] mx-auto space-y-3">
      {INPUT_FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={`shadcn-${field.key}`} className="text-xs">
            {field.label}
          </Label>
          <Input
            id={`shadcn-${field.key}`}
            placeholder={field.placeholder}
            value={values[field.key] ?? ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
            }
          />
        </div>
      ))}
    </div>
  );
}

function RadioGroupPreview() {
  const [value, setValue] = useState<string>(RADIO_DEFAULT);
  return (
    <div className="w-full max-w-[220px] mx-auto">
      <RadioGroup value={value} onValueChange={setValue}>
        {RADIO_ITEMS.map((item) => (
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
  const [value, setValue] = useState<string>(SELECT_DEFAULT);
  return (
    <div className="w-full max-w-[280px] mx-auto">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder={SELECT_PLACEHOLDER} />
        </SelectTrigger>
        <SelectContent className="shadcn-theme">
          {SELECT_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderPreview() {
  const [basic, setBasic] = useState<number[]>([SLIDER_OPACITY.initial]);
  const [volume, setVolume] = useState<number[]>([SLIDER_VOLUME.initial]);
  return (
    <div className="flex flex-col gap-8 w-full max-w-[280px] mx-auto">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">{SLIDER_OPACITY.label}</span>
          <span className="text-muted-foreground tabular-nums">{basic[0]}</span>
        </div>
        <Slider value={basic} onValueChange={setBasic} max={100} step={1} />
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">{SLIDER_VOLUME.label}</span>
          <span className="text-muted-foreground tabular-nums">{volume[0]}%</span>
        </div>
        <Slider value={volume} onValueChange={setVolume} max={100} step={1} />
      </div>
    </div>
  );
}

function SwitchPreview() {
  const [on, setOn] = useState<Set<string>>(
    () => new Set(SWITCH_ITEMS.filter((item) => item.initial).map((item) => item.id))
  );
  return (
    <div className="flex flex-col gap-3 w-fit mx-auto">
      {SWITCH_ITEMS.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Switch
            id={`shadcn-sw-${item.id}`}
            checked={on.has(item.id)}
            onCheckedChange={(v) => {
              setOn((prev) => {
                const next = new Set(prev);
                if (v) next.add(item.id);
                else next.delete(item.id);
                return next;
              });
            }}
          />
          <Label htmlFor={`shadcn-sw-${item.id}`} className="text-sm">
            {item.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

function TablePreview() {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {TABLE_COLUMNS.map((col) => (
              <TableHead key={col} className="h-auto px-3 py-2">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {TABLE_ROWS.map((row) => (
            <TableRow key={row[0]}>
              {row.map((cell) => (
                <TableCell key={cell} className="p-0 px-3 py-2">
                  {cell}
                </TableCell>
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
    <div className="w-full max-w-[360px] mx-auto flex justify-center">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS_ITEMS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
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
            <Button variant="secondary">{TOOLTIP_COPY.trigger}</Button>
          </TooltipTrigger>
          <TooltipContent className="shadcn-theme">
            {TOOLTIP_COPY.content}
          </TooltipContent>
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
