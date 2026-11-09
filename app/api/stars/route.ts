import { NextResponse } from "next/server";
import { getGitHubStars } from "@/lib/github-stars";

// Live GitHub star count, cached server-side for 60s so we call GitHub at most
// once a minute no matter how many visitors poll this route.
export const revalidate = 60;

export async function GET() {
  return NextResponse.json({ stars: await getGitHubStars() });
}
