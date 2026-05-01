"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { chefsApi, usersApi } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileData = {
  chefName: string;
  city: string;
  state: string;
  bio: string;
  cuisineType: string;
  specialties: string[];
  serviceCategory: "Meals" | "Weekly Meal Prep" | "Catering Platters" | "";
  // Service area
  radiusMiles: string;
  deliveryTowns: string;
  offersInHome: boolean;
  // Availability
  availability: { day: string; available: boolean }[];
  leadTimeDays: string;
  maxBookingsPerDay: string;
  // Listing status
  listingActive: boolean;
  // Social / contact
  website: string;
  instagram: string;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CUISINES = [
  "American", "Italian", "Mexican", "Asian Fusion", "Seafood",
  "Mediterranean", "Southern / Soul", "Vegan / Plant-Based", "BBQ & Grill", "Other",
];

const SPECIALTY_OPTIONS = [
  "🐟 Seafood", "🌱 Vegan", "🥗 Gluten-Free", "🍖 BBQ", "🫕 Stew & Comfort",
  "🍱 Meal Prep", "🎉 Catering", "🥐 Brunch", "🍣 Raw Bar", "🌶️ Spicy",
];

// ─── Mock current profile data ────────────────────────────────────────────────

const defaultProfile: ProfileData = {
  chefName: "Coastal Prep Kitchen",
  city: "Boston",
  state: "MA",
  bio: "Fresh seafood-forward weekly meal prep delivered to your door. Sourced from local Massachusetts fishermen. My meals are designed for busy professionals who want restaurant-quality food without the hassle.",
  cuisineType: "Seafood",
  specialties: ["🐟 Seafood", "🍱 Meal Prep", "🥗 Gluten-Free"],
  serviceCategory: "Weekly Meal Prep",
  radiusMiles: "20",
  deliveryTowns: "Boston, Cambridge, Brookline, Somerville, Newton",
  offersInHome: false,
  availability: DAYS.map((day) => ({ day, available: ["Mon", "Tue", "Thu", "Fri"].includes(day) })),
  leadTimeDays: "2",
  maxBookingsPerDay: "4",
  listingActive: true,
  website: "coastalprep.com",
  instagram: "@coastalprep",
};

