"use client";

// The toolbar's New item button and the dialog it opens: a short form for
// one row, a field per column in the table's order, every one optional.
// Add hands what was filled in to the table. Docs code, built from the
// library's Button, Dialog, Field, Input, Textarea, Select, Switch,
// DatePicker, Combobox, Badge and ScrollArea.
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useIcons } from "@/lib/icon-context";
import { useIsMac } from "@/components/ui/command-menu";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** What the form hands over, every field as filled in: "Untitled" for no
 *  name, today for no date, empty text, 0 props and no tags when left
 *  alone. */
export interface NewItemValues {
  name: string;
  primitives: string;
  fluidHover: boolean;
  props: number;
  /** The day, as YYYY-MM-DD. */
  added: string;
  tags: string[];
  website: string;
  summary: string;
}

/** The fields, by the ids of the columns they fill, in their default order. */
const FIELD_IDS = [
  "name",
  "primitives",
  "fluidHover",
  "props",
  "added",
  "tags",
  "website",
  "summary",
] as const;
type FieldId = (typeof FIELD_IDS)[number];

interface NewItemDialogProps {
  /** Gets what was filled in when Add is pressed. */
  onAdd: (values: NewItemValues) => void;
  /** The table's column ids in their current order: the fields follow it.
   *  Ids without a field (the boxes, the row menus) are skipped, and a field
   *  whose column isn't listed goes last. */
  order?: readonly string[];
  /** The Primitives choices with their badge colors, the first the
   *  default. */
  primitiveOptions: Record<string, BadgeColor>;
  /** The tags the Tags field offers. */
  tagOptions: readonly string[];
  /** The dialog's heading. @default "New item" */
  title?: string;
  /** The line under the heading. */
  description?: string;
  className?: string;
}

const isoDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function NewItemDialog({
  onAdd,
  order,
  primitiveOptions,
  tagOptions,
  title = "New item",
  description,
  className,
}: NewItemDialogProps) {
  const icons = useIcons();
  const id = useId();
  const mac = useIsMac();
  const formRef = useRef<HTMLFormElement>(null);
  const primitives = Object.keys(primitiveOptions);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [primitive, setPrimitive] = useState(primitives[0] ?? "");
  const [fluidHover, setFluidHover] = useState(false);
  const [props, setProps] = useState("");
  const [added, setAdded] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  // Each time it opens, the form starts empty, dated today.
  const reset = () => {
    setName("");
    setPrimitive(primitives[0] ?? "");
    setFluidHover(false);
    setProps("");
    setAdded(new Date());
    setTags([]);
    setWebsite("");
    setSummary("");
  };
  const add = (e: FormEvent) => {
    e.preventDefault();
    onAdd({
      name: name.trim() || "Untitled",
      primitives: primitive,
      fluidHover,
      props: Math.max(0, Math.round(Number(props) || 0)),
      added: isoDay(added ?? new Date()),
      tags,
      // A pasted URL keeps only what the column shows: the cell adds the
      // https:// itself.
      website: website.trim().replace(/^https?:\/\//i, ""),
      summary: summary.trim(),
    });
    setOpen(false);
  };
  // ⌘↵ (Ctrl ↵ off a Mac) adds from any field, the Summary's lines included.
  const addOnModEnter = (e: KeyboardEvent<HTMLFormElement>) => {
    if (
      e.key !== "Enter" ||
      !(mac ? e.metaKey : e.ctrlKey) ||
      e.nativeEvent.isComposing
    )
      return;
    e.preventDefault();
    formRef.current?.requestSubmit();
  };
  // One field per column, keyed by its id, shown in the table's column
  // order: a column moved in the table moves here too.
  const fields: Record<FieldId, ReactNode> = {
    name: (
      <Field>
        <FieldLabel htmlFor={`${id}-name`}>Component</FieldLabel>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled"
          autoComplete="off"
        />
      </Field>
    ),
    primitives: (
      <Field>
        <FieldLabel htmlFor={`${id}-primitives`}>Primitives</FieldLabel>
        <Select value={primitive} onValueChange={setPrimitive}>
          <SelectTrigger id={`${id}-primitives`} className="w-full" />
          <SelectContent>
            {primitives.map((p, i) => (
              <SelectItem key={p} index={i} value={p}>
                <Badge variant="ghost" color={primitiveOptions[p]}>
                  {p}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    ),
    // Flush with the fields: the label at their left edge, the switch at
    // the right.
    fluidHover: (
      <Switch
        label="Fluid hover"
        checked={fluidHover}
        onToggle={() => setFluidHover((on) => !on)}
        className="w-full flex-row-reverse justify-between px-0"
      />
    ),
    props: (
      <Field>
        <FieldLabel htmlFor={`${id}-props`}>Props</FieldLabel>
        <Input
          id={`${id}-props`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={props}
          onChange={(e) => setProps(e.target.value)}
          placeholder="0"
          className="tabular-nums"
        />
      </Field>
    ),
    added: (
      <Field>
        <FieldLabel htmlFor={`${id}-added`}>Added</FieldLabel>
        <DatePicker
          id={`${id}-added`}
          value={added}
          onValueChange={setAdded}
          className="w-full"
        />
      </Field>
    ),
    tags: (
      <Field>
        <FieldLabel htmlFor={`${id}-tags`}>Tags</FieldLabel>
        <Combobox
          multiple
          items={[...tagOptions]}
          value={tags}
          onValueChange={setTags}
        >
          <ComboboxChips id={`${id}-tags`} placeholder="Add tags…" />
          <ComboboxContent>
            <ComboboxEmpty>No tag found.</ComboboxEmpty>
            <ComboboxList>
              {(tag) => (
                <ComboboxItem key={String(tag)} value={String(tag)}>
                  {String(tag)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
    ),
    website: (
      <Field>
        <FieldLabel htmlFor={`${id}-website`}>Website</FieldLabel>
        <Input
          id={`${id}-website`}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="example.com/docs/popover"
          autoComplete="off"
        />
      </Field>
    ),
    summary: (
      <Field>
        <FieldLabel htmlFor={`${id}-summary`}>Summary</FieldLabel>
        <Textarea
          id={`${id}-summary`}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What it does, in a sentence."
          rows={2}
        />
      </Field>
    ),
  };
  const ordered = [
    ...(order ?? []).filter((key): key is FieldId => key in fields),
    ...FIELD_IDS.filter((key) => !order?.includes(key)),
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="tertiary"
            leadingIcon={icons.plus}
            className={className}
          >
            New item
          </Button>
        }
      />
      {/* The fields scroll between the heading and the buttons once the
          dialog would outgrow the window, their edges fading. */}
      <DialogContent
        size="sm"
        className="flex max-h-[min(720px,calc(100dvh-4rem))] flex-col p-0"
      >
        {/* A form: Enter in a one-line field adds, like the Add button, and
            ⌘↵ adds from anywhere in it. */}
        <form
          ref={formRef}
          onSubmit={add}
          onKeyDown={addOnModEnter}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogHeader className="mb-0 px-6 pt-6 pb-4">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea
            className="flex min-h-0 flex-1 flex-col"
            viewportClassName="min-h-0 flex-1 !h-auto scroll-fade [--scroll-fade-size:24px]"
          >
            {/* 2px of room around the fields keeps their focus rings in. */}
            <FieldGroup className="px-6 py-0.5">
              {ordered.map((key) => (
                <Fragment key={key}>{fields[key]}</Fragment>
              ))}
            </FieldGroup>
          </ScrollArea>
          <DialogFooter className="mt-0 px-6 pt-4 pb-6">
            <DialogClose
              render={
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" shortcut={mac ? "⌘↵" : ["Ctrl", "↵"]}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A row from the dialog: what was filled in, with an id (`slug`) no
 *  other row has. */
export function newRow<T extends { slug: string }>(values: NewItemValues, rows: readonly T[]) {
  const base = values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  let slug = base;
  for (let n = 2; rows.some((r) => r.slug === slug); n++) slug = `${base}-${n}`;
  return { ...values, slug };
}

/** The table parts useShowAddedRow reads: any useDataTable table fits. */
interface AddedRowTable {
  getPrePaginationRowModel: () => { rows: { original: { slug: string } }[] };
  getState: () => { pagination: { pageSize: number } };
  setPageIndex: (index: number) => void;
  resetColumnFilters: () => void;
  setGlobalFilter: (value: string) => void;
}

/** Shows a row just added: the page it lands on under the table's sort,
 *  with the filters and search cleared first when they would hide it.
 *  Call the returned function with the new row's slug. */
export function useShowAddedRow(table: AddedRowTable) {
  // A ref, not state: the look happens after the render that drew the new
  // row, and clearing the filters draws again for the second look.
  const pending = useRef<{ slug: string; cleared: boolean } | null>(null);
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    const at = table.getPrePaginationRowModel().rows.findIndex((r) => r.original.slug === p.slug);
    if (at === -1 && !p.cleared) {
      // The filters or the search hide it: clear them, and look again
      // once the table has drawn without them.
      p.cleared = true;
      table.resetColumnFilters();
      table.setGlobalFilter("");
      return;
    }
    pending.current = null;
    if (at !== -1) table.setPageIndex(Math.floor(at / table.getState().pagination.pageSize));
  });
  return useCallback((slug: string) => {
    pending.current = { slug, cleared: false };
  }, []);
}
