"use client";

import { useState, useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { highlight } from "./highlight";
import { routeKeyboardOnMouseDown } from "@/lib/click-to-focus";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { useIcon } from "@/registry/default/lib/icon-context";
import { TabsSubtle, TabsSubtleItem } from "@/components/flavored/tabs-subtle";
import { Tooltip } from "@/registry/radix/tooltip";
import { Switch } from "@/registry/radix/switch";
import { AnimatePresence } from "framer-motion";
import { InspectOverlay } from "./InspectOverlay";

export interface PlaybackButton {
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
}

interface ComponentPreviewProps {
  title?: string;
  /** Source snippet for the Code tab. Optional for hideHeader previews,
   *  which have no tab bar to reach it from. */
  code?: string;
  /** Legacy replay callback */
  onReplay?: () => void;
  /** Custom playback button (overrides onReplay) */
  playbackButton?: PlaybackButton;
  /** Padding around the preview content. Use "compact" when the demo
   *  is a self-contained block that already supplies its own breathing
   *  room (dialogs, full-bleed cards). "responsive" is compact on mobile
   *  and default on desktop — for big demos that feel cramped on phones.
   *  "none" removes the padding entirely so the demo bleeds to the
   *  preview frame (full-width tables, scroll areas).
   *  Defaults to "default". */
  padding?: "default" | "compact" | "responsive" | "none";
  /** Override the minimum height of the preview area. Accepts any Tailwind
   *  min-height class (e.g. `min-h-[280px]`). Defaults to `min-h-[120px]`.
   *  Useful when a demo opens floating UI (popovers, dropdowns) that needs
   *  vertical room. */
  minHeightClass?: string;
  /** Vertical alignment of the preview content. Defaults to "center".
   *  "top" suits content that grows downward — an accordion opening a panel
   *  shouldn't shift the rows above it. */
  align?: "top" | "center" | "bottom";
  /** Show the Inspect toggle (pixel rulers + box-model inspector). Defaults to
   *  true; set false for previews where an overlay would get in the way. */
  inspectable?: boolean;
  /** Start with Inspect already on — for previews whose subject IS the
   *  geometry. The toggle still works. */
  defaultInspect?: boolean;
  /** Draw the inspector's top/left pixel rulers. Defaults to true; set false
   *  for full-width/full-height demos where the rulers would overlap (or be
   *  masked by) the component's own chrome — the crosshair, box model, and
   *  measurement tooltip still work. */
  inspectRulers?: boolean;
  /** Drop the Preview/Code + Inspect header entirely — the frame shows just
   *  the live demo. For gallery-style rows (the Layouts variants) where the
   *  chrome would repeat three times for one code sample. */
  hideHeader?: boolean;
  /** Centered label rendered under the frame — the gallery rows' captions. */
  caption?: string;
  children: ReactNode;
}

export function ComponentPreview({
  title,
  code,
  onReplay,
  playbackButton,
  padding = "default",
  minHeightClass = "min-h-[120px]",
  align = "center",
  inspectable = true,
  defaultInspect = false,
  inspectRulers = true,
  hideHeader = false,
  caption,
  children,
}: ComponentPreviewProps) {
  const [tab, setTab] = useState(0);
  const [inspect, setInspect] = useState(defaultInspect);
  const [html, setHtml] = useState("");
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Clicking an empty part of the preview routes keyboard control into the demo
  // (focuses its first interactive element); :focus-within then shows the
  // contrasted border. Clicking outside / Tab away hands keys back to the page.
  const handlePreviewMouseDown = (e: MouseEvent<HTMLDivElement>) =>
    routeKeyboardOnMouseDown(e, previewRef.current);

  useEffect(() => {
    if (code) highlight(code).then(setHtml);
  }, [code]);

  const showButton = !!playbackButton || !!onReplay;
  // Inspect only applies to the live Preview tab. When on, reserve a strip at
  // the top/left of the frame for the rulers (so they sit above the toggles and
  // fit the outer border without overlapping the header or content).
  const inspecting = inspectable && inspect && tab === 0;

  const frame = (
    <div
      ref={frameRef}
      // The Copy-prompt sweep screenshots this frame as its reference for
      // what the component looks like (evals/copy-prompts/grade.mjs).
      data-component-preview=""
      // `isolate` scopes the frame's internal z ladder (the z-[70] tab bar,
      // the inspect overlay's layers) to its own stacking context, so a
      // portalled dialog's z-50 overlay dims the WHOLE frame instead of
      // sliding underneath the header.
      className={`relative isolate flex flex-col gap-0 w-full border border-border/60 transition-[border-color] duration-150 ease-out focus-within:border-foreground/40 ${shape.container}`}
    >
      {/* Tab bar — min-height reserves the playback button's height (h-10 + pt-3)
          so the header doesn't shift when the button mounts/unmounts. A hairline
          along the bottom separates it from the preview/code below. Its own
          opaque background sits above the inspect overlay's ruler layer
          (z-[70] > z-[60]) so the ruler ticks tuck cleanly under it. */}
      {!hideHeader && (
      <div
        className="relative z-[70] flex items-center gap-0 px-3 py-3 min-h-[52px] border-b border-border/60 bg-background"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        {title && (
          <span
            className="px-4 py-2.5 text-site-body text-foreground mr-auto"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {title}
          </span>
        )}
        <TabsSubtle selectedIndex={tab} onSelect={setTab}>
          <TabsSubtleItem index={0} label="Preview" />
          <TabsSubtleItem index={1} label="Code" />
        </TabsSubtle>
        <div className="ml-auto flex items-center gap-1">
          {inspectable && tab === 0 && (
            // Toggling Inspect must not dismiss whatever the preview has open
            // (a dropdown, a popover) — inspecting THAT state is the point.
            // The demos' menus are non-modal, so they dismiss on any outside
            // pointerdown reaching the document and on focus moving outside.
            // stopIMMEDIATEPropagation is what blocks them: the App Router
            // hydrates React on `document`, so Radix's document listener sits
            // on the same node as React's delegation and plain stopPropagation
            // can't cut it off. preventDefault on mousedown keeps focus (and
            // the focus-out dismissal) where it is; the Switch still toggles
            // on click.
            <span
              onPointerDown={(e) => e.nativeEvent.stopImmediatePropagation()}
              onMouseDown={(e) => {
                e.preventDefault();
                e.nativeEvent.stopImmediatePropagation();
              }}
            >
              <Switch
                label="Inspect"
                checked={inspect}
                onToggle={() => setInspect((v) => !v)}
                className="h-8 px-2 rounded-md"
              />
            </span>
          )}
          {showButton && (
            <Tooltip content={playbackButton?.tooltip ?? "Replay animation"} side="top">
              <button
                onClick={playbackButton?.onClick ?? onReplay}
                className={`w-10 h-10 flex items-center justify-center ${shape.button} text-muted-foreground hover:text-foreground hover:bg-hover transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]`}
                aria-label={playbackButton?.tooltip ?? "Replay animation"}
              >
                {playbackButton?.icon ?? <ReplayIcon size={16} strokeWidth={1.5} />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      )}

      {/* Content. Wrapped so its rectangular bottom corners get clipped
          to the outer container's rounded shape (rounded-xl / rounded-3xl
          depending on shape). overflow-hidden alone on the outer would
          re-clip the TabsSubtle focus ring above; this scoped clipper
          uses `border-bottom-*-radius: inherit` so it adopts whichever
          shape is active, and leaves the top corners square (the tab
          bar sits above, well below the outer's curved top edge). */}
      <div
        className="overflow-hidden"
        // With no header above it, the content owns all four corners.
        style={
          hideHeader
            ? { borderRadius: "inherit" }
            : {
                borderBottomLeftRadius: "inherit",
                borderBottomRightRadius: "inherit",
              }
        }
      >
        {tab === 0 ? (
          <div
            ref={previewRef}
            // Focus target for empty-space clicks (see routeKeyboardOnMouseDown)
            // — holds keyboard scope for the demo without ringing any control.
            tabIndex={-1}
            onMouseDown={handlePreviewMouseDown}
            className={`relative flex outline-none ${
              align === "bottom"
                ? "items-end"
                : align === "top"
                  ? "items-start"
                  : "items-center"
            } justify-center ${minHeightClass} bg-background ${
              padding === "none"
                ? ""
                : padding === "compact"
                  ? "px-4 py-4"
                  : padding === "responsive"
                    ? "px-4 py-4 sm:px-8 sm:py-12"
                    : "px-8 py-12"
            }`}
          >
            {children}
          </div>
        ) : (
          <div
            className={`overflow-auto text-site-body [&_pre]:m-0 [&_pre]:p-4 ${minHeightClass.replace("min-h-", "[&_pre]:min-h-")} [&_.shiki]:!bg-transparent`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      {/* Inspector — sits over the whole frame so its rulers reach the outer
          border and clear the header toggles. Fades in/out with the toggle. */}
      <AnimatePresence>
        {inspecting && (
          <InspectOverlay
            key="inspect"
            frameRef={frameRef}
            contentRef={previewRef}
            rulers={inspectRulers}
          />
        )}
      </AnimatePresence>
    </div>
  );

  if (!caption) return frame;
  return (
    <div className="flex flex-col gap-3">
      {frame}
      <p className="pb-2 text-center text-site-caption text-muted-foreground">{caption}</p>
    </div>
  );
}
