import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

export function useUserLocation(defaultLocation: UserLocation = { lat: 42.3601, lng: -71.0589 }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
    getLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultLocation.lat, defaultLocation.lng]);

  return { location, error, loading, retry: getLocation };
}
