import { describe, expect, it } from "vitest";
import {
  CUSTOM_FONT_COOKIE,
  CUSTOM_WEIGHT_COOKIE,
  HEADING_FONT_COOKIE,
  customFontCookie,
  customWeightCookie,
  headingFontCookie,
  readHeadingFont,
} from "@/lib/docs/site-settings";
import {
  customHeadingVars,
  googleFontHref,
  googleFontPreviewHref,
  googleFontWeights,
  nearestGoogleFontWeight,
  type GoogleFont,
} from "@/lib/docs/google-fonts";
import catalog from "@/lib/docs/google-fonts.json";
import { buildCatalog, readNextFontData, serializeCatalog } from "../scripts/generate-google-fonts.mjs";

const jar = (cookies: Record<string, string>) => (name: string) => cookies[name];

/** The value a `document.cookie` line stores. */
const valueOf = (line: string) => line.split("; ")[0].split("=").slice(1).join("=");

const STATIC: GoogleFont = { n: "Lobster" };
const STATIC_CUTS: GoogleFont = { n: "Abhaya Libre", w: [400, 500, 600, 700, 800] };
const NO_REGULAR: GoogleFont = { n: "Bungee Hairline", w: [300] };
const ITALIC_ONLY: GoogleFont = { n: "Molle", i: 1 };
const VARIABLE: GoogleFont = { n: "Playfair Display", a: { wght: [400, 900] } };
const OPSZ: GoogleFont = { n: "Fraunces", a: { opsz: [9, 144], wght: [100, 900] } };

describe("heading font cookies", () => {
  it("reads Inter and Auto when nothing is saved", () => {
    expect(readHeadingFont(jar({}))).toEqual({ font: "inter", customFamily: null, customWeight: null });
  });

  it("reads every saved value back through the cookies it writes", () => {
    const cookies = {
      [HEADING_FONT_COOKIE]: valueOf(headingFontCookie("custom")),
      [CUSTOM_FONT_COOKIE]: valueOf(customFontCookie("Playfair Display")),
      [CUSTOM_WEIGHT_COOKIE]: valueOf(customWeightCookie(600)),
    };
    expect(readHeadingFont(jar(cookies))).toEqual({
      font: "custom",
      customFamily: "Playfair Display",
      customWeight: 600,
    });
  });

  it("falls back on unknown or malformed values", () => {
    expect(
      readHeadingFont(jar({ [HEADING_FONT_COOKIE]: "comic", [CUSTOM_FONT_COOKIE]: "%E0%A4%A", [CUSTOM_WEIGHT_COOKIE]: "bold" }))
    ).toEqual({ font: "inter", customFamily: null, customWeight: null });
    expect(readHeadingFont(jar({ [CUSTOM_WEIGHT_COOKIE]: "4000" })).customWeight).toBeNull();
  });

  it("clears the weight cookie for Auto", () => {
    expect(customWeightCookie(null)).toContain("max-age=0");
  });
});

describe("Google Fonts URLs", () => {
  const css2 = "https://fonts.googleapis.com/css2?";

  it("loads every weight of a family", () => {
    expect(googleFontHref(STATIC)).toBe(`${css2}family=Lobster&display=swap`);
    expect(googleFontHref(STATIC_CUTS)).toBe(`${css2}family=Abhaya+Libre:wght@400;500;600;700;800&display=swap`);
    expect(googleFontHref(ITALIC_ONLY)).toBe(`${css2}family=Molle:ital,wght@1,400&display=swap`);
    expect(googleFontHref(VARIABLE)).toBe(`${css2}family=Playfair+Display:wght@400..900&display=swap`);
    expect(googleFontHref(OPSZ)).toBe(`${css2}family=Fraunces:opsz,wght@9..144,100..900&display=swap`);
  });

  it("previews one weight per family, only the letters of the names", () => {
    expect(googleFontPreviewHref([STATIC, NO_REGULAR, ITALIC_ONLY, OPSZ])).toBe(
      `${css2}family=Lobster&family=Bungee+Hairline:wght@300&family=Molle:ital,wght@1,400&family=Fraunces` +
        `&text=${encodeURIComponent(" BFHLMabcegilnorstu")}&display=swap`
    );
  });
});

describe("custom heading weight", () => {
  it("offers every hundred of a variable range, or the static cuts", () => {
    expect(googleFontWeights(VARIABLE)).toEqual([400, 500, 600, 700, 800, 900]);
    expect(googleFontWeights(STATIC_CUTS)).toEqual([400, 500, 600, 700, 800]);
    expect(googleFontWeights(STATIC)).toEqual([400]);
    expect(googleFontWeights({ n: "Odd", a: { wght: [350, 380] } })).toEqual([350]);
  });

  it("snaps to the nearest weight the family has, lighter on a tie", () => {
    expect(nearestGoogleFontWeight(VARIABLE, 200)).toBe(400);
    expect(nearestGoogleFontWeight(STATIC_CUTS, 900)).toBe(800);
    expect(nearestGoogleFontWeight({ n: "Two", w: [400, 600] }, 500)).toBe(400);
  });

  it("sets the weight for every heading role only when one is picked", () => {
    expect(customHeadingVars(VARIABLE, null)).toEqual({ "--font-custom": '"Playfair Display"' });
    expect(customHeadingVars(VARIABLE, 600)).toEqual({
      "--font-custom": '"Playfair Display"',
      "--font-custom-weight": "600",
    });
  });
});

describe("Google Fonts catalog", () => {
  it("matches the font metadata of the installed Next (npm run google-fonts)", () => {
    // Categories come from Google's feed at generation time; the committed
    // ones stand in for it here, so the test stays offline.
    const categories = Object.fromEntries(
      (catalog as { n: string; c?: string }[]).filter((f) => f.c).map((f) => [f.n, f.c])
    );
    expect(serializeCatalog(buildCatalog(readNextFontData(), categories))).toBe(serializeCatalog(catalog));
  });
});
