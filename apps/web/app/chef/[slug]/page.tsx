"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mockChefs } from "../../../lib/mockChefs";
import { useUserLocation } from "../../../hooks/useUserLocation";
import { useChefLocations } from "../../../hooks/useChefLocations";
import { calcDistanceMiles } from "../../../utils/calcDistance";

export default function ChefDetailPage() {
  const params = useParams();
  const { location: userLocation } = useUserLocation();
  const dynamicChefs = useChefLocations(userLocation);

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

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="max-w-3xl mx-auto pb-36">

        {/* Hero Image */}
        <div className="relative h-72 w-full">
          <Image
            src={chef.image}
            alt={chef.name}
            fill
            className="object-cover rounded-b-3xl"
          />
          <Link
            href="/"
            className="absolute top-4 left-4 bg-white dark:bg-black text-black dark:text-white rounded-full px-4 py-2 text-sm font-medium shadow"
          >
            ← Back
          </Link>
        </div>

        <div className="px-6 pt-6 space-y-6">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-green-600 bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full">
                {chef.category}
              </span>
            </div>
            <h1 className="text-4xl font-bold mt-2">{chef.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {chef.location} • {chef.distance} • ⭐ {chef.rating} ({chef.reviews} reviews)
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{chef.responseTime}</p>
            <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">{chef.bio}</p>
          </div>

          {/* Popular Meals */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">Popular Meals</h2>
            <div className="space-y-3">
              {chef.menu.meals.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  {item.price && (
                    <span className="text-green-600 font-semibold text-sm ml-4 whitespace-nowrap">{item.price}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Weekly Plans */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">Weekly Plans</h2>
            <div className="space-y-3">
              {chef.menu.weekly.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  {item.price && (
                    <span className="text-green-600 font-semibold text-sm ml-4 whitespace-nowrap">{item.price}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Catering Platters */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">Catering Platters</h2>
            <div className="space-y-3">
              {chef.menu.catering.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                  {item.price && (
                    <span className="text-green-600 font-semibold text-sm ml-4 whitespace-nowrap">{item.price}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button className="flex-1 rounded-2xl bg-green-600 text-white py-4 font-semibold text-lg">
            Book Now
          </button>
          <button className="rounded-2xl border border-gray-300 dark:border-gray-700 px-6 py-4 font-semibold">
            Message
          </button>
        </div>
      </div>
    </main>
  );
}
