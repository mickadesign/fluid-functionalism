import type { MetadataRoute } from "next";

const SITE_URL = "https://www.fluidfunctionalism.com";

// Training and bulk-scraping crawlers. Well-behaved bots honor this; abusive
// ones won't, so Vercel Firewall is the real enforcement.
// Agents fetching a page because a person asked (ChatGPT-User, Claude-User,
// Perplexity-User) and AI search indexes (OAI-SearchBot, Claude-SearchBot,
// PerplexityBot) stay allowed: they are how people find and use the docs,
// and /llms.txt exists for them.
const BLOCKED_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "FacebookBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
