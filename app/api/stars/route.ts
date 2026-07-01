import { NextResponse } from "next/server";

const REPO = "mickadesign/fluid-functionalism";

// Live GitHub star count, cached server-side for 60s so we call GitHub at most
// once a minute no matter how many visitors poll this route.
export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ stars: null }, { status: 200 });
    const data = await res.json();
    return NextResponse.json({ stars: data?.stargazers_count ?? null });
  } catch {
    return NextResponse.json({ stars: null }, { status: 200 });
  }
}
