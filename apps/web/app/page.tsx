"use client";

import ChefMap from "../components/ChefMap";
import { mockChefs, MockChef } from "../lib/mockChefs";
import { useUserLocation } from "../hooks/useUserLocation";
import { calcDistanceMiles } from "../utils/calcDistance";

export default function HomePage() {
  const { location: userLocation, loading, error, retry } = useUserLocation();

  // Calculate and sort chefs by distance
  const chefsWithDistance = userLocation
    ? mockChefs
        .map((chef) => {
          const distance = calcDistanceMiles(
            userLocation.lat,
            userLocation.lng,
            chef.lat,
            chef.lng
          );
          return { ...chef, distance: distance.toFixed(1) + " mi" };
        })
        .sort((a, b) =>
          parseFloat(a.distance) - parseFloat(b.distance)
        )
    : mockChefs;

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors">
      <nav className="flex items-center justify-between px-10 py-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold">Cook For Me</h1>

        <div className="flex items-center gap-4">
          <button className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700">
            Login
          </button>
          <button className="px-5 py-2 rounded-full bg-green-600 text-white">
            Become a Chef
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-10 py-20 grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
            Home-cooked meals, weekly prep, and catering from trusted chefs near you.
          </h2>

          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
            Search by ZIP, city, address, or event venue anywhere in the USA.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <input
              className="border border-gray-300 dark:border-gray-700 rounded-full px-6 py-4 w-full bg-transparent"
              placeholder="Enter delivery address"
            />
            <button className="bg-green-600 text-white px-8 py-4 rounded-full">
              Find Food
            </button>
          </div>
        </div>

        <ChefMap chefs={chefsWithDistance} userLocation={userLocation} />
      </section>
      {/* Cards using chefsWithDistance */}
      <section className="max-w-7xl mx-auto px-10 pb-24">
        <h3 className="text-3xl font-semibold mb-8">Popular Near You</h3>
        {loading && <div>Loading your location...</div>}
        {error && (
          <div className="text-red-500 flex items-center gap-2">
            {error}
            <button
              className="ml-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm"
              onClick={retry}
            >
              Retry Location
            </button>
          </div>
        )}
        {/* Warn if using fallback location */}
        {userLocation && userLocation.lat === 42.3601 && userLocation.lng === -71.0589 && !loading && !error && (
          <div className="text-yellow-600 dark:text-yellow-400 mb-4">
            Showing results near Boston (default). Allow location access for more accurate results.
            <button
              className="ml-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm"
              onClick={retry}
            >
              Retry Location
            </button>
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {chefsWithDistance.map((chef) => (
            <div
              key={chef.id}
              className="rounded-3xl border border-gray-200 dark:border-gray-800 p-5"
            >
              <div className="h-56 rounded-2xl bg-gray-200 dark:bg-zinc-900 mb-4 flex items-center justify-center overflow-hidden">
                <img src={chef.image} alt={chef.name} className="object-cover h-full w-full rounded-2xl" />
              </div>
              <h4 className="text-xl font-semibold">{chef.name}</h4>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {chef.category} &ndash; {chef.location}, {chef.city}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {chef.distance ? chef.distance : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}