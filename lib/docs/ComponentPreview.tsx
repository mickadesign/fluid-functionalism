"use client";

import { useState, useEffect, type ReactNode } from "react";
import { highlight } from "./highlight";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useShape } from "@/registry/default/lib/shape-context";
import { useIcon } from "@/registry/default/lib/icon-context";
import { TabsSubtle, TabsSubtleItem } from "@/registry/default/tabs-subtle";

interface ComponentPreviewProps {
  title?: string;
  code: string;
  onReplay?: () => void;
  children: ReactNode;
}

export function ComponentPreview({ title, code, onReplay, children }: ComponentPreviewProps) {
  const [tab, setTab] = useState(0);
  const [html, setHtml] = useState("");
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");

  useEffect(() => {
    highlight(code).then(setHtml);
  }, [code]);

  return (
    <div className={`flex flex-col gap-0 w-full border border-border/60 overflow-hidden ${shape.container}`}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 px-3 pt-3">
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
      </div>

      {/* Content */}
      {tab === 0 ? (
        <div className="relative flex items-center justify-center px-8 py-12 min-h-[120px] bg-background">
          {onReplay && (
            <button
              onClick={onReplay}
              className="absolute top-2 right-2 z-20 w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#6B97FF]"
              aria-label="Replay animation"
            >
              <ReplayIcon size={16} strokeWidth={1.5} />
            </button>
          )}
          {children}
        </div>
      ) : (
        <div
          className="overflow-auto text-[13px] [&_pre]:m-0 [&_pre]:p-4 [&_pre]:min-h-[120px] [&_.shiki]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
