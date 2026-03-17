
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, AlertCircle, Loader2, Scan, Camera, ShieldCheck, XCircle, Zap, RefreshCw, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

  // Check for secure context on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setIsSecure(false);
    }
  }, []);

  // Find the next unchecked slot as the target
  useEffect(() => {
    const nextSlot = slots.find(s => !s.completed) || slots[0];
    setTargetSlot(nextSlot);
  }, [slots]);

  const requestPermissions = async () => {
    setIsInitializing(true);
    setPermissionError(null);

    try {
      // 1. Check for basic support and secure context
      if (!window.isSecureContext) {
        throw new Error("Security Restriction: AR features require an HTTPS connection to access hardware. Please ensure you are using a secure URL.");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Hardware API Missing: Your browser does not support camera access in this context.");
      }

      // 2. Request Camera - This MUST be triggered by a direct user click (like this function)
      // to ensure Chrome/Safari shows the native "Allow/Deny" popup.
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment'
        } 
      });
      
      setHasCameraPermission(true);
      
      // Attach stream to video ref
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(e => console.warn("Video play failed:", e));
      }

      // 3. Request Geolocation
      if (!navigator.geolocation) {
        throw new Error("Hardware API Missing: Geolocation is not supported by your browser.");
      }

      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentPosition(pos);
            setHasLocationPermission(true);
            resolve();
          },
          (err) => {
            let msg = "Location Access Denied.";
            if (err.code === err.PERMISSION_DENIED) {
              msg = "Location Denied: The request for location access was rejected. Please enable Location in your browser settings.";
            } else if (err.code === err.TIMEOUT) {
              msg = "Location Timeout: The request to get your location timed out.";
            }
            reject(new Error(msg));
          },
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });

      setIsSystemActive(true);
    } catch (error: any) {
      console.error('AR Initialization Error:', error);
      
      let friendlyMessage = error.message;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        friendlyMessage = "Browser Blocked: Permission was previously denied. Chrome will not ask again automatically. Please click the 'Lock' icon in your address bar and reset Camera/Location permissions to 'Allow'.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        friendlyMessage = "Hardware Missing: No camera detected on this device.";
      }

      setPermissionError(friendlyMessage);
      setHasCameraPermission(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Continuous Position Tracking
  useEffect(() => {
    if (!hasLocationPermission || !isSystemActive) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPosition(pos),
      (err) => console.error('Geolocation watch error:', err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [hasLocationPermission, isSystemActive]);

  // Calculate Bearing and Distance
  useEffect(() => {
    if (!currentPosition || !targetSlot) return;

    const lat1 = currentPosition.coords.latitude;
    const lon1 = currentPosition.coords.longitude;
    const lat2 = targetSlot.lat;
    const lon2 = targetSlot.lng;

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

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const brng = ((θ * 180) / Math.PI + 360) % 360;
    setBearing(brng);
  }, [currentPosition, targetSlot]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isSecure) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-8 space-y-6 text-center">
        <Lock className="w-16 h-16 text-destructive" />
        <h3 className="text-2xl font-headline font-bold">Secure Context Required</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          AR Navigation requires a secure HTTPS connection to access your device's camera and location sensors.
        </p>
        <Button variant="outline" className="border-white/10" onClick={() => window.location.href = window.location.href.replace('http:', 'https:')}>
          Reload with HTTPS
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <video 
        ref={videoRef} 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isSystemActive ? 'opacity-100' : 'opacity-0'}`}
        autoPlay 
        muted 
        playsInline 
      />

      {!isSystemActive && !permissionError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white p-8 space-y-8 animate-in fade-in">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,212,184,0.1)] relative">
            <Scan className="w-12 h-12 text-primary" />
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-4 max-w-xs">
            <h3 className="text-2xl font-headline font-bold">Initialize HUD</h3>
            <p className="text-sm text-muted-foreground font-medium">Click below to launch native browser permission requests for Camera and GPS.</p>
          </div>
          <Button 
            onClick={requestPermissions} 
            disabled={isInitializing}
            className="w-full max-w-xs h-16 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 gap-3 text-lg"
          >
            {isInitializing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Syncing Sensors...</>
            ) : (
              <><Zap className="w-5 h-5" /> Start AR Systems</>
            )}
          </Button>
        </div>
      )}

      {permissionError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black p-6 text-center space-y-8 animate-in zoom-in-95">
          <XCircle className="w-16 h-16 text-destructive" />
          <div className="space-y-4 max-w-sm">
            <h2 className="text-2xl font-headline font-bold text-white">Access Required</h2>
            <p className="text-muted-foreground text-sm">Hardware sensors must be enabled to visualize your journey.</p>
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Diagnostics</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">{permissionError}</AlertDescription>
            </Alert>
            <Button 
              className="w-full h-12 bg-white/10 text-white hover:bg-white/20 font-bold rounded-xl gap-2"
              onClick={() => {
                setPermissionError(null);
                setIsInitializing(false);
              }}
            >
              <RefreshCw className="w-4 h-4" /> Retry Connection
            </Button>
          </div>
        </div>
      )}

      {isSystemActive && (
        <>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-sm animate-in slide-in-from-top duration-700">
            <div className="glass-card bg-black/40 backdrop-blur-xl border-primary/30 p-4 rounded-3xl flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Target Active</p>
                  <p className="text-sm font-bold text-white truncate max-w-[150px]">{targetSlot?.activity || 'Calculating...'}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-bold text-accent">
                  {distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase font-bold">Distance</p>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 border border-primary/20 rounded-full flex items-center justify-center">
              <div className="absolute inset-4 border border-white/5 rounded-full" />
              <div 
                className="absolute transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${bearing}deg)` }}
              >
                <div className="w-4 h-12 bg-primary rounded-full relative -top-32 shadow-[0_0_20px_hsl(var(--primary))] animate-pulse">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-primary" />
                </div>
              </div>
              <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
            </div>
          </div>

          <div className="absolute bottom-10 left-6 right-6 z-10 animate-in slide-in-from-bottom duration-700">
            <div className="glass-card bg-black/60 backdrop-blur-xl border-white/10 p-5 rounded-[2rem] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">HUD Operational</span>
                </div>
              </div>
              <p className="text-xs font-medium text-white/90 truncate">{targetSlot?.location}</p>
            </div>
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