// ─── Reusable components ──────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 p-4 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition"
    />
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition ${
        checked
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900"
      }`}
    >
      <div className="text-left">
        <p className={`font-medium ${checked ? "text-green-700 dark:text-green-400" : ""}`}>{label}</p>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ml-4 ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChefProfileEditPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const serverProfile = useRef<ProfileData>(defaultProfile);

  // Load real profile on mount
  useEffect(() => {
    if (!accessToken) { router.push("/login"); return; }
    chefsApi.getMyProfile(accessToken)
      .then((data) => {
        const d = data as Record<string, unknown>;
        const user = d.user as Record<string, unknown> | undefined;
        let tags: string[] = [];
        try { tags = d.tags ? JSON.parse(d.tags as string) : []; } catch { tags = []; }
        const category = (d.category as string) ?? "";
        const isServiceCategory = ["Meals", "Weekly Meal Prep", "Catering Platters"].includes(category);
        const patch: Partial<ProfileData> = {
          chefName: (user?.name as string) ?? defaultProfile.chefName,
          bio: (d.bio as string) ?? "",
          city: (d.city as string) ?? "",
          state: (d.state as string) ?? "",
          serviceCategory: isServiceCategory ? (category as ProfileData["serviceCategory"]) : "",
          cuisineType: !isServiceCategory && category ? category : defaultProfile.cuisineType,
          specialties: tags,
        };
        const merged = { ...defaultProfile, ...patch };
        setProfile(merged);
        serverProfile.current = merged;
        setHasChanges(false);
      })
      .catch(() => setLoadError("Could not load your profile — showing defaults."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const update = (patch: Partial<ProfileData>) => {
    setProfile((p) => ({ ...p, ...patch }));
    setHasChanges(true);
    setSaved(false);
    setSaveError("");
  };

  const handleSave = async () => {
    if (!accessToken) { router.push("/login"); return; }
    setSaving(true);
    setSaveError("");
    try {
      await chefsApi.updateMyProfile(accessToken, {
        bio: profile.bio,
        city: profile.city,
        state: profile.state,
        category: profile.serviceCategory || profile.cuisineType,
        tags: JSON.stringify(profile.specialties),
      });
      // Update display name if changed
      if (profile.chefName !== serverProfile.current.chefName) {
        await usersApi.update(accessToken, { name: profile.chefName });
      }
      serverProfile.current = profile;
      setSaved(true);
      setHasChanges(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (s: string) => {
    const next = profile.specialties.includes(s)
      ? profile.specialties.filter((x) => x !== s)
      : [...profile.specialties, s];
    update({ specialties: next });
  };

  const toggleDay = (day: string) => {
    update({
      availability: profile.availability.map((a) =>
        a.day === day ? { ...a, available: !a.available } : a
      ),
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white pb-32">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/chef-dashboard" className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition">
              ← Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="font-semibold text-base">Edit Profile</span>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && !saved && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>
            )}
            {saved && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Saved</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {loadError && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-3 text-xs text-amber-700 dark:text-amber-300">
            ⚠️ {loadError}
          </div>
        )}
        {saveError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-xs text-red-700 dark:text-red-400">
            ✕ {saveError}
          </div>
        )}
        {/* Listing status */}
        <Section title="Listing Status" description="Control whether your profile is visible to customers.">
          <Toggle
            checked={profile.listingActive}
            onChange={(v) => update({ listingActive: v })}
            label={profile.listingActive ? "🟢 Listing is Live" : "⏸ Listing is Paused"}
            description={profile.listingActive ? "Customers can find and book you" : "Your profile is hidden from search results"}
          />
          {!profile.listingActive && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-3 text-xs text-amber-700 dark:text-amber-300">
              ⚠️ Your listing is paused. Existing bookings are unaffected — only new discovery is disabled.
            </div>
          )}
        </Section>

        {/* Photos */}
        <Section title="Photos" description="Update your chef and kitchen photos.">
          <div className="grid grid-cols-2 gap-4">
            <button className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-500 hover:text-green-600 transition bg-gray-50 dark:bg-zinc-900">
              <span className="text-3xl">👨‍🍳</span>
              <span className="text-sm font-medium">Chef Photo</span>
              <span className="text-xs text-gray-400">Tap to update</span>
            </button>
            <button className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-500 hover:text-green-600 transition bg-gray-50 dark:bg-zinc-900">
              <span className="text-3xl">🍳</span>
              <span className="text-sm font-medium">Kitchen / Food</span>
              <span className="text-xs text-gray-400">Tap to update</span>
            </button>
          </div>
        </Section>

        {/* Basic info */}
        <Section title="Basic Info" description="Your name, location, and bio.">
          <Field label="Business / Chef Name">
            <Input
              value={profile.chefName}
              onChange={(v) => update({ chefName: v })}
              placeholder="Coastal Prep Kitchen"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <Input
                value={profile.city}
                onChange={(v) => update({ city: v })}
                placeholder="Boston"
              />
            </Field>
            <Field label="State">
              <Input
                value={profile.state}
                onChange={(v) => update({ state: v })}
                placeholder="MA"
              />
            </Field>
          </div>

          <Field label="Bio">
            <Textarea
              value={profile.bio}
              onChange={(v) => update({ bio: v })}
              placeholder="Tell customers about your specialties, cooking style, and what makes your food unique..."
              rows={5}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{profile.bio.length} / 500 characters</p>
          </Field>
        </Section>

        {/* Service category */}
        <Section title="Service Category" description="How customers find and book you.">
          <div className="space-y-2">
            {([
              { value: "Meals", icon: "🍽️", desc: "Daily or on-demand home-cooked meals for individual orders" },
              { value: "Weekly Meal Prep", icon: "📦", desc: "Portioned containers prepped and delivered on a weekly schedule" },
              { value: "Catering Platters", icon: "🎉", desc: "Large-format food for events, parties, and office gatherings" },
            ] as const).map(({ value, icon, desc }) => (
              <button
                key={value}
                onClick={() => update({ serviceCategory: value })}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition ${
                  profile.serviceCategory === value
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900"
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className={`font-semibold ${profile.serviceCategory === value ? "text-green-700 dark:text-green-400" : ""}`}>{value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
                {profile.serviceCategory === value && (
                  <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Cuisine & specialties */}
        <Section title="Cuisine & Specialties">
          <Field label="Cuisine Type">
            <div className="grid grid-cols-2 gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ cuisineType: c })}
                  className={`px-4 py-3 rounded-2xl border text-sm font-medium transition text-left ${
                    profile.cuisineType === c
                      ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Specialties & Dietary Options">
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    profile.specialties.includes(s)
                      ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Service area */}
        <Section title="Service Area" description="Where and how far you deliver.">
          <Field label="Delivery Radius (miles)">
            <div className="space-y-3">
              <Input
                type="number"
                value={profile.radiusMiles}
                onChange={(v) => update({ radiusMiles: v })}
                placeholder="15"
              />
              <input
                type="range"
                min={1}
                max={100}
                value={Number(profile.radiusMiles) || 15}
                onChange={(e) => update({ radiusMiles: e.target.value })}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1 mi</span>
                <span className="font-semibold text-green-600">{profile.radiusMiles || 15} mi radius</span>
                <span>100 mi</span>
              </div>
            </div>
          </Field>

          <Field label="Delivery Towns / ZIP Codes">
            <Textarea
              value={profile.deliveryTowns}
              onChange={(v) => update({ deliveryTowns: v })}
              placeholder="e.g. Boston, Cambridge, Brookline, Somerville..."
              rows={3}
            />
          </Field>

          <Toggle
            checked={profile.offersInHome}
            onChange={(v) => update({ offersInHome: v })}
            label="Private In-Home Chef"
            description="I cook and serve at the customer's home"
          />
        </Section>

        {/* Availability */}
        <Section title="Availability" description="When you accept orders.">
          <Field label="Available Days">
            <div className="flex gap-2 flex-wrap">
              {profile.availability.map(({ day, available }) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-3 rounded-2xl border font-medium text-sm transition ${
                    available
                      ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 text-gray-400"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Lead Time (days notice)">
              <Input
                type="number"
                value={profile.leadTimeDays}
                onChange={(v) => update({ leadTimeDays: v })}
                placeholder="2"
              />
            </Field>
            <Field label="Max Bookings / Day">
              <Input
                type="number"
                value={profile.maxBookingsPerDay}
                onChange={(v) => update({ maxBookingsPerDay: v })}
                placeholder="3"
              />
            </Field>
          </div>
        </Section>

        {/* Social / contact */}
        <Section title="Links & Social" description="Optional — helps customers learn more about you.">
          <Field label="Website">
            <Input
              value={profile.website}
              onChange={(v) => update({ website: v })}
              placeholder="yoursite.com"
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={profile.instagram}
              onChange={(v) => update({ instagram: v })}
              placeholder="@yourhandle"
            />
          </Field>
        </Section>

        {/* Compliance section — read-only, links to onboarding */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-black">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-base">⚖️ Compliance & Permits</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Your permits are reviewed by our team and cannot be edited here. To update documents, start a new compliance review.
              </p>
            </div>
            <Link
              href="/chef-onboarding"
              className="shrink-0 text-xs font-semibold text-green-600 border border-green-300 dark:border-green-700 px-3 py-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-950 transition"
            >
              Update Permits →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: "Licensed Kitchen", ok: true },
              { label: "Food Handler Cert", ok: true },
              { label: "Insurance (COI)", ok: true },
              { label: "Seafood Permit", ok: true },
            ].map(({ label, ok }) => (
              <div
                key={label}
                className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border ${
                  ok
                    ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900 text-gray-400"
                }`}
              >
                <span>{ok ? "✓" : "—"}</span>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-200 dark:border-red-900 p-5 bg-red-50 dark:bg-red-950 space-y-3">
          <h2 className="font-bold text-base text-red-700 dark:text-red-400">Danger Zone</h2>
          <button className="w-full py-3 rounded-2xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900 transition">
            Deactivate My Account
          </button>
        </div>
      </div>

      {/* Sticky save bar (shown when changes pending) */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-900 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">You have unsaved changes.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setProfile(serverProfile.current);
                  setHasChanges(false);
                  setSaveError("");
                }}
                className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
