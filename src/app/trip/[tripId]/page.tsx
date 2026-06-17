
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  Plus,
  Plane,
  Navigation,
  Brain,
  TrendingDown,
  AlertTriangle,
  Wallet,
  Languages,
  ChevronLeft,
  MapPin,
  Scan,
  Lock,
} from "lucide-react";
import {
  useDoc,
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
} from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { ChatCompanion } from "@/components/chat/ChatCompanion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserHeader } from "@/components/layout/UserHeader";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuggestBudgetAlternativesOutput } from "@/ai/flows/suggest-budget-alternatives-flow";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";

const TripMap = dynamic(() => import("@/components/trip/TripMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center rounded-2xl"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <MapPin className="text-muted-foreground w-8 h-8 opacity-20 animate-pulse" />
    </div>
  ),
});

const CATEGORIES = ["Food", "Transport", "Stay", "Activities", "Misc"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Food: { bg: "rgba(0,212,184,0.1)", text: "#00D4B8", border: "rgba(0,212,184,0.2)" },
  Transport: { bg: "rgba(123,97,255,0.1)", text: "#a78bfa", border: "rgba(123,97,255,0.2)" },
  Stay: { bg: "rgba(245,166,35,0.1)", text: "#F5A623", border: "rgba(245,166,35,0.2)" },
  Activities: { bg: "rgba(56,189,248,0.1)", text: "#38bdf8", border: "rgba(56,189,248,0.2)" },
  Misc: { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
};

export default function TripDetail() {
  const { tripId } = useParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [activeDay, setActiveDay] = useState(1);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestBudgetAlternativesOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Misc");
  const [expenseNote, setExpenseNote] = useState("");

  useEffect(() => {
    if (!isUserLoading && !user) { router.push("/auth"); }
  }, [user, isUserLoading, router]);

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return doc(firestore, "trips", tripId as string);
  }, [firestore, tripId, user]);

  const { data: trip, isLoading: isTripLoading, error: tripError } = useDoc<any>(tripRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);
  const isPremium = userData?.isPremium || false;

  const itineraryQuery = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return query(collection(firestore, `trips/${tripId}/itineraryDays`), orderBy("dayNumber"));
  }, [firestore, tripId, user]);

  const { data: itinerary, isLoading: isItineraryLoading } = useCollection<any>(itineraryQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return collection(firestore, `trips/${tripId}/expenses`);
  }, [firestore, tripId, user]);

  const { data: extraExpenses } = useCollection<any>(expensesQuery);

  const currentDay = useMemo(
    () => itinerary?.find((d) => d.dayNumber === activeDay) || itinerary?.[0],
    [itinerary, activeDay]
  );

  const budgetStats = useMemo(() => {
    const stats: Record<string, { planned: number; actual: number }> = {
      Food: { planned: 0, actual: 0 },
      Transport: { planned: 0, actual: 0 },
      Stay: { planned: 0, actual: 0 },
      Activities: { planned: 0, actual: 0 },
      Misc: { planned: 0, actual: 0 },
    };
    (currentDay?.slots || []).forEach((slot: any) => {
      const cat = slot.category || "Misc";
      const key = CATEGORIES.includes(cat) ? cat : "Misc";
      stats[key].planned += slot.estimatedCostINR || 0;
    });
    extraExpenses?.forEach((exp) => {
      const cat = exp.category || "Misc";
      const key = CATEGORIES.includes(cat) ? cat : "Misc";
      stats[key].actual += exp.amount || 0;
    });
    return Object.entries(stats).map(([category, values]) => ({ category, ...values }));
  }, [currentDay, extraExpenses]);

  const budgetProgress = useMemo(() => {
    if (!trip) return { total: 0, spent: 0, remaining: 0, percent: 0 };
    const totalSpent = extraExpenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    const remaining = Math.max(0, trip.totalBudget - totalSpent);
    const percent = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;
    return { total: trip.totalBudget, spent: totalSpent, remaining, percent };
  }, [trip, extraExpenses]);

  const { progressValue } = useMemo(() => {
    if (!itinerary) return { progressValue: 0 };
    let total = 0;
    let completed = 0;
    itinerary.forEach((day) => {
      (day.slots || []).forEach((slot: any) => { total++; if (slot.completed) completed++; });
    });
    return { progressValue: total > 0 ? (completed / total) * 100 : 0 };
  }, [itinerary]);

  const handleToggleSlot = (day: any, slotIdx: number) => {
    if (!firestore || !tripId) return;
    const updatedSlots = [...day.slots];
    updatedSlots[slotIdx] = { ...updatedSlots[slotIdx], completed: !updatedSlots[slotIdx].completed };
    updateDocumentNonBlocking(doc(firestore, `trips/${tripId}/itineraryDays`, day.id), { slots: updatedSlots });
    setTimeout(() => {
      let globalCompleted = 0;
      let globalTotal = 0;
      itinerary?.forEach((d) => {
        const slots = d.id === day.id ? updatedSlots : d.slots;
        slots.forEach((s: any) => { globalTotal++; if (s.completed) globalCompleted++; });
      });
      const health = globalTotal > 0 ? (globalCompleted / globalTotal) * 100 : 0;
      updateDocumentNonBlocking(doc(firestore, "trips", tripId as string), { health, totalCompletedSlots: globalCompleted });
    }, 500);
  };

  const handleLogExpense = () => {
    if (!firestore || !tripId || !user || !expenseAmount) return;
    const expData = { tripId, amount: parseFloat(expenseAmount), category: expenseCategory, note: expenseNote, loggedByUserId: user.uid, loggedAt: new Date().toISOString() };
    addDocumentNonBlocking(collection(firestore, `trips/${tripId}/expenses`), expData);
    setExpenseAmount("");
    setExpenseNote("");
    setIsExpenseDialogOpen(false);
    toast({ title: "Expense logged!", description: `Added ${expenseAmount} to ${expenseCategory}.` });
  };

  const handleNavigateAll = () => {
    if (!trip || !currentDay?.slots?.length) return;
    const slots = currentDay.slots;
    const origin = encodeURIComponent(slots[0].location);
    if (slots.length === 1) { window.open(`https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${origin}&travelmode=driving`, "_blank"); return; }
    const waypoints = slots.slice(1, -1).map((s: any) => encodeURIComponent(s.location)).filter(Boolean);
    const destination = encodeURIComponent(slots[slots.length - 1].location);
    const waypointQuery = waypoints.length > 0 ? `&waypoints=${waypoints.join("|")}` : "";
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointQuery}&travelmode=driving`, "_blank");
  };

  const handleLaunchAR = () => {
    if (!isPremium) { setIsPlanDialogOpen(true); }
    else { router.push(`/ar/${tripId}`); }
  };

  const handleBookFlight = () => {
    if (!trip) return;
    const tripStart = new Date(trip.startDate);
    const flightStart = new Date(tripStart);
    flightStart.setDate(flightStart.getDate() - 1);
    const flightStartStr = flightStart.toISOString().split("T")[0];
    const origin = encodeURIComponent(trip.origin || "");
    const destination = encodeURIComponent(trip.destination || "");
    window.open(`https://www.google.com/travel/flights?q=Flights from ${origin} to ${destination} on ${flightStartStr} returning ${trip.endDate} for ${trip.numTravelers} adults`, "_blank");
  };

  if (isUserLoading || (isTripLoading && !trip)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div
          className="w-14 h-14 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "hsl(172 100% 42%)", borderRightColor: "rgba(0,212,184,0.15)" }}
        />
        <p className="text-muted-foreground font-headline text-sm animate-pulse-subtle">Syncing with your Travel Brain...</p>
      </div>
    );
  }

  if (tripError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle className="text-destructive w-10 h-10" />
        </div>
        <h1 className="text-3xl font-headline font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md mb-8">You might not have permission to view this journey.</p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="btn-shimmer h-12 px-8 rounded-2xl font-bold"
          style={{ background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))" }}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UserHeader showBack backHref="/dashboard" title={trip?.destination || "Journey"} />

      {/* Progress bar strip */}
      <div
        className="px-4 sm:px-8 py-4 flex flex-col md:flex-row items-center gap-4"
        style={{
          background: "rgba(10,14,30,0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="text-primary w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Itinerary Progress</span>
        </div>

        <div className="flex-1 w-full max-w-xl relative">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressValue}%`,
                background: "linear-gradient(90deg, hsl(172 100% 42%), #00fff2)",
                boxShadow: "0 0 10px rgba(0,212,184,0.6)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary">{Math.round(progressValue)}%</span>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2 h-9 font-bold text-xs"
            style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}
            onClick={handleBookFlight}
          >
            <Plane className="w-3.5 h-3.5" /> Book Flights
          </Button>
          <Button
            size="sm"
            className="rounded-xl gap-2 h-9 font-bold text-xs"
            style={{ background: "rgba(0,212,184,0.12)", border: "1px solid rgba(0,212,184,0.2)", color: "#00D4B8" }}
            onClick={handleLaunchAR}
          >
            <Scan className="w-3.5 h-3.5" /> AR HUD
          </Button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: itinerary */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 border-r scrollbar-hide" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {/* Day selector */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {itinerary?.map((day) => {
              const isActive = activeDay === day.dayNumber;
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 font-bold"
                  style={
                    isActive
                      ? {
                          background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))",
                          boxShadow: "0 0 24px rgba(0,212,184,0.4)",
                          transform: "scale(1.05)",
                        }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }
                  }
                >
                  <span className="text-[9px] uppercase font-bold opacity-70">Day</span>
                  <span className="text-lg font-extrabold leading-none">{day.dayNumber}</span>
                </button>
              );
            })}
          </div>

          {/* Day header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-headline font-bold">
              {currentDay?.theme || `Day ${activeDay}`}
            </h2>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full w-fit"
              style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}
            >
              <Sun className="w-4 h-4 text-accent" />
              <span className="font-bold text-accent text-sm">{currentDay?.weatherTempHigh || 24}°C</span>
            </div>
          </div>

          {/* Activity cards */}
          <div className="grid grid-cols-1 gap-4">
            {isItineraryLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-3xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            )}

            {(currentDay?.slots || []).map((slot: any, idx: number) => {
              const catColor = CATEGORY_COLORS[slot.category] || CATEGORY_COLORS.Misc;
              return (
                <div
                  key={idx}
                  className={`rounded-3xl overflow-hidden transition-all duration-300 ${slot.completed ? "opacity-40" : "hover:scale-[1.01]"}`}
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,14,30,0.7) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: slot.completed ? "none" : "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Category accent bar */}
                  <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${catColor.text}, transparent)` }} />

                  <div className="p-5 flex items-start gap-4">
                    <Checkbox
                      checked={slot.completed}
                      onCheckedChange={() => handleToggleSlot(currentDay, idx)}
                      className="mt-1 border-primary/50"
                    />
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div
                          className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-widest"
                          style={{ color: "hsl(172 100% 42%)" }}
                        >
                          <Clock className="w-3 h-3" /> {slot.time}
                        </div>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: "hsl(37 91% 55%)" }}>
                          ₹{slot.estimatedCostINR}
                        </span>
                      </div>

                      <h4 className={`text-base font-bold leading-tight ${slot.completed ? "line-through text-muted-foreground" : "text-white"}`}>
                        {slot.activity}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{slot.description}</p>

                      {slot.localPhrases?.length > 0 && (
                        <div
                          className="rounded-2xl p-4 mt-2 space-y-3"
                          style={{ background: "rgba(0,212,184,0.05)", border: "1px solid rgba(0,212,184,0.1)" }}
                        >
                          <div className="flex items-center gap-2">
                            <Languages className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Local Assist</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {slot.localPhrases.map((phrase: any, i: number) => (
                              <div key={i} className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold italic text-accent">&ldquo;{phrase.phrase}&rdquo;</span>
                                <span className="text-[10px] text-muted-foreground">{phrase.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <span
                          className="text-[10px] font-bold px-3 py-1 rounded-full"
                          style={{ background: catColor.bg, border: `1px solid ${catColor.border}`, color: catColor.text }}
                        >
                          {slot.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {slot.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Map / Budget / AI */}
        <div
          className="lg:w-2/5 flex flex-col min-h-[500px] lg:min-h-0"
          style={{ background: "rgba(10,14,30,0.4)" }}
        >
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <TabsList
              className="m-4 p-1.5 rounded-2xl shrink-0 grid grid-cols-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <TabsTrigger value="map" className="rounded-xl py-2.5 font-bold text-xs">Explore Map</TabsTrigger>
              <TabsTrigger value="budget" className="rounded-xl py-2.5 font-bold text-xs">BudgetSync</TabsTrigger>
              <TabsTrigger value="ai" className="rounded-xl py-2.5 font-bold text-xs">Optimizer</TabsTrigger>
            </TabsList>

            {/* Map tab */}
            <TabsContent value="map" className="flex-1 mt-0 relative mx-4 mb-4 rounded-2xl overflow-hidden">
              <div className="absolute top-3 right-3 z-10">
                <Button
                  size="sm"
                  className="rounded-xl font-bold text-xs shadow-2xl gap-2"
                  style={{ background: "white", color: "black" }}
                  onClick={handleNavigateAll}
                >
                  <Navigation className="w-3.5 h-3.5" /> Navigate Day
                </Button>
              </div>
              <TripMap locations={currentDay?.slots || []} />
            </TabsContent>

            {/* Budget tab */}
            <TabsContent value="budget" className="flex-1 mt-0 p-4 overflow-y-auto space-y-5 scrollbar-hide">
              <BudgetBreakdown data={budgetStats} currency={trip?.currency || "USD"} />

              <div
                className="p-5 rounded-3xl"
                style={{
                  background: "linear-gradient(135deg, rgba(0,212,184,0.08) 0%, rgba(15,20,40,0.7) 100%)",
                  border: "1px solid rgba(0,212,184,0.15)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(0,212,184,0.15)", border: "1px solid rgba(0,212,184,0.2)" }}
                    >
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block">Left to Spend</span>
                      <span className="text-xl font-bold text-white">{trip?.currency} {budgetProgress.remaining.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${budgetProgress.percent}%`,
                      background: budgetProgress.percent > 80
                        ? "linear-gradient(90deg, #F5A623, #ef4444)"
                        : "linear-gradient(90deg, hsl(172 100% 42%), #00fff2)",
                      boxShadow: "0 0 8px rgba(0,212,184,0.4)",
                    }}
                  />
                </div>
                <p className="text-[9px] text-right text-muted-foreground font-bold mt-2">{Math.round(budgetProgress.percent)}% OF TOTAL BUDGET</p>
              </div>

              <Button
                className="w-full h-14 rounded-2xl font-bold"
                variant="outline"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                onClick={() => setIsExpenseDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" /> Log Actual Expense
              </Button>
            </TabsContent>

            {/* AI tab */}
            <TabsContent value="ai" className="flex-1 mt-0 p-4 overflow-y-auto scrollbar-hide">
              <div className="space-y-6">
                <div
                  className="flex items-center gap-4 p-5 rounded-3xl"
                  style={{ background: "rgba(0,212,184,0.08)", border: "1px solid rgba(0,212,184,0.15)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(0,212,184,0.15)", border: "1px solid rgba(0,212,184,0.2)" }}
                  >
                    <Brain className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-bold">AI Optimizer</h3>
                    <p className="text-xs text-muted-foreground">Smart suggestions to balance your spend.</p>
                  </div>
                </div>

                {aiSuggestions ? (
                  <div className="space-y-3 animate-fade-in">
                    {aiSuggestions.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-3xl"
                        style={{ background: "rgba(0,212,184,0.05)", border: "1px solid rgba(0,212,184,0.12)" }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-[10px] font-bold px-3 py-1 rounded-full"
                            style={{ background: "rgba(0,212,184,0.12)", color: "#00D4B8", border: "1px solid rgba(0,212,184,0.2)" }}
                          >
                            {alt.category}
                          </span>
                          <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: "#F5A623" }}>
                            <TrendingDown className="w-4 h-4" />
                            Save ~{trip?.currency} {alt.estimatedSavings}
                          </div>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-white/80">{alt.suggestion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="py-16 text-center rounded-3xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
                  >
                    <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 opacity-20 animate-pulse" />
                    <p className="text-sm text-muted-foreground px-8 leading-relaxed">
                      AI will suggest cheaper alternatives here if you exceed category budgets.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Expense dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent
          className="max-w-md rounded-3xl"
          style={{
            background: "rgba(10,14,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">Log New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Amount ({trip?.currency})</Label>
              <Input
                type="number"
                placeholder="0.00"
                className="h-14 rounded-2xl text-lg font-bold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Category</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="h-14 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="rounded-2xl"
                  style={{ background: "rgba(10,14,30,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Note (Optional)</Label>
              <Input
                placeholder="What was this for?"
                className="h-14 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="rounded-2xl h-12" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
            <Button
              className="btn-shimmer h-12 rounded-2xl px-8 font-bold"
              style={{ background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", boxShadow: "0 0 20px rgba(0,212,184,0.3)" }}
              onClick={handleLogExpense}
            >
              Record Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlanSelectionDialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen} onSelectFree={() => setIsPlanDialogOpen(false)} />
      <ChatCompanion tripData={trip} />
    </div>
  );
}
