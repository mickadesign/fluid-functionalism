"use client";

import { useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { slideVariants, useSlideDirection } from "@/lib/docs/slide-direction";
import { CarouselDots } from "@/registry/default/carousel-dots";
import Image from "next/image";
import { useIcon, useIcons } from "@/lib/icon-context";
import { fontWeights } from "@/lib/font-weight";
import { useNarrowFrame } from "@/lib/use-narrow-frame";
import { SizeProvider } from "@/lib/size-context";
import { ChatMessage } from "@/registry/default/chat-message";
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
  SIDEBAR_THREADS,
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
  Card,
  CardGroup,
  CardHeader,
  CardTitle,
  CardMedia,
} from "@/registry/default/card";
import { InputMessage } from "@/registry/default/input-message";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarHeader,
  SidebarFooter,
  SidebarInput,
  SidebarInset,
} from "@/components/flavored/sidebar";
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
import {
  Combobox,
  ComboboxChips,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  type ComboboxItemData,
} from "@/components/flavored/combobox";
import {
  COMBOBOX_COMPONENTS,
  COMBOBOX_COPY,
  COMBOBOX_DEFAULT_VALUES,
} from "@/lib/preset/combobox-options";
import {
  CommandMenu,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuEmpty,
} from "@/registry/default/command-menu";
import {
  COMMAND_MENU_COPY,
  COMMAND_MENU_SUGGESTIONS,
  useCommandMenuItems,
} from "@/lib/docs/command-menu-items";
import { Elevated } from "@/lib/elevated";
import { BentoTileContext } from "@/app/components/bento-card";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import { Slider } from "@/registry/radix/slider";
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

function InputMessagePreview() {
  const [value, setValue] = useState("");
  return (
    <div className="w-full max-w-[440px]">
      <InputMessage
        value={value}
        onValueChange={setValue}
        onSend={() => setValue("")}
        placeholderSuggestion="Why is every other input box so stiff?"
      />
    </div>
  );
}

