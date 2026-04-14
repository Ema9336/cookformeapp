"use client";
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import type { MockChef } from '../lib/mockChefs';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '24px',
};

const getMapCenter = (chefs: MockChef[]) =>
  chefs.length > 0 ? { lat: chefs[0].lat, lng: chefs[0].lng } : { lat: 42.3601, lng: -71.0589 };

interface ChefMapProps {
  chefs: MockChef[];
  userLocation?: { lat: number; lng: number } | null;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function ChefMap({ chefs, userLocation }: ChefMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const mapCenter = userLocation || getMapCenter(chefs);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={12}
    >
      {userLocation && (
        <Marker
          position={userLocation}
          title="You are here"
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: { width: 40, height: 40 },
          }}
        />
      )}
      {chefs.map((chef) => (
        <Marker
          key={chef.id}
          position={{ lat: chef.lat, lng: chef.lng }}
          title={chef.name}
        />
      ))}
    </GoogleMap>
  );
}