"use client";
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
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
    libraries: ['marker'],
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const mapCenter = userLocation || getMapCenter(chefs);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps) return;

    const createdMarkers: Array<google.maps.Marker | google.maps.marker.AdvancedMarkerElement> = [];
    const createFallbackMarker = (options: google.maps.MarkerOptions) => {
      const marker = new window.google.maps.Marker(options);
      createdMarkers.push(marker);
    };

    if (userLocation) {
      const markerApi = window.google.maps.marker;
      if (markerApi?.AdvancedMarkerElement && markerApi.PinElement) {
        const pin = new markerApi.PinElement({
          background: '#2563eb',
          borderColor: '#1d4ed8',
          glyphColor: '#ffffff',
        });
        createdMarkers.push(
          new markerApi.AdvancedMarkerElement({
            map,
            position: userLocation,
            title: 'You are here',
            content: pin.element,
          }),
        );
      } else {
        createFallbackMarker({
          map,
          position: userLocation,
          title: 'You are here',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });
      }
    }

    chefs.forEach((chef) => {
      const position = { lat: chef.lat, lng: chef.lng };
      const markerApi = window.google.maps.marker;
      if (markerApi?.AdvancedMarkerElement && markerApi.PinElement) {
        const pin = new markerApi.PinElement({
          background: '#059669',
          borderColor: '#047857',
          glyphColor: '#ffffff',
        });
        createdMarkers.push(
          new markerApi.AdvancedMarkerElement({
            map,
            position,
            title: chef.name,
            content: pin.element,
          }),
        );
      } else {
        createFallbackMarker({
          map,
          position,
          title: chef.name,
        });
      }
    });

    return () => {
      createdMarkers.forEach((marker) => {
        if ('setMap' in marker) {
          marker.setMap(null);
        } else {
          marker.map = null;
        }
      });
    };
  }, [chefs, map, userLocation]);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={12}
      onLoad={setMap}
      onUnmount={() => setMap(null)}
    />
  );
}