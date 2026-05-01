"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analyticsApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const VISITOR_KEY = "cf_visitor_id";
const SESSION_KEY = "cf_session_id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateStorageId(key: string, storage: Storage) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = randomId();
  storage.setItem(key, id);
  return id;
}

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
    visitorIdRef.current = getOrCreateStorageId(VISITOR_KEY, window.localStorage);
    sessionIdRef.current = getOrCreateStorageId(SESSION_KEY, window.sessionStorage);
  }, []);

  useEffect(() => {
    if (!pathname || !sessionIdRef.current) return;

    void analyticsApi.trackEvent({
      eventType: "PAGE_VIEW",
      path: pathname,
      referrer: typeof document !== "undefined" ? textOrEmpty(document.referrer, 400) : "",
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      userId: user?.id,
    }).catch(() => {
      // Never block UX on analytics failures.
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

      void analyticsApi.trackEvent({
        eventType: "CLICK",
        path: pathname,
        element: elementDescriptor(clickable),
        label,
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        userId: user?.id,
      }).catch(() => {
        // Never block UX on analytics failures.
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, user?.id]);

  return null;
}
