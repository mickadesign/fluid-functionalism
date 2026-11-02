import { describe, expect, it } from "vitest";
import {
  ACCENT_ORDER,
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  accentCss,
  accentHex,
  accentLabel,
  contrastRatio,
  isAccentHex,
  presetForHex,
} from "@/lib/accent";
import {
  CUSTOM_ACCENT_COOKIE,
  SETTING_VALUES,
  customAccentCookie,
  readCustomAccent,
} from "@/lib/docs/site-settings";
import { buildStarterPrompt, starterCommand } from "@/lib/docs/install-prompt";
import { STARTER_DEFAULTS } from "@/lib/starter/settings";

const jar = (cookies: Record<string, string>) => (name: string) => cookies[name];
const valueOf = (line: string) => line.split("; ")[0].split("=").slice(1).join("=");

describe("accent presets", () => {
  it("default to the blue the system always had", () => {
    expect(DEFAULT_ACCENT).toBe("blue");
    expect(ACCENT_PRESETS.blue).toMatchObject({ light: "#6B97FF", dark: "#6B97FF" });
    expect(accentCss("blue", null)).toBe("#6B97FF");
    expect([...SETTING_VALUES.accent]).toEqual(ACCENT_ORDER);
  });

  // A 1px focus ring has to stay findable whichever preset is on, on
  // either theme: each shade clears the blue's own contrast, give or take.
  it("keep a visible ring on both backgrounds", () => {
    for (const preset of ACCENT_ORDER) {
      const { light, dark } = ACCENT_PRESETS[preset];
      expect(contrastRatio(light, "#FFFFFF"), preset).toBeGreaterThan(2.75);
      expect(contrastRatio(dark, "#171717"), preset).toBeGreaterThan(5.5);
    }
  });

  it("are every Tailwind hue but blue, by hue, around the system's blue", () => {
    expect(ACCENT_ORDER).toEqual([
      "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan",
      "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
    ]);
  });

  it("map a hex back to its preset, any case", () => {
    expect(presetForHex("#a684ff")).toBe("violet");
    expect(presetForHex("#7f22fe")).toBe("violet");
    expect(presetForHex("#123456")).toBeNull();
    expect(accentHex("red", null, false)).toBe("#E7000B");
    expect(accentHex("red", null, true)).toBe("#FF6467");
    expect(accentHex("red", "#123456", true)).toBe("#123456");
    expect(accentCss("red", null)).toBe("light-dark(#E7000B, #FF6467)");
    expect(accentCss("red", "#123456")).toBe("#123456");
    expect(accentLabel("red", null)).toBe("Red");
    expect(accentLabel("red", "#abcdef")).toBe("#ABCDEF");
  });
});

describe("custom accent cookie", () => {
  it("round-trips a hex and clears for a preset", () => {
    expect(readCustomAccent(jar({ [CUSTOM_ACCENT_COOKIE]: valueOf(customAccentCookie("#abcdef")) }))).toBe("#ABCDEF");
    expect(customAccentCookie(null)).toContain("max-age=0");
  });

  it("ignores anything that isn't a 6-digit hex", () => {
    for (const raw of ["red", "#abc", "#abcdef00", "%E0%A4%A", "javascript:alert(1)"]) {
      expect(readCustomAccent(jar({ [CUSTOM_ACCENT_COOKIE]: raw })), raw).toBeNull();
    }
    expect(isAccentHex("#A1B2C3")).toBe(true);
  });
});

describe("the starter Copy prompt's accent", () => {
  it("carries a preset in the slug and the layout line", () => {
    const settings = { ...STARTER_DEFAULTS, accent: "violet" } as const;
    const prompt = buildStarterPrompt(settings);
    expect(starterCommand(settings)).toContain("/r/starter/violet.json");
    expect(prompt).toContain("violet accent");
    expect(prompt).toContain("(violet, light-dark(#7F22FE, #A684FF))");
    // An existing app gets the tokens' blue, so it sets the preset itself.
    expect(prompt).toContain(`put style={{ "--fluid-accent": "light-dark(#7F22FE, #A684FF)" }} on <html>`);
  });

  it("asks nothing extra of an existing app for the default blue", () => {
    expect(buildStarterPrompt(STARTER_DEFAULTS)).not.toContain(`put style={{ "--fluid-accent"`);
  });

  it("names a custom color in words and where to set it, the slug keeping the preset", () => {
    const prompt = buildStarterPrompt(STARTER_DEFAULTS, undefined, "#123456");
    expect(prompt).toContain("#123456 accent");
    expect(prompt).not.toContain("blue accent");
    expect(prompt).toContain(`Change its value to "#123456"`);
    expect(prompt).toContain(`put style={{ "--fluid-accent": "#123456" }} on <html>`);
    expect(prompt).toContain(starterCommand(STARTER_DEFAULTS));
    expect(prompt).not.toContain("—");
  });
});
