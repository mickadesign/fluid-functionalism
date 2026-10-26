// The site's share card: the still from `npm run og` and its loop from
// `npm run og:video`. A page that sets its own openGraph replaces the root
// layout's wholesale, so every such page spreads these back in.

export const OG_IMAGES = [{ url: "/metadata/og.png", width: 2400, height: 1260 }];

// Absolute on purpose: Next resolves image URLs against metadataBase but
// prints video URLs as written, and crawlers need the full URL. MP4 first:
// most unfurlers take the first og:video and only play H.264. The image
// stays the poster for every platform that ignores og:video.
const OG_VIDEO_BASE = "https://www.fluidfunctionalism.com/metadata/og";

export const OG_VIDEOS = (
  [
    ["mp4", "video/mp4"],
    ["webm", "video/webm"],
  ] as const
).map(([ext, type]) => ({
  url: `${OG_VIDEO_BASE}.${ext}`,
  secureUrl: `${OG_VIDEO_BASE}.${ext}`,
  width: 1200,
  height: 630,
  type,
}));
