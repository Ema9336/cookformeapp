"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { mockChefs } from "../../lib/mockChefs";
import { useAuth } from "../../hooks/useAuth";
import { bookingsApi } from "../../lib/api";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const slug = searchParams.get("chef") || "coastal-prep-kitchen";
  const baseChef = mockChefs.find((c) => c.slug === slug) || mockChefs[0];

  const [serviceType, setServiceType] = useState("delivery");
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse cart from URL
  const cartParam = searchParams.get("cart");
  const cartItems: { name: string; qty: number; price?: string }[] = cartParam
    ? JSON.parse(decodeURIComponent(cartParam))
    : [];

  const handleSubmit = async () => {
    if (!agreed || !date) return;
    if (!accessToken) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const booking = await bookingsApi.create(accessToken, {
        chefSlug: baseChef.slug,
        date,
        serviceType,
        guestCount,
        address,
        notes,
        allergies,
      });
      const qs = new URLSearchParams({
        chef: baseChef.slug,
        date,
        service: serviceType,
        guests: String(guestCount),
        id: String(booking.id),
      });
      router.push(`/booking-confirmed?${qs.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white pb-36">
      <div className="max-w-3xl mx-auto">

        {/* Back nav */}
        <div className="px-6 pt-6">
          <Link href={`/chef/${baseChef.slug}`} className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            ← Back to {baseChef.name}
          </Link>
        </div>

        <div className="p-6 space-y-7">
          <h1 className="text-3xl font-bold">Booking Request</h1>

          {/* Chef Summary Card */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl shrink-0">
              <Image src={baseChef.image} alt={baseChef.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{baseChef.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{baseChef.city} • {baseChef.distance}</p>
              <p className="text-sm mt-1">⭐ {baseChef.rating} ({baseChef.reviews} reviews)</p>
              {baseChef.tags?.slice(0, 2).map((t) => (
                <span key={t} className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 mr-1 mt-1">{t}</span>
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">✅ Licensed</p>
            </div>
          </div>

          {/* Selected items */}
          {cartItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Your Order</h2>
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {cartItems.map((item) => (
                  <div key={item.name} className="flex justify-between items-center px-4 py-3">
                    <span className="font-medium">{item.qty}× {item.name}</span>
                    {item.price && <span className="text-green-600 font-semibold text-sm">{item.price}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Booking Details */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Booking Details</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Preferred Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Number of People</label>
              <div className="flex items-center gap-4 rounded-2xl border border-gray-300 dark:border-gray-700 p-4">
                <button
                  onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                  className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-xl font-bold"
                >−</button>
                <span className="flex-1 text-center font-semibold text-lg">{guestCount} {guestCount === 1 ? "person" : "people"}</span>
                <button
                  onClick={() => setGuestCount((n) => n + 1)}
                  className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold"
                >+</button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Service Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "delivery", label: "🚗 Delivery" },
                  { value: "pickup", label: "🏠 Pickup" },
                  { value: "private-chef", label: "👨‍🍳 Private Chef" },
                  { value: "catering", label: "🎉 Catering Event" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setServiceType(opt.value)}
                    className={`rounded-2xl border p-3 text-sm font-medium transition-colors ${
                      serviceType === opt.value
                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(serviceType === "delivery" || serviceType === "catering" || serviceType === "private-chef") && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
                  {serviceType === "delivery" ? "Delivery Address" : "Event Address"}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Ocean Ave, Oak Bluffs, MA"
                  className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}
          </section>

          {/* Allergies + Notes */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Dietary & Special Requests</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Allergies or dietary restrictions</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. nut allergy, gluten-free, vegan..."
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Additional notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else the chef should know..."
                rows={3}
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </section>

          {/* Food Safety Notice */}
          <section className="rounded-3xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-2">
            <h3 className="font-semibold text-base">⚠️ Food Safety Notice</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Menu items may contain allergens including shellfish, tree nuts, dairy, and gluten. Some meals are prepared in shared kitchen environments. Please disclose all allergies above. CookForMe verifies chef licenses but is not responsible for undisclosed dietary needs.
            </p>
            <label className="flex items-start gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-green-600 w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">I have read the food safety notice and disclosed all relevant allergies.</span>
            </label>
          </section>

        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4 z-40">
        <div className="max-w-3xl mx-auto">
          {error && (
            <p className="text-center text-sm text-red-500 mb-2">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!agreed || !date || submitting}
            className="w-full rounded-2xl bg-green-600 disabled:opacity-40 text-white py-4 font-semibold text-lg"
          >
            {submitting ? "Submitting…" : "Submit Booking Request"}
          </button>
          {(!agreed || !date) && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {!date ? "Select a date" : "Agree to food safety notice"} to continue
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
