"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, Wallet, Star, Zap } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { UserHeader } from "@/components/layout/UserHeader";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";

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
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

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

  const { data: tripsData, isLoading: isTripsLoading } = useCollection<Trip>(tripsQuery);

  const stats = useMemo(() => {
    if (!tripsData) return { explorationScore: 0, currentLevel: 1, levelProgress: 0, streakDays: 0, completedCount: 0, xpRemaining: 200 };
    
    const totalCompleted = tripsData.reduce((acc, t) => acc + (t.totalCompletedSlots || 0), 0);
    const totalXP = totalCompleted * 50;
    
    const level = Math.floor(totalXP / 200) + 1;
    const progressInCurrentLevel = totalXP % 200;
    const levelProgressPercent = (progressInCurrentLevel / 200) * 100;
    const xpRemaining = 200 - progressInCurrentLevel;

    const streak = tripsData.some(t => (t.totalCompletedSlots || 0) > 0) ? 4 : 0;

    return {
      explorationScore: totalXP,
      currentLevel: level,
      levelProgress: levelProgressPercent,
      xpRemaining: xpRemaining,
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
  const isPremium = userData?.isPremium || false;
  const isLimitReached = !isPremium && trips.length >= 4;

  const handleNewTripClick = () => {
    if (isLimitReached) {
      setIsPlanDialogOpen(true);
    } else {
      router.push("/plan/new");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <UserHeader />

      <main className="container mx-auto px-4 pt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="w-full max-w-full overflow-hidden">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-headline font-bold mb-2 break-words text-white leading-tight">
              Welcome back, {user?.displayName?.split(' ')[0] || userData?.name?.split(' ')[0] || "Explorer"}!
            </h1>
            <p className="text-muted-foreground text-xs sm:text-base">You have {trips.length} adventures tracked.</p>
          </div>
          
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 h-12 shadow-lg shadow-primary/20 w-full md:w-auto"
            onClick={handleNewTripClick}
          >
            <Plus className="mr-2 w-5 h-5" /> Plan New Adventure
          </Button>

          <PlanSelectionDialog 
            open={isPlanDialogOpen}
            onOpenChange={setIsPlanDialogOpen}
            tripCount={trips.length}
            onSelectFree={() => router.push("/plan/new")}
          />
        </div>

        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-headline font-bold">Active Journeys</h2>
            <Button variant="link" className="text-primary hover:text-primary/80 text-xs">View History</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="glass-card border-none hover:bg-white/5 transition-all group overflow-hidden">
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="w-full sm:w-32 h-32 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden">
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
                          <h3 className="text-base sm:text-xl font-bold truncate pr-4">{trip.destination}</h3>
                          <Badge variant={trip.health > 80 ? "default" : "secondary"} className={trip.health > 80 ? "bg-primary/20 text-primary border-none text-[8px] sm:text-xs" : "text-[8px] sm:text-xs"}>
                            {Math.round(trip.health || 0)}%
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground mb-4">
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
                          <div className="flex justify-between text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
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
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={handleNewTripClick}>Plan a New Trip</Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card border-none bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Level {stats.currentLevel} Explorer</CardTitle>
              <Star className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.explorationScore} XP</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[8px] text-muted-foreground uppercase font-bold">
                  <span>{stats.xpRemaining} to Level {stats.currentLevel + 1}</span>
                  <span>{Math.round(stats.levelProgress)}%</span>
                </div>
                <Progress value={stats.levelProgress} className="h-1 bg-white/5" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-none bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Travel Streak</CardTitle>
              <Zap className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.streakDays} Days</div>
              <p className="text-[10px] text-muted-foreground mt-1">Activities completed recently!</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Cities Visited</CardTitle>
              <MapPin className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{trips.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Across global destinations</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
