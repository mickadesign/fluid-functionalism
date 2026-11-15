"use client";

import { useEffect, useRef, useState } from "react";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { LH, LW, SCENES } from "./scene-list";

const W = LW;
const H = LH;

/** One scene: its real-size page in an iframe, scaled to the frame's width.
 *  Hover plays it; a click pins it playing or paused. */
function Frame({ n, id, title, motion, seconds }: { n: number; id: string; title: string; motion: string; seconds: number }) {
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState<boolean | null>(null);
  const playing = pinned ?? hovered;

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "teaser-play", playing }, "*");
  }, [playing]);

  return (
    <figure className="flex flex-col gap-3">
      <div
        ref={stage}
        className="relative aspect-video overflow-hidden rounded-[2px] border border-border/60 bg-background"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          setPinned((p) => (p === false ? null : p));
        }}
      >
        {scale > 0 && (
          <iframe
            ref={frame}
            title={title}
            src={`/og/teaser/scene?id=${id}`}
            className="pointer-events-auto absolute left-0 top-0 origin-top-left border-0"
            style={{ width: W, height: H, transform: `scale(${scale})` }}
            onLoad={() => frame.current?.contentWindow?.postMessage({ type: "teaser-play", playing }, "*")}
          />
        )}
        <span className="pointer-events-none absolute left-3 top-2 font-mono text-[11px] tabular-nums text-muted-foreground">
          {String(n).padStart(2, "0")}
        </span>
        <button
          type="button"
          aria-label={playing ? `Pause scene ${n}` : `Play scene ${n}`}
          aria-pressed={playing}
          onClick={() => setPinned(!playing)}
          className="absolute right-2 top-2 rounded-[2px] bg-background/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          {playing ? "pause" : "play"}
        </button>
      </div>
      <figcaption className="flex flex-col gap-1">
        <p className="text-site-body text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
          {title} <span className="font-mono text-site-caption text-muted-foreground">· {seconds}s</span>
        </p>
        <p className="text-site-body text-muted-foreground">{motion}</p>
      </figcaption>
    </figure>
  );
}

export function Board() {
  const total = SCENES.reduce((s, x) => s + x.seconds, 0);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="font-mono text-site-caption text-muted-foreground">Storyboard · X post, muted autoplay, 16:9 loop · {total.toFixed(1)}s</p>
        <h1 className="mt-2 text-site-display text-foreground" style={{ fontVariationSettings: fontWeights.bold }}>
          One table, every shape it takes
        </h1>
        <p className="mt-2 text-site-body text-muted-foreground">
          8 hard cuts of the DataTable in different data and settings, then its 4 main moves, each followed by a close-up of a detail.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
        {SCENES.map((s, i) => (
          <Frame key={s.id} n={i + 1} {...s} />
        ))}
      </div>
    </main>
  );
}
