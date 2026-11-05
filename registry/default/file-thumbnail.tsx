"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";

// ─── Lazy pdfjs loader ────────────────────────────────────────────────────
// Imports pdfjs-dist on first PDF, caches the module, and points the worker
// at the matching CDN build. Consumers don't need bundler-side worker config.
// Sites whose CSP blocks jsDelivr call `setPdfWorkerSrc` with a worker they
// host themselves (copy `pdfjs-dist/build/pdf.worker.min.mjs` to `public/`).
type PdfjsModule = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfjsModule> | null = null;
let pdfWorkerSrc: string | null = null;

function setPdfWorkerSrc(src: string) {
  pdfWorkerSrc = src;
  // Already loaded: retarget it, so the next PDF uses the new worker.
  pdfjsPromise?.then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = src;
  });
}

async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      if (pdfWorkerSrc) {
        mod.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
      } else if (!mod.GlobalWorkerOptions.workerSrc) {
        mod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${mod.version}/build/pdf.worker.min.mjs`;
      }
      return mod;
    });
  }
  return pdfjsPromise;
}

async function renderPdfFirstPage(file: File, targetWidth: number): Promise<string> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = (targetWidth * 2) / baseViewport.width; // 2× for retina
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  return canvas.toDataURL("image/png");
}

// ─── Object URLs ──────────────────────────────────────────────────────────
// One blob URL per File while any thumbnail shows it: subscribing creates it,
// the last unsubscribe revokes it. Created at subscription rather than in a
// memo, so StrictMode's simulated unmount/remount revokes the URL and then
// mints a fresh one, instead of leaving a revoked `blob:` URL on screen.
const objectUrls = new Map<File, { url: string; users: number }>();

function subscribeObjectUrl(file: File) {
  let entry = objectUrls.get(file);
  if (!entry) {
    entry = { url: URL.createObjectURL(file), users: 0 };
    objectUrls.set(file, entry);
  }
  entry.users += 1;
  const held = entry;
  return () => {
    held.users -= 1;
    if (held.users === 0) {
      URL.revokeObjectURL(held.url);
      objectUrls.delete(file);
    }
  };
}

function useObjectUrl(file: File | null): string | null {
  const subscribe = useCallback(
    () => (file ? subscribeObjectUrl(file) : () => {}),
    [file]
  );
  return useSyncExternalStore(
    subscribe,
    () => (file ? (objectUrls.get(file)?.url ?? null) : null),
    () => null
  );
}

// ─── File thumbnail ───────────────────────────────────────────────────────
// Read-only square preview of a File. Images use object-cover via
// `URL.createObjectURL`; PDFs render the first page via pdfjs; while either is
// resolving a spinner is shown. Self-contained (outline + surface + sizing) so
// it can be reused both inside the composer's preview row and to render
// already-sent attachments in a chat transcript.
interface FileThumbnailProps {
  file: File;
  /** Side length of the square thumbnail in pixels. */
  size: number;
  /** Explicit corner radius for a known nested inset. Defaults to the active
   *  shape's regular image/control radius. */
  radius?: number;
  className?: string;
}

function FileThumbnail({ file, size, radius, className }: FileThumbnailProps) {
  const shape = useShape();
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  // The URL exists from the commit on, so the first render has none. That
  // one-frame "before URL" state is covered by the bg-accent (no fallback
  // icon shown for images), so the transition is visually clean.
  const imageUrl = useObjectUrl(isImage ? file : null);

  // PDFs need async rendering — loading flash is unavoidable for the first
  // ~100–300ms while pdfjs loads. Falls back to the generic icon on error
  // (corrupt/password-protected file, CDN worker blocked).
  // The last render stays up while a new one is on its way (a size change
  // doesn't flash the spinner); a failure only counts for the file and size
  // it happened to.
  const [pdf, setPdf] = useState<{
    url: string | null;
    failed: { file: File; size: number } | null;
  }>({ url: null, failed: null });
  if (!isPdf && (pdf.url !== null || pdf.failed !== null)) {
    setPdf({ url: null, failed: null });
  }
  useEffect(() => {
    if (!isPdf) return;
    let cancelled = false;
    renderPdfFirstPage(file, size)
      .then((url) => {
        if (!cancelled) setPdf({ url, failed: null });
      })
      .catch(() => {
        if (!cancelled) setPdf((prev) => ({ ...prev, failed: { file, size } }));
      });
    return () => {
      cancelled = true;
    };
  }, [file, isPdf, size]);
  const pdfUrl = pdf.url;
  const pdfError = pdf.failed?.file === file && pdf.failed.size === size;

  const previewUrl = imageUrl ?? pdfUrl;
  // Spinner only while a preview is genuinely pending; anything that can't
  // produce one (failed PDF, unsupported type) gets the generic icon instead.
  const isPending = (isImage && !imageUrl) || (isPdf && !pdfUrl && !pdfError);

  return (
    <div
      className={cn(
        // Paint the hairline over the preview: unlike a border, it costs no
        // space, and pure neutral ink stays clean over every surface tint.
        "relative shrink-0 overflow-hidden bg-accent outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
        shape.bg,
        className
      )}
      style={{
        width: size,
        height: size,
        // Keep className radius overrides working at the default. Inline
        // geometry is reserved for an explicit nested-radius calculation.
        ...(radius == null ? {} : { borderRadius: radius }),
      }}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={file.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : isPending ? (
        // Circular spinner while we wait for the preview to be ready.
        // Used for both images (brief URL-creation gap) and PDFs (longer
        // pdfjs render). The thin ring is mostly subtle (border-border)
        // with one quadrant accented (border-t-muted-foreground) so the
        // `animate-spin` rotation reads as a moving arc.
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-6 h-6 rounded-full border-2 border-border border-t-muted-foreground animate-spin"
            aria-label="Loading preview"
            role="status"
          />
        </div>
      ) : (
        // Generic document glyph for files with no renderable preview.
        // Inline SVG (not the icon system) so the thumbnail stays
        // self-contained for registry consumers.
        <div
          className="absolute inset-0 flex items-center justify-center text-muted-foreground"
          role="img"
          aria-label={file.name}
        >
          <svg
            width={Math.max(16, size * 0.35)}
            height={Math.max(16, size * 0.35)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
          </svg>
        </div>
      )}
    </div>
  );
}

export { FileThumbnail, loadPdfjs, renderPdfFirstPage, setPdfWorkerSrc };
export type { FileThumbnailProps };
