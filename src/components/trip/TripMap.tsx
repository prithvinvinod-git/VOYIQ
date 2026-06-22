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

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([20, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        minZoom: 1,
      }).addTo(leafletMap.current);

      // Force size recalculation to avoid tile pixelation
      setTimeout(() => leafletMap.current?.invalidateSize(), 100);
      setTimeout(() => leafletMap.current?.invalidateSize(), 500);
    }

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    if (locations.length > 0) {
      const points: L.LatLngExpression[] = [];
      locations.forEach((loc) => {
        if (loc.lat && loc.lng) {
          const marker = L.marker([loc.lat, loc.lng])
            .bindPopup(`<b>${loc.activity}</b>`)
            .addTo(leafletMap.current!);
          markers.current.push(marker);
          points.push([loc.lat, loc.lng]);
        }
      });

      if (points.length > 0) {
        leafletMap.current.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
      }
    }

    return () => {};
  }, [locations]);

  return <div ref={mapRef} className="w-full h-full min-h-[280px]" />;
}
