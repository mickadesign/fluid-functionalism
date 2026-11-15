// @vitest-environment jsdom
// An install is its playground: for each installable preset, the playground's
// preview and the block the Copy prompt installs are drawn for the same code
// and must match, element for element. A playground changed without its
// generator (or the reverse) fails here.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { firstDifference, installSignature, playgroundSignature, stubBrowser, type ParityCase } from "./helpers/preset-parity";
import { decodePreset, encodePreset } from "@/lib/preset/codec";
import { encodeDataTablePreset } from "@/lib/preset/data-table-options";
import { CALENDAR_DEFAULT_CODE } from "@/lib/preset/calendar-options";
import { CARD_DEFAULT_CODE } from "@/lib/preset/card-options";
import { AUQ_DEFAULT_CODE } from "@/lib/preset/ask-user-questions-options";
import { DROPDOWN_DEFAULT_CODE } from "@/lib/preset/dropdown-options";
import { DATE_PICKER_DEFAULT_CODE } from "@/lib/preset/date-picker-options";
import { COMMAND_MENU_DEFAULT_CODE } from "@/lib/preset/command-menu-options";
import { COMBOBOX_DEFAULT_CODE } from "@/lib/preset/combobox-options";
import { INPUT_MESSAGE_DEFAULT_CODE } from "@/lib/preset/input-message-options";
import { SIDEBAR_DEFAULT_CODE } from "@/lib/preset/components";

beforeAll(() => {
  stubBrowser();
  // One day for both sides, at noon UTC: "today" is the same date in the
  // playground (which reads it in UTC) and the install (which reads it
  // locally), whatever the machine's time zone.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
});
afterEach(cleanup);

/** The playground signs its user row with the site author's name and
 *  photo; an install ships a placeholder person instead (nobody's identity
 *  goes into someone else's app). Both read as "a person" here. */
function placeholderIdentity(signature: string): string {
  return signature
    .split("\n")
    .filter((line) => !/<img class="-outline-offset-1|<span class="bg-muted-foreground flex items-center justify-center rounded-full size-5|^\s*"J"$/.test(line))
    .join("\n")
    .replaceAll("Micka Touillaud", "PERSON")
    .replaceAll("Jane Doe", "PERSON")
    // The callouts announce the site's own news; an install's are sample
    // announcements to replace.
    .replace(/<a aria-label="[^"]*" href/g, '<a aria-label="CALLOUT" href')
    .replace(/"(Sidebar is here|500 stars|Motion guidelines|Aurora 2 is here|New workspace roles|Dark mode shipped)"/g, '"CALLOUT TITLE"')
    .replace(/"(New in Fluid Functionalism|Find the hidden mosaic|Three spring tiers, one page|Longer context, faster agents|Owner, editor, viewer|Follows your system)"/g, '"CALLOUT TEXT"');
}

const CASES: ParityCase[] = [
  { slug: "data-table", code: encodeDataTablePreset({}), main: "components/data-table-demo.tsx", exportName: "DataTableDemo" },
  { slug: "calendar", code: CALENDAR_DEFAULT_CODE, main: "components/calendar-demo.tsx", exportName: "CalendarDemo" },
  { slug: "card", code: CARD_DEFAULT_CODE, main: "components/card-section.tsx", exportName: "CardSection" },
  { slug: "ask-user-questions", code: AUQ_DEFAULT_CODE, main: "components/question-flow.tsx", exportName: "QuestionFlow" },
  { slug: "dropdown", code: DROPDOWN_DEFAULT_CODE, main: "components/dropdown-demo.tsx", exportName: "DropdownDemo" },
  { slug: "date-picker", code: DATE_PICKER_DEFAULT_CODE, main: "components/date-picker-demo.tsx", exportName: "DatePickerDemo" },
  // An app opens the menu as a dialog; the playground has one too, under
  // its in-place copy. The two dialogs are compared.
  { slug: "command-menu", code: COMMAND_MENU_DEFAULT_CODE, main: "components/command-menu-demo.tsx", exportName: "CommandMenuDemo", open: "Open", root: "[role=dialog] [data-slot=command-menu]" },
  { slug: "combobox", code: COMBOBOX_DEFAULT_CODE, main: "components/combobox-demo.tsx", exportName: "ComboboxDemo" },
  { slug: "input-message", code: INPUT_MESSAGE_DEFAULT_CODE, main: "components/chat-composer.tsx", exportName: "ChatComposer" },
  // The page fills the window where the preview fills its frame, so the
  // sidebar's own box differs: what is inside it is compared.
  { slug: "sidebar", code: SIDEBAR_DEFAULT_CODE, main: "app/sidebar/page.tsx", root: "[data-slot=sidebar]", inside: true, normalize: placeholderIdentity },
];

// Besides each preset as it starts: a few of its other settings, picked by
// a seeded generator so a failure repeats. The three site-wide settings
// (flavor, shape, size) stay at their defaults: both sides are drawn inside
// the same providers, and those are the site's to set.
const GLOBAL_KEYS = new Set(["flavor", "shape", "size"]);
const VARIANTS = 12;

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function variants(c: ParityCase, seed: number): ParityCase[] {
  const decoded = decodePreset(c.code);
  if (!decoded.ok) throw new Error(decoded.error);
  const { def } = decoded;
  const rand = rng(seed);
  const codes = new Set<string>();
  for (let i = 0; i < VARIANTS * 4 && codes.size < VARIANTS; i++) {
    const preset: Record<string, string | number | boolean> = {};
    for (const field of def.versions[def.currentVersion]) {
      if (GLOBAL_KEYS.has(field.key)) continue;
      preset[field.key] = field.values[Math.floor(rand() * field.values.length)];
    }
    const code = encodePreset(def, preset);
    if (code !== c.code) codes.add(code);
  }
  return [...codes].map((code) => ({ ...c, code }));
}

// retry: a real difference fails every time; a page read a moment too
// early on a loaded machine does not.
describe("preset parity: the install draws what the playground draws", { retry: 2 }, () => {
  for (const [i, c] of CASES.entries()) {
    for (const each of [c, ...variants(c, 100 + i)]) {
      it(`${each.slug} ${each.code}`, async () => {
        const inst = await installSignature(each);
        const play = await playgroundSignature(each, inst.split("\n")[0]);
        expect(firstDifference(play, inst), `${each.slug} ${each.code}`).toBeNull();
      });
    }
  }
});
