import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTING_VALUES,
  SETTINGS_COOKIES,
  readSettings,
  settingCookie,
} from "@/lib/docs/site-settings";
import { iconLibraryOrder } from "@/lib/docs/icon-map";

const jar = (cookies: Record<string, string>) => (name: string) => cookies[name];

describe("Make them yours settings", () => {
  it("reads the defaults when nothing is saved", () => {
    expect(readSettings(jar({}))).toEqual(DEFAULT_SETTINGS);
  });

  it("reads every saved setting back", () => {
    const saved = { theme: "dark", shape: "pill", size: "compact", icons: "phosphor", base: "radix", accent: "red" } as const;
    const cookies = Object.fromEntries(
      Object.entries(saved).map(([key, value]) => [SETTINGS_COOKIES[key as keyof typeof saved], value]),
    );
    expect(readSettings(jar(cookies))).toEqual(saved);
  });

  it("falls back per setting when a cookie holds an unknown value", () => {
    const s = readSettings(jar({ ff_theme: "sepia", ff_shape: "pill" }));
    expect(s.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(s.shape).toBe("pill");
  });

  it("round-trips through the cookie it writes", () => {
    const line = settingCookie("icons", "tabler");
    const [pair] = line.split("; ");
    const [name, value] = pair.split("=");
    expect(readSettings(jar({ [name]: value })).icons).toBe("tabler");
    expect(line).toContain("path=/");
  });

  it("accepts exactly the icon libraries the site can show", () => {
    expect([...SETTING_VALUES.icons].sort()).toEqual([...iconLibraryOrder].sort());
  });

  it("lists each default among its setting's values", () => {
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]) {
      expect(SETTING_VALUES[key] as readonly string[]).toContain(DEFAULT_SETTINGS[key]);
    }
  });
});
