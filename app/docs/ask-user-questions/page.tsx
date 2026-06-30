"use client";

import { useState, type ReactNode } from "react";
import {
  AskUserQuestions,
  type AskUserAnswer,
  type AskUserQuestion,
} from "@/registry/default/ask-user-questions";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { useIcon } from "@/lib/icon-context";

/**
 * Wraps a ComponentPreview with a Replay button that fully resets the demo.
 * Bumps an internal `replayKey` to remount the example (clears all internal
 * state), and optionally invokes `onReset` for parents that own controlled
 * state (e.g. currentIndex / answers).
 *
 * Pattern mirrors the ThinkingSteps doc page's playback button.
 */
function ReplayableExample({
  code,
  onReset,
  align,
  minHeightClass,
  children,
}: {
  code: string;
  onReset?: () => void;
  align?: "center" | "bottom";
  minHeightClass?: string;
  children: (replayKey: number) => ReactNode;
}) {
  const [replayKey, setReplayKey] = useState(0);
  const RotateIcon = useIcon("rotate-ccw");
  return (
    <ComponentPreview
      code={code}
      align={align}
      minHeightClass={minHeightClass}
      padding="responsive"
      playbackButton={{
        icon: <RotateIcon size={16} strokeWidth={1.5} />,
        tooltip: "Replay",
        onClick: () => {
          onReset?.();
          setReplayKey((k) => k + 1);
        },
      }}
    >
      {children(replayKey)}
    </ComponentPreview>
  );
}

// ── Code snippets ──────────────────────────────────────────────

const exampleCode = `import { AskUserQuestions } from "./components";

const questions = [
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
    id: "name",
    title: "What should we call your workspace?",
    freeText: true,
    freeTextMultiline: false, // single-line; Enter submits
    freeTextPlaceholder: "e.g. Acme Design",
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

<AskUserQuestions
  questions={questions}
  onComplete={(answers) => console.log(answers)}
/>`;

const multipleCode = `const questions = [
  {
    id: "role",
    title: "What's your role?",
    options: [
      { id: "design", title: "Designer", description: "Visual / interaction" },
      { id: "eng", title: "Engineer", description: "Frontend / backend" },
      { id: "pm", title: "PM", description: "Product / program" },
      { id: "research", title: "Researcher", description: "User / market research" },
    ],
  },
  {
    id: "tools",
    title: "Which tool do you use most?",
    options: [
      { id: "figma", title: "Figma", description: "Design source of truth" },
      { id: "vscode", title: "VS Code", description: "Code editor" },
      { id: "linear", title: "Linear", description: "Issue tracker" },
      { id: "notion", title: "Notion", description: "Docs and planning" },
    ],
  },
  {
    id: "team",
    title: "How big is your team?",
    options: [
      { id: "solo", title: "Just me", description: "Solo founder or freelancer" },
      { id: "small", title: "2–10", description: "Small team or pod" },
      { id: "mid", title: "11–50", description: "A few cross-functional teams" },
      { id: "large", title: "50+", description: "Full org" },
    ],
  },
  {
    id: "experience",
    title: "How long have you been doing this?",
    options: [
      { id: "lt1", title: "Less than a year", description: "Just getting started" },
      { id: "1to3", title: "1–3 years", description: "Finding your rhythm" },
      { id: "3to7", title: "3–7 years", description: "Comfortable in the craft" },
      { id: "gt7", title: "7+ years", description: "Seasoned" },
    ],
  },
];

<AskUserQuestions questions={questions} />`;

const multiSelectCode = `const questions = [
  {
    id: "features",
    title: "Which features should we prioritize?",
    multiSelect: true,
    options: [
      { id: "dm", title: "Dark mode", description: "System-aware theme switching" },
      { id: "a11y", title: "Accessibility", description: "Screen-reader and keyboard support" },
      { id: "perf", title: "Performance", description: "Faster initial load" },
      { id: "i18n", title: "Translations", description: "Multi-language support" },
    ],
    nextLabel: "Continue",
  },
  {
    id: "platforms",
    title: "Which platforms do you target?",
    multiSelect: true,
    options: [
      { id: "web", title: "Web", description: "Desktop browsers" },
      { id: "ios", title: "iOS", description: "iPhone and iPad" },
      { id: "android", title: "Android", description: "Phones and tablets" },
      { id: "desktop", title: "Native desktop", description: "macOS / Windows / Linux apps" },
    ],
  },
  {
    id: "integrations",
    title: "Which integrations matter most?",
    multiSelect: true,
    options: [
      { id: "slack", title: "Slack", description: "Notifications and approvals" },
      { id: "github", title: "GitHub", description: "PR and issue sync" },
      { id: "linear", title: "Linear", description: "Two-way ticket linking" },
      { id: "figma", title: "Figma", description: "Design hand-off" },
      { id: "calendar", title: "Calendar", description: "Schedule-aware reminders" },
    ],
  },
];

<AskUserQuestions questions={questions} />`;

