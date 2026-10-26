"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CommandMenu,
  CommandMenuDialog,
  CommandMenuEmpty,
  CommandMenuFooter,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
  type CommandMenuItemData,
} from "@/registry/default/command-menu";
import {
  POPULAR_GOOGLE_FONTS,
  googleFontPreviewHref,
  type GoogleFont,
} from "@/lib/docs/google-fonts";

/** Rows per query: enough to scan, few enough to preview in one request. */
const LIMIT = 50;

/** How long typing pauses before the rows' preview faces load: one request
 *  per settled query, not one per keystroke. */
const PREVIEW_DELAY_MS = 200;

/** The rows arrive filtered (see `results`); the menu shows them as is. */
const KEEP_ALL = () => true;

/**
 * Docs-site-only: the whole Google Fonts catalog in a command menu, each
 * row set in its own face. The catalog loads on first open. Before anything
 * is typed it lists popular heading families; typing matches names, prefix
 * matches first, LIMIT rows at most.
 */
export function GoogleFontPicker({
  open,
  onOpenChange,
  current,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The family picked last, listed first while the query is empty. */
  current: string | null;
  onPick: (font: GoogleFont) => void;
}) {
  const [catalog, setCatalog] = useState<GoogleFont[] | null>(null);
  // A failed load (offline, or a chunk swapped by a deploy) says so instead
  // of loading forever, and the next open tries again.
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || catalog || failed) return;
    let live = true;
    import("@/lib/docs/google-fonts.json").then(
      (m) => {
        if (live) setCatalog(m.default as GoogleFont[]);
      },
      () => {
        if (live) setFailed(true);
      }
    );
    return () => {
      live = false;
    };
  }, [open, catalog, failed]);

  const byName = useMemo(() => new Map((catalog ?? []).map((f) => [f.n, f])), [catalog]);

  const results = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    if (!q) {
      const names = current ? [current, ...POPULAR_GOOGLE_FONTS.filter((n) => n !== current)] : POPULAR_GOOGLE_FONTS;
      return names.map((n) => byName.get(n)).filter((f): f is GoogleFont => !!f);
    }
    const prefix: GoogleFont[] = [];
    const inner: GoogleFont[] = [];
    for (const f of catalog) {
      const name = f.n.toLowerCase();
      if (name.startsWith(q)) prefix.push(f);
      else if (name.includes(q)) inner.push(f);
    }
    return [...prefix, ...inner].slice(0, LIMIT);
  }, [catalog, byName, query, current]);

  // The previews follow the rows once typing settles; the previous sheet
  // stays until then, so rows already shown keep their faces.
  const resultsHref = results.length > 0 ? googleFontPreviewHref(results) : null;
  // The popular list on open needs no wait.
  const settled = query.trim() === "";
  const [previewHref, setPreviewHref] = useState<string | null>(null);
  useEffect(() => {
    if (!resultsHref) return;
    const id = setTimeout(() => setPreviewHref(resultsHref), settled ? 0 : PREVIEW_DELAY_MS);
    return () => clearTimeout(id);
  }, [resultsHref, settled]);

  const items = useMemo<CommandMenuItemData[]>(
    () => results.map((f) => ({ value: f.n, label: f.n })),
    [results]
  );

  return (
    <CommandMenuDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setFailed(false);
        }
      }}
      shortcut={null}
      title="Google Fonts"
      description="Pick a family for the site's headings."
    >
      {previewHref && <link rel="stylesheet" href={previewHref} />}
      <CommandMenu
        items={items}
        query={query}
        onQueryChange={setQuery}
        filter={KEEP_ALL}
        onSelect={(item) => {
          const font = byName.get(item.value);
          if (font) onPick(font);
        }}
      >
        <CommandMenuInput
          placeholder={
            catalog
              ? `Search ${catalog.length.toLocaleString("en-US")} Google Fonts…`
              : failed
                ? "Google Fonts didn't load"
                : "Loading Google Fonts…"
          }
        />
        <CommandMenuList
          renderItem={(item) => (
            <CommandMenuItem value={item.value}>
              <span
                className="min-w-0 flex-1 truncate py-1 -my-1"
                style={{ fontFamily: `"${item.value}", var(--font-sans)` }}
              >
                {item.label}
              </span>
            </CommandMenuItem>
          )}
        >
          <CommandMenuEmpty>
            {catalog
              ? "No family matches."
              : failed
                ? "The font list didn't load. Close and reopen to try again."
                : "Loading…"}
          </CommandMenuEmpty>
        </CommandMenuList>
        <CommandMenuFooter />
      </CommandMenu>
    </CommandMenuDialog>
  );
}
