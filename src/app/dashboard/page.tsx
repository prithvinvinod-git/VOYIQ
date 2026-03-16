
"use client";

import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, Wallet, Star, Zap, Plane } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { UserHeader } from "@/components/layout/UserHeader";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
  health: number;
  totalCompletedSlots?: number;
}

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "trips"),
      where("authorizedUserIds", "array-contains", user.uid)
    );
  }, [firestore, user]);

  const { data: tripsData, isLoading: isTripsLoading } = useCollection<Trip>(tripsQuery);

  const stats = useMemo(() => {
    if (!tripsData) return { explorationScore: 0, currentLevel: 1, levelProgress: 0, streakDays: 0, completedCount: 0 };
    
    // XP calculation: 50 XP per completed slot
    const totalCompleted = tripsData.reduce((acc, t) => acc + (t.totalCompletedSlots || 0), 0);
    const totalXP = totalCompleted * 50;
    
    // Leveling: every 200 XP increases level
    const level = Math.floor(totalXP / 200) + 1;
    const progress = (totalXP % 200) / 2; // progress towards next 200 XP, mapped to 0-100%

    // Streak logic: if any activity completed in any trip, count it as a simple active status for now
    const streak = tripsData.some(t => (t.totalCompletedSlots || 0) > 0) ? 4 : 0;

    return {
      explorationScore: totalXP,
      currentLevel: level,
      levelProgress: progress,
      streakDays: streak,
      completedCount: totalCompleted
    };
  }, [tripsData]);

  if (isUserLoading || isTripsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const trips = tripsData || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <UserHeader />

      <main className="container mx-auto px-4 pt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">Welcome back, {user?.displayName?.split(' ')[0] || "Explorer"}!</h1>
            <p className="text-muted-foreground">You have {trips.length} adventures tracked.</p>
          </div>
          <Link href="/plan/new">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 h-12 shadow-lg shadow-primary/20">
              <Plus className="mr-2 w-5 h-5" /> Plan New Adventure
            </Button>
          </Link>
        </div>

        {/* Current Itineraries Section - Now at the top */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold">Active Journeys</h2>
            <Button variant="link" className="text-primary hover:text-primary/80">View History</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="glass-card border-none hover:bg-white/5 transition-all group overflow-hidden">
                    <div className="p-6 flex gap-6">
                      <div className="w-32 h-32 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden">
                        <Image 
                          src={`https://picsum.photos/seed/${trip.id}/150/150`} 
                          alt={trip.destination} 
                          width={150}
                          height={150}
                          className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold truncate pr-4">{trip.destination}</h3>
                          <Badge variant={trip.health > 80 ? "default" : "secondary"} className={trip.health > 80 ? "bg-primary/20 text-primary border-none" : ""}>
                            {Math.round(trip.health || 0)}% Complete
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 
                            <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wallet className="w-3 h-3" />
                            <span>{trip.totalBudget} {trip.currency}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            <span>Itinerary Progress</span>
                            <span>{Math.round(trip.health || 0)}%</span>
                          </div>
                          <Progress value={trip.health || 0} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-2 py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-muted-foreground w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6">Start your first adventure today with VOYIQ AI.</p>
                <Link href="/plan/new">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Plan a New Trip</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards - Now below journeys */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card border-none bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Level {stats.currentLevel} Explorer</CardTitle>
              <Star className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.explorationScore} XP</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                  <span>To Level {stats.currentLevel + 1}</span>
                  <span>{Math.round(stats.levelProgress)}%</span>
                </div>
                <Progress value={stats.levelProgress} className="h-1 bg-white/5" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-none bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Travel Streak</CardTitle>
              <Zap className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streakDays} Days</div>
              <p className="text-xs text-muted-foreground mt-1">Activities completed recently!</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cities Visited</CardTitle>
              <MapPin className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across 1 Continent</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
