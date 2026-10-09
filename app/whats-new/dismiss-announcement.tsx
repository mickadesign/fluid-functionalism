"use client";

import { useEffect } from "react";
import { dismissAllAnnouncements } from "@/lib/docs/updates";

/** Marks every current site announcement as seen when What's New is opened. */
export function DismissAnnouncementOnVisit() {
  useEffect(() => {
    dismissAllAnnouncements();
  }, []);

  return null;
}
