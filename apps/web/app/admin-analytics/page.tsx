"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../lib/api";

type AnalyticsSummary = {
  from: string;
  to: string;
  totals: {
    events: number;
    pageViews: number;
    clicks: number;
    formSubmits: number;
    uniqueVisitors: number;
    uniqueSessions: number;
    avgSessionDurationSec: number;
  };
  topPages: { path: string; count: number }[];
  topClicks: { label: string; count: number }[];
  topCountries: { country: string; count: number }[];
  funnel: {
    key: string;
    label: string;
    count: number;
    conversionFromPrevPct: number;
    dropOffFromPrevPct: number;
  }[];
};

type AnalyticsEvent = {
  id: string;
  eventType: "PAGE_VIEW" | "CLICK" | "FORM_SUBMIT" | "CUSTOM";
  path: string | null;
  element: string | null;
  label: string | null;
  sessionId: string;
  visitorId: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userId: string | null;
  referrer: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; email: string; name: string; role: string } | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function escapeCsv(value: unknown) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function AdminAnalyticsPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = async () => {
    if (!accessToken) return;

    setLoading(true);
    setLoadError("");

    try {
      const fromIso = dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined;
      const toIso = dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined;

      const [summaryData, eventData] = await Promise.all([
        adminApi.getAnalyticsSummary(accessToken, fromIso, toIso),
        adminApi.listAnalyticsEvents(accessToken, {
          limit: 300,
          eventType: eventTypeFilter === "ALL" ? undefined : eventTypeFilter,
          path: pathFilter || undefined,
          query: query || undefined,
          from: fromIso,
          to: toIso,
        }),
      ]);

      setSummary(summaryData as AnalyticsSummary);
      setEvents(eventData as AnalyticsEvent[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const applyTodayPreset = () => {
    const today = toDateInputValue(new Date());
    setDateFrom(today);
    setDateTo(today);
  };

  const applyLastDaysPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setDateFrom(toDateInputValue(from));
    setDateTo(toDateInputValue(to));
  };

  const isTodayPreset = dateFrom && dateTo && dateFrom === dateTo && dateFrom === toDateInputValue(new Date());
  const isLast7Preset = useMemo(() => {
    if (!dateFrom || !dateTo) return false;
    const to = toDateInputValue(new Date());
    const from = new Date();
    from.setDate(from.getDate() - 6);
    return dateFrom === toDateInputValue(from) && dateTo === to;
  }, [dateFrom, dateTo]);

  const isLast30Preset = useMemo(() => {
    if (!dateFrom || !dateTo) return false;
    const to = toDateInputValue(new Date());
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return dateFrom === toDateInputValue(from) && dateTo === to;
  }, [dateFrom, dateTo]);

  const clearFilters = () => {
    setQuery("");
    setPathFilter("");
    setEventTypeFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const exportCsv = () => {
    const headers = [
      "timestamp",
      "eventType",
      "path",
      "label",
      "element",
      "country",
      "region",
      "city",
      "visitorId",
      "sessionId",
      "userName",
      "userEmail",
      "referrer",
    ];

    const rows = events.map((event) => [
      event.createdAt,
      event.eventType,
      event.path ?? "",
      event.label ?? "",
      event.element ?? "",
      event.country ?? "",
      event.region ?? "",
      event.city ?? "",
      event.visitorId ?? "",
      event.sessionId,
      event.user?.name ?? "",
      event.user?.email ?? "",
      event.referrer ?? "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const fromPart = dateFrom || "all";
    const toPart = dateTo || "all";
    const link = document.createElement("a");
    link.href = url;
    link.download = `cookforme-analytics-${fromPart}-to-${toPart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white">
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              ← Home
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/admin-compliance" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              Compliance
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/admin-users" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              User Roles
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/admin-audit" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              Audit Logs
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <h1 className="font-bold text-xl">Analytics</h1>
          </div>
          <button
            onClick={() => void loadData()}
            className="text-xs text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {loadError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            {loadError}
          </div>
        )}

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={applyTodayPreset}
                className={`text-xs px-3 py-2 rounded-lg border ${
                  isTodayPreset
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => applyLastDaysPreset(7)}
                className={`text-xs px-3 py-2 rounded-lg border ${
                  isLast7Preset
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => applyLastDaysPreset(30)}
                className={`text-xs px-3 py-2 rounded-lg border ${
                  isLast30Preset
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                Last 30 Days
              </button>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              >
                <option value="ALL">All Events</option>
                <option value="PAGE_VIEW">Page Views</option>
                <option value="CLICK">Clicks</option>
                <option value="FORM_SUBMIT">Form Submits</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              />
              <button
                onClick={clearFilters}
                className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
              >
                Reset
              </button>
              <button
                onClick={() => void loadData()}
                className="text-xs px-3 py-2 rounded-lg border border-black dark:border-white"
              >
                Apply
              </button>
              <button
                onClick={exportCsv}
                className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700"
              >
                Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
                placeholder="Filter path (e.g. /chef)"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search label, element, user, visitor"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm sm:col-span-2"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{summary?.totals.events ?? 0}</p>
            <p className="text-xs text-gray-500">Total Events</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.totals.pageViews ?? 0}</p>
            <p className="text-xs text-gray-500">Page Views</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary?.totals.clicks ?? 0}</p>
            <p className="text-xs text-gray-500">Clicks</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary?.totals.formSubmits ?? 0}</p>
            <p className="text-xs text-gray-500">Form Submits</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{summary?.totals.uniqueVisitors ?? 0}</p>
            <p className="text-xs text-gray-500">Unique Visitors</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{summary?.totals.uniqueSessions ?? 0}</p>
            <p className="text-xs text-gray-500">Unique Sessions</p>
          </div>
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-2xl font-bold">{formatDuration(summary?.totals.avgSessionDurationSec ?? 0)}</p>
            <p className="text-xs text-gray-500">Avg Session Duration</p>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="font-semibold mb-3">Funnel Drop-off</h2>
          {(summary?.funnel?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No funnel data yet.</p>
          ) : (
            <div className="space-y-3">
              {summary?.funnel.map((step) => (
                <div key={step.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{step.label}</span>
                    <span>
                      {step.count} sessions · {step.conversionFromPrevPct}% kept · {step.dropOffFromPrevPct}% drop
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white"
                      style={{ width: `${Math.max(2, step.conversionFromPrevPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Pages</h2>
            {(summary?.topPages?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No page view data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topPages.map((item) => (
                  <div key={item.path} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.path}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <h2 className="font-semibold mb-3">Top Click Labels</h2>
            {(summary?.topClicks?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-500">No click data yet.</p>
            ) : (
              <div className="space-y-2">
                {summary?.topClicks.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="truncate mr-3">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="font-semibold mb-3">Top Countries</h2>
          {(summary?.topCountries?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No geo data yet.</p>
          ) : (
            <div className="space-y-2">
              {summary?.topCountries.map((item) => (
                <div key={item.country} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-3">{item.country}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-900">
            <div className="col-span-2">When</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-3">Path / Label</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Visitor / Session</div>
            <div className="col-span-1">User</div>
            <div className="col-span-1">Element / Referrer</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading analytics events…</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No analytics events found.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-900 items-start">
                <div className="col-span-2 text-xs text-gray-500">{formatDateTime(event.createdAt)}</div>
                <div className="col-span-1">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                    {event.eventType}
                  </span>
                </div>
                <div className="col-span-3 text-xs">
                  <p className="font-medium truncate">{event.path ?? "—"}</p>
                  <p className="text-gray-500 truncate">{event.label ?? "—"}</p>
                </div>
                <div className="col-span-2 text-xs">
                  <p className="truncate">{event.country ?? "—"}</p>
                  <p className="text-gray-500 truncate">{[event.region, event.city].filter(Boolean).join(", ") || "—"}</p>
                </div>
                <div className="col-span-2 text-xs">
                  <p className="truncate">v: {event.visitorId ?? "—"}</p>
                  <p className="text-gray-500 truncate">s: {event.sessionId}</p>
                </div>
                <div className="col-span-1 text-xs">
                  <p className="font-medium truncate">{event.user?.name ?? "Anonymous"}</p>
                  <p className="text-gray-500 truncate">{event.user?.email ?? "—"}</p>
                </div>
                <div className="col-span-1 text-xs text-gray-500">
                  <p className="truncate">{event.element ?? "—"}</p>
                  <p className="truncate">{event.referrer ?? "—"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
