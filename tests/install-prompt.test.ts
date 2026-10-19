import { describe, expect, it } from "vitest";
import {
  buildInstallPrompt,
  buildPresetPrompt,
  buildStarterPrompt,
  starterCommand,
} from "@/lib/docs/install-prompt";
import { STARTER_DEFAULTS } from "@/lib/starter/settings";
import { PROMPT_ENTRIES } from "@/lib/docs/prompt-entries";
import {
  CARD_DEFAULT_CODE,
  CARD_PRESET_DEF,
} from "@/lib/preset/components";

const skillInstall = "npx skills add mickadesign/fluid-functionalism";

describe("Copy prompts", () => {
  const prompts = [
    {
      kind: "doc page",
      value: buildInstallPrompt({ slug: "card", base: "radix" }),
    },
    {
      kind: "installable playground preset",
      value: buildPresetPrompt({
        def: CARD_PRESET_DEF,
        code: CARD_DEFAULT_CODE,
        base: "radix",
      }),
    },
    {
      kind: "home page starter",
      value: buildStarterPrompt(STARTER_DEFAULTS),
    },
  ];

  // The craft ships in the skill; a brief points there instead of pasting it.
  it.each(prompts)("leaves the craft to the skill in the $kind prompt", ({ value }) => {
    expect(value).not.toContain("Craft (");
    for (const point of PROMPT_ENTRIES.card.craft ?? []) {
      expect(value).not.toContain(point);
    }
    expect(value).toContain(skillInstall);
  });

  // An agent that installed from a brief knows where to check for updates.
  it.each(prompts)("points the $kind prompt at the Markdown changelog", ({ value }) => {
    expect(value).toContain("https://www.fluidfunctionalism.com/changelog.md");
  });
});

describe("the starter Copy prompt", () => {
  const settings = { base: "radix", shape: "pill", size: "compact", icons: "phosphor", theme: "dark" } as const;
  const prompt = buildStarterPrompt(settings);

  it("leads with the one command, carrying every setting in its slug", () => {
    const command = starterCommand(settings);
    expect(command).toBe(
      "npx shadcn@latest create -n my-app -t next https://www.fluidfunctionalism.com/r/starter/radix-pill-compact-phosphor-dark.json",
    );
    expect(prompt).toContain(command);
  });

  it("names the settings in words and where to change them", () => {
    expect(prompt).toContain("Radix, pill, compact size, Phosphor icons, dark theme");
    expect(prompt).toContain("components/providers.tsx");
  });

  it("offers the setup install for an app that already exists", () => {
    expect(prompt).toContain("https://www.fluidfunctionalism.com/r/setup/radix-pill-compact-phosphor-dark.json --overwrite");
    expect(prompt).toContain("<FluidRoot>");
  });

  it("points Base UI projects at the base/ names for later adds", () => {
    expect(buildStarterPrompt({ ...settings, base: "base" })).toContain("@fluid/base/<name>");
    expect(prompt).not.toContain("@fluid/base/");
  });

  it("follows the tone of voice: no em dashes", () => {
    expect(prompt).not.toContain("\u2014");
  });
});