const otherCode = `const questions = [
  {
    id: "blocker",
    title: "What's blocking you most right now?",
    options: [
      { id: "scope", title: "Scope", description: "Too much on the plate" },
      { id: "review", title: "Review", description: "Waiting on feedback" },
      { id: "infra", title: "Infra", description: "Tooling slows me down" },
    ],
    allowOther: true,
    otherPlaceholder: "Describe in your own words…",
  },
  {
    id: "improve",
    title: "Which area needs the most improvement?",
    options: [
      { id: "speed", title: "Speed", description: "Make the loop faster" },
      { id: "clarity", title: "Clarity", description: "Sharpen what good looks like" },
      { id: "alignment", title: "Alignment", description: "Get on the same page sooner" },
      { id: "quality", title: "Quality", description: "Raise the craft bar" },
    ],
    allowOther: true,
  },
  {
    id: "easier",
    title: "What would make your week easier?",
    options: [
      { id: "fewer", title: "Fewer meetings", description: "Reclaim deep work time" },
      { id: "decisions", title: "Faster decisions", description: "Unblock without escalation" },
      { id: "context", title: "More context", description: "Know the why upfront" },
    ],
    allowOther: true,
    otherPlaceholder: "Anything else?",
  },
];

<AskUserQuestions questions={questions} />`;

const skipCode = `const questions = [
  {
    id: "experience",
    title: "How long have you been using the product?",
    options: [
      { id: "new", title: "Less than a week", description: "Just getting started" },
      { id: "mid", title: "A few months", description: "Comfortable with basics" },
      { id: "long", title: "Over a year", description: "Power user" },
    ],
  },
  {
    id: "frequency",
    title: "How often do you use it?",
    options: [
      { id: "daily", title: "Daily", description: "Part of my routine" },
      { id: "weekly", title: "A few times a week", description: "When the work calls for it" },
      { id: "monthly", title: "A few times a month", description: "Occasional use" },
      { id: "rarely", title: "Rarely", description: "Once in a while" },
    ],
  },
  {
    id: "recommend",
    title: "Would you recommend it to a colleague?",
    options: [
      { id: "yes", title: "Yes", description: "Already have" },
      { id: "maybe", title: "Maybe", description: "Depends on the role" },
      { id: "no", title: "Not yet", description: "Needs more polish first" },
    ],
  },
];

<AskUserQuestions
  questions={questions}
  onSkip={(qId, idx) => console.log("skipped", qId, idx)}
/>`;

