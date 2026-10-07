import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

// Tailwind utilities reserved for the canonical-shadcn theme on /compare.
// See app/compare/shadcn-theme.css. These render as transparent outside
// `.shadcn-theme`; this rule blocks accidental use in FF components.
const SHADCN_RESERVED_REGEX =
  "\\b(bg|text|border|ring|hover:bg|hover:text|focus-visible:ring|focus:ring)-(primary|secondary|popover|primary-foreground|secondary-foreground|popover-foreground|destructive-foreground)(\\/[0-9]+)?\\b";

// Focus indicators must ride the --focus-ring token so every click area
// shows the same ring (see the @layer base :focus-visible fallback in
// app/globals.css). This catches color-bearing ring/outline/border utilities
// under focus variants that bypass the token: palette colors, white/black,
// and arbitrary values that aren't var(--focus-ring) — including the raw
// hex, which must go through the token form to stay themeable.
const FOCUS_PALETTE =
  "(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}";
const FOCUS_RING_REGEX = `\\bfocus(?:-visible|-within)?:(?:ring|outline|border)-(?:${FOCUS_PALETTE}|white|black|\\[(?!color:var\\(--focus-ring|var\\(--focus-ring))`;
const FOCUS_RING_MESSAGE =
  "Focus indicators must use the --focus-ring token — e.g. focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)].";

// A component owns its type: size comes from the ladder — a `size` prop, or
// the surrounding SizeProvider (see /docs/sizes). Overriding that with a raw
// px in className freezes one step of the ladder, so the text stops
// responding when the site size changes. Site chrome has the type-scale
// roles for this — text-site-display / -title / -subtitle / -body /
// -caption / -micro, generated into app/globals.css — and a component that
// genuinely wants a different step takes `size`.
//
// Deliberately scoped to className on FF components, not to every element:
// previews that mimic a component's internals with plain divs legitimately
// repeat the same px the component itself uses.
const FF_COMPONENT_REGEX =
  "^(Accordion|AskUser|Badge|Button|Card|Chat|Checkbox|Color|Dialog|Dropdown|Elevated|Input|Menu|Nav|Radio|Scroll|Select|Sidebar|Slider|Switch|Table|Tabs|Thinking|Tooltip)";
const HARDCODED_TYPE_REGEX = "\\btext-\\[[0-9]";
const HARDCODED_TYPE_MESSAGE =
  "Hardcoded font size on a component. Type follows the size ladder: pass `size`, or use a site type-scale role (text-site-caption / -body / -subtitle / -title / -display / -micro) so it tracks the site size step.";

// Inside the registry every size and leading comes from the type scale
// (/docs/typography): typeClass(role, variant), sizeClasses.type.<role>, or
// the literal role class with its var(--fs-*) / var(--lh-*) fallback. A raw
// text-[13px] or leading-[18px] is drift the scale can't reach, and a bare
// text-caption (or site-only text-site-caption) breaks in installs: stock
// tailwind-merge takes it for a color and drops it inside cn().
// The bare role class is caught behind a variant (`sm:`, `hover:`), an
// important `!`, or with a `/leading` modifier; `\x2F` is the slash, which
// would end the selector's regex literal.
// One raw size passes: `pointer-coarse:text-[16px]`, the `fieldTouchClass`
// editable fields add. iOS Safari zooms the page into a focused field set
// under 16px, so touch screens get 16px whatever the role. That floor is the
// platform's, not a step of the scale; any other size behind
// `pointer-coarse:` is still caught, and so is a line height written into it
// (`pointer-coarse:text-[16px]/[24px]`).
const REGISTRY_TYPE_REGEX = "(?<!pointer-coarse:)\\btext-\\[[0-9]|pointer-coarse:text-\\[(?!16px\\](?!\\x2F))[0-9]|\\bleading-\\[(?!var\\(--lh-)|(?:^|[\\s:!])text-(?:site-)?(?:display|title|subtitle|body|caption|micro)(?:-compact)?(?:[\\s!\\x2F]|$)";
const REGISTRY_TYPE_MESSAGE =
  "Registry type comes from the type scale: typeClass(role, variant) or sizeClasses.type.<role> from @/lib/size-context, not a raw text-[Npx], leading-[…], or bare text-<role> class.";

// Text uses 3 weights: fontWeights.normal, fontWeights.semibold, and
// fontWeights.bold for the display style, through fontVariationSettings so
// each carries its optical size. Bans other raw 'wght' values and Tailwind
// weight utilities (font-normal is regular, so it passes).
const WEIGHT_MESSAGE =
  "Text uses 3 weights: fontWeights.normal for text, fontWeights.semibold for headings and selected items, fontWeights.bold for the display style (via fontVariationSettings).";
const RAW_WGHT_REGEX = "'wght' (?!400|550|700)[0-9]";
const TW_WEIGHT_REGEX = "(^|[\\s:!])font-(thin|extralight|light|medium|semibold|bold|extrabold|black)($|[\\s!])";

// Hierarchy comes from size and weight: no uppercase, no letter-spacing
// (tracking-normal is a reset, so it passes). And text uses 2 colors,
// foreground and muted (text-background on dark fills), never an opacity
// step of them. Scoped to class strings, so prose naming a class is fine;
// \x2F is the slash, which would end the selector's regex literal.
const CASE_TRACKING_REGEX = "(^|[\\s:!])(uppercase($|[\\s!])|tracking-(?!normal)[a-z0-9\\[])";
const CASE_TRACKING_MESSAGE = "Hierarchy comes from size and weight: no uppercase, no letter-spacing.";
const FADED_TEXT_REGEX = "(^|[\\s:!])text-(muted-foreground|foreground|background)\\x2F[0-9]";
const FADED_TEXT_MESSAGE =
  "Text uses 2 colors: text-foreground or text-muted-foreground (text-background on dark fills), not an opacity step of them.";
