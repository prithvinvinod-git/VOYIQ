
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, AlertCircle, Loader2, Scan, Camera, ShieldCheck, XCircle, Zap, RefreshCw, Lock, ArrowRight, Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { firebaseConfig } from "@/firebase/config";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
  }
}

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

declare global {
  interface window {
    google: any;
    initMap: () => void;
  }
}

export function ARNavigation({ slots }: ARNavigationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [bearing, setBearing] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [targetSlot, setTargetSlot] = useState<Slot | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);
  
  // Navigation State
  const [nextInstruction, setNextInstruction] = useState<string>("");
  const [isMapsLoaded, setIsMapsLoaded] = useState(false);

  // Load Google Maps API safely
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (window.google && window.google.maps) {
      setIsMapsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey || '';
    
    if (!apiKey) {
      setPermissionError("Google Maps API Key missing. Please check your configuration.");
      return;
    }

    const existingScript = document.getElementById('google-maps-api');
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsMapsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 500);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-api';
    script.src = `https://maps.googleapis.com/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapsLoaded(true);
    script.onerror = () => setPermissionError("Google Maps API failed to load. Check your internet or API key.");
    document.head.appendChild(script);
  }, []);

  // Cleanup Camera Stream on Unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Check for secure context
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setIsSecure(false);
    }
  }, []);

  // Find the next unchecked slot
  useEffect(() => {
    const nextSlot = slots.find(s => !s.completed) || slots[0];
    setTargetSlot(nextSlot);
  }, [slots]);

  const requestPermissions = async () => {
    setIsInitializing(true);
    setPermissionError(null);

    try {
      if (!window.isSecureContext) {
        throw new Error("Security Restriction: AR features require HTTPS.");
      }

      // Request Camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play failed:", playErr);
        }
      }

      // Request Geolocation
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentPosition(pos);
            setHasLocationPermission(true);
            resolve();
          },
          (err) => reject(new Error("Location Access Denied. Enable GPS in your settings.")),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });

      setIsSystemActive(true);
    } catch (error: any) {
      const msg = error.name === 'NotAllowedError' 
        ? "Permission Denied: Chrome has blocked camera access. Reset permissions via the 'Lock' icon in your address bar." 
        : error.message || "Initialization failed.";
      setPermissionError(msg);
      setHasCameraPermission(false);
      
      // Stop stream if partial success
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Update Navigation Logic (Street View + Directions)
  useEffect(() => {
    if (!isSystemActive || !currentPosition || !targetSlot || !isMapsLoaded || !window.google || !window.google.maps) return;

    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(currentPosition.coords.latitude, currentPosition.coords.longitude),
          destination: new window.google.maps.LatLng(targetSlot.lat, targetSlot.lng),
          travelMode: window.google.maps.TravelMode.WALKING,
        },
        (result: any, status: string) => {
          if (status === 'OK' && result.routes[0]) {
            const leg = result.routes[0].legs[0];
            const firstStep = leg.steps[0];
            
            setNextInstruction(firstStep.instructions.replace(/<[^>]*>?/gm, ''));
            // Override the approx distance with high-accuracy walking distance
            setDistance(leg.distance.value);

            // Update Street View Preview safely
            if (streetViewRef.current) {
              const previewPoint = leg.steps.length > 1 ? leg.steps[1].start_location : leg.end_location;
              try {
                new window.google.maps.StreetViewPanorama(streetViewRef.current, {
                  position: previewPoint,
                  addressControl: false,
                  linksControl: false,
                  panControl: false,
                  enableCloseButton: false,
                  zoomControl: false,
                  scrollwheel: false,
                  disableDefaultUI: true,
                  clickToGo: false,
                });
              } catch (svErr) {
                console.warn("StreetView init failed:", svErr);
              }
            }
          } else if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || status === 'NOT_FOUND') {
            console.warn("Directions request limited or denied. Falling back to approximate distance.");
          } else {
            console.warn("Directions request failed with status:", status);
          }
        }
      );
    } catch (e) {
      console.error("Directions Service Error:", e);
    }
  }, [currentPosition, targetSlot, isSystemActive, isMapsLoaded]);

  // Calculate Bearing and Immediate Approx Distance (Haversine)
  useEffect(() => {
    if (!currentPosition || !targetSlot) return;
    const lat1 = currentPosition.coords.latitude;
    const lon1 = currentPosition.coords.longitude;
    const lat2 = targetSlot.lat;
    const lon2 = targetSlot.lng;

    // 1. Calculate Bearing
    const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
    const brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    setBearing(brng);

    // 2. Calculate Approx Distance (Haversine Formula)
    // This provides an immediate non-zero value while APIs load
    const R = 6371e3; // Earth radius in metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    
    // Only set the approximate distance if we haven't received a precise one yet (prevent 0 flash)
    setDistance(prev => (prev === 0 ? d : prev));
  }, [currentPosition, targetSlot]);

  useEffect(() => {
    if (!hasLocationPermission || !isSystemActive) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPosition(pos),
      null,
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasLocationPermission, isSystemActive]);

  if (!isSecure) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-8 space-y-6 text-center">
        <Lock className="w-16 h-16 text-destructive" />
        <h3 className="text-2xl font-headline font-bold">Secure Context Required</h3>
        <p className="text-sm text-muted-foreground">AR features require HTTPS for hardware access. Localhost or SSL is required.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* 1. Live Camera Feed */}
      <video 
        ref={videoRef} 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isSystemActive ? 'opacity-100' : 'opacity-0'}`}
        autoPlay 
        muted 
        playsInline 
      />

      {/* 2. Initialization Overlay */}
      {!isSystemActive && !permissionError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white p-8 space-y-8">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center relative">
            <Scan className="w-12 h-12 text-primary" />
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-4 max-w-xs">
            <h3 className="text-2xl font-headline font-bold">Launch AR HUB</h3>
            <p className="text-sm text-muted-foreground">Visual navigation with live Street View confirmation.</p>
          </div>
          <Button onClick={requestPermissions} disabled={isInitializing || !isMapsLoaded} className="w-full max-w-xs h-16 bg-primary text-primary-foreground font-bold rounded-2xl gap-3">
            {isInitializing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : !isMapsLoaded ? (
              <span className="flex items-center gap-2">Connecting APIs... <Loader2 className="w-3 h-3 animate-spin" /></span>
            ) : (
              <><Zap className="w-5 h-5" /> Start AR Systems</>
            )}
          </Button>
        </div>
      )}

      {/* 3. Error Overlay */}
      {permissionError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black p-6 text-center space-y-8">
          <XCircle className="w-16 h-16 text-destructive" />
          <div className="space-y-4 max-w-sm">
            <h2 className="text-2xl font-headline font-bold text-white">System Error</h2>
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-left">
              <AlertDescription className="text-xs">{permissionError}</AlertDescription>
            </Alert>
            <Button className="w-full h-12 bg-white/10 text-white rounded-xl" onClick={() => {setPermissionError(null); setIsInitializing(false);}}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry Initialization
            </Button>
          </div>
        </div>
      )}

      {/* 4. Active AR HUD */}
      {isSystemActive && (
        <>
          {/* Top Status HUD */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm">
            <div className="glass-card bg-black/40 backdrop-blur-xl border-primary/30 p-4 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Active Waypoint</p>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{targetSlot?.activity || "Locating..."}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">
                  {distance === 0 ? "..." : distance > 1000 ? `${(distance/1000).toFixed(1)}km` : `${Math.round(distance)}m`}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase font-bold">Distance</p>
              </div>
            </div>
            
            {/* Live Instructions Pill */}
            {nextInstruction && (
              <div className="mt-3 bg-accent/20 border border-accent/40 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top">
                <ArrowRight className="w-4 h-4 text-accent animate-bounce-x" />
                <span className="text-[11px] font-bold text-white">{nextInstruction}</span>
              </div>
            )}
          </div>

          {/* Center Visual Compass */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="relative w-64 h-64 border border-primary/20 rounded-full">
              <div className="absolute inset-4 border border-white/5 rounded-full" />
              <div className="absolute transition-transform duration-500 ease-out h-full w-full" style={{ transform: `rotate(${bearing}deg)` }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-primary rounded-full shadow-[0_0_15px_hsl(var(--primary))]" />
              </div>
            </div>
          </div>

          {/* Bottom Visual Guide (Street View Preview) */}
          <div className="absolute bottom-8 left-6 right-6 z-10">
            <div className="flex gap-4 items-end">
              {/* Street View Mini HUD */}
              <div className="w-32 h-32 rounded-3xl border-2 border-white/20 overflow-hidden bg-black/80 shadow-2xl shrink-0 group relative">
                <div ref={streetViewRef} className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <Eye className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                </div>
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-bold text-primary uppercase tracking-widest z-20">
                  Street View Peek
                </div>
              </div>

              {/* Target Location Card */}
              <div className="flex-1 glass-card bg-black/60 backdrop-blur-xl border-white/10 p-5 rounded-[2rem]">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Location Verified</span>
                </div>
                <p className="text-xs font-medium text-white/90 truncate">{targetSlot?.location || "Calculating coordinates..."}</p>
                <div className="mt-2 flex -space-x-1">
                  {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border border-background bg-primary/20" />)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
      `}</style>
    </div>
  );
}
