
"use client";

import React, { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { ARNavigation } from "@/components/trip/ARNavigation";
import { UserHeader } from "@/components/layout/UserHeader";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ARTripHUD() {
  const { tripId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return doc(firestore, "trips", tripId as string);
  }, [firestore, tripId, user]);
  const { data: trip, isLoading: isTripLoading } = useDoc<any>(tripRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  const itineraryQuery = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return query(collection(firestore, `trips/${tripId}/itineraryDays`), orderBy("dayNumber"));
  }, [firestore, tripId, user]);
  const { data: itinerary, isLoading: isItineraryLoading } = useCollection<any>(itineraryQuery);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/auth");
    if (userData && !userData.isPremium) router.push(`/trip/${tripId}`);
  }, [user, isUserLoading, userData, router, tripId]);

  const allSlots = useMemo(() => {
    if (!itinerary) return [];
    // Combine slots from all days for navigation
    return itinerary.flatMap(day => day.slots || []);
  }, [itinerary]);

  if (isUserLoading || isTripLoading || isItineraryLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs uppercase font-bold tracking-widest text-primary/60">Initializing HUD Systems...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-white">Journey Data Not Found</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <div className="z-50 shrink-0">
        <UserHeader showBack backHref={`/trip/${tripId}`} title={`${trip.destination} HUD`} />
      </div>
      <div className="flex-1 relative">
        <ARNavigation slots={allSlots} />
      </div>
    </div>
  );
}
