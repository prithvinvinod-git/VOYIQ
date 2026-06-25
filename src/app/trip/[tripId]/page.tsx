"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sun,
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
  ChevronLeft,
  MapPin,
  Scan,
  ArrowLeft,
  Gauge,
  Calendar,
  Clock,
  DollarSign,
  ChevronRight,
  Star,
  Map,
  CreditCard,
  BarChart3,
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
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { ItineraryTimeline, DaySelector } from "@/components/trip/ItineraryTimeline";
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
import { suggestBudgetAlternatives, SuggestBudgetAlternativesOutput } from "@/ai/flows/suggest-budget-alternatives-flow";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { AppNavbar } from "@/components/layout/AppNavbar";

const TripMap = dynamic(() => import("@/components/trip/TripMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center rounded-2xl bg-white/5">
      <MapPin className="text-white/20 w-8 h-8 animate-pulse" />
    </div>
  ),
});

const CATEGORIES = ["Food", "Transport", "Stay", "Activities", "Misc"];

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

  const handleToggleSlot = (slotIdx: number) => {
    if (!firestore || !tripId || !currentDay) return;
    const updatedSlots = [...currentDay.slots];
    updatedSlots[slotIdx] = { ...updatedSlots[slotIdx], completed: !updatedSlots[slotIdx].completed };
    updateDocumentNonBlocking(doc(firestore, `trips/${tripId}/itineraryDays`, currentDay.id), { slots: updatedSlots });
    setTimeout(() => {
      let globalCompleted = 0;
      let globalTotal = 0;
      itinerary?.forEach((d) => {
        const slots = d.id === currentDay.id ? updatedSlots : d.slots;
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
    if (!isPremium) { setIsPlanDialogOpen(true); return; }

    const slots = currentDay?.slots || [];
    const validSlots = slots.filter((s: any) => s.lat && s.lng);

    if (validSlots.length === 0) {
      // No coordinates — fall back to a destination search
      const query = encodeURIComponent(trip?.destination || "");
      window.open(`https://www.google.com/maps/search/${query}`, "_blank");
      return;
    }

    if (validSlots.length === 1) {
      // Single location — open it directly
      const { lat, lng, activity } = validSlots[0];
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(activity)}`,
        "_blank"
      );
      return;
    }

    // Multiple locations → build a full directions URL
    // origin = first stop, destination = last stop, waypoints = everything in between
    const origin = `${validSlots[0].lat},${validSlots[0].lng}`;
    const destination = `${validSlots[validSlots.length - 1].lat},${validSlots[validSlots.length - 1].lng}`;
    const waypoints = validSlots
      .slice(1, -1)
      .map((s: any) => `${s.lat},${s.lng}`)
      .join("|");

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : "") +
      `&travelmode=walking`;

    window.open(url, "_blank");
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

  const handleRunOptimizer = async () => {
    if (!user || !trip) return;
    const overBudget = budgetStats.find(stat => stat.actual > stat.planned);
    if (!overBudget) {
      toast({ title: "All Good!", description: "Your actual spending is within the planned budget for all categories." });
      return;
    }
    setIsAiLoading(true);
    try {
      const idToken = await user.getIdToken();
      const response = await suggestBudgetAlternatives({
        idToken,
        tripId: tripId as string,
        tripContext: {
          destination: trip.destination,
          travelStyle: trip.travelStyle || [],
          pace: trip.pace || "Balanced",
          dietPref: trip.dietaryPreferences?.[0] || "No preference",
          numTravelers: trip.numTravelers || 1,
        },
        overBudgetCategory: overBudget.category,
        budgetLimit: overBudget.planned,
        amountSpent: overBudget.actual,
        currency: trip.currency || "USD",
      });
      setAiSuggestions(response);
      toast({ title: "Optimizer finished!", description: "AI has generated saving suggestions." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Optimization failed", description: e.message || "Something went wrong." });
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isUserLoading || (isTripLoading && !trip)) {
    return (
      <div className="min-h-screen bg-[#111415] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 animate-spin border-blue-500/15 border-t-blue-500" />
        <p className="text-white/50 font-headline text-sm">Syncing with your Travel Brain...</p>
      </div>
    );
  }

  if (tripError) {
    return (
      <div className="min-h-screen bg-[#111415] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="text-red-400 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-white/50 max-w-md mb-8">You might not have permission to view this journey.</p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="h-12 px-8 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111415] text-white relative overflow-x-hidden">
      {/* Hero video background — same as dashboard */}
      <div className="absolute top-0 left-0 w-full h-[55vh] overflow-hidden pointer-events-none z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover object-top opacity-30">
          <source src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              transparent 0%,
              transparent 25%,
              rgba(17,20,21,0.08) 40%,
              rgba(17,20,21,0.2) 55%,
              rgba(17,20,21,0.5) 70%,
              rgba(17,20,21,0.75) 82%,
              #111415 92%,
              #111415 100%
            )`,
          }}
        />
      </div>

      <AppNavbar />

      {/* Trip Hero */}
      <div className="relative pt-28 pb-6 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="glass-panel rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  {trip?.destination || "Loading..."}
                </span>
                <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
                  (trip?.health || 0) > 80
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}>
                  {(trip?.health || 0).toFixed(0)}% Refined
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-white">
                {trip?.destination || "Your Journey"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  {trip?.startDate ? new Date(trip.startDate).toLocaleDateString() : ""} - {trip?.endDate ? new Date(trip.endDate).toLocaleDateString() : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-violet-400" />
                  {trip?.totalBudget} {trip?.currency}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 h-9 text-xs font-semibold bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={handleBookFlight}
              >
                <Plane className="w-3.5 h-3.5" /> Flights
              </Button>
              <Button
                size="sm"
                className="rounded-xl gap-1.5 h-9 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleLaunchAR}
              >
                <Scan className="w-3.5 h-3.5" /> AR HUD
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar strip */}
      <div className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto mb-6">
        <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Gauge className="text-blue-400 w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Itinerary Progress</span>
          </div>
          <div className="flex-1 w-full">
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-bold tabular-nums text-blue-400">{Math.round(progressValue)}%</span>
        </div>
      </div>

      {/* Main content: two columns */}
      <div className="px-4 md:px-8 lg:px-12 max-w-7xl mx-auto pb-20 flex flex-col lg:flex-row gap-6">
        {/* Left: Itinerary */}
        <div className="flex-1 min-w-0">
          {/* Day selector */}
          {itinerary && (
            <div className="glass-panel rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {itinerary.map((d: any) => (
                  <button
                    key={d.dayNumber}
                    onClick={() => setActiveDay(d.dayNumber)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                      activeDay === d.dayNumber
                        ? "bg-blue-500 text-white"
                        : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Day {d.dayNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day header */}
          <div className="glass-panel rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-headline font-bold text-white">
                  {currentDay?.theme || `Day ${activeDay}`}
                </h2>
                {currentDay?.subtitle && (
                  <p className="text-sm text-white/40 mt-1">{currentDay.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Sun className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-semibold text-orange-400 text-sm">{currentDay?.weatherTempHigh || 24}°C</span>
              </div>
            </div>
          </div>

          {/* Itinerary timeline */}
          {isItineraryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl animate-pulse bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(currentDay?.slots || []).map((slot: any, idx: number) => (
                <div
                  key={idx}
                  className={`glass-panel rounded-2xl p-5 transition-all duration-300 ${
                    slot.completed ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleSlot(idx)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-200 ${
                        slot.completed
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white/5 border-white/20 hover:border-blue-400"
                      }`}
                    >
                      {slot.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold text-blue-400 block mb-1">
                            {slot.time}
                          </span>
                          <h4 className={`text-sm font-bold ${slot.completed ? "text-white/50 line-through" : "text-white"}`}>
                            {slot.activity}
                          </h4>
                        </div>
                        {slot.estimatedCostINR && (
                          <span className="text-[11px] font-medium text-white/30 whitespace-nowrap">
                            {trip?.currency} {slot.estimatedCostINR}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">{slot.description}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] text-white/30">{slot.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!currentDay?.slots || currentDay.slots.length === 0) && (
                <div className="glass-panel rounded-2xl py-12 text-center">
                  <p className="text-sm text-white/30">No activities planned for this day yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Map / Budget / AI */}
        <div className="lg:w-[380px] xl:w-[420px] flex flex-col gap-6">
          {/* Explore Map */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Explore Map</span>
              </div>
              <Button
                size="sm"
                className="rounded-xl h-8 text-[10px] font-bold gap-1.5 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleNavigateAll}
              >
                <Navigation className="w-3 h-3" /> Navigate Day
              </Button>
            </div>
            <div className="h-[300px]">
              <TripMap locations={currentDay?.slots || []} />
            </div>
          </div>

          {/* BudgetSync */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-widest">BudgetSync</span>
            </div>
            <BudgetBreakdown data={budgetStats} currency={trip?.currency || "USD"} />
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Left to Spend</span>
                <span className="text-lg font-bold text-white tabular-nums">{trip?.currency} {budgetProgress.remaining.toFixed(0)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 transition-all duration-500"
                  style={{ width: `${budgetProgress.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-right text-white/30 font-bold mt-2 tabular-nums">{Math.round(budgetProgress.percent)}% OF TOTAL BUDGET</p>
            </div>
            <Button
              className="w-full h-11 rounded-xl font-semibold text-xs mt-4 bg-white/5 border border-white/10 text-white hover:bg-white/10"
              variant="outline"
              onClick={() => setIsExpenseDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Log Actual Expense
            </Button>
          </div>

          {/* AI Optimizer */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                <Brain className="text-blue-400 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-headline font-bold text-white">AI Optimizer</h3>
                <p className="text-[11px] text-white/40">Smart suggestions to balance your spend.</p>
              </div>
            </div>

            {isAiLoading ? (
              <div className="py-10 text-center rounded-xl bg-white/5">
                <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
                <p className="text-xs text-white/40">Running budget optimization analysis...</p>
              </div>
            ) : aiSuggestions ? (
              <div className="space-y-3">
                {aiSuggestions.alternatives.map((alt, i) => (
                  <div key={i} className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {alt.category}
                      </span>
                      <div className="flex items-center gap-1 font-bold text-xs text-emerald-400">
                        <TrendingDown className="w-3 h-3" />
                        Save ~{trip?.currency} {alt.estimatedSavings}
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{alt.suggestion}</p>
                  </div>
                ))}
                <Button
                  onClick={handleRunOptimizer}
                  className="w-full h-10 rounded-xl text-xs font-semibold gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Recalculate Suggestions
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center rounded-xl bg-white/5 space-y-3">
                {budgetStats.some(stat => stat.actual > stat.planned) ? (
                  <>
                    <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto opacity-70" />
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">Category Budgets Exceeded</p>
                      <p className="text-[11px] text-white/40 px-4">Get AI tips to balance your spending.</p>
                    </div>
                    <Button
                      onClick={handleRunOptimizer}
                      className="h-9 px-5 rounded-xl text-xs font-semibold gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Brain className="w-3.5 h-3.5" /> Run Budget Optimizer
                    </Button>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto opacity-70" />
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">Budget is On Track</p>
                      <p className="text-[11px] text-white/40 px-4">Your spending is within the planned budget.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Expense dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-[#1d2021] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-bold text-white">Log New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-amount" className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                Amount ({trip?.currency})
              </Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                className="h-12 rounded-xl text-lg font-bold bg-white/5 border-white/10 text-white"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category" className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                Category
              </Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger id="expense-category" className="h-12 rounded-xl bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-[#1d2021] border-white/10">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-note" className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                Note (Optional)
              </Label>
              <Input
                id="expense-note"
                placeholder="What was this for?"
                className="h-12 rounded-xl bg-white/5 border-white/10 text-white"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="rounded-xl h-11 text-white/60 hover:text-white" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
            <Button
              className="h-11 rounded-xl px-8 font-semibold bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleLogExpense}
              disabled={!expenseAmount}
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