const stackedCode = `// Every question opts into the stacked layout. The set covers the
// same edge cases as the first example — single/multi-select, allowOther,
// custom nextLabel, skippable:false — so you can see how each behaves
// when titles and descriptions stack vertically.
const questions = [
  {
    id: "template",
    title: "Which starting template fits your project?",
    layout: "stacked",
    options: [
      {
        id: "marketing",
        title: "Marketing site",
        description:
          "Polished landing page with hero, features grid, pricing table, and a footer. Best when you need to ship a story-driven page fast.",
      },
      {
        id: "chat",
        title: "AI chat app",
        description:
          "Full conversation UI with InputMessage, ThinkingSteps, and message bubbles wired up. Ideal for assistants and copilots.",
      },
      {
        id: "admin",
        title: "Admin dashboard",
        description:
          "Sidebar shell, sortable data tables, and form-heavy detail views. Built for back-office tools and operational apps.",
      },
      {
        id: "onboarding",
        title: "Onboarding flow",
        description:
          "Stepped intake using AskUserQuestions with a progress indicator and inline validation. Great for setup wizards.",
      },
    ],
  },
  {
    id: "shape",
    title: "Which shape language fits your brand?",
    layout: "stacked",
    options: [
      {
        id: "rounded",
        title: "Rounded",
        description:
          "Soft 16–24px corners that feel approachable and read as software. Pairs well with editorial typography and dense layouts.",
      },
      {
        id: "pill",
        title: "Pill",
        description:
          "Fully rounded shapes that lean playful and consumer-friendly. Best when controls are sparse and breathing room is generous.",
      },
    ],
  },
  {
    id: "components",
    title: "Which components will you reach for first?",
    layout: "stacked",
    multiSelect: true,
    nextLabel: "Continue",
    options: [
      {
        id: "input",
        title: "InputMessage",
        description:
          "Chat-style composer with attachments, dropdowns, and submit affordances. The backbone of any AI surface.",
      },
      {
        id: "thinking",
        title: "ThinkingSteps",
        description:
          "Animated, streamable reasoning steps with collapse and expand. Great for showing AI work in progress.",
      },
      {
        id: "ask",
        title: "AskUserQuestions",
        description:
          "This component — stepped flows with single and multi-select, optional Other, and proximity hover throughout.",
      },
      {
        id: "tabs",
        title: "TabsSubtle",
        description:
          "Quiet segmented tabs that morph between selections. Reach for these when section headers would be too loud.",
      },
      {
        id: "nav",
        title: "NavMenu",
        description:
          "Sidebar navigation with active-state morphing, grouped sections, and keyboard support out of the box.",
      },
    ],
  },
  {
    id: "drew",
    title: "What drew you to Fluid Functionalism?",
    layout: "stacked",
    allowOther: true,
    otherPlaceholder: "Something else? Tell us in a sentence…",
    options: [
      {
        id: "motion",
        title: "Motion that feels alive",
        description:
          "Spring tokens, proximity hover, and morphing backgrounds make every interaction feel intentional rather than scripted.",
      },
      {
        id: "craft",
        title: "Pixel-level craft",
        description:
          "Every component is tuned for typography, spacing, focus rings, and dark mode — no defaults left untouched.",
      },
      {
        id: "tokens",
        title: "A token system, not just components",
        description:
          "Shape, elevation, color, and font-weight tokens compose cleanly so the registry scales beyond what you see.",
      },
    ],
  },
  {
    id: "frameworks",
    title: "Where will you ship these components?",
    layout: "stacked",
    multiSelect: true,
    options: [
      {
        id: "next",
        title: "Next.js (App Router)",
        description:
          "Server components, client islands, and route-level layouts. The primary target the registry is tuned for.",
      },
      {
        id: "remix",
        title: "Remix",
        description:
          "Full-stack data loading with nested routes. Most components transplant cleanly; framer-motion stays client-only.",
      },
      {
        id: "vite",
        title: "Vite + React",
        description:
          "Single-page apps and internal dashboards. The fastest dev loop for prototyping new flows against the registry.",
      },
      {
        id: "astro",
        title: "Astro",
        description:
          "Content-first sites with interactive islands. Good fit for marketing pages that need a handful of live components.",
      },
    ],
  },
  {
    id: "theme",
    title: "How will you handle theme mode?",
    layout: "stacked",
    options: [
      {
        id: "light",
        title: "Light only",
        description:
          "Tune one palette deeply. Best when the product is consumer-facing and the brand voice is bright.",
      },
      {
        id: "dark",
        title: "Dark only",
        description:
          "Lean into the dark-mode aesthetic the registry was designed in. Cuts theme work in half.",
      },
      {
        id: "system",
        title: "System-aware",
        description:
          "Follow the OS preference automatically. No toggle UI, no user friction, and it matches what most apps do today.",
      },
      {
        id: "toggle",
        title: "User toggle",
        description:
          "Give users an explicit switch with persistence. The most flexible option, but it adds a small surface to design.",
      },
    ],
  },
  {
    id: "missing",
    title: "What's missing from the registry today?",
    layout: "stacked",
    multiSelect: true,
    allowOther: true,
    otherPlaceholder: "Tell us what to build next…",
    nextLabel: "Send feedback",
    options: [
      {
        id: "data",
        title: "Data table",
        description:
          "Sortable, filterable, virtualized rows with column resizing and density modes. The most-asked-for primitive.",
      },
      {
        id: "calendar",
        title: "Calendar / date picker",
        description:
          "Single date, range, and inline calendar — with keyboard support and locale-aware formatting baked in.",
      },
      {
        id: "command",
        title: "Command menu",
        description:
          "Keyboard-first launcher with recents, grouped actions, and fuzzy matching. The connective tissue for power users.",
      },
    ],
  },
  {
    id: "recommend",
    title: "Would you recommend Fluid Functionalism to a teammate?",
    layout: "stacked",
    skippable: false,
    options: [
      {
        id: "yes",
        title: "Yes, already have",
        description:
          "It's clear from the first install where the bar is. You'd hand it to anyone shipping a polished React surface.",
      },
      {
        id: "soon",
        title: "Once it covers more ground",
        description:
          "Once the missing pieces (data table, calendar, command) land you'd recommend it without reservation.",
      },
      {
        id: "unsure",
        title: "Still evaluating",
        description:
          "You like the direction but want to ship one real flow against it before passing it on to others.",
      },
    ],
  },
];

<AskUserQuestions questions={questions} />`;

