import { useState, useEffect, useMemo } from "react";
import { MockChef, mockChefs } from "../lib/mockChefs";
import { useChefLocations } from "./useChefLocations";
import { chefsApi } from "../lib/api";

// Shape the API returns for a chef
type ApiChef = {
  id: string;
  slug: string;
  bio?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  category?: string;
  tags?: string;       // JSON string e.g. '["🌱 Vegan"]'
  image?: string;
  rating?: number;
  reviews?: number;
  startingPrice?: string;
  responseTime?: string;
  licensed?: boolean;
  user?: { name?: string };
  menuItems?: { name: string; price?: string; description?: string; category?: string }[];
};

function apiChefToMock(c: ApiChef): MockChef {
  let tags: string[] = [];
  try { tags = c.tags ? JSON.parse(c.tags) : []; } catch { tags = []; }

  const meals = (c.menuItems ?? [])
    .filter((m) => m.category === "meals" || !m.category)
    .map((m) => ({ name: m.name, price: m.price, ingredients: m.description }));
  const weekly = (c.menuItems ?? [])
    .filter((m) => m.category === "weekly")
    .map((m) => ({ name: m.name, price: m.price, ingredients: m.description }));
  const catering = (c.menuItems ?? [])
    .filter((m) => m.category === "catering")
    .map((m) => ({ name: m.name, price: m.price, ingredients: m.description }));

  return {
    id: c.id,
    slug: c.slug,
    name: c.user?.name ?? c.slug,
    bio: c.bio ?? "",
    category: c.category ?? "Meals",
    location: c.city ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    distance: "",
    rating: c.rating?.toFixed(1) ?? "5.0",
    reviews: c.reviews ?? 0,
    responseTime: c.responseTime ?? "Usually responds in 2 hrs",
    image: c.image ?? "/images/chefs/prep.webp",
    avatar: c.image ?? "/images/chefs/prep.webp",
    tags,
    availability: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
      day,
      available: true,
    })),
    lat: c.lat ?? 42.3601,
    lng: c.lng ?? -71.0589,
    menu: { meals, weekly, catering },
  };
}

/**
 * Returns mock chefs (repositioned near the user) merged with any real
 * chefs registered via the API. Mock chefs always appear first so the
 * demo listing is always visible; real chefs are appended, deduped by slug.
 */
export function useAllChefs(
  userLocation: { lat: number; lng: number } | null
): MockChef[] {
  const mockDynamic = useChefLocations(userLocation);
  const [realChefs, setRealChefs] = useState<MockChef[]>([]);

  useEffect(() => {
    chefsApi
      .list()
      .then((data) => {
        const converted = (data as ApiChef[]).map(apiChefToMock);
        setRealChefs(converted);
      })
      .catch(() => {
        // API not running or no chefs yet — silently keep mock-only
      });
  }, []);

  return useMemo(() => {
    const mockSlugs = new Set(mockChefs.map((c) => c.slug));
    const uniqueReal = realChefs.filter((c) => !mockSlugs.has(c.slug));
    return [...mockDynamic, ...uniqueReal];
  }, [mockDynamic, realChefs]);
}
