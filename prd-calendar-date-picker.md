# PRD: Calendar + Date picker

Status: agreed in design interview, 2026-10-19. Not started.

References: [shadcn Calendar](https://ui.shadcn.com/docs/components/base/calendar), [shadcn Date picker](https://ui.shadcn.com/docs/components/base/date-picker), Notion Calendar (event date/time editor, time slot list), Airbnb (two-month range calendar, horizontal + vertical).

## 1. Goal

Two registry items that cover single dates, date ranges and date + time, with the Fluid Functionalism motion system (fluid hover, weight shift, springs, animated focus ring):

- `calendar`: the inline grid.
- `date-picker`: a trigger + popover around `calendar`, plus a time slot picker.

## 2. Scope

### In v1

- Selection modes: single date, date range, date + time (single time or start → end time range).
- Day states: hover, selected, range middle, today, booked, unavailable, outside month, past (via matcher).
- Custom cell size, `fill` mode, shape-aware cells.
- Week numbers (display only).
- One or two months, horizontal / vertical / auto layout.
- Optional range presets.
- Both flavors for `date-picker` (Radix + Base UI).

### Out of v1 (follow-ups)

- Month / year grid view (click caption to switch to 3×4 month grid, then year grid). Planned as option (b), reusing cells, `xy` fluid hover and transitions.
- Clickable week numbers.
- Time ranges that cross midnight.
- Colored "today" (possible later `todayClassName` hook).
- Dropdown caption (`captionLayout="dropdown"`): not planned.

## 3. Engine and dependencies

- **DayPicker v10**, installed as **`@daypicker/react`** (the v10 package name; `react-day-picker` is the legacy alias of the same code). Latest checked: 10.0.2 (2026-09-30).
- `date-fns` comes as DayPicker's own dependency. Our files do not import it: all display formatting (trigger labels, durations, time slots) uses `Intl.DateTimeFormat` / `Intl.NumberFormat`.
- DayPicker's built-in `animate` is **off**. Month transitions are ours (section 7).
- We override `components`: `DayButton`, `Chevron`, `MonthCaption`, `Nav` / `PreviousMonthButton` / `NextMonthButton`, `WeekNumber`, `Weekday` as needed. DayPicker keeps date math, ARIA grid semantics, roving tabindex, locale, `weekStartsOn`.

## 4. Registry items and flavors

| Item | Location | Flavor | Depends on |
|---|---|---|---|
| `calendar` | `registry/default/calendar.tsx` | single source | `@daypicker/react`, `motion`, `use-fluid-hover`, `fluid-hover-highlight`, `button`, `tooltip`, `icon-context`, `size-context`, `shape-context`, `springs`, `font-weight` |
| `date-picker` | `registry/radix/date-picker.tsx` + `registry/base/date-picker.tsx` | Radix Popover / Base UI Popover | `calendar`, flavored `button`, `tooltip` |

- The two `date-picker` files differ only in the popover wrapper (~40 lines). Shared logic (trigger, time list, formatting) lives in a single-source helper file both import (e.g. `registry/default/date-picker-core.tsx`), the same split as `sidebar-core`.
- Base UI popover follows the existing exit pattern (`preventUnmountOnClose()`, see preview-verification notes).
- The `@/components/ui/*` import rule and "no repo paths / flavor comments in registry files" (issue #19) apply.

## 5. Calendar

### 5.1 API (sketch)

```tsx
<Calendar
  mode="single" | "range"
  selected / onSelect            // DayPicker types: Date | undefined, DateRange | undefined
  booked={Matcher}               // unavailable + line-through
  available={Matcher}            // when set, every day NOT matched is unavailable
  disabled={Matcher}             // e.g. { before: today }; unavailable look
  showWeekNumber
  numberOfMonths={1 | 2}
  orientation="auto" | "horizontal" | "vertical"   // default "auto"
  cellSize={number}              // px; default 36 (default size) / 32 (compact)
  fill                           // stretch cells to container width
  showOutsideDays                // default true for 1 month, forced false for 2
  weekStartsOn / locale / timeZone / pagedNavigation  // pass-through to DayPicker
  {...rest DayPicker props}
/>
```

`booked`, `available`, `disabled` accept any DayPicker `Matcher` (Date, Date[], `{ before }`, `{ after }`, `{ from, to }`, `{ dayOfWeek }`, function). They map to DayPicker `modifiers` + `disabled`. In range mode `excludeDisabled` is on, so a range never spans a booked day.

### 5.2 Day states

| State | Look |
|---|---|
| Hover | One shared fluid hover highlight (`--hover`) gliding across the grid (`useFluidHover({ axis: "xy" })`, rows gap-0) |
| Selected (single, range ends) | Solid `bg-foreground text-background`, regular weight (selection never changes weight) |
| Range middle | One continuous `--hover` band per week row, from the center of the start cell to the center of the end cell, 2px corners at row ends, 0 where the row above or below continues the band at that edge. Continues across row and month breaks, with 2px corners at a month's edge (Airbnb ref) |
| Range hover preview | While picking the end, the band follows the hovered/focused day (across both months). Preview end = the fluid hover highlight restyled as a solid cell that glides to the pointer, at regular cell size with a 1px background-color ring inset 1px, concentric radius |
| Today | Semibold number + 4px dot under it; dot turns `text-background` when today is selected |
| Booked | Unavailable (disabled, not focusable) + muted + line-through |
| Unavailable (outside `available`, `disabled`, past) | Disabled, muted, no line-through |
| Outside month | `--muted-foreground` at reduced opacity, not part of hover scope beyond DayPicker defaults |

No brand color: the palette stays neutral.

### 5.3 Sizing and shape

- `cellSize` writes `--cell-size` on the root. Cell width/height, nav button size, week number column width, today-dot offset and popover width all derive from it.
- Text stays on the size scale (`typeClass` body role) regardless of `cellSize`. Bigger cells = more air, not bigger type. Custom type through `classNames`.
- `fill`: cells size from the container, `aspect-square` with a max height.
- `useShape()`: `pill` = circular cells and capsule range band; `rounded` = `rounded-lg` cells and matching band corners.

### 5.4 Week numbers

- `showWeekNumber`: muted column (`--muted-foreground`, lower opacity), one cell wide, empty header cell. Display only, not in the hover scope.
- ISO 8601 numbering (`ISOWeek`) by default with Monday start; locale rules when `weekStartsOn` is Sunday.

### 5.5 Header and navigation

- Single month: caption left, prev/next on the right (Notion ref).
- Nav buttons: FF `Button` ghost icon-only, chevrons from `useIcons()`, `Tooltip` "Previous month" / "Next month". The two buttons share a small fluid hover scope.
- Chevrons move one month at a time (also with two months), `pagedNavigation` stays a pass-through.

### 5.6 Two months

- `numberOfMonths={2}` + `orientation`:
  - **horizontal**: captions centered over each month, prev at the far left of the first caption, next at the far right of the last.
  - **vertical**: one weekday header at the top that stays while the grids scroll; captions left-aligned; both chevrons on the first caption; months separated by a gap, no divider.
  - **auto** (default): horizontal when the container fits two months, vertical otherwise (CSS container query).
- One fluid hover scope across both months (highlight glides from Oct 31 to Nov 1).
- `showOutsideDays` forced off so no date renders twice.

## 6. Date picker

### 6.1 Trigger

- Default `variant="outline"`: trigger matching `Select` (height, radius, size scale, focus ring). Leading calendar icon from `useIcons()`, formatted value or placeholder, clear button once a value is set.
- `variant="ghost"`: inline text look (Notion ref), fluid hover background like menu rows.
- Labels (via `Intl`):
  - single: `Wed Oct 21`; `Wed Oct 21, 2027` when the year is not the current one.
  - range: `Oct 21 → Oct 24`.
  - date + time: two segments in one row, `Wed Oct 21` and `11:00 → 12:45 1h 45min`. **Each segment opens its own popover.**

### 6.2 Date popover

- Contains `calendar` (range defaults to `numberOfMonths={2}`, `orientation="auto"`).
- Focus moves to the selected day (or today) on open. Escape closes and returns focus to the trigger.
- Single: closes on select. Range: closes after the end is picked.
- **Presets** (range): optional `presets` prop (`{ label, range }[]`), off by default. Renders a fluid hover list beside the calendar (below it in a vertical or narrow layout). Selecting a preset sets the range and moves the visible month to it.

### 6.3 Time popover

- `time` (single time) or `timeRange` (start → end with duration).
- Scrollable slot list styled as Dropdown rows: one fluid hover scope, gap-0, `step` prop (default 15 min). Opens scrolled to the current value, or to now if empty.
- End list starts one `step` after the start (11:00 start → first row 11:15) and shows a muted duration on each row: `15min`, `30min`, `1h`, `1h 15min`, `1h 45min` (Notion ref).
- Changing the start keeps the duration and moves the end.
- Each time in the trigger is editable text: type `1130`, `11:30`, `11:30am`; typing filters/highlights the nearest slot (DropdownSearch-style keystroke redirection); Enter commits.
- 12h/24h from the locale (`Intl`), `hourCycle` prop overrides.
- Same-day only.

## 7. Motion

- Springs from `lib/springs.ts` only.
- Month change: direction-aware 8 to 12px slide + crossfade on `moderate`, caption text too. Two months side by side: the strip slides a full month width (carousel), no crossfade. Grid height animates between 5- and 6-week months by **measuring `offsetHeight`** (never `"auto"`, see framer-under-scale note). Reduced motion: crossfade only.
- Selected weight change via `fontVariationSettings` (no layout shift).
- Popover enter/exit follow the existing popup pattern for each flavor.
- Add `calendar` / `date-picker` to `REFERENCE_TIERS` on `/docs/motion` and to `motion-guidelines.md`.

## 8. Keyboard and accessibility

- DayPicker grid keys: arrows, PageUp/PageDown (month), Shift+PageUp/PageDown (year), Home/End (week). Grid = one tab stop (roving tabindex).
- Fluid hover highlight follows keyboard focus (Dropdown rule). Animated focus ring (2px outward `border`, `var(--focus-ring, #6B97FF)`) on `:focus-visible` only, drawn above the highlight.
- Crossing a month boundary by keyboard: the highlight snaps to the new cell instead of gliding from the old grid (Sidebar snap-on-reflow).
- Range by keyboard: Enter = start, focus drives the range preview, Enter = end, Escape before the second Enter restores the previous range.
- Booked/unavailable days: `aria-disabled`, skipped by DayPicker focus. Booked gets an accessible label suffix (e.g. "booked").
- Time inputs: labelled, slot list is a listbox with `aria-activedescendant` or roving focus consistent with Dropdown.
- Editable time fields use `useSize().field` / `fieldTouchClass` (16px on touch, iOS zoom).

## 9. Docs, demos, distribution

Follow `component-documentation-guidelines.md` and the component docs checklist:

- Pages: `app/docs/calendar/` and `app/docs/date-picker/` (page, demos, `layout.tsx` docMetadata), `lib/docs/api/calendar.ts` + `date-picker.ts`, entries in `lib/docs/components.ts`, `lib/docs/prompt-entries.ts`, `lib/docs/api/index.ts`.
- Playgrounds in `lib/docs/playgrounds/` (mode, months, orientation, cellSize, week numbers, booked/available, shape) so the rail and `/demo` pen menu both get controls.
- Demos: single, range (2 months horizontal + vertical), date + time (Notion-like event row with ghost triggers), booked/available (booking calendar), custom cell size + `fill`, week numbers, presets.
- **`/demo` slide + Showcase tile (home bento)**: both, user-confirmed. Showcase tile = range calendar.
- `registry.json` entries (+ generated `public/r/*.json`), Radix/Base flavor wiring, starter template includes them.
- FF skill: `skills/fluid-functionalism/references/components.md` (+ any craft notes), copy prompts.
- `/compare`: add shadcn Calendar / Date picker originals if the page covers them.
- Changelog entry for the month it ships.
- Copy follows `tone-of-voice.md` (no em dashes in user-facing text).

## 10. Testing

- Unit tests: matcher mapping (booked vs unavailable), range excluding booked days, ISO week numbers, duration formatting (`15min`, `1h`, `1h 15min`), time parsing (`1130`, `11:30am`), end-shift on start change, 12h/24h.
- Both flavors: open/close, focus return, exit animation not cut (Base `preventUnmountOnClose()`).
- `tests/registry-consistency.test.mjs` passes; install-lint harness on a fresh shadcn install for both flavors.
- Browser verification: fluid hover glide across months, keyboard snap at month boundary, `auto` orientation switch, dark mode, mobile width.

## 11. Open points (decide during build, defaults given)

- Value type: native `Date` (DayPicker default) for v1; time stored as `"HH:mm"` strings next to the date. Combined `Date` helpers optional.
- `timeZone`: pass-through only, no extra handling in v1.
- Exact `cellSize` defaults (36/32) to be tuned visually against Select height.