// Chip-on-left works with every other option. This walks through:
// single-select inline, single-select stacked, multi-select inline,
// allow-other (multi-line textarea), and skippable: false — all with
// chipPosition: "left". The single-select submit arrow still appears
// on the right edge of the row.
const chipLeftCode = `const questions = [
  {
    id: "role",
    title: "Pick your role",
    chipPosition: "left",
    options: [
      { id: "design", title: "Designer", description: "Prototyping flows" },
      { id: "eng", title: "Engineer", description: "Shipping production UI" },
      { id: "pm", title: "PM", description: "Aligning the team" },
    ],
  },
  {
    id: "template",
    title: "Which starting template fits your project?",
    chipPosition: "left",
    layout: "stacked",
    options: [
      {
        id: "marketing",
        title: "Marketing site",
        description: "Hero, features grid, pricing, footer. Best when you need to ship a story-driven page fast.",
      },
      {
        id: "chat",
        title: "AI chat app",
        description: "InputMessage, ThinkingSteps and message bubbles wired together. Ideal for assistants and copilots.",
      },
      {
        id: "admin",
        title: "Admin dashboard",
        description: "Sidebar shell, sortable tables, and form-heavy detail views. Built for back-office tools.",
      },
    ],
  },
  {
    id: "frameworks",
    title: "Where will you ship these components?",
    chipPosition: "left",
    multiSelect: true,
    nextLabel: "Continue",
    options: [
      { id: "next", title: "Next.js", description: "App Router projects" },
      { id: "remix", title: "Remix", description: "Full-stack apps" },
      { id: "vite", title: "Vite + React", description: "SPAs and dashboards" },
      { id: "astro", title: "Astro", description: "Content-first sites" },
    ],
  },
  {
    id: "feedback",
    title: "Anything else we should build?",
    chipPosition: "left",
    options: [
      { id: "data", title: "Data table", description: "Sortable, filterable rows" },
      { id: "calendar", title: "Calendar", description: "Date picker and range" },
      { id: "command", title: "Command menu", description: "Fast keyboard launcher" },
    ],
    allowOther: true,
    otherPlaceholder: "Tell us in a few lines…",
  },
  {
    id: "recommend",
    title: "Would you recommend Fluid Functionalism?",
    chipPosition: "left",
    skippable: false,
    options: [
      { id: "yes", title: "Yes", description: "Already have" },
      { id: "soon", title: "Soon", description: "Once it covers more ground" },
      { id: "unsure", title: "Not sure yet", description: "Still evaluating" },
    ],
  },
];

<AskUserQuestions questions={questions} />`;

// freeText turns a question into a single open-ended textarea — no options.
// The field auto-focuses and commits with ⌘/⌃+Enter or the bottom button.
const freeTextCode = `const questions = [
  {
    id: "name",
    title: "What should we call your workspace?",
    freeText: true,
    freeTextMultiline: false, // single-line; Enter submits
    freeTextPlaceholder: "e.g. Acme Design",
  },
  {
    id: "goal",
    title: "Describe what you're hoping to build.",
    freeText: true,
    freeTextPlaceholder: "A sentence or two is plenty…",
  },
  {
    id: "feedback",
    title: "Anything else you'd like us to know?",
    freeText: true,
    skippable: false,
    nextLabel: "Finish",
  },
];

<AskUserQuestions questions={questions} />`;

// freeTextValidate runs on submit; a returned message blocks navigation and
// shows in the footer, left-aligned. It clears as soon as the user edits.
const validateCode = `const questions = [
  {
    id: "email",
    title: "Your work email?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "you@company.com",
    freeTextValidate: (value) =>
      /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value)
        ? null
        : "Please enter a valid email so we can reach out.",
  },
];

<AskUserQuestions questions={questions} />`;

const controlledCode = `const [index, setIndex] = useState(0);
const [answers, setAnswers] = useState({});

<AskUserQuestions
  questions={questions}
  currentIndex={index}
  onCurrentIndexChange={setIndex}
  answers={answers}
  onAnswersChange={setAnswers}
  onComplete={() => setIndex(0)}
/>`;

// ── Props tables ───────────────────────────────────────────────

const componentProps: PropDef[] = [
  { name: "questions", type: "AskUserQuestion[]", description: "Ordered list of questions to ask. 2–5 options per question is recommended." },
  { name: "currentIndex", type: "number", description: "Controlled index of the active question." },
  { name: "defaultCurrentIndex", type: "number", default: "0", description: "Initial question index (uncontrolled mode)." },
  { name: "onCurrentIndexChange", type: "(index: number) => void", description: "Called when the active question changes." },
  { name: "answers", type: "Record<string, AskUserAnswer>", description: "Controlled answers map keyed by question id." },
  { name: "defaultAnswers", type: "Record<string, AskUserAnswer>", description: "Initial answers (uncontrolled mode)." },
  { name: "onAnswersChange", type: "(answers: Record<string, AskUserAnswer>) => void", description: "Called whenever any answer changes." },
  { name: "onComplete", type: "(answers: Record<string, AskUserAnswer>) => void", description: "Called after the last question is answered or submitted." },
  { name: "onSkip", type: "(questionId: string, index: number) => void", description: "Called when the user clicks Skip on a question." },
  { name: "skipLabel", type: "string", default: '"Skip"', description: "Label for the skip control in the header." },
];

