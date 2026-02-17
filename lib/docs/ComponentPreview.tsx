"use client";

import { useState, useEffect, type ReactNode } from "react";
import { highlight } from "./highlight";
import { cn } from "@/registry/default/lib/utils";
import { fontWeights } from "@/registry/default/lib/font-weight";

interface ComponentPreviewProps {
  title?: string;
  code: string;
  children: ReactNode;
}

export function ComponentPreview({ title, code, children }: ComponentPreviewProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [html, setHtml] = useState("");

  useEffect(() => {
    highlight(code).then(setHtml);
  }, [code]);

  return (
    <div className="flex flex-col gap-0 w-full border border-border/60 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border/60 bg-muted/30">
        {title && (
          <span
            className="px-4 py-2.5 text-[13px] text-foreground mr-auto"
            style={{ fontVariationSettings: fontWeights.semibold }}
          >
            {title}
          </span>
        )}
        <div className={cn("flex", title ? "" : "w-full")}>
          <button
            onClick={() => setTab("preview")}
            className={cn(
              "px-4 py-2.5 text-[13px] cursor-pointer bg-transparent border-none outline-none transition-colors duration-80",
              tab === "preview"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{
              fontVariationSettings:
                tab === "preview" ? fontWeights.semibold : fontWeights.normal,
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setTab("code")}
            className={cn(
              "px-4 py-2.5 text-[13px] cursor-pointer bg-transparent border-none outline-none transition-colors duration-80",
              tab === "code"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{
              fontVariationSettings:
                tab === "code" ? fontWeights.semibold : fontWeights.normal,
            }}
          >
            Code
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === "preview" ? (
        <div className="flex items-center justify-center p-8 min-h-[120px] bg-background">
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
