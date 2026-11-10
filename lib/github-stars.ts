const REPO = "mickadesign/fluid-functionalism";

/**
 * The repo's GitHub star count, or null when GitHub can't say. Server only:
 * the fetch is cached for 60s, so GitHub's 60-calls-an-hour limit for
 * unauthenticated callers is shared by every visitor instead of spent by each
 * one. Capped at 1.5s, since the root layout waits on it: a slow GitHub costs
 * the count, not the page.
 */
export async function getGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
