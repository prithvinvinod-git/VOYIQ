
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Map as MapIcon, 
  Sun, 
  RefreshCw, 
  Clock, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { ChatCompanion } from "@/components/chat/ChatCompanion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserHeader } from "@/components/layout/UserHeader";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import dynamic from "next/dynamic";

const TripMap = dynamic(() => import("@/components/trip/TripMap"), { ssr: false });

// Mock conversion rates for demo (INR to others)
const CONVERSION_RATES: Record<string, number> = {
  "USD": 1 / 83,
  "EUR": 1 / 88,
  "GBP": 1 / 105,
  "JPY": 1.8,
  "INR": 1,
};

export default function TripDetail() {
  const { tripId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [activeDay, setActiveDay] = useState(1);

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return doc(firestore, "trips", tripId as string);
  }, [firestore, tripId]);

  const { data: trip, isLoading: isTripLoading } = useDoc<any>(tripRef);

  const itineraryQuery = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return query(
      collection(firestore, `trips/${tripId}/itineraryDays`), 
      orderBy("dayNumber")
    );
  }, [firestore, tripId, user]);

  const { data: itinerary, isLoading: isItineraryLoading } = useCollection<any>(itineraryQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return collection(firestore, `trips/${tripId}/expenses`);
  }, [firestore, tripId]);

  const { data: extraExpenses } = useCollection<any>(expensesQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

  const { totalSlots, completedSlots, progressValue } = useMemo(() => {
    if (!itinerary) return { totalSlots: 0, completedSlots: 0, progressValue: 0 };
    let total = 0;
    let completed = 0;
    itinerary.forEach(day => {
      (day.slots || []).forEach((slot: any) => {
        total++;
        if (slot.completed) completed++;
      });
    });
    return {
      totalSlots: total,
      completedSlots: completed,
      progressValue: total > 0 ? (completed / total) * 100 : 0
    };
  }, [itinerary]);

  const budgetData = useMemo(() => {
    if (!itinerary || !trip) return [];
    
    const rate = CONVERSION_RATES[trip.currency] || 1;
    const categories = ["Food", "Transport", "Activities", "Stay", "Misc"];
    
    return categories.map(cat => {
      const plannedINR = itinerary.reduce((sum, day) => {
        const slotsCost = (day.slots || [])
          .filter((s: any) => (s.category || "").toLowerCase() === cat.toLowerCase())
          .reduce((sSum: number, s: any) => sSum + (s.estimatedCostINR || 0), 0);
        return sum + slotsCost;
      }, 0);

      const actual = (extraExpenses || [])
        .filter((e: any) => (e.category || "").toLowerCase() === cat.toLowerCase())
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      return {
        category: cat,
        planned: plannedINR * rate,
        actual: actual
      };
    });
  }, [itinerary, trip, extraExpenses]);

  const handleToggleSlot = (day: any, slotIdx: number) => {
    if (!firestore || !tripId) return;
    const updatedSlots = [...day.slots];
    updatedSlots[slotIdx] = { 
      ...updatedSlots[slotIdx], 
      completed: !updatedSlots[slotIdx].completed 
    };

    const dayRef = doc(firestore, `trips/${tripId}/itineraryDays`, day.id);
    updateDocumentNonBlocking(dayRef, { slots: updatedSlots });
  };

  if (isTripLoading || isItineraryLoading || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button onClick={() => router.push("/dashboard")}>Go back to Dashboard</Button>
      </div>
    );
  }

  const days = itinerary || [];
  const currentDay = days.find(d => d.dayNumber === activeDay) || days[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UserHeader showBack backHref="/dashboard" title={trip.destination} />

      {/* Global Trip Progress */}
      <div className="bg-card/40 border-b border-white/5 py-4 px-4 md:px-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <CheckCircle2 className="text-primary w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Trip Progress</span>
          </div>
          <div className="flex-1 w-full max-w-2xl relative">
            <Progress value={progressValue} className="h-3 bg-white/5" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-white shadow-sm">{Math.round(progressValue)}%</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {completedSlots} / {totalSlots} Activities Completed
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 lg:w-3/5 overflow-y-auto p-4 md:p-8 space-y-8 border-r border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((day) => (
              <Button 
                key={day.dayNumber}
                variant={activeDay === day.dayNumber ? "default" : "outline"}
                className={`flex-shrink-0 h-14 w-24 flex flex-col items-center justify-center rounded-xl border-white/10 ${
                  activeDay === day.dayNumber ? "bg-primary text-primary-foreground border-primary" : ""
                }`}
                onClick={() => setActiveDay(day.dayNumber)}
              >
                <span className="text-[10px] uppercase font-bold opacity-70">Day</span>
                <span className="text-xl font-headline font-bold">{day.dayNumber}</span>
              </Button>
            ))}
          </div>

          {currentDay && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-headline font-bold">{currentDay.theme}</h2>
                  <p className="text-muted-foreground mt-1">{new Date(currentDay.date).toDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-accent">
                    <Sun className="w-5 h-5" />
                    <span className="font-bold">{currentDay.weatherTempHigh || 24}°C</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                    <RefreshCw className="w-3 h-3 mr-1" /> Replan Day
                  </Button>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:left-[1.2rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {(currentDay.slots || []).map((slot: any, idx: number) => (
                  <div key={idx} className="relative pl-12">
                    <div className={`absolute left-3 top-2 w-4 h-4 rounded-full border-4 border-background transition-colors ${slot.completed ? "bg-primary" : "bg-white/10"}`} />
                    <Card className={`glass-card border-none transition-all hover:bg-white/5 ${slot.completed ? "opacity-60 bg-white/[0.02]" : ""}`}>
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <Checkbox 
                              checked={slot.completed} 
                              onCheckedChange={() => handleToggleSlot(currentDay, idx)}
                              className="mt-1.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> {slot.time}
                              </div>
                              <h3 className={`text-xl font-bold ${slot.completed ? "line-through text-muted-foreground" : ""}`}>{slot.activity}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{slot.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {slot.category && <Badge variant="secondary" className="text-[10px] bg-white/5 border-white/10">{slot.category}</Badge>}
                                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-white/5">
                                  <MapIcon className="w-3 h-3" /> {slot.location}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 flex-shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground uppercase block font-bold">Local Cost</span>
                              <span className="font-bold text-accent">₹{slot.estimatedCostINR}</span>
                              <span className="text-[10px] text-muted-foreground block">
                                (~{(slot.estimatedCostINR * (CONVERSION_RATES[trip.currency] || 1)).toFixed(2)} {trip.currency})
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-2/5 flex flex-col h-full bg-card/20">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <TabsList className="bg-white/5 border border-white/10 rounded-xl">
                <TabsTrigger value="map" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Map View</TabsTrigger>
                <TabsTrigger value="budget" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">BudgetSync</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="map" className="flex-1 relative mt-0">
              <TripMap locations={currentDay?.slots || []} />
            </TabsContent>

            <TabsContent value="budget" className="flex-1 p-6 space-y-6 mt-0 overflow-y-auto">
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Planned Trip Budget</h3>
                <div className="text-4xl font-headline font-bold">{trip.totalBudget} {trip.currency}</div>
                <p className="text-xs text-muted-foreground">Tracking live with VOYIQ AI</p>
              </div>

              <BudgetBreakdown data={budgetData} currency={trip.currency} />

              <Card className="glass-card border-accent/20 bg-accent/5 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-accent w-5 h-5 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold">AI Budget Insights</h4>
                    <p className="text-xs text-muted-foreground">
                      Based on current rates, you have saved approximately 12% on transportation. Consider upgrading your dinner tonight!
                    </p>
                  </div>
                </div>
              </Card>

              <Button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                Log Manual Expense
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ChatCompanion tripData={trip} />
    </div>
  );
}
