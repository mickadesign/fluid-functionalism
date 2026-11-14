"use client";

// Saved views as tabs you can rename, delete and reorder: the playground's
// and the Saved views demo's. Docs code, built from the library's Tabs.
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion } from "motion/react";
import { spring } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { useIcons } from "@/lib/icon-context";
import { fieldTouchClass, typeClass, useSize } from "@/lib/size-context";
import { cn } from "@/lib/utils";
import { Tabs, TabsItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";

export interface ViewTab {
  /** Stable through renames and reorders: the tab's key, so a dragged tab
   *  (and its focus) moves with its view. */
  id: number;
  name: string;
}

interface ViewTabsProps {
  /** The first tab: the table as it starts. Never renamed, moved or deleted. */
  first: string;
  /** The saved views, after it. */
  views: readonly ViewTab[];
  /** The open tab: 0 is `first`, a saved view is its index + 1. */
  selected: number;
  onSelect: (tab: number) => void;
  /** By index among `views`. */
  onRename: (view: number, name: string) => void;
  onDelete: (view: number) => void;
  /** By tab index, both 1 or more. The caller moves the view and keeps the
   *  open tab open. */
  onMove: (from: number, to: number) => void;
  /** A tab to open for naming (a view just saved), then `onNameRequested`. */
  nameRequest?: number | null;
  onNameRequested?: () => void;
  className?: string;
}

/** Naming a view happens inline, in its tab: the tab's own label becomes
 *  the draft, so the tab grows as you type and pushes the ones after it,
 *  and a bare field sits on that label (the tab's fill shows through, no
 *  box or shadow of its own), with a × fading in at the tab's end. Clicking
 *  the open tab again opens it to rename. Enter or a click away keeps the
 *  name, Esc keeps the old one, and the × deletes the view.
 *
 *  Saved tabs reorder the way the table's column headers do (the first
 *  stays first): past 4px a press lifts a copy of the tab that follows the
 *  pointer (80%, the pressed fill, held inside the row), its slot empties,
 *  a 2px accent bar marks where it lands, and it moves on release, the
 *  other tabs sliding to their new places. The click the drag ends with is
 *  swallowed, so it doesn't rename. Alt + ← / → moves a focused tab. */
/** A view's name takes 192px of its tab at most, then cuts short with an
 *  ellipsis: a long name (or one being typed) no longer pushes the other
 *  tabs and the tools off the row. Being named, the field keeps to the
 *  same width and scrolls its text. Clipped sideways only: the labels'
 *  text box is trimmed to the cap height, and a full clip would cut their
 *  descenders. */
const VIEW_NAME_CAP =
  "[&_span>span]:max-w-48 [&_span>span]:overflow-x-clip [&_span>span]:text-ellipsis [&_span>span]:whitespace-nowrap";

export function ViewTabs({
  first,
  views,
  selected,
  onSelect,
  onRename,
  onDelete,
  onMove,
  nameRequest = null,
  onNameRequested,
  className,
}: ViewTabsProps) {
  const shape = useShape();
  const icons = useIcons();
  // The tabs take the page's size setting: their dragged copy and the name
  // field over a tab follow the same type.
  const tabType = useSize().variant === "compact" ? "compact" : "default";

  const tabsRef = useRef<HTMLDivElement>(null);
  const [naming, setNaming] = useState<{ at: number; draft: string } | null>(null);
  const nameView = (i: number, name: string) => setNaming({ at: i - 1, draft: name });
  // Where the field and its × sit, read from the tab after each keystroke
  // has resized it: the label's left edge and type, the tab's right end.
  const [nameBox, setNameBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    weight: string;
  } | null>(null);
  useLayoutEffect(() => {
    if (!naming) {
      setNameBox(null);
      return;
    }
    const box = tabsRef.current;
    const tab = box?.querySelectorAll<HTMLElement>("[role=tab]")[naming.at + 1];
    const label = tab?.querySelector<HTMLElement>("span > span:not([aria-hidden])");
    if (!box || !tab || !label) return;
    const b = box.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const l = label.getBoundingClientRect();
    const next = {
      left: l.left - b.left,
      top: t.top - b.top,
      width: t.right - l.left,
      height: t.height,
      weight: getComputedStyle(label).fontVariationSettings,
    };
    setNameBox((old) => (old && JSON.stringify(old) === JSON.stringify(next) ? old : next));
  }, [naming]);
  // A view saved this render gets its field once its tab is there.
  useLayoutEffect(() => {
    if (nameRequest === null) return;
    nameView(nameRequest, views[nameRequest - 1]?.name ?? "");
    onNameRequested?.();
    // nameView reads the tabs just rendered; it runs once per request.
  }, [nameRequest]);
  // The field takes focus with its name selected, once per opening.
  const nameRef = useRef<HTMLInputElement>(null);
  // (The field mounts once its place is read, a render after naming starts.)
  const namingAt = naming?.at ?? null;
  const fieldPlaced = nameBox !== null;
  useLayoutEffect(() => {
    if (namingAt === null || !fieldPlaced) return;
    nameRef.current?.focus({ preventScroll: true });
    nameRef.current?.select();
  }, [namingAt, fieldPlaced]);
  const commitName = () => {
    if (!naming) return;
    const name = naming.draft.trim();
    if (name) onRename(naming.at, name);
    setNaming(null);
  };
  // (The tabs fire no change for the tab already open: its own click does.)
  const renameView = (i: number) => {
    if (i !== selected || i === 0) return;
    nameView(i, views[i - 1]?.name ?? "");
  };

  const dragged = useRef(false);
  const tabGhostRef = useRef<HTMLDivElement>(null);
  const [tabGhost, setTabGhost] = useState<{ label: string; top: number; left: number; width: number; height: number } | null>(null);
  const [tabDrag, setTabDrag] = useState<{ from: number; bar: number | null } | null>(null);
  // Tab lefts before a move, by view id, so the next commit slides them.
  const tabLefts = useRef<Map<number, number> | null>(null);
  const tabEls = () => [...(tabsRef.current?.querySelectorAll<HTMLElement>("[role=tab]") ?? [])];
  const moveViewTab = (from: number, to: number) => {
    if (to === from || to < 1 || from < 1) return;
    tabLefts.current = new Map(tabEls().map((t) => [Number(t.dataset.viewId), t.getBoundingClientRect().left]));
    onMove(from, to);
  };
  useLayoutEffect(() => {
    const before = tabLefts.current;
    if (!before) return;
    tabLefts.current = null;
    for (const t of tabEls()) {
      const was = before.get(Number(t.dataset.viewId));
      const dx = was === undefined ? 0 : was - t.getBoundingClientRect().left;
      if (dx) animate(t, { x: [dx, 0] }, spring.moderate);
    }
  }, [views]);
  const onTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || naming) return;
    const box = tabsRef.current;
    const from = tabEls().findIndex((t) => t.contains(e.target as Node));
    if (!box || from < 1) return;
    const tab = tabEls()[from];
    const rect = tab.getBoundingClientRect();
    const startX = e.clientX;
    let moved = false;
    let to = from;
    // Where the dragged tab would land for a pointer x: before the first
    // saved tab whose middle is past it, or last.
    const land = (x: number) => {
      const els = tabEls();
      const i = els.findIndex((t, k) => k >= 1 && x < t.getBoundingClientRect().left + t.getBoundingClientRect().width / 2);
      const slot = i === -1 ? els.length : i;
      // A slot right before or after itself is no move.
      const target = slot > from ? slot - 1 : slot;
      const b = box.getBoundingClientRect();
      const barX = i === -1 ? els[els.length - 1].getBoundingClientRect().right - b.left + 1 : els[i].getBoundingClientRect().left - b.left - 3;
      return { target: Math.max(1, target), bar: target === from ? null : barX };
    };
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) < 4) return;
      if (!moved) {
        moved = true;
        dragged.current = true;
        setTabGhost({ label: tab.textContent?.slice(0, (tab.textContent?.length ?? 0) / 2) ?? "", top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
      // The ghost stays within the row of tabs.
      const b = box.getBoundingClientRect();
      const dx = Math.min(Math.max(ev.clientX - startX, b.left - rect.left), b.right - rect.right);
      if (tabGhostRef.current) tabGhostRef.current.style.transform = `translateX(${dx}px)`;
      const next = land(startX + dx);
      to = next.target;
      setTabDrag({ from, bar: next.bar });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setTabGhost(null);
      setTabDrag(null);
      if (!moved) return;
      // The release's click would rename the tab: swallowed for this one
      // gesture (a drop off the tab fires none, so the guard comes off on
      // the next tick).
      const swallow = (ev: Event) => ev.stopPropagation();
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => {
        window.removeEventListener("click", swallow, { capture: true });
        dragged.current = false;
      }, 0);
      moveViewTab(from, to);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const onTabsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    const from = tabEls().findIndex((t) => t === document.activeElement);
    if (from < 1) return;
    const to = from + (e.key === "ArrowLeft" ? -1 : 1);
    if (to < 1 || to > views.length) return;
    e.preventDefault();
    e.stopPropagation();
    moveViewTab(from, to);
  };

  return (
    <div ref={tabsRef} className={cn("relative flex items-center gap-1", className)}>
      <Tabs
        selectedIndex={selected}
        onSelect={(i) => !dragged.current && onSelect(i)}
        onPointerDownCapture={onTabsPointerDown}
        onKeyDownCapture={onTabsKeyDown}
        aria-label="Views"
      >
        {[{ id: 0, name: first }, ...views].map(({ id, name }, i) => {
          const editing = naming !== null && naming.at === i - 1;
          return (
            <TabsItem
              key={id}
              index={i}
              // Being named, the tab sizes to the draft (spaces kept, so a
              // trailing one widens it too), its own text hidden under the
              // field, with room at its end for the ×.
              label={editing ? naming.draft.replace(/ /g, " ") || " " : name}
              data-view-id={id}
              // The dragged tab's slot shows empty; its copy rides the pointer.
              className={cn(
                VIEW_NAME_CAP,
                i > 0 && "touch-none select-none",
                tabDrag?.from === i && "invisible",
                editing && "pr-8 [&_span]:!text-transparent"
              )}
              onClick={() => renameView(i)}
            />
          );
        })}
      </Tabs>
      {tabDrag?.bar != null && (
        // Where the tab lands: the column drag's 2px accent bar.
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 w-0.5 rounded-full bg-[var(--fluid-accent,#6B97FF)]"
          style={{ left: tabDrag.bar }}
        />
      )}
      {tabGhost &&
        createPortal(
          // The lifted tab: the pressed fill over the page background,
          // at 80%, following the pointer.
          <div
            ref={tabGhostRef}
            aria-hidden
            // The dragged tab's own corners and type.
            className={cn(
              "pointer-events-none fixed z-[var(--z-popover,60)] flex items-center justify-center whitespace-nowrap bg-background bg-[linear-gradient(var(--active),var(--active))] px-3 text-foreground opacity-80",
              typeClass("body", tabType),
              shape.item
            )}
            style={{ top: tabGhost.top, left: tabGhost.left, width: tabGhost.width, height: tabGhost.height }}
          >
            {tabGhost.label}
          </div>,
          document.body
        )}
      {naming && nameBox && (
        // The bare field on the tab's label, in the label's own type and
        // weight, so the name doesn't move or change size as it turns
        // editable; the tab's fill behind it is the only surface.
        <span
          className={cn("absolute z-10 flex items-center", typeClass("body", tabType))}
          style={{ left: nameBox.left, top: nameBox.top, width: nameBox.width, height: nameBox.height }}
        >
          <input
            ref={nameRef}
            aria-label="View name"
            value={naming.draft}
            onChange={(e) => setNaming({ ...naming, draft: e.target.value })}
            onBlur={(e) => {
              // Leaving for the field's own ×: that click decides.
              if (e.relatedTarget?.closest("[data-view-delete]")) return;
              commitName();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") setNaming(null);
            }}
            style={{ fontVariationSettings: nameBox.weight }}
            // 16px on touch screens, so iOS doesn't zoom into the field.
            className={cn("h-full min-w-0 flex-1 bg-transparent p-0 text-foreground outline-none", fieldTouchClass)}
          />
          <Tooltip content="Delete view">
            <motion.button
              type="button"
              data-view-delete=""
              aria-label="Delete view"
              onClick={() => {
                const at = naming.at;
                setNaming(null);
                onDelete(at);
              }}
              // Fades in as the tab turns editable.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={spring.fast}
              className={cn("mr-0.5 grid size-6 shrink-0 cursor-pointer place-items-center text-muted-foreground outline-none hover:bg-hover hover:text-destructive", shape.item)}
            >
              <icons.x size={14} strokeWidth={1.5} />
            </motion.button>
          </Tooltip>
        </span>
      )}
    </div>
  );
}