function CardPreview() {
  const Circle = useIcon("circle");
  const Shield = useIcon("shield");
  const Palette = useIcon("palette");
  const Search = useIcon("search");
  const items = [
    { icon: Circle, title: "Fluid motion" },
    { icon: Shield, title: "Accessible" },
    { icon: Palette, title: "Yours to theme" },
    { icon: Search, title: "Fluid hover" },
  ];
  // A medium tile: 4 compact inline rows (icon and title) under one fluid
  // hover, divided by hairlines. The descriptions stay on the docs page:
  // with them the 4 rows outgrow the tile's stage.
  return (
    <div className="w-full max-w-[520px]">
      <CardGroup orientation="inline" fluidHover>
        {items.map((item) => (
          <Card
            key={item.title}
            label={item.title}
            size="compact"
            // 4 rows must share a 300px tile row with the stage padding and
            // the footer: 52px rows instead of the compact row's 60px minimum.
            className="min-h-[52px] py-1.5"
            onClick={() => {}}
          >
            <CardMedia icon={item.icon} />
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </CardGroup>
    </div>
  );
}

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

const CAROUSEL_SLIDES = ["Inbox", "Drafts", "Sent", "Archive"];

/** A small carousel on the dots' built-in autoplay: the current pill fills,
 *  then the next slide comes in from the right. A dot picked by hand slides
 *  the label from its side. Hover the slide to pause. */
function CarouselDotsPreview() {
  const { slide, direction, onValueChange, markByHand } = useSlideDirection();
  const [hovering, setHovering] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid h-16 w-48 place-items-center overflow-hidden rounded-xl border border-border/60 bg-background"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={slide}
            className="col-start-1 row-start-1 text-body text-foreground"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {CAROUSEL_SLIDES[slide]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div {...markByHand}>
        <CarouselDots
          count={CAROUSEL_SLIDES.length}
          value={slide}
          onValueChange={onValueChange}
          autoplay={{ duration: 2400, paused: hovering }}
          getLabel={(i) => `Show ${CAROUSEL_SLIDES[i]}`}
        />
      </div>
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

// Mirrors the Combobox playground's default (multiple, chips field,
// bordered, no icon) with two chips already in.
function ComboboxPreview() {
  const [values, setValues] = useState<string[]>(COMBOBOX_DEFAULT_VALUES);
  const items: readonly ComboboxItemData[] = COMBOBOX_COMPONENTS;
  return (
    <div className="w-full max-w-[280px]">
      <Combobox multiple items={items} value={values} onValueChange={setValues}>
        <ComboboxChips placeholder={COMBOBOX_COPY.placeholderMultiple} className="w-full" />
        <ComboboxContent>
          <ComboboxEmpty>{COMBOBOX_COPY.empty}</ComboboxEmpty>
          <ComboboxList>
            {(item) => {
              const v = typeof item === "string" ? item : item.value;
              const label = typeof item === "string" ? item : item.label;
              return (
                <ComboboxItem key={v} value={v}>
                  {label}
                </ComboboxItem>
              );
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function SliderPreview() {
  const [basic, setBasic] = useState<number>(SLIDER_OPACITY.initial);
  const [volume, setVolume] = useState<number>(SLIDER_VOLUME.initial);
  return (
    <div className="flex flex-col gap-8 w-full max-w-[280px]">
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-body">
          <span className="text-muted-foreground">{SLIDER_OPACITY.label}</span>
          <span className="text-muted-foreground tabular-nums">{basic}</span>
        </div>
        <Slider value={basic} onChange={(v) => setBasic(v as number)} showValue={false} />
      </div>
      <Slider
        variant="scrubber"
        label={SLIDER_VOLUME.label}
        value={volume}
        onChange={(v) => setVolume(v as number)}
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

function CommandMenuPreview() {
  const shape = useShape();
  const items = useCommandMenuItems();
  // The tile shows the essence: the field, the suggested rows with their
  // caps, and the rows fading into the list's scroll edge. Tabs and the hint
  // footer stay on the docs page. A large tile, so the panel runs tall
  // enough to show the first groups; its own height caps the list.
  return (
    <Elevated
      offset={2}
      shadowLevel={3}
      className={cn("flex max-h-[440px] w-full max-w-[520px] flex-col overflow-hidden", shape.container)}
    >
      <CommandMenu items={items} suggestions={COMMAND_MENU_SUGGESTIONS}>
        <CommandMenuInput placeholder={COMMAND_MENU_COPY.placeholder} />
        <CommandMenuList>
          <CommandMenuEmpty>{COMMAND_MENU_COPY.empty}</CommandMenuEmpty>
        </CommandMenuList>
      </CommandMenu>
    </Elevated>
  );
}

function TablePreview() {
  const inTile = useContext(BentoTileContext);
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
          {/* 4 rows fit a medium tile's stage; the /demo stage and the
              /compare pair keep all 7, matching the shadcn original. */}
          {(inTile ? TABLE_ROWS.slice(0, 4) : TABLE_ROWS).map((row, i) => (
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

function ChatMessagePreview() {
  return (
    <div className="flex w-full max-w-[300px] flex-col gap-1">
      <ChatMessage from="user" size="compact">
        Why is every other input box so stiff?
      </ChatMessage>
      <ChatMessage from="assistant" size="compact">
        Because nothing about them moves with you.
      </ChatMessage>
    </div>
  );
}

function SidebarPreview() {
  const icons = useIcons();
  const SearchIcon = useIcon("search");
  // One card, two ways to spend its width: beside the main region on a
  // desktop, and rail-only on a phone, where 12rem of rail would leave the
  // main region an 83px sliver that shows nothing.
  const narrow = useNarrowFrame();
  return (
    <div className="flex h-[380px] w-full max-w-[620px] overflow-hidden rounded-xl border border-border bg-background">
      {/* A whole app shell in miniature — workspace row, a thread list with
          the status-dot treatment, a user row, and the main region beside it.
          collapsible="none" keeps it static: it never becomes the
          full-viewport drawer on phones. */}
      <SidebarProvider
        className="h-full min-h-0"
        persist={false}
        shortcut={null}
        width={narrow ? "100%" : "14rem"}
      >
        <Sidebar collapsible="none" variant="inset" className="h-full">
          <SidebarHeader>
            <SidebarMenu size="compact" aria-label="Workspace">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] text-background"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    A
                  </span>
                  <span
                    className="min-w-0 truncate text-foreground"
                    style={{ fontVariationSettings: fontWeights.semibold }}
                  >
                    Acme Inc
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Search and New read as one block — no gap between them — and
                each shortcut is revealed by its own row rather than sitting
                there at rest. Pinned compact so SidebarInput takes its height
                and type from the ladder, the same step the rows use, instead
                of being hand-sized to match them. */}
            <SizeProvider size="compact">
              <div className="flex flex-col">
                <div className="group/search relative">
                  <SearchIcon
                    size={14}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <SidebarInput
                    placeholder="Search"
                    aria-label="Search threads"
                    className="pl-8 pr-11"
                  />
                  <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-sans text-caption text-muted-foreground opacity-0 transition-opacity duration-80 group-hover/search:opacity-100 group-focus-within/search:opacity-100">
                    ⌘K
                  </kbd>
                </div>

                <SidebarMenu size="compact" aria-label="Create">
                  <SidebarMenuItem>
                    <SidebarMenuButton icon={icons.plus}>
                      New thread
                      <span className="ml-auto inline-flex opacity-0 transition-opacity duration-80 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100">
                        <kbd className="font-sans text-caption text-muted-foreground">⌘N</kbd>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </SizeProvider>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Threads</SidebarGroupLabel>
              <SidebarMenu size="compact">
                {/* Skips index 1: it shares a prefix with index 0 and the two
                    truncate to the same string in a 12rem rail. */}
                {[SIDEBAR_THREADS[0], SIDEBAR_THREADS[2], SIDEBAR_THREADS[3], SIDEBAR_THREADS[4]].map((thread) => (
                  <SidebarMenuItem key={thread.label}>
                    <SidebarMenuButton status={thread.status}>
                      {thread.label}
                    </SidebarMenuButton>
                    {thread.badge && <SidebarMenuBadge>{thread.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu size="compact" aria-label="User">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Image
                    src="/micka.png"
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0 rounded-full outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  />
                  <span className="min-w-0 truncate text-foreground">Micka Touillaud</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Blank on purpose — skeleton furniture competed with the rail. */}
        {!narrow && <SidebarInset className="min-h-0" />}
      </SidebarProvider>
    </div>
  );
}

export const previewMap: Record<string, React.FC> = {
  "input-message": InputMessagePreview,
  "chat-message": ChatMessagePreview,
  sidebar: SidebarPreview,
  card: CardPreview,
  accordion: AccordionPreview,
  "ask-user-questions": AskUserQuestionsPreview,
  badge: BadgePreview,
  "carousel-dots": CarouselDotsPreview,
  button: ButtonPreview,
  "checkbox-group": CheckboxPreview,
  "color-picker": ColorPickerPreview,
  combobox: ComboboxPreview,
  "command-menu": CommandMenuPreview,
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
