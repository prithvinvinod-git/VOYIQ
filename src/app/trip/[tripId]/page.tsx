
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
  CheckCircle2,
  ExternalLink,
  TrendingDown,
  AlertCircle,
  Loader2,
  Coins
} from "lucide-react";
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { ChatCompanion } from "@/components/chat/ChatCompanion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserHeader } from "@/components/layout/UserHeader";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { suggestBudgetAlternatives, type SuggestBudgetAlternativesOutput } from "@/ai/flows/suggest-budget-alternatives-flow";
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
  const [aiSuggestions, setAiSuggestions] = useState<SuggestBudgetAlternativesOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
      const plannedLocal = itinerary.reduce((sum, day) => {
        const slotsCost = (day.slots || [])
          .filter((s: any) => (s.category || "").toLowerCase() === cat.toLowerCase())
          .reduce((sSum: number, s: any) => sSum + (s.estimatedCostINR || 0), 0);
        return sum + slotsCost;
      }, 0) * rate;

      const actual = (extraExpenses || [])
        .filter((e: any) => (e.category || "").toLowerCase() === cat.toLowerCase())
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      return {
        category: cat,
        planned: plannedLocal,
        actual: actual
      };
    });
  }, [itinerary, trip, extraExpenses]);

  const overBudgetInfo = useMemo(() => {
    const over = budgetData.filter(d => d.actual > d.planned);
    if (over.length === 0) return null;
    return over.sort((a, b) => (b.actual - b.planned) - (a.actual - a.planned))[0];
  }, [budgetData]);

  const fetchAiSuggestions = async () => {
    if (!overBudgetInfo || !trip) return;
    setIsAiLoading(true);
    try {
      const result = await suggestBudgetAlternatives({
        tripContext: {
          destination: trip.destination,
          travelStyle: trip.travelStyle || [],
          pace: trip.pace || "Balanced",
          dietPref: trip.dietaryPreferences?.[0] || "No preference",
          numTravelers: trip.numTravelers || 1
        },
        overBudgetCategory: overBudgetInfo.category,
        budgetLimit: overBudgetInfo.planned,
        amountSpent: overBudgetInfo.actual,
        currency: trip.currency
      });
      setAiSuggestions(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleSlot = (day: any, slotIdx: number) => {
    if (!firestore || !tripId || !itinerary) return;
    
    const updatedSlots = [...day.slots];
    const newStatus = !updatedSlots[slotIdx].completed;
    updatedSlots[slotIdx] = { 
      ...updatedSlots[slotIdx], 
      completed: newStatus 
    };

    const dayRef = doc(firestore, `trips/${tripId}/itineraryDays`, day.id);
    updateDocumentNonBlocking(dayRef, { slots: updatedSlots });

    let total = 0;
    let completed = 0;
    itinerary.forEach(d => {
      const currentSlots = d.id === day.id ? updatedSlots : (d.slots || []);
      currentSlots.forEach((s: any) => {
        total++;
        if (s.completed) completed++;
      });
    });

    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const tripDocRef = doc(firestore, "trips", tripId as string);
    updateDocumentNonBlocking(tripDocRef, { health: newProgress });
  };

  const openInGoogleMaps = () => {
    if (!currentDay || !currentDay.slots || currentDay.slots.length === 0) return;
    
    const slots = currentDay.slots;
    const origin = `${slots[0].lat},${slots[0].lng}`;
    const destination = `${slots[slots.length - 1].lat},${slots[slots.length - 1].lng}`;
    
    let waypoints = "";
    if (slots.length > 2) {
      waypoints = slots.slice(1, -1)
        .map((s: any) => `${s.lat},${s.lng}`)
        .join("|");
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=driving`;
    window.open(url, '_blank');
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
                <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Insights</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="map" className="flex-1 relative mt-0 flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <Button onClick={openInGoogleMaps} variant="secondary" className="bg-white text-black hover:bg-white/90 shadow-xl rounded-full gap-2">
                  <ExternalLink className="w-4 h-4" /> Navigate Route
                </Button>
              </div>
              <TripMap locations={currentDay?.slots || []} />
            </TabsContent>

            <TabsContent value="budget" className="flex-1 p-6 space-y-6 mt-0 overflow-y-auto">
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Trip Budget</h3>
                <div className="text-4xl font-headline font-bold">{trip.totalBudget} {trip.currency}</div>
                <p className="text-xs text-muted-foreground">Tracking live with VOYIQ AI</p>
              </div>

              <BudgetBreakdown data={budgetData} currency={trip.currency} />

              <Card className={`glass-card p-4 rounded-xl border-none ${overBudgetInfo ? "bg-destructive/10 border-destructive/20" : "bg-accent/5 border-accent/20"}`}>
                <div className="flex items-start gap-3">
                  {overBudgetInfo ? <AlertCircle className="text-destructive w-5 h-5 flex-shrink-0 mt-1" /> : <Sparkles className="text-accent w-5 h-5 flex-shrink-0 mt-1" />}
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold">
                      {overBudgetInfo ? `Attention: Over budget in ${overBudgetInfo.category}` : "AI Budget Insights"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {overBudgetInfo 
                        ? `You've spent ${overBudgetInfo.actual.toFixed(2)} ${trip.currency} in ${overBudgetInfo.category}, exceeding planned ${overBudgetInfo.planned.toFixed(2)} ${trip.currency}.` 
                        : "Your spending is currently within the healthy range. Great job maintaining your budget!"}
                    </p>
                    {overBudgetInfo && (
                      <Button variant="link" onClick={() => setActiveDay(1)} className="p-0 h-auto text-xs text-primary">
                        View AI Suggestions
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              <Button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                Log Manual Expense
              </Button>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 p-6 space-y-6 mt-0 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                    <Sparkles className="text-primary w-5 h-5" /> AI Budget Optimizer
                  </h3>
                  {overBudgetInfo && (
                    <Button 
                      size="sm" 
                      onClick={fetchAiSuggestions} 
                      disabled={isAiLoading}
                      className="bg-primary text-primary-foreground rounded-full"
                    >
                      {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh Suggestions"}
                    </Button>
                  )}
                </div>

                {!overBudgetInfo ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <TrendingDown className="text-primary w-8 h-8" />
                    </div>
                    <p className="text-muted-foreground font-medium">All categories are within budget!</p>
                    <p className="text-xs text-muted-foreground">We'll provide suggestions if you start trending over budget.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!aiSuggestions && !isAiLoading && (
                      <div className="glass-card p-10 text-center rounded-2xl border-dashed border-white/10">
                        <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-bold mb-2">Optimize your {overBudgetInfo.category} spending</h4>
                        <p className="text-xs text-muted-foreground mb-6">Let our AI find cheaper alternatives tailored to your destination.</p>
                        <Button onClick={fetchAiSuggestions} className="bg-primary text-primary-foreground">
                          Get AI Suggestions
                        </Button>
                      </div>
                    )}

                    {isAiLoading && (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                      </div>
                    )}

                    {aiSuggestions?.alternatives.map((alt, i) => (
                      <Card key={i} className="glass-card border-none bg-gradient-to-br from-white/5 to-primary/5 hover:bg-white/10 transition-all p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-bold">
                              {alt.category}
                            </Badge>
                            <span className="text-xs font-bold text-accent">Save ~{alt.estimatedSavings} {trip.currency}</span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed">{alt.suggestion}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ChatCompanion tripData={trip} />
    </div>
  );
}