const CLASS_SCOPES = [
  'JSXAttribute[name.name="className"]',
  "CallExpression[callee.name=/^(cn|cva|clsx)$/]",
];
const classRules = (regex, message) =>
  CLASS_SCOPES.flatMap((scope) => [
    { selector: `${scope} Literal[value=/${regex}/]`, message },
    { selector: `${scope} TemplateElement[value.raw=/${regex}/]`, message },
  ]);

const shadcnRestrictedRules = {
  "no-restricted-syntax": [
    "error",
    ...classRules(CASE_TRACKING_REGEX, CASE_TRACKING_MESSAGE),
    ...classRules(FADED_TEXT_REGEX, FADED_TEXT_MESSAGE),
    { selector: `Literal[value=/${RAW_WGHT_REGEX}/]`, message: WEIGHT_MESSAGE },
    { selector: `TemplateElement[value.raw=/${RAW_WGHT_REGEX}/]`, message: WEIGHT_MESSAGE },
    { selector: `Literal[value=/${TW_WEIGHT_REGEX}/]`, message: WEIGHT_MESSAGE },
    { selector: `TemplateElement[value.raw=/${TW_WEIGHT_REGEX}/]`, message: WEIGHT_MESSAGE },
    {
      selector: `Literal[value=/${SHADCN_RESERVED_REGEX}/]`,
      message:
        "Tailwind utility reserved for /compare's shadcn theme. Use FF tokens (bg-foreground, bg-card, bg-accent, bg-destructive, text-foreground, etc.) instead.",
    },
    {
      selector: `TemplateElement[value.raw=/${SHADCN_RESERVED_REGEX}/]`,
      message:
        "Tailwind utility reserved for /compare's shadcn theme. Use FF tokens instead.",
    },
    {
      selector: `Literal[value=/${FOCUS_RING_REGEX}/]`,
      message: FOCUS_RING_MESSAGE,
    },
    {
      selector: `TemplateElement[value.raw=/${FOCUS_RING_REGEX}/]`,
      message: FOCUS_RING_MESSAGE,
    },
    // `>` into the attribute, not a bare descendant: a component's own
    // className only. Without it the selector reaches through
    // `render={<span className="text-[13px]" />}` and flags the nested
    // element, which is a plain span rendering a row's internals.
    {
      selector: `JSXOpeningElement[name.name=/${FF_COMPONENT_REGEX}/] > JSXAttribute[name.name="className"] Literal[value=/${HARDCODED_TYPE_REGEX}/]`,
      message: HARDCODED_TYPE_MESSAGE,
    },
    {
      selector: `JSXOpeningElement[name.name=/${FF_COMPONENT_REGEX}/] > JSXAttribute[name.name="className"] TemplateElement[value.raw=/${HARDCODED_TYPE_REGEX}/]`,
      message: HARDCODED_TYPE_MESSAGE,
    },
  ],
};

const registryRestrictedRules = {
  "no-restricted-syntax": [
    ...shadcnRestrictedRules["no-restricted-syntax"],
    { selector: `Literal[value=/${REGISTRY_TYPE_REGEX}/]`, message: REGISTRY_TYPE_MESSAGE },
    { selector: `TemplateElement[value.raw=/${REGISTRY_TYPE_REGEX}/]`, message: REGISTRY_TYPE_MESSAGE },
  ],
};

export default [
  {
    ignores: [
      ".claude/**",
      ".next/**",
      "dist/**",
      "next-env.d.ts",
      "node_modules/**",
      "public/r/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Block shadcn-reserved Tailwind tokens in Fluid Functionalism code.
  // The canonical shadcn install (components/shadcn/**) and the /compare page
  // are explicitly exempt because they need these utilities by design.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "components/shadcn/**",
      "app/compare/**",
      "app/components/shadcn-previews.tsx",
    ],
    rules: shadcnRestrictedRules,
  },
  // Registry sources: the shadcn rules plus the type-scale rule. A later
  // block replaces no-restricted-syntax wholesale, so this one repeats them.
  {
    files: ["registry/**/*.{ts,tsx}"],
    // The tailwind-merge list names the role utilities on purpose.
    ignores: ["registry/default/lib/utils.ts"],
    rules: registryRestrictedRules,
  },
  // Registry sources ship into other people's projects, and a fresh
  // `create-next-app` lints them with eslint-plugin-react-hooks' full
  // recommended set (the React Compiler rules: refs, immutability,
  // static-components, set-state-in-effect, ...). Same rules here, so an
  // install never opens with lint errors the site's own CI didn't see.
  {
    files: ["registry/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  // That app's no-unused-vars has no `^_` ignore, so a prop dropped with
  // `{ key: _key, ...rest }` is a warning there. Registry code drops props
  // with omit() from registry/default/lib/omit.ts instead. Both rules are
  // errors here, so installs open with no warnings either and CI catches a
  // new one. A plain <img> stays possible with a reasoned disable comment.
  {
    files: ["registry/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {}],
      "@next/next/no-img-element": "error",
    },
  },
];
