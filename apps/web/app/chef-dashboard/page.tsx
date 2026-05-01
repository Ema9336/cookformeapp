"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { bookingsApi } from "../../lib/api";

// ─── Mock data ────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "accepted" | "completed" | "declined";

type Order = {
  id: string;
  customer: string;
  item: string;
  date: string;
  servings: number;
  total: string;
  status: OrderStatus;
  note?: string;
};

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-001",
    customer: "Sarah M.",
    item: "5 Meals / Week Plan",
    date: "Mon Apr 20",
    servings: 5,
    total: "$149",
    status: "pending",
    note: "No shellfish please, dairy-free if possible",
  },
  {
    id: "ORD-002",
    customer: "James T.",
    item: "Seafood Boil Tray",
    date: "Sat Apr 19",
    servings: 12,
    total: "$280",
    status: "pending",
  },
  {
    id: "ORD-003",
    customer: "Priya K.",
    item: "Salmon Power Bowl × 3",
    date: "Wed Apr 16",
    servings: 3,
    total: "$54",
    status: "accepted",
  },
  {
    id: "ORD-004",
    customer: "Tom R.",
    item: "Family Meal Plan",
    date: "Mon Apr 14",
    servings: 20,
    total: "$229",
    status: "completed",
  },
  {
    id: "ORD-005",
    customer: "Lisa N.",
    item: "Brunch Platter",
    date: "Sun Apr 13",
    servings: 8,
    total: "$200",
    status: "completed",
  },
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  accepted: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  completed: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  declined: "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "⏳ Pending",
  accepted: "✓ Accepted",
  completed: "✅ Completed",
  declined: "✕ Declined",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChefDashboardPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "completed">("all");
  const [listingActive, setListingActive] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    bookingsApi.chefBookings(accessToken).then((data) => {
      const mapped = (data as Array<Record<string, unknown>>).map((b) => ({
        id: String(b.id),
        customer: (b.customer as { name?: string })?.name ?? "Customer",
        item: String(b.serviceType ?? ""),
        date: b.date ? new Date(String(b.date)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "",
        servings: Number(b.guestCount ?? 1),
        total: b.totalAmount ? "$" + Number(b.totalAmount).toFixed(0) : "—",
        status: String(b.status ?? "pending").toLowerCase() as OrderStatus,
        note: (b.notes as string) || (b.allergies as string) || undefined,
      }));
      if (mapped.length > 0) setOrders(mapped);
    }).catch(() => {/* keep mock data on error */});
  }, [accessToken]);

  const accept = (id: string) => {
    if (accessToken) bookingsApi.updateStatus(accessToken, id, "ACCEPTED").catch(() => {});
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "accepted" } : o)));
  };
  const decline = (id: string) => {
    if (accessToken) bookingsApi.updateStatus(accessToken, id, "DECLINED").catch(() => {});
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "declined" } : o)));
  };
  const complete = (id: string) => {
    if (accessToken) bookingsApi.updateStatus(accessToken, id, "COMPLETED").catch(() => {});
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "completed" } : o)));
  };

  const filtered =
    activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const weekEarnings = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + parseFloat(o.total.replace("$", "").replace(",", "")), 0);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white">

      {/* Top nav */}
      <nav className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="text-xl font-bold">
          Cook For Me
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setListingActive(!listingActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${
              listingActive
                ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                : "border-gray-300 dark:border-gray-700 text-gray-500"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${listingActive ? "bg-green-500" : "bg-gray-400"}`} />
            {listingActive ? "Listing Live" : "Listing Paused"}
          </button>
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-lg">
            👨‍🍳
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Chef Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Coastal Prep Kitchen · Back Bay, Boston MA</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending", value: pendingCount.toString(), sub: "needs response", highlight: pendingCount > 0 },
            { label: "This Week", value: "$" + weekEarnings.toLocaleString(), sub: "from completed orders", highlight: false },
            { label: "Rating", value: "4.9 ⭐", sub: "128 reviews", highlight: false },
          ].map(({ label, value, sub, highlight }) => (
            <div
              key={label}
              className={`rounded-2xl border p-4 ${
                highlight
                  ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${highlight ? "text-amber-700 dark:text-amber-400" : ""}`}>{value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/chef-profile-edit"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-green-400 transition text-center"
          >
            <span className="text-2xl">✏️</span>
            <span className="text-sm font-medium">Edit Listing</span>
          </Link>
          <button className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-green-400 transition">
            <span className="text-2xl">📅</span>
            <span className="text-sm font-medium">Availability</span>
          </button>
          <Link
            href="/chef/coastal-prep-kitchen"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black hover:border-green-400 transition text-center"
          >
            <span className="text-2xl">👁️</span>
            <span className="text-sm font-medium">View Listing</span>
          </Link>
        </div>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  {pendingCount} order{pendingCount > 1 ? "s" : ""} waiting for your response
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">Respond quickly — customers browse multiple chefs at once.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("pending")}
              className="shrink-0 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Review
            </button>
          </div>
        )}

        {/* Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Orders</h2>
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900 rounded-xl p-1">
              {(["all", "pending", "accepted", "completed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    activeTab === tab
                      ? "bg-white dark:bg-zinc-800 shadow text-black dark:text-white"
                      : "text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                No {activeTab} orders
              </div>
            )}

            {filtered.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-5 space-y-3"
              >
                {/* Order header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{order.customer}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{order.item}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {order.date} · {order.servings} servings · <span className="font-semibold text-green-600">{order.total}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{order.id}</span>
                </div>

                {/* Customer note */}
                {order.note && (
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300">
                    💬 &ldquo;{order.note}&rdquo;
                  </div>
                )}

                {/* Actions */}
                {order.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => accept(order.id)}
                      className="flex-1 rounded-xl bg-green-600 text-white py-2.5 text-sm font-semibold hover:bg-green-700 transition"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => decline(order.id)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold hover:border-red-400 hover:text-red-500 transition"
                    >
                      ✕ Decline
                    </button>
                  </div>
                )}

                {order.status === "accepted" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => complete(order.id)}
                      className="flex-1 rounded-xl bg-black dark:bg-white text-white dark:text-black py-2.5 text-sm font-semibold transition"
                    >
                      ✅ Mark as Complete
                    </button>
                    <button className="px-4 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-semibold">
                      💬 Message
                    </button>
                  </div>
                )}

                {order.status === "completed" && (
                  <div className="flex items-center gap-2 pt-1 text-sm text-gray-400 dark:text-gray-500">
                    <span>✅ Delivered · Payment initiated</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
