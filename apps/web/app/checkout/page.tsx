"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { mockChefs } from "../../lib/mockChefs";
import { useAuth } from "../../hooks/useAuth";
import { bookingsApi, paymentsApi, type PaymentStatus } from "../../lib/api";
import { addToCart as addCartItem, clearCart, getCartItems, type CartItem } from "../../lib/cart";
import { trackAnalyticsEvent } from "../../lib/analytics";

function parsePriceToNumber(value?: string) {
  if (!value) return 0;
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

type ChefBookingDetail = {
  serviceType: string;
  date: string;
  address: string;
};

const DEFAULT_SERVICE_TYPE = "delivery";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const legacySlug = searchParams.get("chef") || "";
  const legacyCartParam = searchParams.get("cart");

  const [bookingDetailsByChef, setBookingDetailsByChef] = useState<Record<string, ChefBookingDetail>>({});
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [allergies, setAllergies] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentStatusLoading, setPaymentStatusLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [previewComplete, setPreviewComplete] = useState(false);

  useEffect(() => {
    const existing = getCartItems();

    // Backward compatibility with legacy URL-based cart params.
    if (legacyCartParam && legacySlug && existing.length === 0) {
      try {
        const legacyItems = JSON.parse(decodeURIComponent(legacyCartParam)) as Array<{ name: string; qty: number; price?: string }>;
        const legacyChef = mockChefs.find((c) => c.slug === legacySlug);

        legacyItems.forEach((item) => {
          if (!item?.name || !item?.qty) return;
          addCartItem({
            chefSlug: legacySlug,
            chefName: legacyChef?.name ?? legacySlug,
            itemName: item.name,
            price: item.price,
            qty: item.qty,
          });
        });
      } catch {
        // Ignore malformed legacy cart.
      }
    }

    setCartItems(getCartItems());
  }, [legacyCartParam, legacySlug]);

  const groups = Array.from(
    cartItems.reduce((map, item) => {
      const current = map.get(item.chefSlug) ?? {
        chefSlug: item.chefSlug,
        chefName: item.chefName,
        items: [] as CartItem[],
      };
      current.items.push(item);
      map.set(item.chefSlug, current);
      return map;
    }, new Map<string, { chefSlug: string; chefName: string; items: CartItem[] }>()).values()
  );

  const primaryChefSlug = groups[0]?.chefSlug || legacySlug || "coastal-prep-kitchen";
  const baseChef = mockChefs.find((c) => c.slug === primaryChefSlug) || mockChefs[0];
  const chefKey = groups.map((g) => g.chefSlug).join(",");

  useEffect(() => {
    setBookingDetailsByChef((prev) => {
      const next: Record<string, ChefBookingDetail> = {};
      groups.forEach((group) => {
        next[group.chefSlug] = prev[group.chefSlug] ?? {
          serviceType: DEFAULT_SERVICE_TYPE,
          date: "",
          address: "",
        };
      });
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);

      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key])
      ) {
        return prev;
      }

      return next;
    });
  }, [chefKey, groups]);

  const updateChefDetail = (
    chefSlug: string,
    patch: Partial<ChefBookingDetail>,
  ) => {
    setBookingDetailsByChef((prev) => ({
      ...prev,
      [chefSlug]: {
        serviceType: DEFAULT_SERVICE_TYPE,
        date: "",
        address: "",
        ...prev[chefSlug],
        ...patch,
      },
    }));
  };

  const groupsMissingDetails = groups.filter((group) => {
    const detail = bookingDetailsByChef[group.chefSlug];
    if (!detail?.date) return true;
    const addressRequired =
      detail.serviceType === "delivery" ||
      detail.serviceType === "catering" ||
      detail.serviceType === "private-chef";
    if (addressRequired && !detail.address.trim()) return true;
    return false;
  });

  const hasIncompleteChefDetails = groupsMissingDetails.length > 0;

  useEffect(() => {
    trackAnalyticsEvent({
      eventType: "CUSTOM",
      label: "checkout_view",
      metadata: {
        chefs: chefKey ? chefKey.split(",") : [],
        chefCount: groups.length,
      },
    });
  }, [chefKey, groups.length]);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentStatus = async () => {
      try {
        const status = await paymentsApi.status();
        if (!cancelled) {
          setPaymentStatus(status);
        }
      } catch {
        if (!cancelled) {
          setPaymentStatus({
            stripeEnabled: false,
            bookingsEnabled: false,
            mode: "disabled",
            publishableKeyPresent: false,
            message: "Payments are temporarily unavailable.",
          });
        }
      } finally {
        if (!cancelled) {
          setPaymentStatusLoading(false);
        }
      }
    };

    void loadPaymentStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + parsePriceToNumber(item.price) * item.qty, 0);
  const estimatedFees = subtotal > 0 ? Math.round(subtotal * 0.08 * 100) / 100 : 0;
  const estimatedTotal = subtotal + estimatedFees;

  const previewCardComplete =
    cardholderName.trim().length >= 2 &&
    cardNumber.replace(/\D/g, "").length >= 16 &&
    cardExpiry.replace(/\D/g, "").length === 4 &&
    cardCvc.replace(/\D/g, "").length >= 3;

  const handleSubmit = async () => {
    if (!agreed) return;
    if (groups.length === 0) {
      setError("Your cart is empty. Add items from one or more chefs first.");
      return;
    }
    if (hasIncompleteChefDetails) {
      setError("Set date and service details for each chef before checkout.");
      return;
    }

    if (!paymentStatus?.bookingsEnabled) {
      if (!previewCardComplete) {
        setError("Enter sample card details to preview the final checkout step.");
        return;
      }

      setError(null);
      setPreviewComplete(true);
      trackAnalyticsEvent({
        eventType: "CUSTOM",
        label: "checkout_preview_payment_review",
        metadata: {
          chefs: groups.map((g) => g.chefSlug),
          chefCount: groups.length,
          perChef: groups.map((g) => ({
            chefSlug: g.chefSlug,
            serviceType: bookingDetailsByChef[g.chefSlug]?.serviceType,
            date: bookingDetailsByChef[g.chefSlug]?.date,
          })),
          guestCount,
          total: estimatedTotal,
        },
      });
      return;
    }

    if (!accessToken) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const bookings = await Promise.all(
        groups.map((group) =>
          bookingsApi.create(accessToken, {
            chefSlug: group.chefSlug,
            date: bookingDetailsByChef[group.chefSlug].date,
            serviceType: bookingDetailsByChef[group.chefSlug].serviceType,
            guestCount,
            address: bookingDetailsByChef[group.chefSlug].address,
            notes,
            allergies,
            cart: group.items.map((item) => ({ name: item.itemName, qty: item.qty, price: item.price })),
          })
        )
      );

      clearCart();
      setCartItems([]);

      trackAnalyticsEvent({
        eventType: "FORM_SUBMIT",
        label: "booking_submit_success",
        metadata: {
          chefs: groups.map((g) => g.chefSlug),
          bookingCount: bookings.length,
          perChef: groups.map((g) => ({
            chefSlug: g.chefSlug,
            serviceType: bookingDetailsByChef[g.chefSlug]?.serviceType,
            date: bookingDetailsByChef[g.chefSlug]?.date,
          })),
          guestCount,
        },
      });

      const qs = new URLSearchParams({
        chef: groups[0].chefSlug,
        date: bookingDetailsByChef[groups[0].chefSlug].date,
        service: bookingDetailsByChef[groups[0].chefSlug].serviceType,
        guests: String(guestCount),
        id: String(bookings[0].id),
        bookingCount: String(bookings.length),
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

        <div className="px-6 pt-6">
          {groups.length <= 1 ? (
            <Link href={`/chef/${baseChef.slug}`} className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              ← Back to {baseChef.name}
            </Link>
          ) : (
            <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              ← Back to chefs
            </Link>
          )}
        </div>

        <div className="p-6 space-y-7">
          <h1 className="text-3xl font-bold">Booking Request</h1>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl shrink-0">
              <Image src={baseChef.image} alt={baseChef.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              {groups.length <= 1 ? (
                <>
                  <h2 className="text-xl font-bold">{baseChef.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{baseChef.city} • {baseChef.distance}</p>
                  <p className="text-sm mt-1">⭐ {baseChef.rating} ({baseChef.reviews} reviews)</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold">Multi-Chef Order</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{groups.length} chefs in this cart</p>
                  <p className="text-sm mt-1">One checkout submits separate booking requests per chef.</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">✅ Licensed</p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Your Order</h2>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.chefSlug} className="rounded-3xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900 text-sm font-semibold">
                      {group.chefName}
                    </div>
                    {group.items.map((item) => (
                      <div key={`${group.chefSlug}-${item.itemName}`} className="flex justify-between items-center px-4 py-3">
                        <span className="font-medium">{item.qty}× {item.itemName}</span>
                        {item.price && <span className="text-green-600 font-semibold text-sm">{item.price}</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Booking Details by Chef</h2>

            {groups.map((group) => {
              const detail = bookingDetailsByChef[group.chefSlug] ?? {
                serviceType: DEFAULT_SERVICE_TYPE,
                date: "",
                address: "",
              };

              const addressRequired =
                detail.serviceType === "delivery" ||
                detail.serviceType === "catering" ||
                detail.serviceType === "private-chef";

              return (
                <div key={group.chefSlug} className="rounded-3xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{group.chefName}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{group.items.reduce((sum, item) => sum + item.qty, 0)} items</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Preferred Date</label>
                    <input
                      type="date"
                      value={detail.date}
                      onChange={(e) => updateChefDetail(group.chefSlug, { date: e.target.value })}
                      className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
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
                          onClick={() => updateChefDetail(group.chefSlug, { serviceType: opt.value })}
                          className={`rounded-2xl border p-3 text-sm font-medium transition-colors ${
                            detail.serviceType === opt.value
                              ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {addressRequired && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
                        {detail.serviceType === "delivery" ? "Delivery Address" : "Event Address"}
                      </label>
                      <input
                        type="text"
                        value={detail.address}
                        onChange={(e) => updateChefDetail(group.chefSlug, { address: e.target.value })}
                        placeholder="123 Ocean Ave, Oak Bluffs, MA"
                        className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}

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
          </section>

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

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Payment Status</h2>
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded-full font-semibold ${paymentStatus?.mode === "test" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>
                  {paymentStatusLoading ? "Checking…" : paymentStatus?.mode === "test" ? "Stripe Test Mode" : "Payments Disabled"}
                </span>
                {paymentStatus && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {paymentStatus.bookingsEnabled ? "Bookings enabled" : "Bookings disabled"}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {paymentStatusLoading
                  ? "Checking whether bookings and payments are currently enabled."
                  : paymentStatus?.message}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              {!paymentStatus?.bookingsEnabled && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                  Preview Only
                </span>
              )}
            </div>

            {!paymentStatus?.bookingsEnabled && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use sample values only. This preview does not send or process any payment information.
              </p>
            )}

            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Cardholder name</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Name on card"
                  className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Card number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">Expiry</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="12/34"
                    className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">CVC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-zinc-900 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Chefs</span>
                  <span>{groups.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span>{subtotal > 0 ? `$${subtotal.toFixed(2)}` : "Calculated at payment"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Estimated service fee</span>
                  <span>{subtotal > 0 ? `$${estimatedFees.toFixed(2)}` : "TBD"}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-base pt-1 border-t border-gray-200 dark:border-gray-800">
                  <span>Estimated total</span>
                  <span>{subtotal > 0 ? `$${estimatedTotal.toFixed(2)}` : "Shown when items have prices"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {previewComplete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewComplete(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-green-600">Preview Complete</p>
                <h2 className="text-2xl font-bold">Final payment step preview</h2>
              </div>
              <button
                onClick={() => setPreviewComplete(false)}
                className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-zinc-950 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Chefs</span>
                <span className="font-medium">{groups.length}</span>
              </div>
              {groups.map((group) => {
                const detail = bookingDetailsByChef[group.chefSlug];
                return (
                  <div key={`preview-${group.chefSlug}`} className="flex items-center justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">{group.chefName}</span>
                    <span className="font-medium text-right">
                      {(detail?.serviceType || DEFAULT_SERVICE_TYPE).replace("-", " ")} • {detail?.date || "No date"}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Card</span>
                <span className="font-medium">•••• {cardNumber.replace(/\D/g, "").slice(-4) || "4242"}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-2 font-semibold">
                <span>Total</span>
                <span>{subtotal > 0 ? `$${estimatedTotal.toFixed(2)}` : "Calculated at payment"}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
              This is a preview only. No payment was processed, no booking was submitted, and no card data was sent to Stripe.
            </div>

            <button
              onClick={() => setPreviewComplete(false)}
              className="w-full rounded-2xl bg-green-600 text-white py-4 font-semibold text-lg"
            >
              Back to Checkout Preview
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4 z-40">
        <div className="max-w-3xl mx-auto">
          {error && (
            <p className="text-center text-sm text-red-500 mb-2">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!agreed || hasIncompleteChefDetails || submitting || paymentStatusLoading || (!paymentStatus?.bookingsEnabled && !previewCardComplete)}
            className="w-full rounded-2xl bg-green-600 disabled:opacity-40 text-white py-4 font-semibold text-lg"
          >
            {paymentStatusLoading
              ? "Checking availability…"
              : !paymentStatus?.bookingsEnabled
                ? "Preview Final Payment Step"
                : submitting
                  ? "Submitting…"
                  : groups.length > 1
                    ? `Submit ${groups.length} Booking Requests`
                    : "Submit Booking Request"}
          </button>
          {(!agreed || hasIncompleteChefDetails) && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {hasIncompleteChefDetails
                ? `Finish date/service details for ${groupsMissingDetails.length} chef${groupsMissingDetails.length === 1 ? "" : "s"}`
                : "Agree to food safety notice"} to continue
            </p>
          )}
          {paymentStatus && !paymentStatus.bookingsEnabled && agreed && !hasIncompleteChefDetails && !previewCardComplete && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Enter sample card details to preview the final payment step.
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
