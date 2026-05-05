"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "../hooks/useAuth";
import AnalyticsTracker from "../components/analytics-tracker";
import AnalyticsConsentBanner from "../components/analytics-consent-banner";
import SupportChatWidget from "../components/support-chat-widget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AnalyticsConsentBanner />
        <AnalyticsTracker />
        <SupportChatWidget />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}