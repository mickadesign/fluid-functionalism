"use client";

import Link from "next/link";
import { componentList } from "@/lib/docs/components";
import { BentoGrid } from "@/app/components/bento-grid";
import { Button } from "@/registry/default/button";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { useIcon } from "@/lib/icon-context";
import { Tooltip } from "@/registry/default/tooltip";

export default function Page() {
  const ArrowRight = useIcon("arrow-right");

  return (
    <div className="mt-12 lg:mt-0">
      <div className="w-full max-w-[640px] mx-auto py-20 sm:py-28 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1
              className="text-[22px] sm:text-[28px] text-foreground leading-none"
              style={{ fontVariationSettings: fontWeights.bold }}
            >
              Fluid Functionalism
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Refined UI components with satisfying hover.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/docs">
                <Button variant="primary" size="sm">Get started</Button>
              </Link>
              <Link href="/docs">
                <Button variant="tertiary" size="sm">Browse components</Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" disabled aria-label="No previous page">
              <ArrowRight className="rotate-180" />
            </Button>
            <Tooltip content={<span>Introduction &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
              <Link href="/docs" aria-label="Next: Introduction" className="outline-none" tabIndex={-1}>
                <Button variant="ghost" size="icon">
                  <ArrowRight />
                </Button>
              </Link>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[1200px] mx-auto px-6 pb-16">
        <BentoGrid components={componentList} />
      </div>
    </div>
  );
}
