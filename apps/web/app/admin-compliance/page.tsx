"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { adminApi } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ComplianceStatus = "pending" | "approved" | "changes_requested" | "rejected";

type ChefApplication = {
  id: string;
  chefName: string;
  city: string;
  state: string;
  serviceCategory: string;
  cuisineType: string;
  submittedAt: string;
  status: ComplianceStatus;
  isBookable?: boolean;
  complianceScore: number;
  // Toggles
  licensedKitchen: boolean;
  kitchenType: string;
  foodHandlerCert: boolean;
  hasInsurance: boolean;
  seafoodPermit: boolean;
  rawBarPermit: boolean;
  shellfishCert: boolean;
  // Uploads
  uploadFoodHandlerCert: string;
  uploadInsurance: string;
  uploadSeafoodPermit: string;
  uploadRawBarPermit: string;
  uploadShellfishCert: string;
  uploadKitchenLicense: string;
  // Review
  adminNotes: string;
  reviewedBy: string;
  reviewedAt: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockApplications: ChefApplication[] = [
  {
    id: "app_001",
    chefName: "Coastal Prep Kitchen",
    city: "Boston",
    state: "MA",
    serviceCategory: "Weekly Meal Prep",
    cuisineType: "Seafood",
    submittedAt: "2025-01-14T09:30:00Z",
    status: "pending",
    complianceScore: 92,
    licensedKitchen: true,
    kitchenType: "commercial",
    foodHandlerCert: true,
    hasInsurance: true,
    seafoodPermit: true,
    rawBarPermit: true,
    shellfishCert: true,
    uploadFoodHandlerCert: "servsafe_manager_cert.pdf",
    uploadInsurance: "liability_insurance_2025.pdf",
    uploadSeafoodPermit: "MA_seafood_handler_permit.pdf",
    uploadRawBarPermit: "raw_bar_permit_2025.pdf",
    uploadShellfishCert: "MA_shellfish_dealer_cert.pdf",
    uploadKitchenLicense: "commercial_kitchen_inspection.pdf",
    adminNotes: "",
    reviewedBy: "",
    reviewedAt: "",
  },
  {
    id: "app_002",
    chefName: "Maria's Mexican Kitchen",
    city: "Austin",
    state: "TX",
    serviceCategory: "Meals",
    cuisineType: "Mexican",
    submittedAt: "2025-01-13T16:45:00Z",
    status: "pending",
    complianceScore: 75,
    licensedKitchen: true,
    kitchenType: "home",
    foodHandlerCert: true,
    hasInsurance: false,
    seafoodPermit: false,
    rawBarPermit: false,
    shellfishCert: false,
    uploadFoodHandlerCert: "food_handler_card_TX.jpg",
    uploadInsurance: "",
    uploadSeafoodPermit: "",
    uploadRawBarPermit: "",
    uploadShellfishCert: "",
    uploadKitchenLicense: "home_kitchen_permit_austin.pdf",
    adminNotes: "",
    reviewedBy: "",
    reviewedAt: "",
  },
  {
    id: "app_003",
    chefName: "Chef Marco's Events",
    city: "Miami",
    state: "FL",
    serviceCategory: "Catering Platters",
    cuisineType: "Mediterranean",
    submittedAt: "2025-01-12T11:15:00Z",
    status: "approved",
    complianceScore: 100,
    licensedKitchen: true,
    kitchenType: "commercial",
    foodHandlerCert: true,
    hasInsurance: true,
    seafoodPermit: true,
    rawBarPermit: false,
    shellfishCert: false,
    uploadFoodHandlerCert: "servsafe_cert.pdf",
    uploadInsurance: "general_liability_coi.pdf",
    uploadSeafoodPermit: "FL_seafood_permit.pdf",
    uploadRawBarPermit: "",
    uploadShellfishCert: "",
    uploadKitchenLicense: "commercial_kitchen_FL_license.pdf",
    adminNotes: "All documents verified. Catering license valid through Dec 2026.",
    reviewedBy: "Admin",
    reviewedAt: "2025-01-13T09:00:00Z",
  },
  {
    id: "app_004",
    chefName: "Plant Power Prep",
    city: "Los Angeles",
    state: "CA",
    serviceCategory: "Weekly Meal Prep",
    cuisineType: "Vegan / Plant-Based",
    submittedAt: "2025-01-11T14:00:00Z",
    status: "changes_requested",
    complianceScore: 60,
    licensedKitchen: false,
    kitchenType: "",
    foodHandlerCert: true,
    hasInsurance: false,
    seafoodPermit: false,
    rawBarPermit: false,
    shellfishCert: false,
    uploadFoodHandlerCert: "food_handler_cert.pdf",
    uploadInsurance: "",
    uploadSeafoodPermit: "",
    uploadRawBarPermit: "",
    uploadShellfishCert: "",
    uploadKitchenLicense: "",
    adminNotes: "CA requires a licensed kitchen for weekly meal prep. Please upload your MEHKO permit or commissary kitchen agreement. Insurance also required.",
    reviewedBy: "Admin",
    reviewedAt: "2025-01-12T10:30:00Z",
  },
  {
    id: "app_005",
    chefName: "Harborside Raw Bar",
    city: "Newport",
    state: "RI",
    serviceCategory: "Catering Platters",
    cuisineType: "Seafood",
    submittedAt: "2025-01-10T10:00:00Z",
    status: "rejected",
    complianceScore: 30,
    licensedKitchen: false,
    kitchenType: "",
    foodHandlerCert: false,
    hasInsurance: false,
    seafoodPermit: false,
    rawBarPermit: false,
    shellfishCert: false,
    uploadFoodHandlerCert: "",
    uploadInsurance: "",
    uploadSeafoodPermit: "",
    uploadRawBarPermit: "",
    uploadShellfishCert: "",
    uploadKitchenLicense: "",
    adminNotes: "Missing all required permits for a raw bar catering operation in RI. Must reapply once all permits are obtained.",
    reviewedBy: "Admin",
    reviewedAt: "2025-01-11T11:00:00Z",
  },
  {
    id: "app_006",
    chefName: "NYC Ghost Kitchen Co",
    city: "Brooklyn",
    state: "NY",
    serviceCategory: "Meals",
    cuisineType: "American",
    submittedAt: "2025-01-15T08:00:00Z",
    status: "pending",
    complianceScore: 85,
    licensedKitchen: true,
    kitchenType: "commercial",
    foodHandlerCert: true,
    hasInsurance: true,
    seafoodPermit: false,
    rawBarPermit: false,
    shellfishCert: false,
    uploadFoodHandlerCert: "NYC_food_protection_cert.pdf",
    uploadInsurance: "COI_2025.pdf",
    uploadSeafoodPermit: "",
    uploadRawBarPermit: "",
    uploadShellfishCert: "",
    uploadKitchenLicense: "NYC_DOHMH_permit.pdf",
    adminNotes: "",
    reviewedBy: "",
    reviewedAt: "",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: ComplianceStatus) {
  const map: Record<ComplianceStatus, { label: string; classes: string }> = {
    pending: { label: "Pending Review", classes: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
    approved: { label: "Approved ✓", classes: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
    changes_requested: { label: "Changes Requested", classes: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
    rejected: { label: "Rejected", classes: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
  };
  const { label, classes } = map[status];
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${classes}`}>{label}</span>
  );
}

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── API status mapping ──────────────────────────────────────────────────────

function apiStatusToLocal(s: string): ComplianceStatus {
  const map: Record<string, ComplianceStatus> = {
    PENDING: "pending",
    APPROVED: "approved",
    CHANGES_REQUESTED: "changes_requested",
    REJECTED: "rejected",
  };
  return map[s] ?? "pending";
}

function localStatusToApi(s: ComplianceStatus): string {
  const map: Record<ComplianceStatus, string> = {
    pending: "PENDING",
    approved: "APPROVED",
    changes_requested: "CHANGES_REQUESTED",
    rejected: "REJECTED",
  };
  return map[s];
}

function apiChefToApplication(c: Record<string, unknown>): ChefApplication {
  const user = (c.user ?? {}) as Record<string, unknown>;
  let tags: string[] = [];
  try { tags = c.tags ? JSON.parse(c.tags as string) : []; } catch { tags = []; }
  const licensed = Boolean(c.licensed);
  const score = [
    licensed,
    Boolean(c.bio),
    Boolean(c.city),
    Boolean(c.state),
  ].filter(Boolean).length * 25;
  return {
    id: c.id as string,
    chefName: (user.name as string) ?? (c.slug as string),
    city: (c.city as string) ?? "",
    state: (c.state as string) ?? "",
    serviceCategory: (c.category as string) ?? "",
    cuisineType: tags[0] ?? "",
    submittedAt: (c.createdAt as string) ?? new Date().toISOString(),
    status: apiStatusToLocal((c.complianceStatus as string) ?? "PENDING"),
    isBookable: Boolean(c.isBookable),
    complianceScore: score,
    licensedKitchen: licensed,
    kitchenType: licensed ? "licensed" : "",
    foodHandlerCert: false,
    hasInsurance: false,
    seafoodPermit: false,
    rawBarPermit: false,
    shellfishCert: false,
    uploadFoodHandlerCert: "",
    uploadInsurance: "",
    uploadSeafoodPermit: "",
    uploadRawBarPermit: "",
    uploadShellfishCert: "",
    uploadKitchenLicense: "",
    adminNotes: (c.adminNotes as string) ?? "",
    reviewedBy: "",
    reviewedAt: "",
  };
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function ApplicationDrawer({
  app,
  onClose,
  onStatusChange,
  onBookableChange,
  accessToken,
}: {
  app: ChefApplication;
  onClose: () => void;
  onStatusChange: (id: string, status: ComplianceStatus, notes: string) => void;
  onBookableChange: (id: string, isBookable: boolean) => void;
  accessToken: string | null;
}) {
  const [notes, setNotes] = useState(app.adminNotes);
  const [saving, setSaving] = useState(false);
  const [bookableSaving, setBookableSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleAction = async (status: ComplianceStatus) => {
    setSaving(true);
    setActionError("");
    try {
      if (accessToken) {
        await adminApi.updateCompliance(accessToken, app.id, {
          status: localStatusToApi(status),
          adminNotes: notes,
        });
      }
      onStatusChange(app.id, status, notes);
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleBookableToggle = async () => {
    if (!accessToken) return;
    setBookableSaving(true);
    setActionError("");
    try {
      const next = !Boolean(app.isBookable);
      await adminApi.updateBookable(accessToken, app.id, { isBookable: next });
      onBookableChange(app.id, next);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update bookable status.");
    } finally {
      setBookableSaving(false);
    }
  };

  const uploads = [
    { label: "Food Handler Certificate", file: app.uploadFoodHandlerCert, required: app.foodHandlerCert },
    { label: "Certificate of Insurance", file: app.uploadInsurance, required: app.hasInsurance },
    { label: "Kitchen License / Inspection", file: app.uploadKitchenLicense, required: app.licensedKitchen },
    { label: "Seafood Handling Permit", file: app.uploadSeafoodPermit, required: app.seafoodPermit },
    { label: "Raw Bar Permit", file: app.uploadRawBarPermit, required: app.rawBarPermit },
    { label: "Shellfish Certification", file: app.uploadShellfishCert, required: app.shellfishCert },
  ].filter((u) => u.required);

  const toggleChecks = [
    { label: "Licensed Kitchen", on: app.licensedKitchen, sub: app.kitchenType ? `(${app.kitchenType})` : "" },
    { label: "Food Handler Cert", on: app.foodHandlerCert },
    { label: "General Liability Insurance", on: app.hasInsurance },
    { label: "Seafood Permit", on: app.seafoodPermit },
    { label: "Raw Bar Permit", on: app.rawBarPermit },
    { label: "Shellfish Certification", on: app.shellfishCert },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50" />
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-950 h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-gray-900 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-bold text-lg">{app.chefName}</p>
            <p className="text-sm text-gray-500">{app.city}, {app.state} · {app.serviceCategory}</p>
            <p className="text-xs mt-1">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${app.isBookable ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>
                {app.isBookable ? "Bookable Live" : "Preview Only"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookableToggle}
              disabled={bookableSaving}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition disabled:opacity-60 ${app.isBookable ? "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300" : "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"}`}
            >
              {bookableSaving ? "Saving..." : app.isBookable ? "Disable Booking" : "Enable Booking"}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Status + Score */}
          <div className="flex items-center gap-3">
            {statusBadge(app.status)}
            <span className={`text-sm font-bold ${scoreColor(app.complianceScore)}`}>
              Score: {app.complianceScore}/100
            </span>
            <span className="text-xs text-gray-400 ml-auto">Submitted {formatDate(app.submittedAt)}</span>
          </div>

          {/* Compliance toggles */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <p className="font-semibold text-sm mb-3">Self-Reported Compliance</p>
            {toggleChecks.map(({ label, on, sub }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{label} {sub && <span className="text-gray-400 text-xs">{sub}</span>}</span>
                <span className={`font-semibold ${on ? "text-green-600 dark:text-green-400" : "text-red-400"}`}>
                  {on ? "✓ Yes" : "✕ No"}
                </span>
              </div>
            ))}
          </div>

          {/* Uploaded documents */}
          <div className="space-y-2">
            <p className="font-semibold text-sm">Uploaded Documents</p>
            {uploads.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No documents uploaded.</p>
            ) : (
              uploads.map(({ label, file }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-sm ${
                    file
                      ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950"
                      : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{file ? "✅" : "❌"}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">{label}</p>
                      {file && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{file}</p>}
                      {!file && <p className="text-xs text-red-500">Not uploaded</p>}
                    </div>
                  </div>
                  {file && (
                    <button className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition">
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Admin notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for the chef or internal team..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

            {app.reviewedBy && (
              <p className="text-xs text-gray-400">
                Last reviewed by <strong>{app.reviewedBy}</strong> on {formatDate(app.reviewedAt)}
              </p>
            )}
            {actionError && (
              <p className="text-xs text-red-500">{actionError}</p>
            )}
        </div>

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-gray-900 p-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAction("approved")}
            disabled={saving}
            className="py-3 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? "…" : "✓ Approve"}
          </button>
          <button
            onClick={() => handleAction("changes_requested")}
            disabled={saving}
            className="py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "…" : "↩ Request Changes"}
          </button>
          <button
            onClick={() => handleAction("rejected")}
            disabled={saving}
            className="py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50"
          >
            {saving ? "…" : "✕ Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterTab = "all" | ComplianceStatus;

export default function AdminCompliancePage() {
  const { accessToken } = useAuth();
  const [applications, setApplications] = useState<ChefApplication[]>(mockApplications);
  const [selected, setSelected] = useState<ChefApplication | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loadError, setLoadError] = useState("");
  const [showingDemoData, setShowingDemoData] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    adminApi.listChefs(accessToken)
      .then((data) => {
        const real = (data as Record<string, unknown>[]).map(apiChefToApplication);
        setApplications(real);
        setShowingDemoData(false);
        setLoadError(real.length === 0 ? "No chef applications yet." : "");
      })
      .catch(() => {
        setApplications(mockApplications);
        setShowingDemoData(true);
        setLoadError("Could not load chefs from API — showing demo data.");
      });
  }, [accessToken]);

  // Non-admins get a 403 from the API — no client-side redirect needed here

  const handleStatusChange = (id: string, status: ComplianceStatus, notes: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status, adminNotes: notes, reviewedBy: "Admin", reviewedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const handleBookableChange = (id: string, isBookable: boolean) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, isBookable }
          : a
      )
    );
    setSelected((prev) => (prev && prev.id === id ? { ...prev, isBookable } : prev));
  };

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    changes_requested: applications.filter((a) => a.status === "changes_requested").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "changes_requested", label: `Changes (${counts.changes_requested})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-900 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-black dark:hover:text-white transition text-sm">
              ← Home
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <h1 className="font-bold text-xl">⚖️ Compliance Review</h1>
          </div>
          <div className="flex items-center gap-3">
            {counts.pending > 0 && (
              <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full">
                {counts.pending} pending
              </span>
            )}
            <Link
              href="/admin-users"
              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
            >
              User Roles
            </Link>
            <Link
              href="/admin-audit"
              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
            >
              Audit Logs
            </Link>
            <Link
              href="/admin-analytics"
              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
            >
              Analytics
            </Link>
            <Link
              href="/chef-onboarding"
              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
            >
              + Test Onboarding
            </Link>
          </div>
        </div>
      </div>

        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {loadError && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-3 text-xs text-amber-700 dark:text-amber-300">
            ⚠️ {loadError}
          </div>
        )}
        {showingDemoData && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-3 text-xs text-blue-700 dark:text-blue-300">
            Demo mode is active. Admin API data is not being displayed.
          </div>
        )}
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Applications", value: counts.all, color: "text-black dark:text-white" },
            { label: "Pending Review", value: counts.pending, color: "text-amber-600 dark:text-amber-400" },
            { label: "Approved", value: counts.approved, color: "text-green-600 dark:text-green-400" },
            { label: "Rejected / Changes", value: counts.rejected + counts.changes_requested, color: "text-red-500 dark:text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${
                filter === key
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                  : "bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Applications list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">No applications in this category.</div>
          )}
          {filtered.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelected(app)}
              className="w-full bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-left hover:border-green-500 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-base group-hover:text-green-600 transition truncate">{app.chefName}</span>
                    {statusBadge(app.status)}
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${app.isBookable ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"}`}>
                      {app.isBookable ? "Bookable" : "Preview"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {app.city}, {app.state} · {app.serviceCategory} · {app.cuisineType}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(app.submittedAt)}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className={`text-2xl font-bold ${scoreColor(app.complianceScore)}`}>{app.complianceScore}</p>
                  <p className="text-xs text-gray-400">score</p>
                </div>
              </div>

              {/* Quick compliance indicators */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { label: "Kitchen", on: app.licensedKitchen },
                  { label: "Food Handler", on: app.foodHandlerCert },
                  { label: "Insurance", on: app.hasInsurance },
                  ...(app.seafoodPermit || app.rawBarPermit || app.shellfishCert
                    ? [{ label: "Seafood/Shellfish", on: app.seafoodPermit || app.shellfishCert }]
                    : []),
                ].map(({ label, on }) => (
                  <span
                    key={label}
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                      on
                        ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                        : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400"
                    }`}
                  >
                    {on ? "✓" : "✕"} {label}
                  </span>
                ))}
              </div>

              {app.adminNotes && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic">
                  📋 {app.adminNotes}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <ApplicationDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, status, notes) => {
            handleStatusChange(id, status, notes);
            setSelected(null);
          }}
          onBookableChange={handleBookableChange}
          accessToken={accessToken}
        />
      )}
    </main>
  );
}
