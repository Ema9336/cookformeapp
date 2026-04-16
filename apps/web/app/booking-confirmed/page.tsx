"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { mockChefs } from "../../lib/mockChefs";

function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("chef") || "coastal-prep-kitchen";
  const date = searchParams.get("date") || "";
  const service = searchParams.get("service") || "delivery";
  const guests = searchParams.get("guests") || "2";
  const bookingId = searchParams.get("id") || "CFM-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const chef = mockChefs.find((c) => c.slug === slug) || mockChefs[0];

  const serviceLabels: Record<string, string> = {
    delivery: "🚗 Delivery",
    pickup: "🏠 Pickup",
    "private-chef": "👨‍🍳 Private Chef",
    catering: "🎉 Catering Event",
  };

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-3xl mx-auto p-6 pb-36 space-y-8">

        {/* Success animation block */}
        <div className="flex flex-col items-center text-center pt-10 gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-5xl animate-bounce">
              🎉
            </div>
            <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-sm w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">✓</span>
          </div>
          <h1 className="text-3xl font-bold">Booking Request Sent!</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">
            {chef.name} will confirm your booking within{" "}
            {chef.responseTime.replace("Responds ", "").replace("Responds", "")}.
          </p>
        </div>

        {/* Booking ID */}
        <div className="rounded-3xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-5 text-center space-y-1">
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-widest">Booking Reference</p>
          <p className="text-3xl font-bold tracking-wider text-green-700 dark:text-green-300">{bookingId}</p>
          <p className="text-xs text-gray-400">Save this ID for your records</p>
        </div>

        {/* Chef Card */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="relative h-36 w-full">
            <Image src={chef.image} alt={chef.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xl font-bold">{chef.name}</p>
              <p className="text-sm opacity-80">{chef.city} • ⭐ {chef.rating}</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {formattedDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Date</span>
                <span className="font-medium text-sm">{formattedDate}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Service</span>
              <span className="font-medium text-sm">{serviceLabels[service] || service}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Guests</span>
              <span className="font-medium text-sm">{guests} {Number(guests) === 1 ? "person" : "people"}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                ⏳ Pending Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* What's next */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What happens next?</h2>
          <div className="space-y-3">
            {[
              { icon: "📩", title: "Chef reviews your request", desc: `${chef.name} will review your booking details and available dates.` },
              { icon: "✅", title: "You get a confirmation", desc: "Once confirmed, you'll receive a summary with all details." },
              { icon: "💳", title: "Payment at confirmation", desc: "No payment is taken until your chef confirms the booking." },
            ].map((step) => (
              <div key={step.title} className="flex gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-2xl shrink-0">{step.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{step.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Message the chef nudge */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Have a question?</p>
            <p className="text-sm text-gray-400 mt-0.5">Message {chef.name.split(" ")[0]} directly</p>
          </div>
          <Link
            href={`/chef/${chef.slug}`}
            className="shrink-0 rounded-2xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-sm font-semibold"
          >
            Message
          </Link>
        </div>

      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4 z-40">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Link
            href="/"
            className="flex-1 rounded-2xl bg-green-600 text-white py-4 font-semibold text-lg text-center"
          >
            Find More Chefs
          </Link>
          <Link
            href={`/chef/${chef.slug}`}
            className="rounded-2xl border border-gray-300 dark:border-gray-700 px-6 py-4 font-semibold text-sm text-center"
          >
            View Chef
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense>
      <BookingConfirmedContent />
    </Suspense>
  );
}
