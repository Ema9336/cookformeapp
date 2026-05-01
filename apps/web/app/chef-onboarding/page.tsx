"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStateCompliance, US_STATES, type StateCompliance } from "@/lib/stateComplianceData";
import { useAuth } from "../../hooks/useAuth";
import { chefsApi } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type MenuItemEntry = { name: string; price: string; description: string };

type FormData = {
  // Step 1 – Profile
  chefName: string;
  serviceCategory: "Meals" | "Weekly Meal Prep" | "Catering Platters" | "";
  city: string;
  state: string;
  bio: string;
  cuisineType: string;
  specialties: string[];
  // Step 2 – Menu
  meals: MenuItemEntry[];
  weeklyPlans: MenuItemEntry[];
  cateringPlatters: MenuItemEntry[];
  // Step 3 – Service Area + Availability
  radiusMiles: string;
  deliveryTowns: string;
  offersInHome: boolean;
  availability: { day: string; available: boolean }[];
  leadTimeDays: string;
  maxBookingsPerDay: string;
  // Step 2 – Compliance
  licensedKitchen: boolean;
  kitchenType: "home" | "commercial" | "";
  foodHandlerCert: boolean;
  hasInsurance: boolean;
  seafoodPermit: boolean;
  rawBarPermit: boolean;
  shellfishCert: boolean;
  stateServed: string;
  // Permit uploads (file names for display)
  uploadFoodHandlerCert: string;
  uploadInsurance: string;
  uploadSeafoodPermit: string;
  uploadRawBarPermit: string;
  uploadShellfishCert: string;
  uploadKitchenLicense: string;
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

const STEPS = [
  { label: "Profile", icon: "👨‍🍳" },
  { label: "Compliance", icon: "⚖️" },
  { label: "Menu", icon: "🍽️" },
  { label: "Service", icon: "📍" },
  { label: "Publish", icon: "🚀" },
];

const emptyMenuItem = (): MenuItemEntry => ({ name: "", price: "", description: "" });

const defaultForm: FormData = {
  chefName: "",
  serviceCategory: "",
  city: "",
  state: "",
  bio: "",
  cuisineType: "",
  specialties: [],
  meals: [emptyMenuItem()],
  weeklyPlans: [emptyMenuItem()],
  cateringPlatters: [emptyMenuItem()],
  radiusMiles: "15",
  deliveryTowns: "",
  offersInHome: false,
  availability: DAYS.map((day) => ({ day, available: ["Mon", "Tue", "Thu", "Fri"].includes(day) })),
  leadTimeDays: "2",
  maxBookingsPerDay: "3",
  licensedKitchen: false,
  kitchenType: "",
  foodHandlerCert: false,
  hasInsurance: false,
  seafoodPermit: false,
  rawBarPermit: false,
  shellfishCert: false,
  stateServed: "",
  uploadFoodHandlerCert: "",
  uploadInsurance: "",
  uploadSeafoodPermit: "",
  uploadRawBarPermit: "",
  uploadShellfishCert: "",
  uploadKitchenLicense: "",
};

// ─── Reusable field components ────────────────────────────────────────────────

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

// ─── Menu item editor ─────────────────────────────────────────────────────────

function MenuItemEditor({
  title,
  items,
  onChange,
  pricePlaceholder = "e.g. $18",
}: {
  title: string;
  items: MenuItemEntry[];
  onChange: (items: MenuItemEntry[]) => void;
  pricePlaceholder?: string;
}) {
  const update = (i: number, field: keyof MenuItemEntry, value: string) => {
    const updated = items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it));
    onChange(updated);
  };
  const add = () => onChange([...items, emptyMenuItem()]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{title}</h3>
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-zinc-900">
          <div className="flex gap-3">
            <input
              value={item.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Item name"
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              value={item.price}
              onChange={(e) => update(i, "price", e.target.value)}
              placeholder={pricePlaceholder}
              className="w-28 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {items.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition shrink-0"
              >
                ✕
              </button>
            )}
          </div>
          <textarea
            value={item.description}
            onChange={(e) => update(i, "description", e.target.value)}
            placeholder="Short description (optional)"
            rows={2}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-green-500 hover:text-green-600 transition"
      >
        + Add {title.split(" ")[0]}
      </button>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const toggle = (s: string) =>
    setForm({
      ...form,
      specialties: form.specialties.includes(s)
        ? form.specialties.filter((x) => x !== s)
        : [...form.specialties, s],
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chef Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Tell customers who you are and what you cook.</p>
      </div>

      {/* Photo upload placeholders */}
      <div className="grid grid-cols-2 gap-4">
        <button className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-500 hover:text-green-600 transition">
          <span className="text-3xl">👨‍🍳</span>
          <span className="text-sm font-medium">Chef Photo</span>
          <span className="text-xs text-gray-400">Upload headshot</span>
        </button>
        <button className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-500 hover:text-green-600 transition">
          <span className="text-3xl">🍳</span>
          <span className="text-sm font-medium">Kitchen Photo</span>
          <span className="text-xs text-gray-400">Upload kitchen</span>
        </button>
      </div>

      <Field label="Business or Chef Name">
        <Input value={form.chefName} onChange={(v) => setForm({ ...form, chefName: v })} placeholder="e.g. Coastal Prep Kitchen" />
      </Field>

      <Field label="Service Category">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This is how customers discover you — choose the one that best describes what you offer.</p>
        <div className="space-y-2">
          {([
            { value: "Meals", icon: "🍽️", desc: "Daily or on-demand home-cooked meals for individual orders" },
            { value: "Weekly Meal Prep", icon: "📦", desc: "Portioned containers prepped and delivered on a weekly schedule" },
            { value: "Catering Platters", icon: "🎉", desc: "Large-format food for events, parties, and office gatherings" },
          ] as const).map(({ value, icon, desc }) => (
            <button
              key={value}
              onClick={() => setForm({ ...form, serviceCategory: value })}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition ${
                form.serviceCategory === value
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900"
              }`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
              <div>
                <p className={`font-semibold ${
                  form.serviceCategory === value ? "text-green-700 dark:text-green-400" : ""
                }`}>{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
              {form.serviceCategory === value && (
                <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City">
          <Input value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Boston" />
        </Field>
        <Field label="State">
          <Input value={form.state} onChange={(v) => setForm({ ...form, state: v })} placeholder="MA" />
        </Field>
      </div>

      <Field label="Bio">
        <Textarea
          value={form.bio}
          onChange={(v) => setForm({ ...form, bio: v })}
          placeholder="Tell customers about your specialties, cooking style, and what makes your food unique..."
          rows={4}
        />
      </Field>

      <Field label="Cuisine Type">
        <div className="grid grid-cols-2 gap-2">
          {CUISINES.map((c) => (
            <button
              key={c}
              onClick={() => setForm({ ...form, cuisineType: c })}
              className={`px-4 py-3 rounded-2xl border text-sm font-medium transition text-left ${
                form.cuisineType === c
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
              onClick={() => toggle(s)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                form.specialties.includes(s)
                  ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step3Menu({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Menu Setup</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Add your meals, plans, and catering packages.</p>
      </div>

      <MenuItemEditor
        title="Popular Meals"
        items={form.meals}
        onChange={(meals) => setForm({ ...form, meals })}
        pricePlaceholder="e.g. $18"
      />

      <MenuItemEditor
        title="Weekly Plans"
        items={form.weeklyPlans}
        onChange={(weeklyPlans) => setForm({ ...form, weeklyPlans })}
        pricePlaceholder="e.g. $149/wk"
      />

      <MenuItemEditor
        title="Catering Platters"
        items={form.cateringPlatters}
        onChange={(cateringPlatters) => setForm({ ...form, cateringPlatters })}
        pricePlaceholder="From $250"
      />
    </div>
  );
}

function Step4Service({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const toggleDay = (day: string) =>
    setForm({
      ...form,
      availability: form.availability.map((a) =>
        a.day === day ? { ...a, available: !a.available } : a
      ),
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Area</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Define where and when you work.</p>
      </div>

      <Field label="Delivery Radius (miles)">
        <div className="space-y-3">
          <Input
            type="number"
            value={form.radiusMiles}
            onChange={(v) => setForm({ ...form, radiusMiles: v })}
            placeholder="15"
          />
          <input
            type="range"
            min={1}
            max={100}
            value={Number(form.radiusMiles) || 15}
            onChange={(e) => setForm({ ...form, radiusMiles: e.target.value })}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1 mi</span>
            <span className="font-semibold text-green-600">{form.radiusMiles || 15} mi radius</span>
            <span>100 mi</span>
          </div>
        </div>
      </Field>

      <Field label="Delivery Towns / ZIP Codes">
        <Textarea
          value={form.deliveryTowns}
          onChange={(v) => setForm({ ...form, deliveryTowns: v })}
          placeholder="e.g. Boston, Cambridge, Brookline, Somerville..."
          rows={3}
        />
      </Field>

      <Toggle
        checked={form.offersInHome}
        onChange={(v) => setForm({ ...form, offersInHome: v })}
        label="Private In-Home Chef"
        description="I cook and serve at the customer's home"
      />

      <Field label="Available Days">
        <div className="flex gap-2 flex-wrap">
          {form.availability.map(({ day, available }) => (
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
            value={form.leadTimeDays}
            onChange={(v) => setForm({ ...form, leadTimeDays: v })}
            placeholder="2"
          />
        </Field>
        <Field label="Max Bookings / Day">
          <Input
            type="number"
            value={form.maxBookingsPerDay}
            onChange={(v) => setForm({ ...form, maxBookingsPerDay: v })}
            placeholder="3"
          />
        </Field>
      </div>
    </div>
  );
}

// ─── Upload button ────────────────────────────────────────────────────────────

function UploadButton({
  label,
  fileName,
  onUpload,
  required = false,
}: {
  label: string;
  fileName: string;
  onUpload: (name: string) => void;
  required?: boolean;
}) {
  const uploaded = Boolean(fileName);
  return (
    <label
      className={`flex items-center justify-between gap-4 p-4 rounded-2xl border cursor-pointer transition ${
        uploaded
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 hover:border-green-400"
      }`}
    >
      <input
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          if (e.target.files?.[0]) onUpload(e.target.files[0].name);
        }}
      />
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{uploaded ? "✅" : "📎"}</span>
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${uploaded ? "text-green-700 dark:text-green-400" : ""}`}>
            {label}
            {required && !uploaded && <span className="text-red-400 ml-1">*</span>}
          </p>
          {uploaded ? (
            <p className="text-xs text-green-600 dark:text-green-500 truncate">{fileName}</p>
          ) : (
            <p className="text-xs text-gray-400">PDF, JPG or PNG · tap to upload</p>
          )}
        </div>
      </div>
      {uploaded && (
        <span className="shrink-0 text-xs text-green-600 font-semibold">Uploaded</span>
      )}
      {!uploaded && (
        <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1">Upload</span>
      )}
    </label>
  );
}

// ─── State Compliance Card ────────────────────────────────────────────────────

function StateComplianceCard({ data }: { data: StateCompliance }) {
  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-5 space-y-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-base text-blue-900 dark:text-blue-200">{data.state} Requirements</p>
          <p className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">{data.regulatoryBody}</p>
        </div>
        <a
          href={data.regulatoryBodyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-blue-600 dark:text-blue-400 underline font-medium"
        >
          Official site ↗
        </a>
      </div>

      {/* Warning flags */}
      {data.warningFlags.length > 0 && (
        <div className="space-y-1.5">
          {data.warningFlags.map((flag) => (
            <div key={flag} className="rounded-xl bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-3 py-2 text-amber-800 dark:text-amber-300 text-xs">
              {flag}
            </div>
          ))}
        </div>
      )}

      {/* Key permits */}
      <div className="grid grid-cols-1 gap-2">
        {[
          {
            icon: "🏠",
            label: data.foodServiceLicense.name,
            status: data.foodServiceLicense.required ? "Required" : "Recommended",
            required: data.foodServiceLicense.required,
            notes: data.foodServiceLicense.notes,
          },
          {
            icon: "📜",
            label: "ServSafe Manager Certification",
            status: data.serveSafeManager.required ? "Required" : "Not required",
            required: data.serveSafeManager.required,
            notes: data.serveSafeManager.notes,
          },
          {
            icon: "🪪",
            label: "Food Handler Card",
            status: data.foodHandlerCard.required ? "Required" : "Not required",
            required: data.foodHandlerCard.required,
            notes: data.foodHandlerCard.notes,
          },
          {
            icon: "🦪",
            label: "Shellfish / Raw Bar Permit",
            status: data.shellfish.requiresStatePermit ? "Required if serving shellfish" : "State permit not required",
            required: data.shellfish.requiresStatePermit,
            notes: data.shellfish.notes,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex items-start gap-3 rounded-xl p-3 border ${
              item.required
                ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950"
                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900"
            }`}
          >
            <span className="text-base shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 dark:text-white text-xs">{item.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    item.required
                      ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-relaxed">{item.notes}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cottage food note */}
      <div className={`rounded-xl p-3 border text-xs ${
        data.cottageFood.hotMealsAllowed
          ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300"
          : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400"
      }`}>
        <span className="font-semibold">Cottage Food Law: </span>
        {data.cottageFood.hotMealsAllowed
          ? `✅ Hot meals allowed! `
          : `❌ Hot meals NOT covered. `}
        {data.cottageFood.salesLimit && `Sales limit: ${data.cottageFood.salesLimit}. `}
        {data.cottageFood.notes}
      </div>

      {/* Ghost kitchen note */}
      <div className="rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900 p-3 text-xs text-purple-800 dark:text-purple-300">
        <span className="font-semibold">Ghost Kitchen: </span>
        {data.ghostKitchen.permitted ? "✅ Permitted — " : "❌ Not permitted — "}
        {data.ghostKitchen.notes}
      </div>

      {/* Additional permits */}
      {data.additionalPermits.length > 0 && (
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs mb-1.5">Additional Permits You May Need:</p>
          <div className="flex flex-wrap gap-1.5">
            {data.additionalPermits.map((p) => (
              <span key={p} className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step2({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const complianceData = form.stateServed ? getStateCompliance(form.stateServed) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & Permits</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Required before your listing goes live. Upload your documents so we can verify them.</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-4 text-sm text-amber-800 dark:text-amber-300">
        ⚠️ Permit requirements vary by state. You can skip uploads now and submit them within 7 days of applying.
      </div>

      <Field label="Primary State You Serve">
        <div className="space-y-3">
          <select
            value={form.stateServed}
            onChange={(e) => setForm({ ...form, stateServed: e.target.value })}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 p-4 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition appearance-none"
          >
            <option value="">Select your state…</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Dynamic state compliance card */}
          {complianceData && <StateComplianceCard data={complianceData} />}
          {form.stateServed && !complianceData && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
              Compliance data not found for this state. Please contact support.
            </div>
          )}
        </div>
      </Field>

      <div className="space-y-3">
        <h3 className="font-semibold text-base">Kitchen Type</h3>
        <Toggle
          checked={form.licensedKitchen}
          onChange={(v) => setForm({ ...form, licensedKitchen: v })}
          label="Licensed / Inspected Kitchen"
          description="I operate from a licensed kitchen"
        />
        {form.licensedKitchen && (
          <div className="grid grid-cols-2 gap-3">
            {(["home", "commercial"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setForm({ ...form, kitchenType: type })}
                className={`py-3 rounded-2xl border text-sm font-medium transition ${
                  form.kitchenType === type
                    ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900"
                }`}
              >
                {type === "home" ? "🏠 Home Kitchen" : "🏢 Commercial Kitchen"}
              </button>
            ))}
          </div>
        )}
        {form.licensedKitchen && (
          <UploadButton
            label="Kitchen License / Inspection Certificate"
            fileName={form.uploadKitchenLicense}
            onUpload={(name) => setForm({ ...form, uploadKitchenLicense: name })}
          />
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-base">Certifications & Insurance</h3>
        <Toggle
          checked={form.foodHandlerCert}
          onChange={(v) => setForm({ ...form, foodHandlerCert: v })}
          label="Food Handler Certification"
          description="ServSafe or equivalent"
        />
        {form.foodHandlerCert && (
          <UploadButton
            label="Food Handler Certificate"
            fileName={form.uploadFoodHandlerCert}
            onUpload={(name) => setForm({ ...form, uploadFoodHandlerCert: name })}
            required
          />
        )}
        <Toggle
          checked={form.hasInsurance}
          onChange={(v) => setForm({ ...form, hasInsurance: v })}
          label="General Liability Insurance"
          description="Recommended for all chefs"
        />
        {form.hasInsurance && (
          <UploadButton
            label="Certificate of Insurance (COI)"
            fileName={form.uploadInsurance}
            onUpload={(name) => setForm({ ...form, uploadInsurance: name })}
          />
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-base">Seafood & Raw Bar Permits</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Only required if you serve seafood, raw bar, or shellfish.</p>
        <Toggle
          checked={form.seafoodPermit}
          onChange={(v) => setForm({ ...form, seafoodPermit: v })}
          label="Seafood Handling Permit"
          description="Required to sell/serve seafood commercially"
        />
        {form.seafoodPermit && (
          <UploadButton
            label="Seafood Handling Permit"
            fileName={form.uploadSeafoodPermit}
            onUpload={(name) => setForm({ ...form, uploadSeafoodPermit: name })}
            required
          />
        )}
        <Toggle
          checked={form.rawBarPermit}
          onChange={(v) => setForm({ ...form, rawBarPermit: v })}
          label="Raw Bar Permit"
          description="Required for oysters, clams, and raw shellfish"
        />
        {form.rawBarPermit && (
          <UploadButton
            label="Raw Bar Permit"
            fileName={form.uploadRawBarPermit}
            onUpload={(name) => setForm({ ...form, uploadRawBarPermit: name })}
            required
          />
        )}
        <Toggle
          checked={form.shellfishCert}
          onChange={(v) => setForm({ ...form, shellfishCert: v })}
          label="Shellfish Certification"
          description="State shellfish sanitation certification"
        />
        {form.shellfishCert && (
          <UploadButton
            label="Shellfish Certification"
            fileName={form.uploadShellfishCert}
            onUpload={(name) => setForm({ ...form, uploadShellfishCert: name })}
            required
          />
        )}
      </div>
    </div>
  );
}

function Step5({ form }: { form: FormData }) {
  const availableDays = form.availability.filter((a) => a.available).map((a) => a.day);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ready to Publish 🚀</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here&apos;s a preview of your listing. It will go live after a quick compliance review.</p>
      </div>

      {/* Preview card */}
      <div className="rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Banner placeholder */}
        <div className="h-40 bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center">
          <span className="text-white text-5xl">🍳</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-green-600 bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full">
                {form.serviceCategory || form.cuisineType || "Chef"}
              </span>
              <h2 className="text-2xl font-bold mt-2">{form.chefName || "Your Chef Name"}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {form.city}{form.state ? `, ${form.state}` : ""} • {form.radiusMiles || 15} mi radius
              </p>
            </div>
            <div className="shrink-0 w-14 h-14 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-2xl border-4 border-white dark:border-black">
              👨‍🍳
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {form.bio || "Your bio will appear here..."}
          </p>

          {form.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.specialties.map((s) => (
                <span key={s} className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">{s}</span>
              ))}
            </div>
          )}

          {availableDays.length > 0 && (
            <div className="flex gap-1.5 flex-wrap pt-1">
              {availableDays.map((d) => (
                <span key={d} className="text-xs px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 font-medium border border-green-200 dark:border-green-800">{d}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compliance summary */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-2">
        <h3 className="font-semibold">Compliance Summary</h3>
        {[
          { label: "Licensed Kitchen", ok: form.licensedKitchen },
          { label: "Food Handler Cert", ok: form.foodHandlerCert },
          { label: "Insurance", ok: form.hasInsurance },
          { label: "Seafood Permit", ok: form.seafoodPermit },
          { label: "Raw Bar Permit", ok: form.rawBarPermit },
          { label: "Shellfish Cert", ok: form.shellfishCert },
        ].map(({ label, ok }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className={ok ? "text-green-600 font-semibold" : "text-gray-400"}>
              {ok ? "✓ Yes" : "— No"}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-4 text-sm text-blue-700 dark:text-blue-300">
        📋 Our team will review your permits within 1–2 business days. You&apos;ll receive an email when your listing is live.
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChefOnboardingPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handlePublish = async () => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Upsert the chef profile (also promotes user role to CHEF)
      await chefsApi.updateMyProfile(accessToken, {
        bio: form.bio,
        city: form.city,
        state: form.state,
        category: form.serviceCategory || form.cuisineType,
        tags: JSON.stringify(form.specialties),
        licensed: form.licensedKitchen,
        responseTime: "Usually responds in 2 hrs",
      });

      // 2. Create menu items (skip blank entries)
      const allItems = [
        ...form.meals.map((i) => ({ ...i, category: "meals" })),
        ...form.weeklyPlans.map((i) => ({ ...i, category: "weekly" })),
        ...form.cateringPlatters.map((i) => ({ ...i, category: "catering" })),
      ].filter((i) => i.name.trim());

      await Promise.all(
        allItems.map((item) =>
          chefsApi.addMenuItem(accessToken, {
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
          })
        )
      );

      setPublished(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (published) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-5xl mb-6">
          🎉
        </div>
        <h1 className="text-4xl font-bold">You&apos;re submitted!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-sm">
          <strong>{form.chefName || "Your listing"}</strong> is under review. We&apos;ll email you within 1–2 business days when you go live.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-green-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-32">

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-900 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition">
              ← Cook For Me
            </Link>
            <span className="text-sm text-gray-500 font-medium">Step {step} of {totalSteps}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step pills */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${
                  i + 1 === step
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : i + 1 < step
                    ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 cursor-pointer"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        {step === 1 && <Step1 form={form} setForm={setForm} />}
        {step === 2 && <Step2 form={form} setForm={setForm} />}
        {step === 3 && <Step3Menu form={form} setForm={setForm} />}
        {step === 4 && <Step4Service form={form} setForm={setForm} />}
        {step === 5 && <Step5 form={form} />}
      </div>

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4 z-40">
        <div className="max-w-2xl mx-auto flex gap-3 flex-col">
          {submitError && (
            <p className="text-center text-sm text-red-500">{submitError}</p>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-700 py-4 font-semibold"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => step < totalSteps ? setStep(step + 1) : handlePublish()}
              disabled={submitting}
              className="flex-1 rounded-2xl bg-green-600 disabled:opacity-50 text-white py-4 font-semibold text-lg transition hover:bg-green-700"
            >
              {step === totalSteps
                ? submitting ? "Submitting…" : "⭐ Publish Listing"
                : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
