"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { DocPage, DocSection } from "@/lib/docs/DocPage";
import { InputCopy } from "@/registry/default/input-copy";
import { SkillHero } from "./hero";
import { Timeline } from "./timeline";

const SKILLS_SH_URL = "https://skills.sh/mickadesign/fluid-functionalism/fluid-functionalism";
const INSTALL_COMMAND = "npx skills add mickadesign/fluid-functionalism";

/** What it does: 1 line per job. The detail lives in SKILL.md. */
const JOBS: Array<{ title: string; body: string }> = [
  { title: "Reads your stack once", body: "Checked on the first run, remembered after." },
  { title: "Suggests 2 to 5 upgrades", body: "Ranked by what your users will notice." },
  { title: "Installs the right piece", body: "Right name, right flavor. Your edits survive." },
  { title: "Reviews the motion you have", body: "Flags hand-written timings and layout shifts." },
];

/** Try it: prompts to paste as-is. Each names the skill so it triggers. */
const PROMPTS = [
  "Audit this project with the fluid-functionalism skill",
  "Add a settings dialog with a sidebar from Fluid Functionalism",
  "Replace our dropdowns with the Fluid Functionalism ones",
  "Make this list hover like the Fluid Functionalism menus",
  "Review the motion in this app against the fluid-functionalism skill",
];

/** Live install count from skills.sh, via our cached route. Renders nothing
 *  until a number arrives, so a failed lookup never shows a wrong zero. */
function InstallCount() {
  const [installs, setInstalls] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/skill-installs")
      .then((res) => res.json())
      .then((data: { installs: number | null }) => {
        if (!cancelled && typeof data.installs === "number") setInstalls(data.installs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (installs === null) return null;
  return (
    <p className="text-caption text-muted-foreground">
      <a
        href={SKILLS_SH_URL}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-muted-foreground/40 underline-offset-2 hover:text-foreground"
      >
        {new Intl.NumberFormat("en", { notation: "compact" }).format(installs)}{" "}
        {installs === 1 ? "install" : "installs"} on skills.sh
      </a>
    </p>
  );
}

export default function FluidSkillDoc() {
  return (
    <DocPage
      title="/fluid-functionalism skill"
      slug="skill"
      showInstall={false}
      description="Teaches your coding agent the components, the motion rules, and the reasons behind them."
    >
      {/* No section title: the command sits straight under the page intro. */}
      <div className="flex flex-col gap-4">
        <InputCopy
          value={INSTALL_COMMAND}
          align="left"
          onCopy={() => track("Skill install copied", { method: "skills-cli" })}
        />
        <InstallCount />
      </div>

      <SkillHero />

      <DocSection title="What it does">
        <Timeline steps={JOBS} />
      </DocSection>

      <DocSection title="What it knows">
        <p className="text-body leading-relaxed text-muted-foreground">
          The craft behind every component, distilled from its implementation and
          code comments: exact values, interaction rules, edge cases, and why each
          detail matters. Once the FF components are in place, your agent uses this
          knowledge to apply the final layer of craft to your interface, from
          spacing and alignment to motion and feedback.
        </p>
      </DocSection>

      <DocSection title="Try it">
        <div className="flex flex-col gap-2">
          {PROMPTS.map((prompt, i) => (
            <InputCopy
              key={prompt}
              value={prompt}
              align="left"
              onCopy={() => track("Skill prompt copied", { prompt: i + 1 })}
            />
          ))}
        </div>
      </DocSection>
    </DocPage>
  );
}
