
"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface Location {
  lat: number;
  lng: number;
  activity: string;
}

export default function TripMap({ locations }: { locations: Location[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
    }

    // Clear old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    if (locations.length > 0) {
      const points: L.LatLngExpression[] = [];
      locations.forEach(loc => {
        if (loc.lat && loc.lng) {
          const marker = L.marker([loc.lat, loc.lng])
            .bindPopup(loc.activity)
            .addTo(leafletMap.current!);
          markers.current.push(marker);
          points.push([loc.lat, loc.lng]);
        }
      });

      if (points.length > 0) {
        leafletMap.current.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
      }
    }

    return () => {
      // Cleanup happens if component unmounts
    };
  }, [locations]);

  return <div ref={mapRef} className="w-full h-full min-h-[400px]" />;
}
