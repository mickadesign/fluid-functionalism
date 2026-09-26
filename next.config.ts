import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The fluid hover hook was published as `use-proximity-hover` until
      // 2026-09-07. Installed components still list it as a registry
      // dependency, so the old URL must keep resolving.
      {
        source: "/r/use-proximity-hover.json",
        destination: "/r/use-fluid-hover.json",
        permanent: true,
      },
      // Short link to the agent skill page, for sharing.
      {
        source: "/skill",
        destination: "/docs/skill",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
