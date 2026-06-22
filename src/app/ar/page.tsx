
"use client";

import React, { useEffect } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { Button } from "@/components/ui/button";
import { Scan, MapPin, Calendar, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ARHubLanding() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "trips"),
      where("authorizedUserIds", "array-contains", user.uid)
    );
  }, [firestore, user]);
  const { data: trips, isLoading: isTripsLoading } = useCollection<any>(tripsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/auth");
    if (userData && !userData.isPremium) router.push("/dashboard");
  }, [user, isUserLoading, userData, router]);

  if (isUserLoading || isTripsLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-cyan-500/8 blur-[110px]" />
        <div className="absolute top-[30%] left-[10%] w-[250px] h-[250px] rounded-full bg-violet-500/5 blur-[90px]" />
      </div>
      <AppNavbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative">
        <div className="text-center space-y-6 mb-16">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto glass-panel border-blue-500/20">
            <Scan className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold">Augmented Navigation.</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
            Select an active journey to initialize your high-precision AR exploration HUD.
          </p>
        </div>

        <div className="grid gap-6">
          {trips && trips.length > 0 ? (
            trips.map((trip) => (
              <Link key={trip.id} href={`/ar/${trip.id}`}>
                <div className="glass-panel hover:scale-[1.01] transition-all duration-300 group overflow-hidden rounded-2xl">
                  <div className="flex flex-col sm:flex-row gap-6 p-6">
                    <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden relative flex-shrink-0">
                      <Image 
                        src={`https://picsum.photos/seed/${trip.id}/300/300`} 
                        alt={trip.destination} 
                        fill
                        className="object-cover transition-transform group-hover:scale-110 duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{trip.destination}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-white/50 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-400" /> {new Date(trip.startDate).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {trip.destination}</span>
                        </div>
                      </div>
                      <Button className="w-full sm:w-fit mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl gap-2 h-10">
                        Launch HUD <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-20 text-center glass-panel rounded-2xl border-dashed">
              <Sparkles className="text-white/20 w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">No active journeys</h3>
              <p className="text-white/50 mb-6 font-medium">Start a new adventure to unlock AR navigation.</p>
              <Link href="/plan/new">
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-8 h-12 rounded-xl font-bold">Plan a Journey</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
