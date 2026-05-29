"use client";

import { useState, useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { highlight } from "./highlight";
import { routeKeyboardOnMouseDown } from "@/lib/click-to-focus";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { useIcon } from "@/registry/default/lib/icon-context";
import { TabsSubtle, TabsSubtleItem } from "@/registry/default/tabs-subtle";
import { Tooltip } from "@/registry/radix/tooltip";

export interface PlaybackButton {
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
}

interface ComponentPreviewProps {
  title?: string;
  code: string;
  /** Legacy replay callback */
  onReplay?: () => void;
  /** Custom playback button (overrides onReplay) */
  playbackButton?: PlaybackButton;
  /** Padding around the preview content. Use "compact" when the demo
   *  is a self-contained block that already supplies its own breathing
   *  room (dialogs, full-bleed cards). "responsive" is compact on mobile
   *  and default on desktop — for big demos that feel cramped on phones.
   *  Defaults to "default". */
  padding?: "default" | "compact" | "responsive";
  /** Override the minimum height of the preview area. Accepts any Tailwind
   *  min-height class (e.g. `min-h-[280px]`). Defaults to `min-h-[120px]`.
   *  Useful when a demo opens floating UI (popovers, dropdowns) that needs
   *  vertical room. */
  minHeightClass?: string;
  /** Vertical alignment of the preview content. Defaults to "center". */
  align?: "center" | "bottom";
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
  children,
}: ComponentPreviewProps) {
  const [tab, setTab] = useState(0);
  const [html, setHtml] = useState("");
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");
  const previewRef = useRef<HTMLDivElement>(null);

  // Clicking an empty part of the preview routes keyboard control into the demo
  // (focuses its first interactive element); :focus-within then shows the
  // contrasted border. Clicking outside / Tab away hands keys back to the page.
  const handlePreviewMouseDown = (e: MouseEvent<HTMLDivElement>) =>
    routeKeyboardOnMouseDown(e, previewRef.current);

  useEffect(() => {
    highlight(code).then(setHtml);
  }, [code]);

  const showButton = !!playbackButton || !!onReplay;

  return (
    <div className={`flex flex-col gap-0 w-full border border-border/60 overflow-hidden transition-[border-color] duration-80 focus-within:border-foreground/40 ${shape.container}`}>
      {/* Tab bar — min-height reserves the playback button's height (h-10 + pt-3)
          so the header doesn't shift when the button mounts/unmounts. */}
      <div className="flex items-center gap-0 px-3 pt-3 min-h-[52px]">
        {title && (
          <span
            className="px-4 py-2.5 text-[13px] text-foreground mr-auto"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {title}
          </span>
        )}
        <TabsSubtle selectedIndex={tab} onSelect={setTab}>
          <TabsSubtleItem index={0} label="Preview" />
          <TabsSubtleItem index={1} label="Code" />
        </TabsSubtle>
        {showButton && (
          <Tooltip content={playbackButton?.tooltip ?? "Replay animation"} side="top">
            <button
              onClick={playbackButton?.onClick ?? onReplay}
              className={`ml-auto w-10 h-10 flex items-center justify-center ${shape.button} text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]`}
              aria-label={playbackButton?.tooltip ?? "Replay animation"}
            >
              {playbackButton?.icon ?? <ReplayIcon size={16} strokeWidth={1.5} />}
            </button>
          </Tooltip>
        )}
      </div>

      {/* Content */}
      {tab === 0 ? (
        <div
          ref={previewRef}
          onMouseDown={handlePreviewMouseDown}
          className={`flex ${align === "bottom" ? "items-end" : "items-center"} justify-center ${minHeightClass} bg-background ${
            padding === "compact"
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
          className={`overflow-auto text-[13px] [&_pre]:m-0 [&_pre]:p-4 ${minHeightClass.replace("min-h-", "[&_pre]:min-h-")} [&_.shiki]:!bg-transparent`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
