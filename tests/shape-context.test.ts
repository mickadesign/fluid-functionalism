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

  it.each(Object.entries(shapeMap))(
    "%s keeps the fixed popup pair concentric around p-1",
    (_variant, shape) => {
      expect(shape.containerRadius).toBe(shape.bgRadius + 4);
    }
  );
});
