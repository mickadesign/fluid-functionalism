import { describe, expect, it } from "vitest";
import { nestedRadius, shapeMap } from "@/lib/shape-context";

describe("nested border radii", () => {
  it("derives an inner radius from the visible inset and border", () => {
    expect(nestedRadius(28, 12)).toBe(16);
    expect(nestedRadius(13, 4, 1)).toBe(8);
  });

  it("clamps the inner radius at zero", () => {
    expect(nestedRadius(8, 12)).toBe(0);
  });

  it.each([shapeMap.rounded, shapeMap.pill].map((s) => [s.variant, s] as const))(
    "%s keeps the fixed popup pair concentric around p-1",
    (_variant, shape) => {
      expect(shape.containerRadius).toBe(shape.bgRadius + 4);
    }
  );

  // Square on square needs no concentric offset: sharp is 1px all the way out.
  it("keeps every sharp radius at 1px", () => {
    const { bgRadius, containerRadius, mergedRadius } = shapeMap.sharp;
    expect([bgRadius, containerRadius, mergedRadius]).toEqual([1, 1, 1]);
  });
});

// The R shortcut and settings list shapes in display order, while preset links
// pack them by index (so their order can never change). Both must name every
// shape the map defines, or a new variant goes missing from one of them.
describe("shape lists", async () => {
  const { SETTING_VALUES } = await import("@/lib/docs/site-settings");
  const presets = await Promise.all([
    import("@/lib/preset/ask-user-questions-options").then((m) => m.AUQ_PRESET_FIELDS),
    import("@/lib/preset/calendar-options").then((m) => m.CALENDAR_PRESET_FIELDS),
    import("@/lib/preset/card-options").then((m) => m.CARD_PRESET_FIELDS),
    import("@/lib/preset/combobox-options").then((m) => m.COMBOBOX_PRESET_FIELDS),
    import("@/lib/preset/command-menu-options").then((m) => m.COMMAND_MENU_PRESET_FIELDS),
    import("@/lib/preset/date-picker-options").then((m) => m.DATE_PICKER_PRESET_FIELDS),
    import("@/lib/preset/dropdown-options").then((m) => m.DROPDOWN_PRESET_FIELDS),
    import("@/lib/preset/input-message-options").then((m) => m.INPUT_MESSAGE_PRESET_FIELDS),
    import("@/lib/preset/sidebar-options").then((m) => m.SIDEBAR_PRESET_FIELDS),
  ]);
  const shapes = Object.keys(shapeMap).sort();

  it("settings and the R cycle list every shape", () => {
    expect([...SETTING_VALUES.shape].sort()).toEqual(shapes);
  });

  it("every preset encodes every shape, rounded first as the default", () => {
    for (const fields of presets) {
      const field = fields.find((f) => f.key === "shape");
      expect(field).toBeDefined();
      expect([...field!.values].sort()).toEqual(shapes);
      expect(field!.values[0]).toBe("rounded");
    }
  });
});
