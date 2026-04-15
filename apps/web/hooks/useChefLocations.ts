import { useState, useEffect } from "react";
import { MockChef, mockChefs } from "../lib/mockChefs";

const BOSTON_CENTER = { lat: 42.3601, lng: -71.0589 };

// Store each chef's relative offset from the Boston center
const CHEF_OFFSETS = mockChefs.map((chef) => ({
  id: chef.id,
  latOffset: chef.lat - BOSTON_CENTER.lat,
  lngOffset: chef.lng - BOSTON_CENTER.lng,
}));

async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string
): Promise<{ location: string; city: string; state: string }> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) {
      return { location: "Nearby", city: "", state: "" };
    }
    const components = data.results[0].address_components;
    let location = "";
    let city = "";
    let state = "";
    for (const comp of components) {
      if (
        !location &&
        (comp.types.includes("neighborhood") ||
          comp.types.includes("sublocality_level_1") ||
          comp.types.includes("sublocality"))
      ) {
        location = comp.long_name;
      }
      if (comp.types.includes("locality")) {
        city = comp.long_name;
      }
      if (comp.types.includes("administrative_area_level_1")) {
        state = comp.short_name;
      }
    }
    return { location: location || city, city, state };
  } catch {
    return { location: "Nearby", city: "", state: "" };
  }
}

export function useChefLocations(
  userLocation: { lat: number; lng: number } | null
): MockChef[] {
  const [chefs, setChefs] = useState<MockChef[]>(mockChefs);

  useEffect(() => {
    if (!userLocation) {
      setChefs(mockChefs);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    // Compute offset positions relative to user's location
    const offsetChefs = mockChefs.map((chef, i) => ({
      ...chef,
      lat: userLocation.lat + CHEF_OFFSETS[i].latOffset,
      lng: userLocation.lng + CHEF_OFFSETS[i].lngOffset,
    }));

    setChefs(offsetChefs);

    // Reverse geocode each position for real neighborhood/city names
    Promise.all(
      offsetChefs.map(async (chef) => {
        const geoInfo = await reverseGeocode(chef.lat, chef.lng, apiKey);
        return { ...chef, ...geoInfo };
      })
    ).then(setChefs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng]);

  return chefs;
}
