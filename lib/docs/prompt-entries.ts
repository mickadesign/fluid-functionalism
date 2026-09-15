/** Per-page usage snippet and props list for the "Copy prompt" button.
 *  Keyed by doc page slug. `install-prompt.ts` derives the rest (install
 *  command, description, flavor, docs URL). Keep imports pointing at the
 *  installed paths (`@/components/ui/*`, `@/lib/*`, `@/hooks/*`), not the
 *  repo's registry paths. */
export interface PromptEntry {
  /** Minimal composition, ~12 lines, imports from the installed path. */
  usage: string;
  /** One line per prop: `name: type (default X). What it does.` */
  props: string[];
  /** Extra sentence when the two primitive flavors differ in usage. */
  flavorNote?: string;
  /** The craft: the interaction-design decisions built into the component
   *  that a consumer (human or agent) would miss from the API alone — exact
   *  behaviors, exact values, and the why where one exists. Each bullet is
   *  one decision, ≤2 lines, sourced from the component code and doc page —
   *  never aspirational. Rendered in the Copy-prompt brief so composed code
   *  respects the behaviors instead of fighting them. */
  craft?: string[];
}

export const PROMPT_ENTRIES: Record<string, PromptEntry> = {
  "fluid-hover": {
    usage: `import { useRef } from "react";
import { useFluidHover, useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

function List({ rows }: { rows: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hover = useFluidHover(containerRef); // options: { axis: "y" | "x" | "xy" }
  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 p-2" {...hover.handlers}>
      <FluidHoverHighlight hover={hover} className="rounded-lg" />
      {rows.map((label, i) => <Row key={label} index={i} registerItem={hover.registerItem}>{label}</Row>)}
    </div>
  );
}
// Inside Row: const ref = useRef<HTMLButtonElement>(null); useRegisterFluidHoverItem(registerItem, index, ref);
// then render <button ref={ref} className="relative z-10 ...">`,
    props: [
      "axis: \"y\" | \"x\" | \"xy\" (default \"y\"). Hook option. Which way the list runs: y for lists, x for strips, xy for grids.",
      "isItemDisabled: (el: HTMLElement) => boolean. Hook option. Skips an item: never lit, never clicked.",
      "gapClick: boolean | { maxDistance?: number } (default true). Hook option. A click between items goes to the lit one.",
      "handlers: { onMouseEnter, onMouseMove, onMouseLeave, onClick }. Returned. Spread onto the container.",
      "registerItem: (index, element | null) => void. Returned. Give it to each row via useRegisterFluidHoverItem; indices start at 0.",
      "activeIndex: number | null. Returned. The lit item, also set as data-fluid-hover-active on the item.",
      "setActiveIndex: (index | null) => void. Returned. Light an item yourself, for keyboard focus.",
      "remeasure: () => void. Returned. Measure again and hide the highlight until done; call it when a popup opens.",
      "FluidHoverHighlight hover: ReturnType<typeof useFluidHover>. The hook; the highlight reads what it needs from it.",
      "FluidHoverHighlight transition: Transition | false (default spring.fast). The travel; false snaps in place after a reflow.",
    ],
  },
  motion: {
    usage: `import { motion } from "framer-motion";
import { spring } from "@/lib/springs";

// fast: 0.08s, bounce 0. Hover, fades, tooltips, focus rings.
// moderate: 0.16s, bounce 0. Dropdowns, tabs, short travel, panels that must land exactly.
// slow: 0.24s, bounce 0.12. Dialogs, drawers, large surfaces.
// spring.<tier> is the enter; spring.<tier>.exit is the matching exit tween.
<motion.div
  transition={spring.fast}
  exit={{ opacity: 0, transition: spring.fast.exit }}
/>`,
    props: [
      "spring.fast: { type: \"spring\", duration: 0.08, bounce: 0, exit: { duration: 0.06 } }. Hover, fades, tooltips, focus rings.",
      "spring.moderate: { type: \"spring\", duration: 0.16, bounce: 0, exit: { duration: 0.12 } }. Critically damped: dropdowns, tabs, drawers, short travel.",
      "spring.slow: { type: \"spring\", duration: 0.24, bounce: 0.12, exit: { duration: 0.16 } }. Dialogs, drawers, large surfaces.",
      "spring.<tier>.exit: tween config. Pass as the transition of an exit prop; never reuse the enter spring for a dismissal.",
      "exitFallbackMs(tier): number. Exit duration in ms plus a 100ms buffer, for deferred-unmount timers that guard an exit tween.",
    ],
  },
  scrollbars: {
    usage: `import { ScrollArea } from "@/components/ui/scroll-area";

// className constrains the outer box; viewportClassName goes on the inner
// scrolling viewport, where the scroll-fade / scroll-fade-x utility lives.
<ScrollArea orientation="horizontal" viewportClassName="scroll-fade-x" className="w-full">
  <div className="flex w-max gap-2 p-3">
    {months.map((month) => (
      <div key={month} className="flex h-20 w-28 shrink-0 items-center justify-center border border-border">
        {month}
      </div>
    ))}
  </div>
</ScrollArea>`,
    props: [
      "orientation: \"vertical\" | \"horizontal\" | \"both\" (default \"vertical\"). Which axes get scrollbars.",
      "viewportClassName: string. Classes for the inner scrolling viewport, where the scroll-fade utility goes.",
      "className: string. Classes for the outer container; set the height or width constraint here.",
    ],
    flavorNote: "Radix flavor wraps @radix-ui/react-scroll-area, Base UI flavor wraps @base-ui/react ScrollArea. Both export ScrollArea and ScrollBar with the same props.",
  },
  sizes: {
    usage: `import { SizeProvider, useSize } from "@/lib/size-context";

// One SizeProvider pins every control in its subtree to a step:
// default is 36px controls, compact is 28px. Components also take a
// per-instance size prop that wins over the provider.
function Toolbar() {
  const { gap, control, text, icon } = useSize(); // Tailwind classes plus icon px for the current step
  return (
    <SizeProvider size="compact">
      <div className={\`flex items-center \${gap}\`}>...</div>
    </SizeProvider>
  );
}`,
    props: [
      "SizeProvider size: \"default\" | \"compact\". Controlled variant; pins every control in the subtree to one step.",
      "SizeProvider defaultSize: \"default\" | \"compact\" (default \"default\"). Uncontrolled initial variant, switchable via useSizeContext().setSize.",
      "useSize(override?): SizeClasses. Returns { variant, control, controlHeight, segmentItem, segmentPad, text, px, itemPx, gap, icon } for the current step.",
      "useSizeVariant(override?): \"default\" | \"compact\". The resolved step, honoring a per-component override over the provider.",
      "useSizeContext(): { size, setSize }. Read or switch the step from inside a SizeProvider.",
      "useTypeScale(override?): Record<TypeScaleRole, number>. Font sizes per role (display, title, body, caption and so on) for the current step.",
      "size (on components): \"default\" | \"compact\" (default from provider). Per-component override on Button, Badge, Select, Tabs, Dropdown, Accordion, Card and most others.",
    ],
  },
  surfaces: {
    usage: `import { Elevated } from "@/lib/elevated";
import { SurfaceProvider, useSurface } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

// Elevated reads the substrate from context, computes min(substrate + offset, 8),
// applies the surface background and shadow classes, then re-provides the new
// level so nested surfaces keep climbing the ladder.
<Elevated offset={2} className="rounded-xl p-2">   {/* popover / dropdown: 2 above */}
  <Elevated offset={4} shadowLevel={5}>...</Elevated>   {/* dialog: 4 above, fixed shadow */}
</Elevated>
// Manual: const level = Math.min(useSurface() + 2, 8); className={surfaceClasses(level)}`,
    props: [
      "offset: number. Steps above the current substrate; the surface level becomes min(substrate + offset, 8). Use 2 for dropdown, popover, select menu and 4 for dialog, modal.",
      "shadowLevel: number (default the computed level). Override the shadow level so a dropdown keeps a constant shadow weight however deep it nests.",
      "className: string. Merged after the surface classes; radius and padding go here.",
      "...div props: ComponentPropsWithoutRef<\"div\">. Everything else is forwarded to the div, ref included.",
      "SurfaceProvider value: number. Set the substrate for a subtree by hand (1 page, 3 popover, 5 dialog).",
      "useSurface(): number. The current substrate level from context, 1 when no provider is present.",
      "surfaceClasses(bgLevel, shadowLevel = bgLevel): string. Background plus shadow Tailwind classes for a level, for components that do not use Elevated.",
    ],
  },
  accordion: {
    usage: `import { Accordion, AccordionGroup, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// Standalone: one Accordion, one item. Grouped: AccordionGroup with an
// index on every AccordionItem so the fluid hover highlight can track rows.
<AccordionGroup type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1" index={0}>
    <AccordionTrigger>Getting started</AccordionTrigger>
    <AccordionContent>Install the component and import it into your project.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" index={1}>
    <AccordionTrigger>Styling</AccordionTrigger>
    <AccordionContent>Pill or rounded, and every transition is a spring.</AccordionContent>
  </AccordionItem>
</AccordionGroup>`,
    props: [
      "type: \"single\" | \"multiple\" (default \"single\"). Whether one or multiple items can be expanded.",
      "collapsible: boolean (default true). Allow collapsing all items when type is single.",
      "defaultValue: string | string[]. Initially expanded item value(s).",
      "value: string | string[]. Controlled expanded value(s).",
      "onValueChange: (value) => void. Callback when expanded state changes.",
      "highlight: \"trigger\" | \"item\" (default \"item\"). What an open item tints: item fills the row and its panel, trigger scopes the fill to the row and shows it on hover.",
      "AccordionItem value: string. Unique identifier for this item.",
      "AccordionItem index: number. Position for fluid hover. Required inside AccordionGroup, omit for standalone.",
      "AccordionItem disabled: boolean (default false). Whether this item is disabled.",
      "AccordionTrigger / AccordionContent children: ReactNode. Trigger label and collapsible content.",
    ],
    flavorNote: "Radix flavor builds on @radix-ui/react-accordion, Base UI flavor on @base-ui/react Accordion. Same exports and props in both.",
  },
  "ask-user-questions": {
    usage: `import { AskUserQuestions, type AskUserQuestion } from "@/components/ui/ask-user-questions";

const questions: AskUserQuestion[] = [
  {
    id: "role",
    title: "What's your role?",
    options: [
      { id: "design", title: "Designer", description: "Visual / interaction" },
      { id: "eng", title: "Engineer", description: "Frontend / backend" },
      { id: "pm", title: "PM", description: "Product / program" },
    ],
  },
  { id: "tools", title: "Which tool do you use most?", multiSelect: true, options: [/* 2 to 5 options */] },
];

<AskUserQuestions questions={questions} onComplete={(answers) => console.log(answers)} />`,
    props: [
      "questions: AskUserQuestion[]. Ordered list of questions to ask; 2 to 5 options per question is recommended.",
      "currentIndex: number. Controlled index of the active question; pair with onCurrentIndexChange.",
      "defaultCurrentIndex: number (default 0). Initial question index (uncontrolled).",
      "answers: Record<string, AskUserAnswer>. Controlled answers map keyed by question id; pair with onAnswersChange.",
      "onComplete: (answers: Record<string, AskUserAnswer>) => void. Called after the last question is answered or submitted.",
      "onSkip: (questionId: string, index: number) => void. Called when the user clicks Skip on a question.",
      "skipLabel: string (default \"Skip\"). Label for the skip control in the header.",
      "AskUserQuestion: { id, title, options?, multiSelect?, allowOther?, skippable?, layout?: \"inline\" | \"stacked\", chipPosition?: \"left\" | \"right\", freeText?, freeTextValidate? }. multiSelect adds a Next button; allowOther adds an inline textarea; freeText makes a textarea the only answer.",
      "AskUserOption: { id, title, description? }. Bold title plus muted description per row.",
      "AskUserAnswer: { questionId, selectedIds: string[], otherText?, skipped? }. What each question resolves to.",
    ],
  },
  badge: {
    usage: `import { Badge } from "@/components/ui/badge";

<Badge color="violet">Fiction</Badge>
<Badge color="amber">Science</Badge>
<Badge variant="dot" color="green">Philosophy</Badge>
<Badge size="compact" color="blue">History</Badge>`,
    props: [
      "variant: \"solid\" | \"dot\" (default \"solid\"). Solid uses a tinted background; dot shows a colored indicator.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Step on the size ladder; legacy sm/md/lg values resolve as aliases.",
      "color: BadgeColor (default \"gray\"). Tailwind palette name: gray, red, orange, amber, yellow, lime, green, emerald, teal, cyan, blue, indigo, violet, purple, fuchsia, pink, rose.",
    ],
  },
  "button": {
    usage: `import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";

<Button variant="primary">Primary</Button>
<Button variant="secondary" leadingIcon={Plus}>Create</Button>
<Button variant="tertiary" trailingIcon={ArrowRight}>Next</Button>
<Button variant="ghost">Ghost</Button>
<Button loading>Saving</Button>
<Button disabled>Disabled</Button>`,
    props: [
      'variant: "primary" | "secondary" | "tertiary" | "ghost" (default "primary"). Visual style of the button.',
      'size: "default" | "compact" | "icon" | "icon-compact" (default from SizeProvider). Step on the size ladder: 36px default, 28px compact.',
      "loading: boolean (default false). Shows a spinner and disables the button.",
      "active: boolean (default false). Forces the pressed visual, e.g. while a menu the button opened is showing.",
      "leadingIcon: IconComponent. Icon displayed before the label.",
      "trailingIcon: IconComponent. Icon displayed after the label.",
      "asChild: boolean (default false). Merge props onto the child element instead of rendering a <button>.",
      "disabled: boolean (default false). Disables the button.",
    ],
  },
  "card": {
    usage: `import {
  Card, CardGroup, CardHeader, CardMedia,
  CardTitle, CardDescription, CardFooter, CardButton,
} from "@/components/ui/card";
import { Circle } from "lucide-react";

<CardGroup orientation="inline">
  <Card onClick={() => open(item)}>
    <CardMedia icon={Circle} />
    <CardHeader>
      <CardTitle>Fluid motion</CardTitle>
      <CardDescription>Spring-tuned transitions across three tiers</CardDescription>
    </CardHeader>
    <CardFooter><CardButton>Connect</CardButton></CardFooter>
  </Card>
</CardGroup>`,
    props: [
      "onClick: () => void. Makes the whole card a clickable target (stretched button).",
      "href: string. Makes the whole card a link (stretched anchor).",
      "selected: boolean (default false). Persistent selected fill and title emphasis on top of fluid hover.",
      "disabled: boolean (default false). Dims and disables the card.",
      "dismissible: boolean (default false). Shows a dismiss button, revealed on hover or focus.",
      "onDismiss: () => void. Called when the dismiss button is pressed.",
      'CardGroup orientation: "card" | "inline" (default "card"). Stacked layout or a horizontal row.',
      "CardGroup columns: number (default 1). Grid columns; more than 1 enables 2-D fluid hover.",
      'CardGroup border: "none" | "outlined" (default "none"). Borderless with dividers, or a drawn border.',
      "CardGroup separated: boolean (default false). Individually shaped tiles with a gap instead of one divided block.",
    ],
  },
  "chat-message": {
    usage: `import { ChatMessage } from "@/components/ui/chat-message";
import { Copy } from "lucide-react";

const actions = <button aria-label="Copy"><Copy size={13} /></button>;

<div className="flex flex-col gap-2">
  <ChatMessage from="user" time="Wednesday 6:06 PM" actions={actions}>
    What does "good design" actually mean?
  </ChatMessage>
  <ChatMessage from="assistant" actions={actions}>
    Good design is mostly invisible. You only notice it when it is missing.
  </ChatMessage>
</div>`,
    props: [
      'from: "user" | "assistant". Who sent it: user is a right-aligned accent bubble, assistant is left-aligned plain text.',
      "children: ReactNode. Message body. Omit for an attachment-only message.",
      "time: ReactNode. Pre-formatted timestamp in the hover-revealed meta row. User messages only.",
      "actions: ReactNode. Icon-only action buttons next to the timestamp. Row height is always reserved, so nothing shifts.",
      "files: File[]. Optional attachments rendered as square thumbnails above the bubble. Images and PDFs supported.",
      "thumbnailSize: number (default 64). Side length in px of each attachment thumbnail.",
      "className: string. Merged onto the outer motion wrapper, e.g. to tweak max-width.",
    ],
  },
  "checkbox-group": {
    usage: `import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group";
import { useState } from "react";

const items = ["Apples", "Bananas", "Cherries", "Dates"];
const [checked, setChecked] = useState<Set<number>>(new Set([0]));
const toggle = (i: number) => setChecked((prev) => {
  const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
});

<CheckboxGroup checkedIndices={checked}>
  {items.map((label, i) => (
    <CheckboxItem key={label} index={i} label={label} checked={checked.has(i)} onToggle={() => toggle(i)} />
  ))}
</CheckboxGroup>`,
    props: [
      "checkedIndices: Set<number>. Set of checked item indices; drives the merged background across contiguous picks.",
      "children: ReactNode. CheckboxItem children.",
      "CheckboxItem label: string. Text label for the checkbox.",
      "CheckboxItem index: number. Position index within the group.",
      "CheckboxItem checked: boolean. Whether this item is checked.",
      "CheckboxItem onToggle: () => void. Called when this item is toggled.",
    ],
  },
  "color-picker": {
    usage: `import { ColorPicker, ColorPickerPopover } from "@/components/ui/color-picker";
import { useState } from "react";

const [color, setColor] = useState("#6B97FF");

// Inline panel, controlled
<ColorPicker value={color} onValueChange={(v) => setColor(v)} />

// Popover with a trigger tile and label
<ColorPickerPopover triggerLabel="Fill" defaultValue="#6B97FF" />`,
    props: [
      "value: string. Controlled color value in any supported format.",
      'defaultValue: string (default "#6B97FF"). Initial color when uncontrolled.',
      "onValueChange: (value, parsed) => void. Fired on every change with the formatted string and a parsed color object.",
      'format: "hex" | "rgb" | "hsl" | "oklch". Controlled format selection.',
      'defaultFormat: "hex" | "rgb" | "hsl" | "oklch" (default "hex"). Initial format when uncontrolled.',
      "swatches: string[]. Optional preset swatches; the strip is hidden when omitted.",
      "hideEyedropper: boolean (default false). Force-hide the eyedropper button.",
      "ColorPickerPopover triggerLabel: string. Optional label rendered next to the color tile.",
      "ColorPickerPopover triggerShowValue: boolean (default true). Show the hex value next to the tile.",
      "ColorPickerPopover triggerShowRemove: boolean (default false). Render an X button on the trigger; pairs with onTriggerRemove.",
    ],
  },
  "combobox": {
    usage: `import {
  Combobox, ComboboxInput, ComboboxContent,
  ComboboxList, ComboboxItem, ComboboxEmpty,
} from "@/components/ui/combobox";
import { useState } from "react";

const frameworks = [{ value: "next", label: "Next.js" }, { value: "astro", label: "Astro" }];
const [value, setValue] = useState("");

<Combobox items={frameworks} value={value} onValueChange={setValue}>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item.value} value={item.value}>{item.label}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`,
    props: [
      "items: readonly (string | { value: string; label: string })[]. The options; a string is its own value and label.",
      "multiple: boolean (default false). Any number of picks; values become string[] and the field is ComboboxChips.",
      'value: string | string[]. Selected value; "" means none, an array when multiple.',
      'onValueChange: (value: string | string[]) => void. Called with the pick, "" when cleared, or the array when multiple.',
      "filter: (item, query: string) => boolean. Match an item against the query. Default is case-insensitive contains on the label.",
      "onCreate: (query: string) => item | void. Adds a create row for the query when no label matches exactly.",
      "hideSelected: boolean (default false). Multiple only; picked items leave the list.",
      "disabled: boolean (default false). Disables the field and the popup.",
      'size: "default" | "compact". Pins field and popup to one size step; otherwise follows the SizeProvider.',
      'ComboboxInput variant: "bordered" | "borderless" (default "bordered"). Also takes icon, placeholder, error, clearable.',
    ],
  },
  "dialog": {
    usage: `import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open dialog</Button>} />
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Create teamspace</DialogTitle>
      <DialogDescription>Add a new teamspace to organize your projects.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    props: [
      "open: boolean. Controlled open state.",
      "defaultOpen: boolean (default false). Initial open state.",
      "onOpenChange: (open: boolean) => void. Called when the dialog opens or closes.",
      "modal: boolean (default true). Traps focus and locks page scroll while open.",
      'DialogContent size: "sm" | "lg" | "xl" (default "sm"). Width 400, 540, or 880; xl is a canvas for layouts.',
      "DialogContent container: HTMLElement | null. Portal target; scopes overlay and panel to a positioned container.",
      "DialogTrigger / DialogClose render: ReactElement. The element that becomes the control, e.g. a Button.",
      "DialogTrigger / DialogClose asChild: boolean (default false). Compose onto the single child instead of render.",
    ],
    flavorNote: "Radix and Base UI flavors share the same API. DialogTrigger and DialogClose accept either render={<Button />} or asChild with a single child in both flavors.",
  },
  "dropdown": {
    usage: `import { DropdownMenu, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";
import { Button } from "@/components/ui/button";
import { Clock, Star, Users } from "lucide-react";
import { useState } from "react";

const items = [{ icon: Clock, label: "Recents" }, { icon: Star, label: "Favorites" }, { icon: Users, label: "Shared" }];
const [view, setView] = useState(0);

<DropdownMenu>
  <DropdownTrigger render={<Button variant="ghost">Open menu</Button>} />
  <DropdownContent checkedIndex={view}>
    {items.map((item, i) => (
      <MenuItem key={item.label} index={i} icon={item.icon} label={item.label} checked={view === i} onSelect={() => setView(i)} />
    ))}
  </DropdownContent>
</DropdownMenu>`,
    props: [
      "DropdownMenu open: boolean. Controlled open state; defaultOpen and onOpenChange also available.",
      "DropdownTrigger render: ReactElement. The element that becomes the trigger, e.g. a Button.",
      "DropdownContent checkedIndex: number. The checked row; drives the selected background and radio value.",
      "DropdownContent checkedIndices: number[]. Checked rows become checkboxes that keep the menu open; touching picks share one background.",
      'DropdownContent side: "top" | "bottom" | "left" | "right" (default "bottom"). Side of the trigger the popup prefers.',
      'DropdownContent align: "start" | "center" | "end" (default "start"). Alignment against the trigger.',
      "MenuItem icon: IconComponent. Leading icon.",
      "MenuItem label: string. Row text.",
      "MenuItem index: number. Position in the list.",
      "MenuItem checked: boolean (default false). Set it, even to false, for a radio or checkbox row; leave undefined for a plain action.",
    ],
    flavorNote: "Radix and Base UI flavors share the same API. Dropdown (inline panel without a trigger), DropdownLabel, DropdownSeparator, DropdownSearch and DropdownEmpty export from the same file; MenuItem installs alongside at @/components/ui/menu-item.",
  },
  "input-copy": {
    usage: `import { InputCopy } from "@/components/ui/input-copy";

<InputCopy
  label="Install command"
  value="npx shadcn@latest add https://www.fluidfunctionalism.com/r/input-copy.json"
  onCopy={() => console.log("copied")}
/>`,
    props: [
      "value: string. The text to display and copy to the clipboard.",
      "label: string. Optional label displayed above the input.",
      'variant: "icon" | "button" (default "icon"). Icon-only with tooltip, or a button with a visible label.',
      'align: "right" | "left" (default "right"). Position of the copy action relative to the value.',
      "onCopy: () => void. Fires after the value is successfully copied.",
      "disabled: boolean (default false). Disables the input and the copy button.",
    ],
  },
  "input-group": {
    usage: `import { useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputField } from "@/components/ui/input-group";

const [value, setValue] = useState("");

<InputGroup>
  <InputField index={0} label="Search" placeholder="Search teamspaces..."
    icon={Search} value={value} onChange={setValue} />
</InputGroup>`,
    props: [
      "InputGroup children: ReactNode. One or more InputField children.",
      "index: number. Position of the field within the group (required for fluid hover).",
      "label: string. Label text above the input.",
      "labelHidden: boolean (default false). Keep the label for assistive tech but do not render it.",
      "value: string. Controlled input value.",
      "onChange: (value: string) => void. Called when the value changes.",
      "placeholder: string. Placeholder text.",
      "icon: IconComponent. Leading icon inside the input.",
      "error: string. Error message shown below the input.",
      "disabled: boolean (default false). Disables the input.",
    ],
  },
  "input-message": {
    usage: `import { useState } from "react";
import { InputMessage } from "@/components/ui/input-message";

const [value, setValue] = useState("");

<div className="w-full max-w-xl">
  <InputMessage
    value={value}
    onValueChange={setValue}
    onSend={(text) => console.log("send:", text)}
  />
</div>`,
    props: [
      "value: string. Controlled textarea value.",
      "onValueChange: (value: string) => void. Called on every textarea change.",
      "onSend: (value: string, files: File[]) => void. Fires on Enter (without Shift) or send click, skipped when empty.",
      'placeholder: string (default "Ask me anything…"). Placeholder shown while the value is empty.',
      'size: "default" | "compact" (default from SizeProvider). Step on the size ladder.',
      "leftSlot / rightSlot: ReactNode | (ctx) => ReactNode. Content in the bottom action areas; render-fn receives { openFilePicker, files }.",
      "files / onFilesChange: File[] / (files: File[]) => void. Controlled attachments; enables drag-and-drop and the file picker.",
      'status: "idle" | "streaming". While streaming, the send button becomes Stop (empty draft) or Queue (non-empty draft).',
      "suggestions: string[]. Suggested prompts listed under the action bar while the draft is empty.",
      "disabled: boolean (default false). Disables the textarea, send button, and drag-and-drop.",
    ],
  },
  "radio-group": {
    usage: `import { useState } from "react";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";

const options = ["Option A", "Option B", "Option C"];
const [selected, setSelected] = useState(0);

<RadioGroup selectedIndex={selected}>
  {options.map((label, i) => (
    <RadioItem key={label} index={i} label={label} selected={selected === i} onSelect={() => setSelected(i)} />
  ))}
</RadioGroup>`,
    props: [
      "RadioGroup selectedIndex: number. Index of the currently selected item.",
      "RadioGroup children: ReactNode. RadioItem children.",
      "index: number. Position index within the group.",
      "label: string. Text label for the item.",
      "selected: boolean. Whether this item is selected.",
      "onSelect: () => void. Called when this item is selected.",
      "value: string. Optional value forwarded to the underlying primitive for form integration.",
    ],
  },
  select: {
    usage: `import { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

const [value, setValue] = useState("");

<Select value={value} onValueChange={setValue}>
  <SelectTrigger placeholder="Select a fruit" />
  <SelectContent>
    <SelectItem index={0} value="apple">Apple</SelectItem>
    <SelectItem index={1} value="banana">Banana</SelectItem>
    <SelectItem index={2} value="cherry">Cherry</SelectItem>
  </SelectContent>
</Select>`,
    props: [
      "value: string. Controlled selected value.",
      "defaultValue: string. Uncontrolled default value.",
      "onValueChange: (value: string) => void. Called when the selected value changes.",
      "disabled: boolean (default false). Disables the entire select.",
      "name: string. Name for form submission.",
      'SelectTrigger variant: "bordered" | "borderless" (default "bordered"). Visual style of the trigger.',
      'SelectTrigger placeholder: string (default "Select…"). Text shown when no value is selected.',
      "SelectTrigger icon: IconComponent. Optional icon before the value.",
      "SelectTrigger error: string. Error message shown below the trigger.",
      "SelectItem index: number. Position within the content, required for fluid hover. SelectItem also takes value, icon, disabled.",
    ],
  },
  sidebar: {
    usage: `import { Home, Inbox } from "lucide-react";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarInset, SidebarTrigger,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";

<SidebarProvider defaultOpen>
  <Sidebar side="left" variant="sidebar">
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton icon={Home} isActive>Home</SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton icon={Inbox}>Inbox</SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset><SidebarTrigger />{/* page content */}</SidebarInset>
</SidebarProvider>`,
    props: [
      "SidebarProvider open / onOpenChange: boolean / (open: boolean) => void. Controlled open state.",
      "SidebarProvider defaultOpen: boolean (default true). Uncontrolled initial state; read the sidebar_state cookie in a server layout to restore it.",
      "SidebarProvider persist: boolean (default true). Write the desktop state to the sidebar_state cookie.",
      'SidebarProvider peek: "none" | "hover" | "click" (default "none"). Collapsed edge strip reveals the sidebar as a floating overlay.',
      'SidebarProvider shortcut: string | null (default "[" left, "]" right). Bare-key toggle; null disables.',
      "SidebarProvider mobileBreakpoint: number (default 768). Width below which the sidebar becomes a modal drawer.",
      'SidebarProvider width / widthMobile: string (default "16rem" / "18rem"). Rail and drawer widths.',
      'Sidebar side: "left" | "right" (default "left"). Which edge the rail lives on.',
      'Sidebar variant: "sidebar" | "floating" | "inset" (default "sidebar"). Transparent rail, floating card, or inset pairing where SidebarInset becomes the card.',
      'Sidebar collapsible: "offcanvas" | "none" (default "offcanvas"). Offcanvas slides away; none is a static column. Also: rail (boolean, default true) for the drag-resize handle, bordered (boolean, default true).',
    ],
    flavorNote:
      "Both flavors install sidebar.tsx plus sidebar-core.tsx and sidebar-menu.tsx; import everything from @/components/ui/sidebar. SidebarMenuButton accepts render={<Link href=... />} (Base UI) or asChild (Radix) for custom elements.",
  },
  slider: {
    usage: `import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const [value, setValue] = useState(25);

<Slider label="Volume" value={value} onChange={(v) => setValue(v as number)} min={0} max={100} />

// Dense design: pass size="compact"
<Slider size="compact" value={value} onChange={(v) => setValue(v as number)} />`,
    props: [
      "value: number | [number, number]. Current value; an array enables range mode with two thumbs.",
      "onChange: (value: SliderValue) => void. Called on drag, click, or keyboard change.",
      'size: "default" | "compact" (default from SizeProvider). Default renders the pip/scrubber design, compact the dense design.',
      'variant: "pips" | "scrubber" (default "pips"). Default-step layout; ignored when compact renders.',
      "min: number (default 0). Minimum value.",
      "max: number (default 100). Maximum value.",
      "step: number (default 1). Step increment the thumb snaps to.",
      "steps: number[]. Discrete allowed values; min/max derive from the list and step is ignored.",
      'valuePosition: "left" | "right" | "top" | "bottom" | "tooltip" (default "left"). Where the value label renders; showValue (default true) toggles it.',
      "label: string. Accessible label, also shown as a prefix in the value display. formatValue: (v: number) => string customizes the label.",
    ],
  },
  "switch": {
    usage: `import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const [checked, setChecked] = useState(false);

<Switch
  label="Notifications"
  checked={checked}
  onToggle={() => setChecked((prev) => !prev)}
/>`,
    props: [
      "label: string. Text label displayed next to the switch.",
      "checked: boolean. Whether the switch is on.",
      "onToggle: () => void. Called when the switch is toggled.",
      "disabled: boolean (default false). Disables the switch.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the switch to one step of the size ladder.",
    ],
  },
  "table": {
    usage: `import {
  Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow index={0}>
      <TableCell>Alice</TableCell>
      <TableCell>Engineer</TableCell>
    </TableRow>
    <TableRow index={1}>
      <TableCell>Bob</TableCell>
      <TableCell>Designer</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
    props: [
      "children: ReactNode. TableHeader and TableBody children.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the rows to one step of the size ladder.",
      "TableRow.index: number. Row index for fluid hover; omit for header rows.",
      "TableRow.children: ReactNode. TableCell or TableHead children.",
    ],
  },
  "tabs": {
    usage: `import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs";

<Tabs defaultValue="library">
  <TabsList>
    <TabItem value="library" label="Library" />
    <TabItem value="recents" label="Recents" />
    <TabItem value="favorites" label="Favorites" />
  </TabsList>
  <TabPanel value="library">Library content.</TabPanel>
  <TabPanel value="recents">Recents content.</TabPanel>
  <TabPanel value="favorites">Favorites content.</TabPanel>
</Tabs>`,
    props: [
      "value: string. Controlled active tab value. Takes precedence over selectedIndex.",
      "onValueChange: (value: string) => void. Called when the active tab changes.",
      "defaultValue: string. Default active tab for uncontrolled usage.",
      "selectedIndex: number. Index-based controlled alternative.",
      "onSelect: (index: number) => void. Called with the new index when the active tab changes.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the segmented control to one step of the size ladder.",
      "TabItem.value: string. Unique value identifying this tab.",
      "TabItem.label: string. Text label for the tab.",
      "TabItem.icon: IconComponent. Optional leading icon.",
      "TabPanel.value: string. Must match a TabItem value; content renders when that tab is active.",
    ],
  },
  "tabs-subtle": {
    usage: `import { useState } from "react";
import { TabsSubtle, TabsSubtleItem, TabsSubtlePanel } from "@/components/ui/tabs-subtle";

const tabs = ["Teamspaces", "Recents", "Favorites"];
const [selected, setSelected] = useState(0);

<TabsSubtle idPrefix="demo" selectedIndex={selected} onSelect={setSelected}>
  {tabs.map((label, i) => (
    <TabsSubtleItem key={label} index={i} label={label} />
  ))}
</TabsSubtle>
{tabs.map((label, i) => (
  <TabsSubtlePanel key={label} index={i} selectedIndex={selected} idPrefix="demo">
    <p>{label} content</p>
  </TabsSubtlePanel>
))}`,
    props: [
      "selectedIndex: number. Index of the currently selected tab.",
      "onSelect: (index: number) => void. Called when a tab is selected.",
      "idPrefix: string. Prefix for ARIA IDs linking tabs to panels.",
      "activeLabel: boolean (default false). Only the selected tab shows its text label. Requires icons on tabs.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Pins the tabs to one step of the size ladder.",
      "TabsSubtleItem.index: number. Position index within the tab list.",
      "TabsSubtleItem.label: string. Text label for the tab.",
      "TabsSubtleItem.icon: IconComponent. Icon displayed in the tab.",
      "TabsSubtlePanel.index: number. Index of this panel; rendered only when it matches selectedIndex.",
      "TabsSubtlePanel.idPrefix: string. Must match the TabsSubtle idPrefix.",
    ],
  },
  "thinking-indicator": {
    usage: `import { ThinkingIndicator } from "@/components/ui/thinking-indicator";

<ThinkingIndicator />

// Text only, inline before a streamed reply
<ThinkingIndicator showIcon={false} />`,
    props: [
      "showIcon: boolean (default true). Show the morphing circle to infinity glyph before the label. Set false for a text-only indicator.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Step on the size ladder. Wins over the surrounding SizeProvider.",
    ],
  },
  "thinking-steps": {
    usage: `import {
  ThinkingSteps, ThinkingStepsHeader, ThinkingStepsContent,
  ThinkingStep, ThinkingStepDetails,
} from "@/components/ui/thinking-steps";

<ThinkingSteps>
  <ThinkingStepsHeader />
  <ThinkingStepsContent>
    <ThinkingStep icon="search" label="Searched the web" />
    <ThinkingStep icon="globe" label="Read 3 sources">
      <ThinkingStepDetails summary="Explored 2 files" details={["Read a.tsx", "Read b.tsx"]} />
    </ThinkingStep>
    <ThinkingStep icon="check" label="Done" isLast />
  </ThinkingStepsContent>
</ThinkingSteps>`,
    props: [
      "defaultOpen: boolean (default true). Whether the accordion starts expanded (uncontrolled).",
      "open: boolean. Controlled open state. Use with onOpenChange.",
      "onOpenChange: (open: boolean) => void. Callback when the open state changes.",
      "size: \"default\" | \"compact\" (default from SizeProvider). Step on the size ladder.",
      "ThinkingStepsHeader.children: ReactNode (default \"Thinking\"). Header label text.",
      "ThinkingStep.label: string. Step label text.",
      "ThinkingStep.icon: IconName (default \"dot\"). Icon name from the icon library.",
      "ThinkingStep.status: \"complete\" | \"active\" | \"pending\" (default \"complete\"). Pending steps are hidden; active steps show shimmer text.",
      "ThinkingStep.isLast: boolean (default false). Hides the connector line below this step.",
      "ThinkingStepDetails.summary / details: string / string[]. Collapsed label and the detail lines rendered inside the nested accordion.",
    ],
  },
  "tooltip": {
    usage: `import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="Save your changes">
  <button>Hover me</button>
</Tooltip>

<Tooltip content="Right" side="right" delayDuration={0}>
  <button>Right</button>
</Tooltip>`,
    props: [
      "content: ReactNode. The content displayed inside the tooltip.",
      "children: ReactElement. The trigger element. Must accept a ref.",
      "side: \"top\" | \"right\" | \"bottom\" | \"left\" (default \"top\"). Preferred side of the trigger to render the tooltip.",
      "sideOffset: number (default 8). Distance in pixels between the tooltip and the trigger.",
      "delayDuration: number (default 200). Milliseconds to wait before showing the tooltip on hover.",
      "followCursor: \"x\" | \"y\". Track the cursor along one axis while hovering; the other axis stays anchored by side.",
      "forceOpen: boolean. True forces the tooltip open, false forces it closed, undefined uses hover and focus.",
      "onOpenChange: (open: boolean) => void. Called when the internal open state changes.",
      "className: string. Additional classes applied to the tooltip content container.",
      "contentClassName: string. Classes for the portalled element; pass a z-index utility to lift the tooltip above other fixed layers (default z-50).",
    ],
  },
};
