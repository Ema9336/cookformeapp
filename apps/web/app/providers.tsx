"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "../hooks/useAuth";
import AnalyticsTracker from "../components/analytics-tracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AnalyticsTracker />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}