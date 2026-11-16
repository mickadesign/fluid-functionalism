"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable } from "@/lib/docs/PropsTable";
import { CodeBlock } from "@/registry/default/code-block";
import { highlight } from "@/lib/docs/highlight";
import { props } from "@/lib/docs/api/code-block";

const SAMPLE = `export function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}.</p>;
}`;

const OUTPUT = `> next build

   Creating an optimized production build ...
 ✓ Compiled successfully in 4.1s
 ✓ Generating static pages (58/58)

Route (app)                    Size   First Load JS
┌ ○ /                       4.2 kB         118 kB
├ ○ /docs/button            2.9 kB         131 kB
└ ○ /docs/code-block        1.7 kB         112 kB`;

const basicCode = `import { CodeBlock } from "./components";

<CodeBlock language="tsx" code={source} />

// Numbered lines, a file name in place of the language.
<CodeBlock title="greeting.tsx" code={source} lineNumbers />`;

const highlightedCode = `import { CodeBlock } from "./components";
import { codeToHtml } from "shiki";

const html = await codeToHtml(source, { lang: "tsx", theme: "github-light" });

// code stays the plain string: it is what the button copies.
<CodeBlock language="tsx" code={source}>
  <div dangerouslySetInnerHTML={{ __html: html }} />
</CodeBlock>`;

const outputCode = `import { CodeBlock } from "./components";

// Command output: wrapped, capped at 160px, no header.
<CodeBlock code={stdout} wrap maxHeight={160} hideHeader />`;

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="mx-1 rounded bg-[light-dark(#EBEBED,#2C2C2C)] px-1 py-0.5 text-site-caption text-foreground">
      {children}
    </code>
  );
}

/** The sample colored by the site's own Shiki setup, to show children in use. */
function HighlightedDemo() {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    highlight(SAMPLE).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="w-full max-w-[480px]">
      <CodeBlock language="tsx" code={SAMPLE}>
        {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : undefined}
      </CodeBlock>
    </div>
  );
}

export default function CodeBlockDoc() {
  return (
    <DocPage
      title="CodeBlock"
      slug="code-block"
      description="Code or command output with a copy button."
    >
      <DocSection title="Basic">
        <p className="text-site-body text-muted-foreground">
          Press the copy button: the icon gives way to a check that draws
          itself, then comes back after 2 seconds.
        </p>
        <ComponentPreview code={basicCode}>
          <div className="flex w-full max-w-[480px] flex-col gap-3">
            <CodeBlock language="tsx" code={SAMPLE} />
            <CodeBlock title="greeting.tsx" code={SAMPLE} lineNumbers />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Highlighted">
        <p className="text-site-body text-muted-foreground">
          The block ships no highlighter. Pass colored markup as children and
          <Code>code</Code> stays the plain string the button copies.
        </p>
        <ComponentPreview code={highlightedCode}>
          <HighlightedDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Output">
        <p className="text-site-body text-muted-foreground">
          For logs and command output, <Code>wrap</Code> the lines, cap the
          height, and drop the header. The copy button floats in the corner.
        </p>
        <ComponentPreview code={outputCode}>
          <div className="w-full max-w-[480px]">
            <CodeBlock code={OUTPUT} wrap maxHeight={160} hideHeader />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
