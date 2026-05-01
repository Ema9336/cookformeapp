"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { getAnalyticsIdentity, trackAnalyticsEvent } from "../lib/analytics";

function textOrEmpty(value?: string | null, max = 300) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function elementDescriptor(el: HTMLElement) {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const classes = Array.from(el.classList).slice(0, 2).map((c) => `.${c}`).join("");
  return `${tag}${id}${classes}`.slice(0, 200);
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visitorIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids = getAnalyticsIdentity();
    visitorIdRef.current = ids.visitorId;
    sessionIdRef.current = ids.sessionId;
  }, []);

  useEffect(() => {
    if (!pathname || !sessionIdRef.current) return;

    trackAnalyticsEvent({
      eventType: "PAGE_VIEW",
      path: pathname,
      userId: user?.id,
      metadata: {
        referrer: typeof document !== "undefined" ? textOrEmpty(document.referrer, 400) : "",
      },
    });
  }, [pathname, user?.id]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const clickable = target?.closest("a,button,[data-analytics],input[type='submit']") as HTMLElement | null;
      if (!clickable || !sessionIdRef.current) return;

      const label = textOrEmpty(
        clickable.getAttribute("data-analytics-label") ||
          clickable.getAttribute("aria-label") ||
          clickable.textContent,
        300,
      );

      trackAnalyticsEvent({
        eventType: "CLICK",
        path: pathname,
        element: elementDescriptor(clickable),
        label,
        userId: user?.id,
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, user?.id]);

  return null;
}
