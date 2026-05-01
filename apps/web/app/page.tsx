"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import ChefMap from "../components/ChefMap";
import { useUserLocation } from "../hooks/useUserLocation";
import { useChefLocations } from "../hooks/useChefLocations";
import { calcDistanceMiles } from "../utils/calcDistance";
import { useAuth } from "../hooks/useAuth";

// ─── Filter constants ─────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Meals", "Weekly Meal Prep", "Catering Platters"] as const;
type Category = (typeof CATEGORIES)[number];

const DIETARY_TAGS = [
  "🐟 Seafood", "🌱 Vegan", "🥗 Gluten-Free", "🍖 BBQ",
  "🫒 Mediterranean", "🥩 Premium Meats", "🍾 Events", "🦞 Seafood",
];

const SORT_OPTIONS = [
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Top Rated" },
  { value: "reviews", label: "Most Reviewed" },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { location: userLocation, loading, error, retry } = useUserLocation();
  const dynamicChefs = useChefLocations(userLocation);
  const { user, logout } = useAuth();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [showFilters, setShowFilters] = useState(false);

  // Chefs with computed distance
  const chefsWithDistance = useMemo(() =>
    userLocation
      ? dynamicChefs.map((chef) => {
          const dist = calcDistanceMiles(userLocation.lat, userLocation.lng, chef.lat, chef.lng);
          return { ...chef, distanceNum: dist, distance: dist.toFixed(1) + " mi" };
        })
      : dynamicChefs.map((chef) => ({ ...chef, distanceNum: 0 })),
    [dynamicChefs, userLocation]
  );

  // Filter + sort pipeline
  const filteredChefs = useMemo(() => {
    let result = chefsWithDistance;

    // Text search — name, bio, category, tags
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter((c) => c.category === activeCategory);
    }

    // Tag filter (chef must have ALL selected tags)
    if (activeTags.length > 0) {
      result = result.filter((c) =>
        activeTags.every((tag) =>
          c.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase().replace(/^.+\s/, "")))
        )
      );
    }

    // Distance filter (only when we have real location)
    if (userLocation) {
      result = result.filter((c) => (c as typeof c & { distanceNum: number }).distanceNum <= maxDistance);
    }

    // Sort
    if (sortBy === "distance") {
      result = [...result].sort((a, b) =>
        ((a as typeof a & { distanceNum: number }).distanceNum) -
        ((b as typeof b & { distanceNum: number }).distanceNum)
      );
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    } else if (sortBy === "reviews") {
      result = [...result].sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [chefsWithDistance, searchQuery, activeCategory, activeTags, maxDistance, sortBy, userLocation]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setActiveTags([]);
    setMaxDistance(50);
    setSortBy("distance");
  };

  const hasActiveFilters =
    searchQuery || activeCategory !== "All" || activeTags.length > 0 || maxDistance < 50;

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 sm:px-10 py-4 sm:py-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-bold">Cook For Me</h1>
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                Hi, {user.name.split(" ")[0]}
              </span>
              {user.role === "CHEF" && (
                <Link href="/chef-dashboard" className="px-4 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-700">
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="px-4 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-700"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm sm:px-5 sm:text-base rounded-full border border-gray-300 dark:border-gray-700">
                Login
              </Link>
              <Link href="/chef-onboarding" className="px-4 py-2 text-sm sm:px-5 sm:text-base rounded-full bg-green-600 text-white whitespace-nowrap">
                Become a Chef
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero + Map */}
      <section className="max-w-7xl mx-auto px-5 sm:px-10 py-10 sm:py-16 grid lg:grid-cols-2 gap-8 sm:gap-12">
        <div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Home-cooked meals, weekly prep, and catering from trusted chefs near you.
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-600 dark:text-gray-300">
            Search by chef name, cuisine, or dietary preference.
          </p>

          {/* Search bar */}
          <div className="mt-6 sm:mt-8 space-y-2">
            {/* Row 1: text search + filters button — always one line */}
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-full pl-10 sm:pl-11 pr-8 py-3 sm:py-4 text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  placeholder="Chefs, cuisines, dietary needs…"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-full border transition font-medium text-sm ${
                  showFilters || hasActiveFilters
                    ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                    : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                }`}
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">
                    {[activeCategory !== "All", activeTags.length > 0, maxDistance < 50].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Row 2: delivery address + Search button — always one line */}
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">📍</span>
                <input
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-full pl-10 sm:pl-11 pr-4 py-3 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  placeholder="Delivery address or ZIP code"
                />
              </div>
              <button className="shrink-0 bg-green-600 text-white px-5 sm:px-6 py-3 rounded-full text-sm font-semibold hover:bg-green-700 transition">
                Search
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                }`}
              >
                {cat === "Meals" ? "🍽️ " : cat === "Weekly Meal Prep" ? "📦 " : cat === "Catering Platters" ? "🎉 " : ""}
                {cat}
              </button>
            ))}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5 bg-gray-50 dark:bg-zinc-900">
              {/* Dietary tags */}
              <div>
                <p className="text-sm font-semibold mb-2">Dietary & Specialty</p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                        activeTags.includes(tag)
                          ? "border-green-500 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance slider */}
              {userLocation && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold">Max Distance</p>
                    <span className="text-sm font-bold text-green-600">{maxDistance} mi</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="w-full accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 mi</span>
                    <span>50 mi</span>
                  </div>
                </div>
              )}

              {/* Sort */}
              <div>
                <p className="text-sm font-semibold mb-2">Sort By</p>
                <div className="flex gap-2">
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSortBy(value)}
                      className={`px-4 py-2 rounded-full border text-xs font-medium transition ${
                        sortBy === value
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-700 transition font-medium"
                >
                  ✕ Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <ChefMap chefs={filteredChefs} userLocation={userLocation} />
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-5 sm:px-10 pb-24">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-semibold">
            {hasActiveFilters || searchQuery
              ? `${filteredChefs.length} result${filteredChefs.length !== 1 ? "s" : ""}`
              : "Popular Near You"}
          </h3>
          {/* Inline sort (when filters panel is closed) */}
          {!showFilters && (
            <div className="flex gap-2">
              {SORT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                    sortBy === value
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location notices */}
        {loading && <p className="text-gray-400 mb-4 text-sm">Detecting your location…</p>}
        {error && (
          <div className="text-red-500 flex items-center gap-2 mb-4 text-sm">
            {error}
            <button className="ml-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm" onClick={retry}>
              Retry
            </button>
          </div>
        )}
        {userLocation?.lat === 42.3601 && !loading && !error && (
          <div className="text-yellow-600 dark:text-yellow-400 mb-4 text-sm flex items-center gap-2">
            📍 Showing results near Boston (default).
            <button className="underline" onClick={retry}>Use my location</button>
          </div>
        )}

        {/* Chef grid */}
        {filteredChefs.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-5xl">🍽️</p>
            <p className="text-xl font-semibold">No chefs match your filters</p>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or clearing some filters.</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
            {filteredChefs.map((chef) => (
              <Link
                key={chef.id}
                href={`/chef/${chef.slug}`}
                className="block rounded-3xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:border-green-400 transition group"
              >
                <div className="h-56 rounded-2xl bg-gray-200 dark:bg-zinc-900 mb-4 overflow-hidden">
                  <Image
                    src={chef.image}
                    alt={chef.name}
                    width={400}
                    height={224}
                    className="object-cover w-full h-full rounded-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xl font-semibold leading-tight">{chef.name}</h4>
                  <span className="shrink-0 text-sm font-bold text-amber-500">⭐ {chef.rating}</span>
                </div>

                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                  {chef.category} · {chef.location}, {chef.city}
                </p>

                <div className="flex items-center justify-between mt-1">
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {chef.reviews} reviews
                  </p>
                  {chef.distance && (
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">{chef.distance}</p>
                  )}
                </div>

                {chef.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {chef.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}