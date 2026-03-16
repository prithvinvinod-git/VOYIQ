
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, Wallet, Star, Zap, Download, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, getDocs, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { UserHeader } from "@/components/layout/UserHeader";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [exportingTripId, setExportingTripId] = useState<string | null>(null);

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

  const generateGoogleMapsLink = (slots: any[]) => {
    if (!slots || slots.length === 0) return "";
    const origin = encodeURIComponent(slots[0].location);
    if (slots.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${origin}&travelmode=driving`;
    }
    const waypoints = slots.slice(1, -1).map((s: any) => encodeURIComponent(s.location)).filter(Boolean);
    const destination = encodeURIComponent(slots[slots.length - 1].location);
    const waypointQuery = waypoints.length > 0 ? `&waypoints=${waypoints.join('|')}` : '';
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointQuery}&travelmode=driving`;
  };

  const handleExportPDF = async (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore) return;

    setExportingTripId(trip.id);
    try {
      const itQuery = query(collection(firestore, `trips/${trip.id}/itineraryDays`), orderBy("dayNumber"));
      const snap = await getDocs(itQuery);
      const days = snap.docs.map(d => d.data());

      if (days.length === 0) {
        toast({ variant: "destructive", title: "Export Failed", description: "No itinerary data found for this trip." });
        return;
      }

      // Generate Print View
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const html = `
        <html>
          <head>
            <title>VOYIQ Itinerary - ${trip.destination}</title>
            <style>
              body { font-family: 'Syne', 'Plus Jakarta Sans', sans-serif; background: white; color: black; padding: 40px; }
              .header { border-bottom: 2px solid #00D4B8; padding-bottom: 20px; margin-bottom: 40px; }
              h1 { margin: 0; color: #00D4B8; font-size: 32px; }
              .trip-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .day { border-left: 4px solid #F5A623; padding-left: 20px; margin-bottom: 40px; page-break-inside: avoid; }
              .day-header { font-size: 20px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px; }
              .slot { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              .time { font-weight: bold; color: #666; font-size: 12px; }
              .activity { font-weight: bold; font-size: 16px; margin: 4px 0; }
              .location { font-size: 12px; color: #888; }
              .nav-link { display: inline-block; background: #00D4B8; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 12px; margin-top: 10px; }
              @media print { .nav-link { display: none; } }
            </style>
          </head>
          <body>
            <div className="header">
              <h1>VOYIQ | TRAVEL REFINED</h1>
              <p>Your curated journey through ${trip.destination}</p>
            </div>
            <div className="trip-info">
              <div>
                <strong>Destination:</strong> ${trip.destination}<br/>
                <strong>Dates:</strong> ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}
              </div>
              <div>
                <strong>Total Budget:</strong> ${trip.totalBudget} ${trip.currency}<br/>
                <strong>Plan Health:</strong> ${Math.round(trip.health)}%
              </div>
            </div>
            ${days.map((day: any) => `
              <div class="day">
                <div class="day-header">Day ${day.dayNumber}: ${day.theme || 'Exploration'}</div>
                ${day.slots.map((slot: any) => `
                  <div class="slot">
                    <div class="time">${slot.time}</div>
                    <div class="activity">${slot.activity}</div>
                    <div class="desc">${slot.description}</div>
                    <div class="location">${slot.location}</div>
                  </div>
                `).join('')}
                <a href="${generateGoogleMapsLink(day.slots)}" class="nav-link">Open Day ${day.dayNumber} in Maps</a>
              </div>
            `).join('')}
            <script>window.print();</script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      toast({ title: "PDF Generated", description: "Your itinerary is ready for printing." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setExportingTripId(null);
    }
  };

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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-2 break-words text-white leading-tight">
              Welcome back, {user?.displayName?.split(' ')[0] || userData?.name?.split(' ')[0] || "Explorer"}!
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base font-medium">You have {trips.length} refined adventures tracked.</p>
          </div>
          
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 h-12 shadow-lg shadow-primary/20 w-full md:w-auto shrink-0 font-bold"
            onClick={handleNewTripClick}
          >
            <Plus className="mr-2 w-5 h-5" /> Design New Adventure
          </Button>

          <PlanSelectionDialog 
            open={isPlanDialogOpen}
            onOpenChange={setIsPlanDialogOpen}
            tripCount={trips.length}
            onSelectFree={() => {
              setIsPlanDialogOpen(false);
              router.push("/plan/new");
            }}
          />
        </div>

        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-headline font-bold text-white">Active Journeys</h2>
            <Button variant="link" className="text-primary hover:text-primary/80 text-xs font-bold uppercase tracking-widest">History</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="glass-card border-none hover:bg-white/5 transition-all group overflow-hidden shadow-2xl">
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                      <div className="w-full sm:w-48 h-32 sm:h-auto rounded-xl bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden group/img">
                        <Image 
                          src={`https://picsum.photos/seed/${trip.id}/400/300`} 
                          alt={trip.destination} 
                          width={400}
                          height={300}
                          className="object-cover w-full h-full opacity-60 group-hover/img:opacity-100 transition-all duration-700 group-hover/img:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-base sm:text-xl font-bold truncate pr-4 text-white">{trip.destination}</h3>
                            <Badge variant={trip.health > 80 ? "default" : "secondary"} className={trip.health > 80 ? "bg-primary/20 text-primary border-none text-[8px] sm:text-xs" : "text-[8px] sm:text-xs"}>
                              {Math.round(trip.health || 0)}% Refined
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground mb-4 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-accent" /> 
                              <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wallet className="w-3 h-3 text-primary" />
                              <span>{trip.totalBudget} {trip.currency}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                              <span>Itinerary Completion</span>
                              <span>{Math.round(trip.health || 0)}%</span>
                            </div>
                            <Progress value={trip.health || 0} className="h-1.5" />
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-9 border-white/10 hover:bg-primary/10 hover:text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest"
                            onClick={(e) => handleExportPDF(e, trip)}
                            disabled={exportingTripId === trip.id}
                          >
                            {exportingTripId === trip.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            ) : (
                              <Download className="w-3 h-3 mr-2" />
                            )}
                            Export PDF Itinerary
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-2 py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-muted-foreground w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">No active journeys</h3>
                <p className="text-muted-foreground mb-6 font-medium">Initialize your first refined adventure today with VOYIQ AI.</p>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 h-12 rounded-xl font-bold" onClick={handleNewTripClick}>Plan a New Journey</Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card border-none bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Level {stats.currentLevel} Voyager</CardTitle>
              <Star className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{stats.explorationScore} XP</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[8px] text-muted-foreground uppercase font-bold tracking-widest">
                  <span>{stats.xpRemaining} to Next Tier</span>
                  <span>{Math.round(stats.levelProgress)}%</span>
                </div>
                <Progress value={stats.levelProgress} className="h-1 bg-white/5" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-none bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Journey Streak</CardTitle>
              <Zap className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{stats.streakDays} Days</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">Consistent exploration verified.</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Destinations Visited</CardTitle>
              <MapPin className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{trips.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">Mapped across global coordinates.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
