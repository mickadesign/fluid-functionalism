"use client";

import { type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { MARKDOWN_SAMPLE, TypesetEditor } from "@/lib/docs/typeset-sample";
import { TYPESET_SPACE } from "@/lib/typeset/generate";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { cn } from "@/lib/utils";
import {
  BalanceDemo,
  HeadingFontDemo,
  NumbersDemo,
  PrettyDemo,
  TrimDemo,
  TypeScaleSpecimen,
  WeightOpszDemo,
} from "./demos";

/** Inline code chip used throughout the prose. */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-site-body text-muted-foreground">{children}</p>;
}

function Rule({ children }: { children: ReactNode }) {
  return <li className="pl-1 text-site-body text-muted-foreground">{children}</li>;
}

/** A titled part inside a section, styled like the surfaces page's. The
 *  negative margin tucks its line against it (8px), as with a section title. */
function H3({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={cn("-mb-2 text-site-subtitle text-foreground", className)}
      style={{ fontVariationSettings: fontWeights.semibold }}
    >
      {children}
    </h3>
  );
}

/** A link off the site, opened in a new tab. */
function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline underline-offset-4"
    >
      {children}
    </a>
  );
}

/** The sheet's gaps, named by the styles they sit around. A caption takes
 *  the same room as the space under a heading. */
const GAPS: Array<[gap: keyof typeof TYPESET_SPACE, label: string]> = [
  ["section", "Above display and title"],
  ["subsection", "Above subtitle"],
  ["heading", "Below display, title, and subtitle"],
  ["block", "Between body blocks"],
  ["heading", "Above caption"],
  ["item", "Between list items"],
  ["rule", "Around a divider"],
];

/** Read from the sheet's own values, so it can't drift from them. Styled
 *  like PropsTable. */
function GapTable() {
  const th = "px-3 py-2 text-left text-foreground";
  return (
    <table className="w-full border-collapse text-site-body tabular-nums [&_th:first-child]:pl-0 [&_td:first-child]:pl-0">
      <thead>
        <tr className="border-b border-border">
          {["Gap", "Default", "Compact"].map((label) => (
            <th key={label} className={th} style={{ fontVariationSettings: fontWeights.semibold }}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {GAPS.map(([gap, label]) => (
          <tr key={label} className="border-b border-border/40">
            <td className="px-3 py-2 text-muted-foreground">{label}</td>
            <td className="px-3 py-2 text-foreground">{TYPESET_SPACE[gap].default}px</td>
            <td className="px-3 py-2 text-foreground">{TYPESET_SPACE[gap].compact}px</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TypographyDoc() {
  return (
    <DocPage
      title="Typography"
      slug="typography"
      description="Bold rules that create consistency across the whole component library."
      intro="Typography is hard. Every style you add makes it clunkier, so building this page was mostly cutting and refactoring until only the essential rules remained. Those rules power every component in the library, and each one is simple. Defining them and applying them on every surface is what makes it hard. Good rules hold every kind of component, and every component holds to them. Enjoy!"
    >
      <DocSection title="5 rules">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
          <Rule>5 styles for the whole site, from page titles to captions.</Rule>
          <Rule>3 weights: regular for text, semibold for headings and selected items, bold for page titles.</Rule>
          <Rule>2 text colors: foreground and muted.</Rule>
          <Rule>
            1 font family:{" "}
            <ExternalLink href="https://rsms.me/inter/">Inter Variable 4.0</ExternalLink>. Headings
            can switch to{" "}
            <ExternalLink href="https://vercel.com/font">Geist Serif</ExternalLink> or any Google Fonts
            family.
          </Rule>
          <Rule>1 paragraph style.</Rule>
        </ul>
      </DocSection>

      <DocSection title="5 no-gos">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground">
          <Rule>No uppercase: hierarchy comes from size and weight.</Rule>
          <Rule>No letter-spacing: handled with Inter&apos;s optical sizing.</Rule>
          <Rule>No eyebrows: a section starts with its title.</Rule>
          <Rule>No difference with markdown: it uses the same styles and colors as everything else.</Rule>
          <Rule>No opacity for text: it&apos;s foreground or muted, never a faded step of them.</Rule>
        </ul>
      </DocSection>

      <DocSection title="The scale">
        <P>
          5 styles, each a size and a line height. Press<Code>S</Code>for compact.
        </P>
        <TypeScaleSpecimen />
      </DocSection>

      <DocSection title="Heading font">
        <P>
          3 choices for headings: Inter, Geist Serif, or any Google Fonts family. Geist Serif runs
          the display style 4px larger, in its one Regular cut. Press<Code>F</Code>to cycle.
        </P>
        <HeadingFontDemo />
      </DocSection>

      <DocSection title="Markdown">
        <P>Markdown gets the same 5 styles, to-dos and tables included.</P>
        <TypesetEditor content={MARKDOWN_SAMPLE} label="Markdown sample" />
      </DocSection>

      <DocSection title="Spacing">
        <P>Space only goes above a block, so streaming text never shifts.</P>
        <GapTable />
      </DocSection>

      <DocSection title="5 tweaks">
        <P>Small details that keep text still, snug in its box, and evenly wrapped.</P>

        <H3 className="mt-2">Weight without reflow</H3>
        <P>
          Each weight carries its own optical size, so semibold labels keep their width.
          Idea from{" "}
          <ExternalLink href="https://x.com/lochieaxon/status/2061631101999968701">
            @lochieaxon
          </ExternalLink>
          .
        </P>
        <WeightOpszDemo />

        <H3 className="mt-6">Steady numbers</H3>
        <P>
          Changing numbers use<Code>tabular-nums</Code>so every digit is the same width and the
          words after them hold still.
        </P>
        <NumbersDemo />

        <H3 className="mt-6">Trimmed labels</H3>
        <P>
          Labels use<Code>text-box: trim-both cap alphabetic</Code>so the padding you set is the
          space you see. Idea from{" "}
          <ExternalLink href="https://interfaces.dev/magazine/issues/working-with-type">
            @jakubkrehel
          </ExternalLink>
          .
        </P>
        <TrimDemo />

        <H3 className="mt-6">Balanced headings</H3>
        <P>
          Headings use<Code>text-wrap: balance</Code>so their lines come out even.
        </P>
        <BalanceDemo />

        <H3 className="mt-6">Pretty paragraphs</H3>
        <P>
          Paragraphs use<Code>text-wrap: pretty</Code>so none ends on a lone word.
        </P>
        <PrettyDemo />
      </DocSection>
    </DocPage>
  );
}
