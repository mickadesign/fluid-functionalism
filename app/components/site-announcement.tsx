"use client";

import { useEffect, useState } from "react";
import {
  Banner,
  BannerTitle,
  BannerDescription,
  BannerActions,
  BannerAction,
} from "@/registry/default/banner";
import {
  nextUndismissedAnnouncement,
  updateHref,
  updateKind,
  announceDisplayTitle,
  announceDisplayDescription,
  dismissAnnouncement,
  onAnnouncementDismissed,
  type UpdateEntry,
} from "@/lib/docs/updates";

/** Fixed site Banner for the next undismissed update marked `announce: true`. */
export function SiteAnnouncement() {
  // Resolved after mount so SSR / first paint match and localStorage is safe.
  const [announcement, setAnnouncement] = useState<UpdateEntry | null>(null);

  useEffect(() => {
    setAnnouncement(nextUndismissedAnnouncement());
  }, []);

  useEffect(() => {
    return onAnnouncementDismissed(() => {
      setAnnouncement(nextUndismissedAnnouncement());
    });
  }, []);

  if (!announcement) return null;

  const kind = updateKind(announcement);

  return (
    <div className="w-full max-w-170 max-sm:pl-14 px-6 mx-auto mt-4">
      <Banner
        status={kind === "Breaking" ? "error" : "info"}
        dismissible
        open
        onDismiss={() => {
          dismissAnnouncement(announcement.id);
          setAnnouncement(nextUndismissedAnnouncement());
        }}
      >
        <BannerTitle>{announceDisplayTitle(announcement)}</BannerTitle>
        <BannerDescription>
          {announceDisplayDescription(announcement)}
        </BannerDescription>
        <BannerActions>
          <BannerAction variant="primary" href={updateHref(announcement)}>
            View
          </BannerAction>
          <BannerAction href="/whats-new">What&apos;s new</BannerAction>
        </BannerActions>
      </Banner>
    </div>
  );
}
