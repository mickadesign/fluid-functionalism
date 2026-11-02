// @vitest-environment jsdom
/**
 * routeKeyboardOnMouseDown: an empty-space press inside a demo keeps keyboard
 * scope there, leaves a focused text field (so a typed time commits), and
 * a press on a portaled popup keeps focus where it is.
 */
import { afterEach, describe, expect, it } from "vitest";
import type { MouseEvent } from "react";
import { routeKeyboardOnMouseDown } from "@/lib/click-to-focus";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup() {
  document.body.innerHTML = `
    <div id="region" tabindex="-1">
      <span id="empty">space</span>
      <button id="button">Go</button>
      <input id="input" />
    </div>
    <div id="portal"><div id="row">11:30 AM</div></div>
  `;
  const $ = (id: string) => document.getElementById(id)!;
  return { region: $("region"), $ };
}

function press(target: HTMLElement) {
  let prevented = false;
  const event = { target, preventDefault: () => (prevented = true) } as unknown as MouseEvent;
  return { event, prevented: () => prevented };
}

describe("routeKeyboardOnMouseDown", () => {
  it("lets a focusable target take focus natively", () => {
    const { region, $ } = setup();
    const p = press($("button"));
    routeKeyboardOnMouseDown(p.event, region);
    expect(p.prevented()).toBe(false);
  });

  it("keeps a focused control on an empty-space press", () => {
    const { region, $ } = setup();
    $("button").focus();
    const p = press($("empty"));
    routeKeyboardOnMouseDown(p.event, region);
    expect(p.prevented()).toBe(true);
    expect(document.activeElement).toBe($("button"));
  });

  it("leaves a focused text field for the region on an empty-space press", () => {
    const { region, $ } = setup();
    $("input").focus();
    const p = press($("empty"));
    routeKeyboardOnMouseDown(p.event, region);
    expect(p.prevented()).toBe(true);
    expect(document.activeElement).toBe(region);
  });

  it("keeps a focused non-text input (a range) on an empty-space press", () => {
    const { region, $ } = setup();
    const range = document.createElement("input");
    range.type = "range";
    region.appendChild(range);
    range.focus();
    const p = press($("empty"));
    routeKeyboardOnMouseDown(p.event, region);
    expect(document.activeElement).toBe(range);
  });

  it("keeps focus in the field when a portaled popup row is pressed", () => {
    const { region, $ } = setup();
    $("input").focus();
    const p = press($("row"));
    routeKeyboardOnMouseDown(p.event, region);
    expect(p.prevented()).toBe(true);
    expect(document.activeElement).toBe($("input"));
  });
});
