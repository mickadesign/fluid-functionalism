"use client";

import Link from "next/link";
import { componentList } from "@/lib/docs/components";
import { BentoGrid } from "@/app/components/bento-grid";
import { Button } from "@/registry/default/button";
import { fontWeights } from "@/registry/default/lib/font-weight";

export default function Page() {
  return (
    <div className="w-full max-w-[1200px] mx-auto py-10 sm:py-16 px-6 mt-12 lg:mt-0">
      <div className="flex flex-col gap-2 mb-10">
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
      <BentoGrid components={componentList} />
    </div>
  );
}
