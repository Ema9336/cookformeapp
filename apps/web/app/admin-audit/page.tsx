"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../lib/api";

type AuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: string;
  actor?: { id: string; email: string; name: string; role: string } | null;
};

function formatDate(iso: string) {
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

export default function AdminAuditPage() {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    adminApi
      .listAuditLogs(accessToken, 200)
      .then((data) => setLogs(data as AuditLog[]))
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load audit logs"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      const matchesAction = actionFilter === "ALL" || l.action === actionFilter;

      const created = new Date(l.createdAt);
      const matchesFrom = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`);
      const matchesTo = !dateTo || created <= new Date(`${dateTo}T23:59:59`);

      const details = l.details ?? "";
      const matchesQuery =
        q.length === 0 ||
        l.action.toLowerCase().includes(q) ||
        l.targetType.toLowerCase().includes(q) ||
        l.targetId.toLowerCase().includes(q) ||
        (l.actor?.email ?? "").toLowerCase().includes(q) ||
        (l.actor?.name ?? "").toLowerCase().includes(q) ||
        details.toLowerCase().includes(q);

      return (
        matchesAction &&
        matchesFrom &&
        matchesTo &&
        matchesQuery
      );
    });
  }, [logs, query, actionFilter, dateFrom, dateTo]);

  const actionOptions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return ["ALL", ...Array.from(set).sort()];
  }, [logs]);

  const clearFilters = () => {
    setQuery("");
    setActionFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

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
  const isLast7Preset = (() => {
    if (!dateFrom || !dateTo) return false;
    const to = toDateInputValue(new Date());
    const from = new Date();
    from.setDate(from.getDate() - 6);
    return dateFrom === toDateInputValue(from) && dateTo === to;
  })();
  const isLast30Preset = (() => {
    if (!dateFrom || !dateTo) return false;
    const to = toDateInputValue(new Date());
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return dateFrom === toDateInputValue(from) && dateTo === to;
  })();

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
            <Link href="/admin-analytics" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              Analytics
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <h1 className="font-bold text-xl">Audit Logs</h1>
          </div>
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
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search action, actor, target, or details"
                className="w-full sm:max-w-md rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              />
              <span className="text-xs text-gray-500">Showing {filtered.length} of {logs.length}</span>
            </div>
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
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-2 text-xs"
              >
                {actionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
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
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 dark:border-gray-900">
            <div className="col-span-2">When</div>
            <div className="col-span-2">Actor</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-4">Details</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading audit logs…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No audit logs found.</div>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-900 items-start">
                <div className="col-span-2 text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                <div className="col-span-2 text-xs">
                  <p className="font-medium truncate">{log.actor?.name ?? "Unknown"}</p>
                  <p className="text-gray-500 truncate">{log.actor?.email ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">
                    {log.action}
                  </span>
                </div>
                <div className="col-span-2 text-xs">
                  <p className="font-medium truncate">{log.targetType}</p>
                  <p className="text-gray-500 truncate">{log.targetId}</p>
                </div>
                <div className="col-span-4 text-xs text-gray-500 break-words">{log.details ?? "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