const questionProps: PropDef[] = [
  { name: "id", type: "string", description: "Stable identifier used to key the answer. Falls back to position." },
  { name: "title", type: "string", description: "Question text shown above the options." },
  { name: "options", type: "AskUserOption[]", description: "2–5 options to choose from. Omit for freeText questions." },
  { name: "multiSelect", type: "boolean", default: "false", description: "Allow multiple options to be selected. Adds a Next button at the bottom." },
  { name: "allowOther", type: "boolean", default: "false", description: "Render an always-visible inline textarea for free-form, multi-line answers. Enter submits (single-select); Shift+Enter inserts a newline." },
  { name: "otherPlaceholder", type: "string", default: '"Describe in your own words…"', description: "Placeholder for the Other textarea." },
  { name: "skippable", type: "boolean", default: "true", description: "Show the Skip control in the header." },
  { name: "nextLabel", type: "string", description: "Label for the Next button in multi-select mode. Defaults to 'Next' or 'Finish'." },
  { name: "layout", type: '"inline" | "stacked"', default: '"inline"', description: "Row layout. 'stacked' places the description on its own line under the title — use when descriptions are long enough to wrap." },
  { name: "chipPosition", type: '"left" | "right"', default: '"right"', description: "Which side of the row the numbered chip sits on. With 'left', the single-select submit arrow still appears on the row's right edge. Works with single/multi-select, allowOther, and inline/stacked layouts." },
  { name: "freeText", type: "boolean", default: "false", description: "Render a single multi-line textarea as the only answer — no option rows. The field auto-focuses; ⌘/⌃+Enter or the bottom submit button commits, and the answer is returned in otherText. Distinct from allowOther (which appends a free-text row alongside options); options is ignored when set." },
  { name: "freeTextPlaceholder", type: "string", default: '"Type your answer…"', description: "Placeholder for the freeText textarea." },
  { name: "freeTextMultiline", type: "boolean", default: "true", description: "Whether the freeText field starts at multi-line height. Set false for a single-line field (one row tall) where plain Enter submits instead of inserting a newline. The textarea still grows to fit longer content either way." },
  { name: "freeTextValidate", type: "(value: string) => string | null", description: "Validate the freeText value on submit (button or ⌘/⌃+Enter). Return an error message to block submission and show it in the footer (left-aligned); return null to allow. The error clears as the user edits." },
];

const optionProps: PropDef[] = [
  { name: "id", type: "string", description: "Stable identifier returned in the answer. Falls back to position." },
  { name: "title", type: "string", description: "Bold leading label for the option." },
  { name: "description", type: "string", description: "Secondary muted text shown after the title." },
];

const answerProps: PropDef[] = [
  { name: "questionId", type: "string", description: "Id of the question this answer belongs to." },
  { name: "selectedIds", type: "string[]", description: "Selected option ids. Length 0–1 in single-select, 0–N in multi-select." },
  { name: "otherText", type: "string", description: "Free-form text from the Other input or a freeText question, if any." },
  { name: "skipped", type: "boolean", description: "True when the user skipped the question." },
];

// ── Page ───────────────────────────────────────────────────────

