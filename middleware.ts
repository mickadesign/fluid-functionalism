import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { track } from "@vercel/analytics/server";

// Counts registry fetches (`npx shadcn add .../r/<name>.json`) as a Web
// Analytics custom event. Static files are served from the CDN cache, so this
// is the only place a fetch is visible. Dependencies resolved by full URL
// (utils, springs, ...) are counted too, one event per file.
const REGISTRY_PATH = /^\/r\/(?:(base|radix)\/)?([a-z0-9-]+)(?:\.json)?$/;

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const match = request.nextUrl.pathname.match(REGISTRY_PATH);
  if (match && match[2] !== "registry") {
    const [, flavor, name] = match;
    // The shadcn CLI fetches with Node, browsers send a Mozilla UA.
    const userAgent = request.headers.get("user-agent") ?? "";
    // track() posts to the referer's origin (or the protected deployment URL
    // when there is none), so pin it to this request's own URL.
    const headers = new Headers(request.headers);
    headers.set("referer", request.url);
    event.waitUntil(
      track(
        "Registry fetch",
        {
          item: flavor ? `${flavor}/${name}` : name,
          client: userAgent.startsWith("Mozilla/") ? "browser" : "cli",
        },
        { headers },
      ).catch(() => {}),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/r/:path*",
};
