// ── DataTable playground: sample data ────────────────────
// The same table over other kinds of records, so the playground reads as
// a bank statement, an inbox or a CRM as well as the component list. All
// of it is made up, and all of it is about this library: the springs, the
// hover highlight, the focus ring and the rules they live by.
//
// A row is its id (`slug`), its main text (`name`), and whatever its
// columns read. Links stay inside the docs.

import type { badgeColors } from "@/registry/default/badge";
import { componentList } from "@/lib/docs/components";
import type { DataTablePlayState } from "@/lib/preset/data-table-options";

export type BadgeColor = keyof typeof badgeColors;

export type SampleRow = {
  slug: string;
  name: string;
  subRows?: SampleRow[];
} & Record<string, unknown>;

/** One column of a sample table, by what it holds. */
export type SampleColumn =
  /** The row's main text: sorts, never hides, edits as text. */
  | { id: "name"; kind: "title"; label: string; icon: string }
  /** One of a few, as a badge: sorts, filters, edits from a menu. */
  | { id: string; kind: "badge"; label: string; icon: string; options: Record<string, BadgeColor> }
  | { id: string; kind: "bool"; label: string; icon: string }
  /** A number: sorts, edits from a list or by typing. `money` shows euros:
   *  "signed" with its sign always (money in and out), "plain" without. */
  | { id: string; kind: "number"; label: string; icon: string; options: readonly number[]; money?: "signed" | "plain" }
  | { id: string; kind: "date"; label: string; icon: string }
  | { id: string; kind: "tags"; label: string; icon: string; options: readonly string[] }
  /** A docs path shown as a link; beside the text, the cell edits. */
  | { id: string; kind: "link"; label: string; icon: string }
  /** Plain text. `grow` takes the width that is left (the last column);
   *  `short` is a name or a word that keeps one line even when text wraps. */
  | { id: string; kind: "text"; label: string; icon: string; grow?: boolean; sortable?: boolean; short?: boolean };

export interface SampleDataset {
  key: string;
  /** Its tab. */
  label: string;
  /** The table's heading. */
  title: string;
  /** "No <noun> match". */
  noun: string;
  searchPlaceholder: string;
  /** The empty search's nudge: "Try a name like …". */
  hint: string;
  columns: readonly SampleColumn[];
  /** The playground settings its tab opens with, over the defaults: each
   *  table shows the component set up another way. */
  settings: Partial<DataTablePlayState>;
  /** How it starts sorted, and which columns start hidden. */
  sort: { id: string; desc: boolean };
  hidden: Record<string, boolean>;
  rows: () => SampleRow[];
}

const docs = (slug: string) => `fluidfunctionalism.com/docs/${slug}`;

