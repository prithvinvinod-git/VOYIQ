
"use client";

import React, { useEffect } from "react";
import { UserHeader } from "@/components/layout/UserHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader showBack backHref="/dashboard" title="AR Explorer" />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-6 mb-16">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/10">
            <Scan className="w-10 h-10 text-primary" />
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
                <Card className="glass-card border-none hover:bg-white/5 transition-all group overflow-hidden shadow-xl">
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
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{trip.destination}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent" /> {new Date(trip.startDate).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {trip.destination}</span>
                        </div>
                      </div>
                      <Button className="w-full sm:w-fit mt-4 bg-primary text-primary-foreground font-bold rounded-xl gap-2 h-10">
                        Launch HUD <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
              <Sparkles className="text-muted-foreground w-12 h-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">No active journeys</h3>
              <p className="text-muted-foreground mb-6 font-medium">Start a new adventure to unlock AR navigation.</p>
              <Link href="/plan/new">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 h-12 rounded-xl font-bold">Plan a Journey</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
