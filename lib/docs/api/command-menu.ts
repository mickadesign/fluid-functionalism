// The API reference of /docs/command-menu: its PropsTables and the API section
// of /docs/command-menu.md both read these, so the two cannot drift.
import type { ApiTable, PropDef } from "@/lib/docs/api/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export const itemDataProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique id. The row's key and what aria-activedescendant points at." },
  { name: "label", type: "string", description: "The row's text." },
  { name: "action", type: "string", description: 'What the footer names Enter while the row is highlighted, e.g. "Open Showcase". Defaults to the label.' },
  { name: "description", type: "string", description: "Text after the label, at its size, 1 contrast step lower." },
  { name: "icon", type: "IconComponent", description: "Leading icon." },
  { name: "shortcut", type: "string", description: 'Caps at the trailing edge, e.g. "mod+p" or "⌘P". Display only.' },
  { name: "keywords", type: "string[]", description: "Extra terms the filter matches besides label and description." },
  { name: "group", type: "string", description: "Heading the row lists under. Groups keep first-appearance order; ungrouped rows form an unlabelled section." },
  { name: "disabled", type: "boolean", default: "false", description: "Listed and greyed; the arrows and the pointer skip it." },
  { name: "onSelect", type: "() => void", description: "Runs when the row is picked, before the root's onSelect." },
];

export const rootProps: PropDef[] = [
  { name: "items", type: "CommandMenuItemData[]", description: "The actions. Keep the array stable: the highlight resets to the first row when the rows change." },
  { name: "onSelect", type: "(item) => void", description: "Runs when a row is picked, after the item's own onSelect." },
  { name: "filter", type: "(item, query: string) => boolean", description: "Match an item against the query. Default: every word of the query appears in label, description, or keywords." },
  { name: "query", type: "string", description: "Controlled query." },
  { name: "defaultQuery", type: "string", default: '""', description: "Initial query." },
  { name: "onQueryChange", type: "(query: string) => void", description: "Called on every keystroke." },
  { name: "suggestions", type: "string[]", description: "Values listed first, under suggestionsLabel, while nothing is typed. A suggested row leaves its own group." },
  { name: "suggestionsLabel", type: "string", default: '"Suggestions"', description: "Heading of the suggestions section." },
  { name: "closeOnSelect", type: "boolean", default: "true", description: "Inside CommandMenuDialog, a pick closes the dialog." },
  { name: "size", type: '"default" | "compact"', description: "Pins field and rows to one size step. Omitted, both follow the SizeProvider." },
];

export const dialogProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the dialog opens or closes, including from the shortcut." },
  { name: "shortcut", type: "string | null", default: '"mod+k"', description: 'The combo that toggles the dialog from anywhere: "mod" is ⌘ on a Mac and Ctrl elsewhere, joined with "+" to alt, shift, and one key. null binds nothing.' },
  { name: "shortcutScope", type: "RefObject<HTMLElement>", description: "Focus must be inside this element for the combo to open the dialog. For a demo or a pane that shares its combo with the palette at the root: the root palette keeps the key everywhere else." },
  { name: "title", type: "string", default: '"Command menu"', description: "The dialog's name for screen readers." },
  { name: "description", type: "string", default: '"Search for a command to run."', description: "Read after the title." },
  { name: "modal", type: "boolean", default: "true", description: "Traps focus and locks page scroll while open." },
  { name: "container", type: "HTMLElement | null", description: "Portal target, to scope the dialog to a region." },
  { name: "className", type: "string", description: "Merged onto the panel. It opens centered at its cap of min(440px, 76dvh) and keeps that top edge as the rows filter down, so the field never moves." },
];

export const inputProps: PropDef[] = [
  { name: "placeholder", type: "string", default: '"Type a command or search…"', description: "Shown while nothing is typed." },
  { name: "icon", type: "IconComponent | null", default: "search", description: "Leading icon. null drops it." },
];

export const listProps: PropDef[] = [
  { name: "renderItem", type: "(item, index: number) => ReactNode", description: "Custom rows: return a CommandMenuItem per visible item. Default renders one from the item's data." },
  { name: "children", type: "ReactNode", description: "Static children, e.g. CommandMenuEmpty." },
];

export const itemProps: PropDef[] = [
  { name: "value", type: "string", description: "Which item this row is. Its data fills the row; props below override it." },
  { name: "label", type: "string", description: "Overrides the item's label." },
  { name: "description", type: "string", description: "Overrides the item's description." },
  { name: "icon", type: "IconComponent", description: "Overrides the item's icon." },
  { name: "shortcut", type: "string", description: "Overrides the item's shortcut caps." },
  { name: "disabled", type: "boolean", description: "Overrides the item's disabled state." },
  { name: "onSelect", type: "() => void", description: "Overrides the item's onSelect." },
  { name: "children", type: "ReactNode", description: "Replaces the label and description. The icon and caps stay." },
];

export const tabsProps: PropDef[] = [
  { name: "tabs", type: "{ value: string; label: string; icon?: IconComponent }[]", description: "1 tab each." },
  { name: "value", type: "string", description: "The selected tab's value." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called on a pick. Derive items from the value." },
];

export const footerProps: PropDef[] = [
  { name: "hints", type: "{ label: string; keys: string | string[] }[]", description: "Replaces the default hints, the highlighted row's Enter hint included. A keys list draws 1 cap per entry." },
  { name: "children", type: "ReactNode", description: "Replaces the hints with your own content." },
];

export const shortcutProps: PropDef[] = [
  { name: "keys", type: "string | string[]", description: 'The combo, in the trigger syntax ("mod+shift+p") or pre-formatted ("⌘⇧P"). A list draws 1 cap per entry. Modifiers draw as symbols on a Mac and words elsewhere.' },
];

/** The page's tables in page order, titled as on the page. */
export const apiReference: ApiTable[] = [
  { title: "Item data", props: itemDataProps },
  { title: "CommandMenu", props: rootProps },
  { title: "CommandMenuDialog", props: dialogProps },
  { title: "CommandMenuInput", props: inputProps },
  { title: "CommandMenuTabs", props: tabsProps },
  { title: "CommandMenuList", props: listProps },
  { title: "CommandMenuItem", props: itemProps },
  { title: "CommandMenuFooter", props: footerProps },
  { title: "CommandMenuShortcut", props: shortcutProps },
];
