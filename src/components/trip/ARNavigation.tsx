
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, AlertCircle, Loader2, Scan } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Slot {
  lat: number;
  lng: number;
  activity: string;
  completed?: boolean;
  location: string;
}

interface ARNavigationProps {
  slots: Slot[];
}

export function ARNavigation({ slots }: ARNavigationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [bearing, setBearing] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [targetSlot, setTargetSlot] = useState<Slot | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Find the next unchecked slot as the target
  useEffect(() => {
    const nextSlot = slots.find(s => !s.completed) || slots[0];
    setTargetSlot(nextSlot);
  }, [slots]);

  // Request Camera Permission
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      } finally {
        setIsInitializing(false);
      }
    };
    getCameraPermission();
  }, []);

  // Request Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPosition(pos);
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Calculate Bearing and Distance
  useEffect(() => {
    if (!currentPosition || !targetSlot) return;

    const lat1 = currentPosition.coords.latitude;
    const lon1 = currentPosition.coords.longitude;
    const lat2 = targetSlot.lat;
    const lon2 = targetSlot.lng;

    // Haversine Distance
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    setDistance(d);

    // Bearing
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const brng = ((θ * 180) / Math.PI + 360) % 360;
    setBearing(brng);
  }, [currentPosition, targetSlot]);

  if (isInitializing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs uppercase font-bold tracking-widest opacity-60">Initializing HUD Systems...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Video Feed */}
      <video 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover" 
        autoPlay 
        muted 
        playsInline 
      />

      {/* Permission Overlays */}
      {!hasCameraPermission && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <Alert variant="destructive" className="glass-card border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hardware Access Required</AlertTitle>
            <AlertDescription>
              Please enable camera access to initialize the AR exploration HUD.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* AR HUD ELEMENTS */}
      {hasCameraPermission && (
        <>
          {/* Top Pill - Status */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
            <div className="glass-card bg-black/40 backdrop-blur-xl border-primary/30 p-4 rounded-3xl flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Active Target</p>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{targetSlot?.activity || 'Searching...'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-accent">
                  {distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase font-bold">Distance</p>
              </div>
            </div>
          </div>

          {/* Center Target HUD */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 border border-primary/20 rounded-full flex items-center justify-center">
              {/* Static HUD Rings */}
              <div className="absolute inset-4 border border-white/5 rounded-full" />
              <div className="absolute inset-12 border border-primary/10 rounded-full border-dashed" />
              
              {/* Dynamic Directional Arrow */}
              <div 
                className="absolute transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${bearing}deg)` }}
              >
                <div className="w-4 h-12 bg-primary rounded-full relative -top-32 shadow-[0_0_20px_hsl(var(--primary))] animate-pulse">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-primary" />
                </div>
              </div>

              {/* Center Crosshair */}
              <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
              <div className="w-10 h-[1px] bg-white/20 absolute" />
              <div className="h-10 w-[1px] bg-white/20 absolute" />
            </div>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-10 left-6 right-6 z-10">
            <div className="glass-card bg-black/60 backdrop-blur-xl border-white/10 p-5 rounded-[2rem] space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location Identified</span>
              </div>
              <p className="text-xs font-medium text-white/90">{targetSlot?.location}</p>
              <div className="flex gap-2 pt-2">
                <Badge className="bg-primary/20 text-primary border-none text-[8px] px-2 py-0.5 uppercase">GPS Active</Badge>
                <Badge className="bg-accent/20 text-accent border-none text-[8px] px-2 py-0.5 uppercase">Motion Sync</Badge>
              </div>
            </div>
          </div>

          {/* Scanning Animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-[1px] bg-primary/20 absolute animate-[scan_3s_linear_infinite]" />
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
