import { NextResponse } from "next/server";

const SOURCE = "mickadesign/fluid-functionalism";
const SKILL = "fluid-functionalism";

// Install count for the agent skill, as counted by skills.sh: `npx skills add`
// reports every install there. The search endpoint is the one skills.sh's own
// site uses and is undocumented, so any failure returns null and the page
// hides the count. Forks publish the same skill under their own source, so
// match on ours. Cached for an hour: the count moves slowly.
export const revalidate = 3600;

interface SkillsShResult {
  source?: string;
  skillId?: string;
  installs?: number;
}

export async function GET() {
  try {
    const res = await fetch(
      `https://skills.sh/api/search?q=${encodeURIComponent(SKILL)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return NextResponse.json({ installs: null });
    const data = (await res.json()) as { skills?: SkillsShResult[] };
    const match = data.skills?.find(
      (s) => s.source === SOURCE && s.skillId === SKILL,
    );
    return NextResponse.json({
      installs: typeof match?.installs === "number" ? match.installs : null,
    });
  } catch {
    return NextResponse.json({ installs: null });
  }
}
