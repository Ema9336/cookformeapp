"use client";

import { useEffect, useState } from "react";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackAnalyticsEvent,
  type AnalyticsConsent,
} from "../../lib/analytics";

export default function AnalyticsPreferenceControls() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent>("unknown");

  useEffect(() => {
    setConsent(getAnalyticsConsent());
    setMounted(true);
  }, []);

  const handleAllow = () => {
    setAnalyticsConsent("granted");
    setConsent("granted");
    trackAnalyticsEvent({
      eventType: "CUSTOM",
      label: "analytics_consent_granted",
      metadata: { source: "privacy_page" },
    });
  };

  const handleDecline = () => {
    setAnalyticsConsent("denied");
    setConsent("denied");
  };

  if (!mounted) return null;

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <p className="text-sm font-semibold text-slate-800">Analytics Preference</p>
      <p className="mt-1 text-xs text-slate-600">
        Current setting: {consent === "granted" ? "Allowed" : consent === "denied" ? "Declined" : "Not chosen yet"}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDecline}
          className={`text-xs px-3 py-2 rounded-lg border transition ${
            consent === "denied"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          Decline Analytics
        </button>
        <button
          onClick={handleAllow}
          className={`text-xs px-3 py-2 rounded-lg border transition ${
            consent === "granted"
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-emerald-300 bg-emerald-100 text-emerald-800"
          }`}
        >
          Allow Analytics
        </button>
      </div>
    </div>
  );
}