/** Whole euros: "+€250" / "−€64" signed, "€48,000" plain. */
export function formatMoney(value: number, signed: boolean) {
  const amount = `€${Math.abs(value).toLocaleString("en-US")}`;
  if (value < 0) return `−${amount}`;
  return signed && value > 0 ? `+${amount}` : amount;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");
/** The last twelve months, oldest first: December 2025 to November 2026. */
const YEAR = Array.from({ length: 12 }, (_, i) => {
  const month = (i + 11) % 12;
  return { year: i === 0 ? 2025 : 2026, month, name: MONTH_NAMES[month] };
});
// Nothing dated after the table was written: the last month stops at the 12th.
const day = (m: (typeof YEAR)[number], d: number) =>
  `${m.year}-${pad(m.month + 1)}-${pad(m.month === 10 && m.year === 2026 ? 1 + ((d - 1) % 12) : d)}`;

// ── Transactions ─────────────────────────────────────────
// The studio's account: what it costs to keep an interface moving.

type Tx = [slug: string, name: string, category: string, amount: number, added: string, tags: string[], doc: string, note: string, parts?: [string, number][]];

const TRANSACTIONS: Tx[] = [
  ["springs", "Spring wholesale, three tiers", "Motion", -120, "2026-11-09", ["Recurring"], "motion", "Fast, moderate and slow. A fourth was offered and sent back unopened.", [["Fast", -30], ["Moderate", -40], ["Slow", -50]]],
  ["bounce-refund", "Refund: bounce", "Motion", 48, "2026-07-03", ["Refund"], "motion", "Moderate went to bounce 0. The supplier took the rest back."],
  ["linear-disposal", "Linear easing, disposal fee", "Motion", -15, "2026-02-18", ["One-off"], "motion", "Collected at a constant rate, as you would expect."],
  ["hover-highlight", "Hover highlight, one unit", "Components", -64, "2026-02-16", ["One-off"], "fluid-hover", "One per list. A second was declined at checkout."],
  ["focus-ring", "Focus ring, 1px, blue", "Components", -6, "2026-07-03", ["One-off"], "motion", "#6B97FF, sold by the pixel and drawn 2px out."],
  ["layout-shift", "Layout shift insurance", "Components", -40, "2026-11-01", ["Recurring"], "typography", "Covers labels that change weight. No claim filed so far."],
  ["skeleton-rental", "Skeleton rental, 1.5 seconds", "Components", -3, "2026-11-08", ["One-off"], "data-table", "Returned the moment the data landed."],
  ["tooltip-bubble", "Tooltip group, one shared bubble", "Components", -18, "2026-11-12", ["One-off"], "tooltip", "It glides between the icons, so one was enough."],
  ["scrollbar-thumbs", "Scrollbar thumbs, overlay", "Components", -9, "2026-09-02", ["One-off"], "scrollbars", "Three shades: 8, 12 and 16 percent."],
  ["inter", "Inter Variable, optical size axis", "Type", 0, "2026-02-16", ["One-off"], "typography", "Open source. The axis came included."],
  ["heading-serif", "Geist Serif, heading trial", "Type", -29, "2026-10-21", ["One-off"], "typography", "Press F on any page to try another."],
  ["text-box-trim", "Text-box trim, both edges", "Type", -12, "2026-08-11", ["One-off"], "typography", "The padding you set is now the space you see."],
  ["em-dash", "Em dash removal service", "Type", -35, "2026-09-06", ["One-off"], "typography", "Found 212. Left none."],
  ["pill-upgrade", "Pill corners upgrade", "Shape", -20, "2026-06-14", ["One-off"], "surfaces", "Fully round. Menus stayed rounded on purpose."],
  ["sharp-downgrade", "Refund: sharp corners", "Shape", 19, "2026-11-10", ["Refund"], "surfaces", "Kept 1px of radius, so 1 euro stayed with the shop."],
  ["dark-mode", "Dark mode, second coat", "Shape", -30, "2026-05-02", ["One-off"], "surfaces", "light-dark() on every token, one source for both."],
  ["hosting", "Hosting", "Running costs", -20, "2026-11-01", ["Recurring"], "skill", "The registry, the docs and this very table."],
  ["domain", "Domain renewal", "Running costs", -14, "2026-10-02", ["Recurring", "Tax"], "skill", "fluidfunctionalism.com, for another year."],
  ["sponsors", "Sponsors payout", "Income", 250, "2026-11-05", ["Recurring"], "skill", "From people who like their menus to glide."],
  ["icon-set", "Icon set sales", "Income", 490, "2026-11-04", ["Tax"], "skill", "The paid set, on its own little site."],
  ["stars-cake", "500 stars cake", "Team", -55, "2026-10-12", ["Team"], "skill", "Clipped to an Inter Bold 500.", [["Cake", -40], ["Candles, 500", -15]]],
  ["coffee", "Coffee, launch week", "Team", -86, "2026-11-08", ["Team"], "data-table", "The table shipped. So did the espresso.", [["Espresso, 14", -42], ["Oat flat white, 9", -36], ["Decaf, by mistake", -8]]],
];

// A year of the lines a statement repeats, month after month, each with
// a note that changes: [name, category, amount for month i, day, doc, notes].
const TX_MONTHLY: [string, string, (i: number) => number, number, string, string[]][] = [
  ["Hosting", "Running costs", () => -20, 1, "skill", ["The registry, the docs and this very table.", "Same price, more components.", "Paid on the first, like a metronome."]],
  ["Sponsors payout", "Income", (i) => 140 + i * 10, 5, "skill", ["From people who like their menus to glide.", "One new sponsor this month.", "Someone rounded up. Thank you, whoever you are."]],
  ["Layout shift insurance", "Components", () => -40, 1, "typography", ["Covers labels that change weight.", "No claim filed this month either.", "The premium has never moved. Fitting."]],
  ["Icon set sales", "Income", (i) => 210 + ((i * 37) % 9) * 35, 4, "skill", ["The paid set, on its own little site.", "A studio bought five seats.", "Somebody finally needed the grid icon."]],
  ["Spring maintenance", "Motion", () => -12, 9, "motion", ["All three tiers checked. None of them bounce.", "Fast is still fast.", "Slow was late to its own inspection."]],
  ["Coffee", "Team", (i) => -(38 + ((i * 13) % 7) * 6), 8, "data-table", ["Mostly espresso.", "A release week. It shows.", "Oat milk has its own line now.", "Somebody ordered decaf. Nobody owned up."]],
  ["Pixel audit", "Components", () => -16, 15, "sizes", ["Every control still lands on the 36 and 28 ladder.", "One icon was half a pixel off. It has been spoken to.", "Nothing to report, which is the report."]],
];

const TX_CATEGORY: Record<string, BadgeColor> = {
  Motion: "blue",
  Components: "violet",
  Type: "amber",
  Shape: "pink",
  "Running costs": "gray",
  Income: "green",
  Team: "orange",
};

const transactions: SampleDataset = {
  key: "transactions",
  label: "Transactions",
  title: "Transactions",
  noun: "transactions",
  searchPlaceholder: "Search transactions…",
  hint: "Try a name like Refund or Coffee.",
  // A statement to read, not to work in: no boxes, no row menus, nothing
  // to drag. Searched across every column, filtered and saved as views,
  // and a split payment opens into its parts.
  settings: {
    filter: "all",
    viewMenu: false,
    selection: false,
    rowActions: false,
    resize: false,
    reorder: false,
    pinRight: false,
    expandable: true,
  },
  sort: { id: "added", desc: true },
  hidden: {},
  columns: [
    { id: "name", kind: "title", label: "Description", icon: "file" },
    { id: "category", kind: "badge", label: "Category", icon: "folder", options: TX_CATEGORY },
    { id: "amount", kind: "number", label: "Amount", icon: "sliders-horizontal", options: [-100, -50, -20, -10, 50, 100], money: "signed" },
    { id: "added", kind: "date", label: "Date", icon: "calendar" },
    { id: "tags", kind: "tags", label: "Tags", icon: "tag", options: ["One-off", "Recurring", "Refund", "Tax", "Team"] },
    { id: "website", kind: "link", label: "Receipt", icon: "link" },
    { id: "summary", kind: "text", label: "Note", icon: "info", grow: true },
  ],
  rows: () => [
    ...TRANSACTIONS.map(([slug, name, category, amount, added, tags, doc, note, parts]) => ({
      slug,
      name,
      category,
      amount,
      added,
      tags: [...tags],
      website: docs(doc),
      summary: note,
      subRows: parts?.map(([part, share]) => ({
        slug: `${slug}/${part}`,
        name: part,
        category,
        amount: share,
        added,
        tags: [],
        website: docs(doc),
        summary: `Part of ${name}.`,
      })),
    })),
    ...YEAR.flatMap((month, i) =>
      TX_MONTHLY.map(([name, category, amount, date, doc, notes]) => ({
        slug: `${name.toLowerCase().replace(/ /g, "-")}-${month.year}-${pad(month.month + 1)}`,
        name: `${name}, ${month.name}`,
        category,
        amount: amount(i),
        added: day(month, date),
        tags: ["Recurring"],
        website: docs(doc),
        summary: notes[i % notes.length],
      }))
    ),
  ],
};

// ── Inbox ────────────────────────────────────────────────
// Mail from the parts of the system, each with something to say.

type Mail = [slug: string, subject: string, from: string, label: string, size: number, added: string, tags: string[], preview: string, replies?: [string, string, string][]];

const MAIL: Mail[] = [
  ["bounce-talk", "We need to talk about my bounce", "Moderate Spring", "Feedback", 4, "2026-07-03", ["Needs reply"], "You set me to 0 without a word. I had range.", [["Re: We need to talk about my bounce", "Fast Spring", "I never had any. You get used to it."], ["Re: Re: We need to talk about my bounce", "Slow Spring", "I will reply properly when I arrive."]]],
  ["following", "I have been following your cursor", "Hover Highlight", "Fan mail", 2, "2026-11-11", ["Unread", "Starred"], "From item to item, all day. It is my whole job and I love it."],
  ["under-pointer", "A question about empty space", "Hover Highlight", "Feedback", 3, "2026-10-27", [], "When you leave the list, I now go out. Understood. No hard feelings."],
  ["complaint", "Formal complaint", "Linear Easing", "Feedback", 6, "2026-02-17", ["Needs reply"], "I was replaced by a spring. I would like that on record, at a constant rate."],
  ["come-back", "Can I come back?", "Em Dash", "Feedback", 1, "2026-09-07", ["Unread"], "I have changed. I am a comma now."],
  ["weight", "Your label keeps changing weight", "Layout", "Bug", 5, "2026-03-12", [], "And yet nothing around it moves. I have checked twice. Closing this."],
  ["one-pixel", "I was only one pixel", "Focus Ring", "Bug", 2, "2026-07-04", ["Starred"], "Drawn two pixels out and still you noticed me. Only on the keyboard, though."],
  ["never-wrap", "I never wrap", "Button Label", "Feedback", 1, "2026-10-12", [], "Squeeze me again and I will hide the whole row instead."],
  ["shape-urgent", "Pill or rounded? Urgent", "Shape Context", "Feedback", 3, "2026-06-13", ["Needs reply"], "Sharp has now applied as well. Please advise before the next render."],
  ["invoice", "Invoice 0042: one focus ring", "Blue & Sons", "Billing", 48, "2026-07-06", [], "1px, color #6B97FF, net 30 days. Thank you for your business."],
  ["opsz", "Optical size axis reporting for duty", "Inter", "Fan mail", 2, "2026-02-16", ["Starred"], "Big text gets tighter, small text gets room. You will not have to ask."],
  ["out-of-office", "Out of office", "Skeleton", "Automated", 1, "2026-11-08", ["Automated"], "I am standing in for your rows. Back when the data lands."],
  ["my-side", "Your neighbor took my side", "Tooltip", "Bug", 4, "2026-11-12", ["Unread"], "It flipped below, so I went below too. We are a group now."],
  ["fourth-spring", "Feature request: a fourth spring", "Anonymous", "Feedback", 2, "2026-07-02", [], "Declined. Three is the system. We did remove one to be sure."],
  ["has-selector", "Unsubscribe", ":has() selector", "Automated", 1, "2026-11-11", ["Automated"], "You stopped calling. I used to restyle the whole page for you."],
  ["deps", "Dependency watch: Monday", "Deps Routine", "Automated", 12, "2026-11-09", ["Automated"], "Three upgrades, zero surprises, one draft pull request."],
  ["readme", "README drift detected", "Audit Routine", "Automated", 9, "2026-11-09", ["Automated", "Unread"], "Two components shipped since the README last looked."],
  ["stars", "You reached 500 stars", "GitHub", "Press", 7, "2026-10-12", ["Starred"], "There is a hidden page for that. Nobody has found it yet."],
  ["button-or-link", "Is this a button or a link?", "A designer who codes a little", "Feedback", 3, "2026-08-20", ["Needs reply"], "It goes somewhere, so a link. It does something, so a button. Thank you, I think."],
  ["welcome", "Welcome to the registry", "shadcn CLI", "Automated", 2, "2026-02-16", ["Automated"], "One command per component. I will rewrite your imports, do not worry."],
];

// A note from every component in the library, in one of a few moods:
// [subject, preview, label, tags].
const COMPONENT_MAIL: [(name: string) => string, (name: string) => string, string, string[]][] = [
  [(n) => `${n} here. A small request`, (n) => `Could I have 2px more padding? ${n} will not ask again.`, "Feedback", ["Needs reply"]],
  [(n) => `Out of office: ${n}`, () => "Unmounted until someone opens me. Messages will be read on mount.", "Automated", ["Automated"]],
  [(n) => `${n} would like a word with Tooltip`, () => "It keeps explaining me to people. I am self-explanatory.", "Feedback", []],
  [(n) => `Someone hovered ${n} 4,000 times`, () => "I counted. The highlight kept up with every one.", "Fan mail", ["Starred"]],
  [(n) => `${n}: I got a dark mode`, () => "Same shape, new tokens. Nobody had to write a second stylesheet.", "Fan mail", []],
  [(n) => `Please stop inspecting ${n}`, () => "Yes, the padding is even. You have measured it three times.", "Feedback", ["Unread"]],
  [(n) => `${n} passed the keyboard test`, () => "Tab in, arrows around, Esc out. The ring showed up for all of it.", "Press", []],
  [(n) => `Standup notes from ${n}`, () => "Yesterday: rendered. Today: rendering. Blockers: none.", "Automated", ["Automated"]],
];

// The routines that write in on a schedule: [subject for the month, from, preview, day].
const ROUTINE_MAIL: [(month: string) => string, string, string[], number][] = [
  [(m) => `Dependency watch: ${m}`, "Deps Routine", ["Three upgrades, zero surprises, one draft pull request.", "One major version. Opened as a draft, to be safe.", "Nothing to upgrade. Enjoy the quiet."], 9],
  [(m) => `README audit: ${m}`, "Audit Routine", ["Two components shipped since the README last looked.", "The install table is up to date.", "One renamed page. Fixed in a pull request."], 2],
  [(m) => `Changelog draft: ${m}`, "Changelog Routine", ["Drafted on the first Friday, as agreed. No em dashes.", "A short month. Three lines.", "Counts first, then the mechanism. Ready for review."], 6],
  [(m) => `Open issues review: ${m}`, "Issues Routine", ["Four open, two with replies drafted, none posted.", "One duplicate found. Reply drafted.", "A quiet week. One question about springs."], 16],
];

const MAIL_LABEL: Record<string, BadgeColor> = {
  Feedback: "blue",
  Bug: "red",
  Billing: "amber",
  "Fan mail": "pink",
  Press: "green",
  Automated: "gray",
};

const inbox: SampleDataset = {
  key: "inbox",
  label: "Inbox",
  title: "Inbox",
  noun: "messages",
  searchPlaceholder: "Search mail…",
  hint: "Try a subject like Invoice or Unsubscribe.",
  // A list to triage: boxes and a row menu, previews wrapped in full and
  // read from the top, and threads that open. No filters, no column
  // tools, nothing frozen on the left.
  settings: {
    viewMenu: false,
    filters: false,
    views: false,
    resize: false,
    reorder: false,
    pinning: false,
    lines: "wrap",
    align: "top",
    expandable: true,
  },
  sort: { id: "added", desc: true },
  hidden: { size: false },
  columns: [
    { id: "name", kind: "title", label: "Subject", icon: "mail" },
    { id: "from", kind: "text", label: "From", icon: "user", sortable: true, short: true },
    { id: "label", kind: "badge", label: "Label", icon: "folder", options: MAIL_LABEL },
    { id: "size", kind: "number", label: "Size (KB)", icon: "sliders-horizontal", options: [1, 2, 5, 10, 50] },
    { id: "added", kind: "date", label: "Received", icon: "calendar" },
    { id: "tags", kind: "tags", label: "Tags", icon: "tag", options: ["Automated", "Needs reply", "Starred", "Unread"] },
    { id: "summary", kind: "text", label: "Preview", icon: "message-circle", grow: true },
  ],
  rows: () => [
    ...MAIL.map(([slug, name, from, label, size, added, tags, preview, replies]) => ({
      slug,
      name,
      from,
      label,
      size,
      added,
      tags: [...tags],
      summary: preview,
      subRows: replies?.map(([subject, sender, text], i) => ({
        slug: `${slug}/${i}`,
        name: subject,
        from: sender,
        label,
        size: 1,
        added,
        tags: [],
        summary: text,
      })),
    })),
    ...componentList.map(({ slug, name }, i) => {
      const [subject, preview, label, tags] = COMPONENT_MAIL[i % COMPONENT_MAIL.length];
      return {
        slug: `from-${slug}`,
        name: subject(name),
        from: name,
        label,
        size: 1 + ((i * 7) % 6),
        added: day(YEAR[(i * 5) % 12], 1 + ((i * 11) % 27)),
        tags: [...tags],
        summary: preview(name),
      };
    }),
    ...YEAR.flatMap((month, i) =>
      ROUTINE_MAIL.map(([subject, from, previews, date]) => ({
        slug: `${from.toLowerCase().replace(/ /g, "-")}-${month.year}-${pad(month.month + 1)}`,
        name: subject(month.name),
        from,
        label: "Automated",
        size: 6 + ((i * 3) % 8),
        added: day(month, date),
        tags: ["Automated"],
        summary: previews[i % previews.length],
      }))
    ),
  ],
};

// ── CRM ──────────────────────────────────────────────────
// The accounts: companies that should, in fairness, all be customers.

type Account = [slug: string, name: string, stage: string, deal: number, added: string, tags: string[], doc: string, note: string, contacts?: [string, string][]];

const ACCOUNTS: Account[] = [
  ["bezier", "Bezier & Sons", "Lost", 12000, "2026-03-02", ["Agency"], "motion", "Still tuning curves by hand, four numbers at a time. Not ready for springs."],
  ["ease-in", "Ease-In Capital", "Proposal", 48000, "2026-11-06", ["Finance"], "motion", "Wants every modal to arrive fashionably late. We are talking them out of it."],
  ["stagger", "Stagger Labs", "Won", 32000, "2026-10-17", ["Startup"], "reveal", "Bought page reveals for the whole landing page, one block after another.", [["Ada, Head of Entrances", "Signs things off in order, 40ms apart."], ["Lin, Delay Coordinator", "Prefers email. Replies slightly after everyone else."]]],
  ["keyframe", "Keyframe Logistics", "Qualified", 21000, "2026-09-30", ["Enterprise"], "motion", "Ships from 0% to 100%. Curious what happens in between."],
  ["layout-shift", "Layout Shift Inc.", "Lost", 9000, "2026-04-22", ["Startup"], "typography", "Churned. Their numbers kept jumping while we read them."],
  ["tabular", "Tabular Nums Accounting", "Won", 15000, "2026-08-05", ["Finance"], "typography", "Every digit the same width. The partners got emotional."],
  ["pill-rounded", "Pill & Rounded LLP", "Proposal", 27000, "2026-11-10", ["Agency"], "surfaces", "The two partners cannot agree on a radius. Shape context may settle it.", [["P. Pill, Partner", "Fully round on everything."], ["R. Rounded, Partner", "8px and not a pixel more."]]],
  ["sharp", "Sharp Corners Legal", "Qualified", 18000, "2026-11-10", ["Enterprise"], "surfaces", "1px of radius, no exceptions, and they want it in writing."],
  ["overshoot", "Overshoot Bank", "Lead", 60000, "2026-07-01", ["Finance"], "motion", "Asked for bounce on the account balance. We said no."],
  ["hover-glide", "Hover & Glide Airlines", "Won", 44000, "2026-10-28", ["Enterprise"], "fluid-hover", "One highlight follows you down the departures board."],
  ["focus-ring", "Focus Ring Security", "Won", 23000, "2026-07-08", ["Enterprise"], "motion", "Keyboard visitors are announced. Mouse visitors walk straight in."],
  ["dark-dairy", "Dark Mode Dairy", "Lead", 6000, "2026-05-14", ["Startup"], "surfaces", "Open late. Same milk, different tokens."],
  ["skeleton-crew", "Skeleton Crew Staffing", "Qualified", 14000, "2026-11-08", ["Agency"], "data-table", "Fills in until the real team loads, then steps aside without a flicker."],
  ["tooltip-travel", "Tooltip Travel", "Proposal", 11000, "2026-11-12", ["Startup"], "tooltip", "One bubble, many destinations, always on the same side."],
  ["opacity", "Opacity Partners", "Lead", 30000, "2026-06-03", ["Finance"], "surfaces", "Hard to read. About 40 percent committed."],
  ["scroll-fade", "Scroll Fade Films", "Won", 19000, "2026-09-10", ["Agency"], "scrollbars", "Every ending dissolves at the edge of the frame."],
  ["combobox", "Combobox Catering", "Qualified", 8000, "2026-09-06", ["Startup"], "combobox", "Type what you want or pick from the list. Either way it arrives as a chip."],
  ["command", "Command Menu Couriers", "Won", 36000, "2026-09-08", ["Enterprise"], "command-menu", "Everything is one shortcut away, parcels included.", [["Kit, Dispatcher", "Answers to Cmd+K only."]]],
  ["z-index", "Z-Index Towers", "Lost", 99990, "2026-02-27", ["Enterprise"], "surfaces", "Wanted to sit on top of everything. 9,999 floors and still not enough."],
  ["dropdown", "Dropdown Elevators", "Lead", 16000, "2026-11-08", ["Startup"], "dropdown", "Opens on hover now. Nobody is forced to get in."],
];

// More accounts than anyone could write by hand: a trade and a kind of
// company, each with half of the note. [word, docs page, what they want].
const TRADES: [string, string, string][] = [
  ["Kerning", "typography", "Wants the letters closer. Then further apart. Then closer."],
  ["Baseline", "typography", "Everything they own sits on the same line."],
  ["Gutter", "sizes", "Sells the space between things, by the pixel."],
  ["Viewport", "sidebar", "Looks different every time you resize them."],
  ["Glyph", "typography", "One character, extremely well drawn."],
  ["Leading", "typography", "Keeps a respectful distance between lines."],
  ["Contrast", "surfaces", "Light on dark, dark on light, never in between."],
  ["Token", "surfaces", "Names every color before they will use it."],
  ["Radius", "surfaces", "Has strong feelings about corners."],
  ["Easing", "motion", "Starts fast, arrives gently, every single time."],
  ["Tween", "motion", "Lives entirely between two states."],
  ["Cursor", "fluid-hover", "Goes wherever you point."],
  ["Hairline", "surfaces", "One pixel wide and proud of it."],
  ["Chevron", "dropdown", "Always pointing at something."],
  ["Checkbox", "checkbox", "Sees the world as done or not done."],
  ["Placeholder", "input", "Will be replaced by something real soon."],
];
const KINDS: [string, string, string][] = [
  ["Works", "Agency", "Family run since the first keyframe."],
  ["& Co.", "Finance", "The Co. is a spreadsheet."],
  ["Collective", "Agency", "Decides everything by consensus, slowly."],
  ["Systems", "Enterprise", "Procurement needs three quotes and a diagram."],
  ["Studio", "Startup", "Four people and a very nice plant."],
  ["Holdings", "Enterprise", "Nobody is sure what they hold."],
];
const STAGES = ["Lead", "Qualified", "Proposal", "Won", "Lost"];

const STAGE: Record<string, BadgeColor> = {
  Lead: "gray",
  Qualified: "blue",
  Proposal: "amber",
  Won: "green",
  Lost: "red",
};

const crm: SampleDataset = {
  key: "crm",
  label: "CRM",
  title: "Accounts",
  noun: "accounts",
  searchPlaceholder: "Search accounts…",
  hint: "Try a name like Stagger or Overshoot.",
  // A table to work in: every cell edits in place, headers carry icons,
  // columns resize, reorder and freeze on both sides, and each account
  // opens into its contacts.
  settings: {
    headerIcons: true,
    editable: true,
    expandable: true,
  },
  sort: { id: "added", desc: true },
  hidden: {},
  columns: [
    { id: "name", kind: "title", label: "Account", icon: "users" },
    { id: "stage", kind: "badge", label: "Stage", icon: "folder", options: STAGE },
    { id: "deal", kind: "number", label: "Deal", icon: "sliders-horizontal", options: [5000, 10000, 20000, 50000], money: "plain" },
    { id: "added", kind: "date", label: "Last contact", icon: "calendar" },
    { id: "tags", kind: "tags", label: "Tags", icon: "tag", options: ["Agency", "Enterprise", "Finance", "Startup"] },
    { id: "website", kind: "link", label: "Interested in", icon: "link" },
    { id: "summary", kind: "text", label: "Notes", icon: "info", grow: true },
  ],
  rows: () => [
    ...ACCOUNTS.map(([slug, name, stage, deal, added, tags, doc, note, contacts]) => ({
      slug,
      name,
      stage,
      deal,
      added,
      tags: [...tags],
      website: docs(doc),
      summary: note,
      subRows: contacts?.map(([person, about], i) => ({
        slug: `${slug}/${i}`,
        name: person,
        stage,
        deal: 0,
        added,
        tags: [],
        website: docs(doc),
        summary: about,
      })),
    })),
    ...TRADES.flatMap(([trade, doc, wants], t) =>
      KINDS.map(([kind, tag, about], k) => {
        const n = t * KINDS.length + k;
        return {
          slug: `${trade}-${kind}`.toLowerCase().replace(/[^a-z]+/g, "-"),
          name: `${trade} ${kind}`,
          stage: STAGES[(n * 7 + t) % STAGES.length],
          deal: 4000 + ((n * 37) % 23) * 2500,
          added: day(YEAR[(n * 5) % 12], 1 + ((n * 13) % 27)),
          tags: [tag],
          website: docs(doc),
          summary: `${wants} ${about}`,
        };
      })
    ),
  ],
};

export const SAMPLE_DATASETS = [transactions, inbox, crm] as const;
