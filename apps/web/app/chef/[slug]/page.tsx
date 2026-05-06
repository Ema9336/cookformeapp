"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { mockChefs, MenuItem } from "../../../lib/mockChefs";
import { useUserLocation } from "../../../hooks/useUserLocation";
import { useChefLocations } from "../../../hooks/useChefLocations";
import { calcDistanceMiles } from "../../../utils/calcDistance";
import { paymentsApi, type PaymentStatus } from "../../../lib/api";

function MenuSection({
  title,
  items,
  onAdd,
  onViewDetail,
}: {
  title: string;
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
  onViewDetail: (item: MenuItem) => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center">
            <button className="text-left flex-1" onClick={() => onViewDetail(item)}>
              <p className="font-medium">{item.name}</p>
              {item.ingredients && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{item.ingredients}</p>
              )}
            </button>
            <div className="flex items-center gap-3 ml-4">
              {item.price && <span className="text-green-600 font-semibold text-sm whitespace-nowrap">{item.price}</span>}
              <button
                onClick={() => onAdd(item)}
                className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold shrink-0"
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ChefDetailPage() {
  const params = useParams();
  const { location: userLocation } = useUserLocation();
  const dynamicChefs = useChefLocations(userLocation);
  const [favorited, setFavorited] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [cart, setCart] = useState<{ item: MenuItem; qty: number }[]>([]);
  const [drawerItem, setDrawerItem] = useState<MenuItem | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        setStickyVisible(heroRef.current.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentStatus = async () => {
      try {
        const status = await paymentsApi.status();
        if (!cancelled) setPaymentStatus(status);
      } catch {
        if (!cancelled) {
          setPaymentStatus({
            stripeEnabled: false,
            bookingsEnabled: false,
            mode: "disabled",
            publishableKeyPresent: false,
            message: "Bookings are currently disabled while the marketplace is in preview mode.",
          });
        }
      }
    };

    void loadPaymentStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const baseChef = mockChefs.find((c) => c.slug === params.slug);
  if (!baseChef) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chef not found</h1>
          <Link href="/" className="text-green-600 underline">Back to home</Link>
        </div>
      </main>
    );
  }

  const dynamicChef = dynamicChefs.find((c) => c.slug === params.slug) || baseChef;
  const distance = userLocation
    ? calcDistanceMiles(userLocation.lat, userLocation.lng, dynamicChef.lat, dynamicChef.lng).toFixed(1) + " mi"
    : baseChef.distance;
  const location = dynamicChef.location || baseChef.location;
  const city = dynamicChef.city || baseChef.city;
  const chef = { ...baseChef, location, city, distance };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.name === item.name);
      if (existing) return prev.map((c) => c.item.name === item.name ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.qty, 0);

  const checkoutHref = () => {
    const cartData = cart.map((c) => ({ name: c.item.name, qty: c.qty, price: c.item.price }));
    const qs = new URLSearchParams({ chef: chef.slug });
    if (cartData.length > 0) qs.set("cart", encodeURIComponent(JSON.stringify(cartData)));
    return `/checkout?${qs.toString()}`;
  };

  const bookingsEnabled = paymentStatus?.bookingsEnabled ?? false;

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">

      {/* Always-visible top nav */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between transition-all duration-300 ${stickyVisible ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"}`}>
        <Link href="/" className="text-lg font-bold">Cook For Me</Link>
        <Link href="/chef-onboarding" className="text-sm font-semibold px-4 py-2 rounded-full bg-green-600 text-white">Become a Chef</Link>
      </div>

      {/* Sticky Header on scroll */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between transition-all duration-300 ${stickyVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"}`}>
        <span className="font-semibold text-lg truncate">{chef.name}</span>
        {bookingsEnabled ? (
          <Link href={checkoutHref()} className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-semibold shrink-0 ml-4">Book Now</Link>
        ) : (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-4 py-2 rounded-full text-sm font-semibold shrink-0 ml-4">
            Preview Only
          </span>
        )}
      </div>

      <div className="max-w-3xl mx-auto pb-36">

        {/* Hero Image */}
        <div ref={heroRef} className="relative h-72 w-full">
          <Image src={chef.image} alt={chef.name} fill className="object-cover rounded-b-3xl" />
          <Link href="/" className="absolute top-4 left-4 bg-white/80 dark:bg-black/70 backdrop-blur text-black dark:text-white rounded-full px-4 py-2 text-sm font-medium shadow">
            ← Back
          </Link>
          <button
            onClick={() => setFavorited(!favorited)}
            className="absolute top-4 right-4 bg-white/80 dark:bg-black/70 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center shadow text-xl"
          >
            {favorited ? "❤️" : "🤍"}
          </button>
          {/* Chef avatar + verified badge */}
          <div className="absolute -bottom-6 left-6">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-white dark:border-black overflow-hidden bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                👨‍🍳
              </div>
              <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">✓</span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-10 space-y-6">

          {/* Header */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-green-600 bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full">
              {chef.category}
            </span>
            <h1 className="text-4xl font-bold mt-3">{chef.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {chef.location} • {chef.distance} • ⭐ {chef.rating} ({chef.reviews} reviews)
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{chef.responseTime}</p>

            {/* Dietary tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {chef.tags.map((tag) => (
                <span key={tag} className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">{chef.bio}</p>
          </div>

          {/* Availability */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">Availability</h2>
            <div className="flex gap-2 flex-wrap">
              {chef.availability.map(({ day, available }) => (
                <div key={day} className={`flex flex-col items-center px-3 py-2 rounded-xl text-sm font-medium ${available ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-gray-600"}`}>
                  <span>{day}</span>
                  <span className="text-xs mt-1">{available ? "✓" : "—"}</span>
                </div>
              ))}
            </div>
            {!bookingsEnabled && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Bookings are currently disabled while the marketplace is in preview mode.
              </p>
            )}
          </section>

          <MenuSection title="Popular Meals" items={chef.menu.meals} onAdd={addToCart} onViewDetail={setDrawerItem} />
          <MenuSection title="Weekly Plans" items={chef.menu.weekly} onAdd={addToCart} onViewDetail={setDrawerItem} />
          <MenuSection title="Catering Platters" items={chef.menu.catering} onAdd={addToCart} onViewDetail={setDrawerItem} />

        </div>
      </div>

      {/* Meal detail drawer */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerItem(null)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-3xl z-10 overflow-hidden">
            {/* Meal image */}
            <div className="relative h-52 w-full">
              <Image
                src={chef.image}
                alt={drawerItem.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={() => setDrawerItem(null)} className="absolute top-4 right-4 bg-white/20 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto -mt-2 mb-1" />
              <h3 className="text-2xl font-bold">{drawerItem.name}</h3>
              {drawerItem.description && <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">{drawerItem.description}</p>}
              {drawerItem.price && <p className="text-green-600 font-semibold text-xl">{drawerItem.price}</p>}
              <button
                onClick={() => { addToCart(drawerItem); setDrawerItem(null); }}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold text-lg mt-2"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message drawer */}
      {messageOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMessageOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-3xl z-10 p-6 space-y-4">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2" />
            {messageSent ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-3xl">✉️</div>
                <h3 className="text-2xl font-bold">Message Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">{chef.name} will get back to you within {chef.responseTime.replace("Responds ", "").replace("Responds", "")}.</p>
                <button
                  onClick={() => setMessageOpen(false)}
                  className="mt-2 w-full bg-green-600 text-white py-4 rounded-2xl font-semibold text-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-lg">👨‍🍳</div>
                  <div>
                    <p className="font-semibold">{chef.name}</p>
                    <p className="text-xs text-gray-400">{chef.responseTime}</p>
                  </div>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Hi ${chef.name.split(" ")[0]}, I'd love to learn more about your meals...`}
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => { if (messageText.trim()) setMessageSent(true); }}
                  disabled={!messageText.trim()}
                  className="w-full bg-green-600 disabled:opacity-40 text-white py-4 rounded-2xl font-semibold text-lg"
                >
                  Send Message
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4 z-40">
        <div className="max-w-3xl mx-auto flex gap-3">
          {bookingsEnabled ? (
            <Link href={checkoutHref()} className="flex-1 rounded-2xl bg-green-600 text-white py-4 font-semibold text-lg relative flex items-center justify-center">
              Book Now
              {cartTotal > 0 && (
                <span className="absolute -top-2 -right-2 bg-black dark:bg-white text-white dark:text-black text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                  {cartTotal}
                </span>
              )}
            </Link>
          ) : (
            <div className="flex-1 rounded-2xl bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 py-4 font-semibold text-lg relative flex items-center justify-center">
              Preview Only
            </div>
          )}
          <button
            onClick={() => { setMessageOpen(true); setMessageSent(false); setMessageText(""); }}
            className="rounded-2xl border border-gray-300 dark:border-gray-700 px-6 py-4 font-semibold"
          >
            Message
          </button>
        </div>
      </div>
    </main>
  );
}
