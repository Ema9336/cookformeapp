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
        console.error("Geolocation error:", err);
        setError(`Location error: ${err.message}`);
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
