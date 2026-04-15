import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

const CACHE_KEY = "cookforme_user_location";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function setCachedLocation(loc: UserLocation) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...loc, ts: Date.now() }));
  } catch {}
}

export function useUserLocation(defaultLocation: UserLocation = { lat: 42.3601, lng: -71.0589 }) {
  const cached = typeof window !== "undefined" ? getCachedLocation() : null;
  const [location, setLocation] = useState<UserLocation | null>(cached);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cached);

  const getLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocation(defaultLocation);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCachedLocation(loc);
        setLocation(loc);
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied. Allow location in your browser settings.",
          2: "Your location could not be determined.",
          3: "Location request timed out.",
        };
        const msg = messages[err.code] || "Unable to get your location.";
        setError(msg);
        setLocation(defaultLocation);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    if (!cached) {
      getLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, error, loading, retry: getLocation };
}