const exampleQuestions: AskUserQuestion[] = [
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
    id: "name",
    title: "What should we call your workspace?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "e.g. Acme Design",
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

const multipleQuestions: AskUserQuestion[] = [
  {
    id: "role",
    title: "What's your role?",
    options: [
      { id: "design", title: "Designer", description: "Visual / interaction" },
      { id: "eng", title: "Engineer", description: "Frontend / backend" },
      { id: "pm", title: "PM", description: "Product / program" },
      { id: "research", title: "Researcher", description: "User / market research" },
    ],
  },
  {
    id: "tools",
    title: "Which tool do you use most?",
    options: [
      { id: "figma", title: "Figma", description: "Design source of truth" },
      { id: "vscode", title: "VS Code", description: "Code editor" },
      { id: "linear", title: "Linear", description: "Issue tracker" },
      { id: "notion", title: "Notion", description: "Docs and planning" },
    ],
  },
  {
    id: "team",
    title: "How big is your team?",
    options: [
      { id: "solo", title: "Just me", description: "Solo founder or freelancer" },
      { id: "small", title: "2–10", description: "Small team or pod" },
      { id: "mid", title: "11–50", description: "A few cross-functional teams" },
      { id: "large", title: "50+", description: "Full org" },
    ],
  },
  {
    id: "experience",
    title: "How long have you been doing this?",
    options: [
      { id: "lt1", title: "Less than a year", description: "Just getting started" },
      { id: "1to3", title: "1–3 years", description: "Finding your rhythm" },
      { id: "3to7", title: "3–7 years", description: "Comfortable in the craft" },
      { id: "gt7", title: "7+ years", description: "Seasoned" },
    ],
  },
];

const multiSelectQuestions: AskUserQuestion[] = [
  {
    id: "features",
    title: "Which features should we prioritize?",
    multiSelect: true,
    options: [
      { id: "dm", title: "Dark mode", description: "System-aware theme switching" },
      { id: "a11y", title: "Accessibility", description: "Screen-reader and keyboard support" },
      { id: "perf", title: "Performance", description: "Faster initial load" },
      { id: "i18n", title: "Translations", description: "Multi-language support" },
    ],
    nextLabel: "Continue",
  },
  {
    id: "platforms",
    title: "Which platforms do you target?",
    multiSelect: true,
    options: [
      { id: "web", title: "Web", description: "Desktop browsers" },
      { id: "ios", title: "iOS", description: "iPhone and iPad" },
      { id: "android", title: "Android", description: "Phones and tablets" },
      { id: "desktop", title: "Native desktop", description: "macOS / Windows / Linux apps" },
    ],
  },
  {
    id: "integrations",
    title: "Which integrations matter most?",
    multiSelect: true,
    options: [
      { id: "slack", title: "Slack", description: "Notifications and approvals" },
      { id: "github", title: "GitHub", description: "PR and issue sync" },
      { id: "linear", title: "Linear", description: "Two-way ticket linking" },
      { id: "figma", title: "Figma", description: "Design hand-off" },
      { id: "calendar", title: "Calendar", description: "Schedule-aware reminders" },
    ],
  },
];

const otherQuestions: AskUserQuestion[] = [
  {
    id: "blocker",
    title: "What's blocking you most right now?",
    options: [
      { id: "scope", title: "Scope", description: "Too much on the plate" },
      { id: "review", title: "Review", description: "Waiting on feedback" },
      { id: "infra", title: "Infra", description: "Tooling slows me down" },
    ],
    allowOther: true,
    otherPlaceholder: "Describe in your own words…",
  },
  {
    id: "improve",
    title: "Which area needs the most improvement?",
    options: [
      { id: "speed", title: "Speed", description: "Make the loop faster" },
      { id: "clarity", title: "Clarity", description: "Sharpen what good looks like" },
      { id: "alignment", title: "Alignment", description: "Get on the same page sooner" },
      { id: "quality", title: "Quality", description: "Raise the craft bar" },
    ],
    allowOther: true,
  },
  {
    id: "easier",
    title: "What would make your week easier?",
    options: [
      { id: "fewer", title: "Fewer meetings", description: "Reclaim deep work time" },
      { id: "decisions", title: "Faster decisions", description: "Unblock without escalation" },
      { id: "context", title: "More context", description: "Know the why upfront" },
    ],
    allowOther: true,
    otherPlaceholder: "Anything else?",
  },
];

const stackedQuestions: AskUserQuestion[] = [
  {
    id: "template",
    title: "Which starting template fits your project?",
    layout: "stacked",
    options: [
      {
        id: "marketing",
        title: "Marketing site",
        description:
          "Polished landing page with hero, features grid, pricing table, and a footer. Best when you need to ship a story-driven page fast.",
      },
      {
        id: "chat",
        title: "AI chat app",
        description:
          "Full conversation UI with InputMessage, ThinkingSteps, and message bubbles wired up. Ideal for assistants and copilots.",
      },
      {
        id: "admin",
        title: "Admin dashboard",
        description:
          "Sidebar shell, sortable data tables, and form-heavy detail views. Built for back-office tools and operational apps.",
      },
      {
        id: "onboarding",
        title: "Onboarding flow",
        description:
          "Stepped intake using AskUserQuestions with a progress indicator and inline validation. Great for setup wizards.",
      },
    ],
  },
  {
    id: "shape",
    title: "Which shape language fits your brand?",
    layout: "stacked",
    options: [
      {
        id: "rounded",
        title: "Rounded",
        description:
          "Soft 16–24px corners that feel approachable and read as software. Pairs well with editorial typography and dense layouts.",
      },
      {
        id: "pill",
        title: "Pill",
        description:
          "Fully rounded shapes that lean playful and consumer-friendly. Best when controls are sparse and breathing room is generous.",
      },
    ],
  },
  {
    id: "components",
    title: "Which components will you reach for first?",
    layout: "stacked",
    multiSelect: true,
    nextLabel: "Continue",
    options: [
      {
        id: "input",
        title: "InputMessage",
        description:
          "Chat-style composer with attachments, dropdowns, and submit affordances. The backbone of any AI surface.",
      },
      {
        id: "thinking",
        title: "ThinkingSteps",
        description:
          "Animated, streamable reasoning steps with collapse and expand. Great for showing AI work in progress.",
      },
      {
        id: "ask",
        title: "AskUserQuestions",
        description:
          "This component — stepped flows with single and multi-select, optional Other, and proximity hover throughout.",
      },
      {
        id: "tabs",
        title: "TabsSubtle",
        description:
          "Quiet segmented tabs that morph between selections. Reach for these when section headers would be too loud.",
      },
      {
        id: "nav",
        title: "NavMenu",
        description:
          "Sidebar navigation with active-state morphing, grouped sections, and keyboard support out of the box.",
      },
    ],
  },
  {
    id: "drew",
    title: "What drew you to Fluid Functionalism?",
    layout: "stacked",
    allowOther: true,
    otherPlaceholder: "Something else? Tell us in a sentence…",
    options: [
      {
        id: "motion",
        title: "Motion that feels alive",
        description:
          "Spring tokens, proximity hover, and morphing backgrounds make every interaction feel intentional rather than scripted.",
      },
      {
        id: "craft",
        title: "Pixel-level craft",
        description:
          "Every component is tuned for typography, spacing, focus rings, and dark mode — no defaults left untouched.",
      },
      {
        id: "tokens",
        title: "A token system, not just components",
        description:
          "Shape, elevation, color, and font-weight tokens compose cleanly so the registry scales beyond what you see.",
      },
    ],
  },
  {
    id: "frameworks",
    title: "Where will you ship these components?",
    layout: "stacked",
    multiSelect: true,
    options: [
      {
        id: "next",
        title: "Next.js (App Router)",
        description:
          "Server components, client islands, and route-level layouts. The primary target the registry is tuned for.",
      },
      {
        id: "remix",
        title: "Remix",
        description:
          "Full-stack data loading with nested routes. Most components transplant cleanly; framer-motion stays client-only.",
      },
      {
        id: "vite",
        title: "Vite + React",
        description:
          "Single-page apps and internal dashboards. The fastest dev loop for prototyping new flows against the registry.",
      },
      {
        id: "astro",
        title: "Astro",
        description:
          "Content-first sites with interactive islands. Good fit for marketing pages that need a handful of live components.",
      },
    ],
  },
  {
    id: "theme",
    title: "How will you handle theme mode?",
    layout: "stacked",
    options: [
      {
        id: "light",
        title: "Light only",
        description:
          "Tune one palette deeply. Best when the product is consumer-facing and the brand voice is bright.",
      },
      {
        id: "dark",
        title: "Dark only",
        description:
          "Lean into the dark-mode aesthetic the registry was designed in. Cuts theme work in half.",
      },
      {
        id: "system",
        title: "System-aware",
        description:
          "Follow the OS preference automatically. No toggle UI, no user friction, and it matches what most apps do today.",
      },
      {
        id: "toggle",
        title: "User toggle",
        description:
          "Give users an explicit switch with persistence. The most flexible option, but it adds a small surface to design.",
      },
    ],
  },
  {
    id: "missing",
    title: "What's missing from the registry today?",
    layout: "stacked",
    multiSelect: true,
    allowOther: true,
    otherPlaceholder: "Tell us what to build next…",
    nextLabel: "Send feedback",
    options: [
      {
        id: "data",
        title: "Data table",
        description:
          "Sortable, filterable, virtualized rows with column resizing and density modes. The most-asked-for primitive.",
      },
      {
        id: "calendar",
        title: "Calendar / date picker",
        description:
          "Single date, range, and inline calendar — with keyboard support and locale-aware formatting baked in.",
      },
      {
        id: "command",
        title: "Command menu",
        description:
          "Keyboard-first launcher with recents, grouped actions, and fuzzy matching. The connective tissue for power users.",
      },
    ],
  },
  {
    id: "recommend",
    title: "Would you recommend Fluid Functionalism to a teammate?",
    layout: "stacked",
    skippable: false,
    options: [
      {
        id: "yes",
        title: "Yes, already have",
        description:
          "It's clear from the first install where the bar is. You'd hand it to anyone shipping a polished React surface.",
      },
      {
        id: "soon",
        title: "Once it covers more ground",
        description:
          "Once the missing pieces (data table, calendar, command) land you'd recommend it without reservation.",
      },
      {
        id: "unsure",
        title: "Still evaluating",
        description:
          "You like the direction but want to ship one real flow against it before passing it on to others.",
      },
    ],
  },
];

const chipLeftQuestions: AskUserQuestion[] = [
  {
    id: "role",
    title: "Pick your role",
    chipPosition: "left",
    options: [
      { id: "design", title: "Designer", description: "Prototyping flows" },
      { id: "eng", title: "Engineer", description: "Shipping production UI" },
      { id: "pm", title: "PM", description: "Aligning the team" },
    ],
  },
  {
    id: "template",
    title: "Which starting template fits your project?",
    chipPosition: "left",
    layout: "stacked",
    options: [
      {
        id: "marketing",
        title: "Marketing site",
        description:
          "Hero, features grid, pricing, footer. Best when you need to ship a story-driven page fast.",
      },
      {
        id: "chat",
        title: "AI chat app",
        description:
          "InputMessage, ThinkingSteps and message bubbles wired together. Ideal for assistants and copilots.",
      },
      {
        id: "admin",
        title: "Admin dashboard",
        description:
          "Sidebar shell, sortable tables, and form-heavy detail views. Built for back-office tools.",
      },
    ],
  },
  {
    id: "frameworks",
    title: "Where will you ship these components?",
    chipPosition: "left",
    multiSelect: true,
    nextLabel: "Continue",
    options: [
      { id: "next", title: "Next.js", description: "App Router projects" },
      { id: "remix", title: "Remix", description: "Full-stack apps" },
      { id: "vite", title: "Vite + React", description: "SPAs and dashboards" },
      { id: "astro", title: "Astro", description: "Content-first sites" },
    ],
  },
  {
    id: "feedback",
    title: "Anything else we should build?",
    chipPosition: "left",
    options: [
      { id: "data", title: "Data table", description: "Sortable, filterable rows" },
      { id: "calendar", title: "Calendar", description: "Date picker and range" },
      { id: "command", title: "Command menu", description: "Fast keyboard launcher" },
    ],
    allowOther: true,
    otherPlaceholder: "Tell us in a few lines…",
  },
  {
    id: "recommend",
    title: "Would you recommend Fluid Functionalism?",
    chipPosition: "left",
    skippable: false,
    options: [
      { id: "yes", title: "Yes", description: "Already have" },
      { id: "soon", title: "Soon", description: "Once it covers more ground" },
      { id: "unsure", title: "Not sure yet", description: "Still evaluating" },
    ],
  },
];

const freeTextQuestions: AskUserQuestion[] = [
  {
    id: "name",
    title: "What should we call your workspace?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "e.g. Acme Design",
  },
  {
    id: "goal",
    title: "Describe what you're hoping to build.",
    freeText: true,
    freeTextPlaceholder: "A sentence or two is plenty…",
  },
  {
    id: "feedback",
    title: "Anything else you'd like us to know?",
    freeText: true,
    skippable: false,
    nextLabel: "Finish",
  },
];

const validateQuestions: AskUserQuestion[] = [
  {
    id: "email",
    title: "Your work email?",
    freeText: true,
    freeTextMultiline: false,
    freeTextPlaceholder: "you@company.com",
    freeTextValidate: (value) =>
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
        ? null
        : "Please enter a valid email so we can reach out.",
  },
];

const skipQuestions: AskUserQuestion[] = [
  {
    id: "experience",
    title: "How long have you been using the product?",
    options: [
      { id: "new", title: "Less than a week", description: "Just getting started" },
      { id: "mid", title: "A few months", description: "Comfortable with basics" },
      { id: "long", title: "Over a year", description: "Power user" },
    ],
  },
  {
    id: "frequency",
    title: "How often do you use it?",
    options: [
      { id: "daily", title: "Daily", description: "Part of my routine" },
      { id: "weekly", title: "A few times a week", description: "When the work calls for it" },
      { id: "monthly", title: "A few times a month", description: "Occasional use" },
      { id: "rarely", title: "Rarely", description: "Once in a while" },
    ],
  },
  {
    id: "recommend",
    title: "Would you recommend it to a colleague?",
    options: [
      { id: "yes", title: "Yes", description: "Already have" },
      { id: "maybe", title: "Maybe", description: "Depends on the role" },
      { id: "no", title: "Not yet", description: "Needs more polish first" },
    ],
  },
];

export default function AskUserQuestionsDoc() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AskUserAnswer>>({});

  return (
    <DocPage
      title="AskUserQuestions"
      slug="ask-user-questions"
      description="Stepped question flow with 2–5 options, single or multi-select, inline 'other' input, optional skip, and multi-question navigation."
    >
      <DocSection title="Example">
        <ReplayableExample
          code={exampleCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={exampleQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Multiple questions">
        <ReplayableExample
          code={multipleCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={multipleQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Multi-select">
        <ReplayableExample
          code={multiSelectCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={multiSelectQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="With other">
        <ReplayableExample
          code={otherCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={otherQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Free text">
        <ReplayableExample
          code={freeTextCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={freeTextQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Free text validation">
        <ReplayableExample
          code={validateCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={validateQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Skippable">
        <ReplayableExample
          code={skipCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={skipQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Chip on left">
        <ReplayableExample
          code={chipLeftCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={chipLeftQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Stacked layout">
        <ReplayableExample
          code={stackedCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
        >
          {(k) => <AskUserQuestions key={k} questions={stackedQuestions} />}
        </ReplayableExample>
      </DocSection>

      <DocSection title="Controlled">
        <ReplayableExample
          code={controlledCode}
          align="bottom"
          minHeightClass="min-h-[560px]"
          onReset={() => {
            setIndex(0);
            setAnswers({});
          }}
        >
          {(k) => (
            <AskUserQuestions
              key={k}
              questions={multipleQuestions}
              currentIndex={index}
              onCurrentIndexChange={setIndex}
              answers={answers}
              onAnswersChange={setAnswers}
              onComplete={() => setIndex(0)}
            />
          )}
        </ReplayableExample>
      </DocSection>

      <DocSection title="API Reference — AskUserQuestions">
        <PropsTable props={componentProps} />
      </DocSection>

      <DocSection title="API Reference — AskUserQuestion">
        <PropsTable props={questionProps} />
      </DocSection>

      <DocSection title="API Reference — AskUserOption">
        <PropsTable props={optionProps} />
      </DocSection>

      <DocSection title="API Reference — AskUserAnswer">
        <PropsTable props={answerProps} />
      </DocSection>
    </DocPage>
  );
}
