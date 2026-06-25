"use client";

import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix broken default marker icons in Next.js / Webpack builds
// (Leaflet's icon URLs point to node_modules which Webpack doesn't serve)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Location {
  lat: number;
  lng: number;
  activity: string;
}

export default function TripMap({ locations }: { locations: Location[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Stable serialised key so fitBounds only re-fires when coords genuinely change
  const locationKey = useMemo(
    () =>
      locations
        .filter((l) => l.lat && l.lng)
        .map((l) => `${l.lat},${l.lng}`)
        .join("|"),
    [locations]
  );

  // --- Initialise map once ---
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      // Prevent animation jank when the container resizes
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 1,
    }).addTo(map);

    mapRef.current = map;

    // Use ResizeObserver instead of brittle setTimeout hacks
    resizeObserverRef.current = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserverRef.current.observe(mapContainerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []); // run only once

  // --- Update markers whenever locations actually change ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const validLocs = locations.filter((l) => l.lat && l.lng);
    if (validLocs.length === 0) return;

    const points: L.LatLngExpression[] = [];
    validLocs.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng])
        .bindPopup(`<b>${loc.activity}</b>`)
        .addTo(map);
      markersRef.current.push(marker);
      points.push([loc.lat, loc.lng]);
    });

    // Fit bounds smoothly
    map.flyToBounds(L.latLngBounds(points), {
      padding: [40, 40],
      maxZoom: 14,
      animate: true,
      duration: 0.8,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]); // only when the actual coords change

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[280px]"
      style={{ background: "#1a1f21" }}
    />
  );
}
