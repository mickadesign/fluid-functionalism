import { describe, expect, it } from "vitest";
import { buildInstallPrompt, buildPresetPrompt } from "@/lib/docs/install-prompt";
import { PROMPT_ENTRIES } from "@/lib/docs/prompt-entries";
import {
  CARD_DEFAULT_CODE,
  CARD_PRESET_DEF,
} from "@/lib/preset/components";

const craftHeading =
  "Craft (built-in behaviors — compose around them, don't re-implement or fight them):";

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
  ];

  it.each(prompts)("includes Card craft in the $kind prompt", ({ value }) => {
    expect(value).toContain(craftHeading);
    for (const point of PROMPT_ENTRIES.card.craft ?? []) {
      expect(value).toContain(`- ${point}`);
    }
  });
});
