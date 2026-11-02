"use client";

// ---------------------------------------------------------------------------
// Shared "Get code" UI for playground presets: the site-global knobs that
// ride along in every code, the ?preset= URL sync, and the dialog. Each
// playground supplies its own encode/apply; everything else is uniform.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { useShape } from "@/lib/shape-context";
import { useSizeVariant } from "@/lib/size-context";
import { useBase } from "@/lib/base-context";
import { Button } from "@/registry/radix/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/registry/radix/dialog";
import { InputCopy } from "@/registry/default/input-copy";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { buildPresetPrompt } from "@/lib/docs/install-prompt";
import { useHoverMode } from "@/lib/docs/hover-mode";
import type { PresetGlobals } from "@/lib/preset/sidebar-options";
import type { PresetComponentDef } from "@/lib/preset/codec";

const SITE = "https://www.fluidfunctionalism.com";

/** The site-level knobs every preset encodes: the primitive flavor picks
 *  the payload namespace, shape/size pin the providers in the emitted page. */
export function usePresetGlobals(): PresetGlobals {
  const { base } = useBase();
  const shape = useShape();
  const sizeVariant = useSizeVariant();
  return {
    flavor: base === "base" ? "base" : "radix",
    shape: shape.bgRadius >= 20 ? "pill" : "rounded",
    size: sizeVariant === "compact" ? "compact" : "default",
  };
}

/** Share-links in, address bar out: reads ?preset= once on mount (the caller
 *  decodes and applies — after checking the tag is its own), then keeps the
 *  URL tracking the current code. replaceState keeps Next's router out. */
export function usePresetUrlSync(
  code: string,
  defaultCode: string,
  onLoad: (raw: string) => void
): void {
  // A pasted ?preset= is the ONLY copy of the shared state, and the tracker
  // effect below runs in the same commit as the mount-read — before the
  // decoded state has landed. Writing then would replace the pasted code
  // with the pre-hydration default, and any remount inside that window (a
  // hydration failure, StrictMode, a flavor flip) would re-read the
  // clobbered URL and lose the preset for good. So: while a pasted code is
  // pending, the tracker only writes once `code` has moved off its initial
  // value — proof the decode was applied. Until then the URL stays intact,
  // and any remount simply re-reads and re-applies it.
  const pendingRef = useRef<string | null>(null);
  const initialCodeRef = useRef(code);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("preset");
    if (raw) {
      pendingRef.current = raw;
      onLoad(raw);
    }
    // Mount-only by design: the param seeds state once; afterwards the rail
    // owns it and the effect below writes the URL.
  }, []);
  useEffect(() => {
    if (pendingRef.current !== null) {
      if (code === initialCodeRef.current) return; // decode not applied yet
      pendingRef.current = null;
    }
    const url = new URL(window.location.href);
    if (code === defaultCode) url.searchParams.delete("preset");
    else url.searchParams.set("preset", code);
    window.history.replaceState(window.history.state, "", url);
  }, [code, defaultCode]);
}

/** The rail-bottom action. Installable components get a "Copy prompt"
 *  button (same brief as the doc page's Installation block, pointed at the
 *  preset block); share-only components get a modal with the playground
 *  link instead. */
export function GetCodeDialog({
  def,
  code,
}: {
  def: PresetComponentDef;
  code: string;
}) {
  const { base } = useBase();
  const hover = useHoverMode();
  if (def.installable) {
    return (
      <CopyPromptButton
        prompt={buildPresetPrompt({ def, code, base, hover })}
        size="sm"
        // Full width only in the desktop rail; inline under the preview
        // (below xl) it hugs its label and sits left.
        className="xl:w-full"
      />
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm" className="w-full">
          Share
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[480px]"
        // Don't auto-focus the copy field — its focus ring and tooltip
        // firing on open read as noise; the copy button still works.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Share this configuration</DialogTitle>
          <DialogDescription>
            Reopens the {def.label} playground exactly as configured.
          </DialogDescription>
        </DialogHeader>
        <InputCopy value={`${SITE}${def.docsPath}?preset=${code}`} />
      </DialogContent>
    </Dialog>
  );
}
