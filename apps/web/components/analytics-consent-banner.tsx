"use client";

import { useState } from "react";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackAnalyticsEvent,
  type AnalyticsConsent,
} from "../lib/analytics";

export default function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent>(() => getAnalyticsConsent());
  const [open, setOpen] = useState(() => getAnalyticsConsent() === "unknown");

  const accept = () => {
    setAnalyticsConsent("granted");
    setConsent("granted");
    setOpen(false);

    trackAnalyticsEvent({
      eventType: "CUSTOM",
      label: "analytics_consent_granted",
      metadata: { source: "consent_banner" },
    });
  };

  const decline = () => {
    setAnalyticsConsent("denied");
    setConsent("denied");
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-xl p-4">
          <p className="text-sm font-semibold">Privacy & Analytics</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            We use first-party analytics to improve the product. You can choose whether to allow analytics tracking.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={decline}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
            >
              Allow Analytics
            </button>
          </div>
        </div>
      )}

      {!open && consent !== "unknown" && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 text-xs px-3 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
        >
          Analytics: {consent === "granted" ? "On" : "Off"}
        </button>
      )}
    </>
  );
}
