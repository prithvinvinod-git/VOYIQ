
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
  AlertCircle,
  Loader2,
  Plus,
  Plane,
  Navigation
} from "lucide-react";
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { suggestBudgetAlternatives, type SuggestBudgetAlternativesOutput } from "@/ai/flows/suggest-budget-alternatives-flow";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";

const TripMap = dynamic(() => import("@/components/trip/TripMap"), { ssr: false });

const CONVERSION_RATES: Record<string, number> = {
  "USD": 1 / 83,
  "EUR": 1 / 88,
  "GBP": 1 / 105,
  "INR": 1,
};

export default function TripDetail() {
  const { tripId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [activeDay, setActiveDay] = useState(1);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestBudgetAlternativesOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Misc");
  const [expenseNote, setExpenseNote] = useState("");

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return doc(firestore, "trips", tripId as string);
  }, [firestore, tripId]);

  const { data: trip, isLoading: isTripLoading } = useDoc<any>(tripRef);

  const itineraryQuery = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return query(collection(firestore, `trips/${tripId}/itineraryDays`), orderBy("dayNumber"));
  }, [firestore, tripId]);

  const { data: itinerary, isLoading: isItineraryLoading } = useCollection<any>(itineraryQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return collection(firestore, `trips/${tripId}/expenses`);
  }, [firestore, tripId]);

  const { data: extraExpenses } = useCollection<any>(expensesQuery);

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

  const handleToggleSlot = (day: any, slotIdx: number) => {
    if (!firestore || !tripId) return;
    const updatedSlots = [...day.slots];
    updatedSlots[slotIdx] = { ...updatedSlots[slotIdx], completed: !updatedSlots[slotIdx].completed };
    updateDocumentNonBlocking(doc(firestore, `trips/${tripId}/itineraryDays`, day.id), { slots: updatedSlots });

    // Recalculate global trip progress and completed count for XP
    setTimeout(() => {
      let globalCompleted = 0;
      let globalTotal = 0;
      itinerary?.forEach(d => {
        const slots = d.id === day.id ? updatedSlots : d.slots;
        slots.forEach((s: any) => {
          globalTotal++;
          if (s.completed) globalCompleted++;
        });
      });
      const health = globalTotal > 0 ? (globalCompleted / globalTotal) * 100 : 0;
      updateDocumentNonBlocking(doc(firestore, "trips", tripId as string), { 
        health, 
        totalCompletedSlots: globalCompleted 
      });
    }, 500);
  };

  const bookingUrl = useMemo(() => {
    if (!trip) return "";
    return `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(trip.destination)}%20from%20${encodeURIComponent(trip.origin || "")}%20on%20${trip.startDate}`;
  }, [trip]);

  if (isTripLoading || isItineraryLoading || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) return null;

  const days = itinerary || [];
  const currentDay = days.find(d => d.dayNumber === activeDay) || days[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UserHeader showBack backHref="/dashboard" title={trip.destination} />

      <div className="bg-card/40 border-b border-white/5 py-4 px-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-primary w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Trip Progress</span>
        </div>
        <Progress value={progressValue} className="h-2 flex-1 max-w-xl" />
        <span className="text-xs font-bold">{Math.round(progressValue)}%</span>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 border-r border-white/5">
          {/* Flight Suggestion Card */}
          {trip.origin && (
            <Card className="glass-card border-none bg-gradient-to-r from-primary/10 to-accent/5 p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Plane className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Travel from {trip.origin.split(',')[0]}</h3>
                    <p className="text-sm text-muted-foreground">Estimated Distance: ~1,200 km | Recommended arrival: {new Date(new Date(trip.startDate).getTime() - 86400000).toDateString()}</p>
                  </div>
                </div>
                <Button onClick={() => window.open(bookingUrl, '_blank')} className="bg-primary text-primary-foreground gap-2">
                  <ExternalLink className="w-4 h-4" /> Book Flights
                </Button>
              </div>
            </Card>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((day) => (
              <Button key={day.id} variant={activeDay === day.dayNumber ? "default" : "outline"} className={`w-20 h-14 rounded-xl ${activeDay === day.dayNumber ? "bg-primary" : "border-white/10"}`} onClick={() => setActiveDay(day.dayNumber)}>
                <span className="text-xl font-bold">{day.dayNumber}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold">{currentDay?.theme}</h2>
              <div className="flex items-center gap-2 text-accent">
                <Sun className="w-5 h-5" />
                <span className="font-bold">{currentDay?.weatherTempHigh || 24}°C</span>
              </div>
            </div>

            {(currentDay?.slots || []).map((slot: any, idx: number) => (
              <Card key={idx} className={`glass-card border-none transition-all ${slot.completed ? "opacity-50" : ""}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <Checkbox checked={slot.completed} onCheckedChange={() => handleToggleSlot(currentDay, idx)} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-tighter">
                      <Clock className="w-3 h-3" /> {slot.time}
                    </div>
                    <h4 className={`font-bold ${slot.completed ? "line-through" : ""}`}>{slot.activity}</h4>
                    <p className="text-xs text-muted-foreground">{slot.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] border-white/10">{slot.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{slot.location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-accent">₹{slot.estimatedCostINR}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:w-2/5 flex flex-col bg-card/20">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <TabsList className="m-4 bg-white/5 p-1 border border-white/10 rounded-xl">
              <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
              <TabsTrigger value="budget" className="flex-1">Budget</TabsTrigger>
            </TabsList>
            <TabsContent value="map" className="flex-1 mt-0 relative">
               <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <Button size="sm" variant="secondary" className="bg-white text-black" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trip.destination)}`, '_blank')}>
                   <Navigation className="w-4 h-4 mr-2" /> Navigate Day
                 </Button>
               </div>
               <TripMap locations={currentDay?.slots || []} />
            </TabsContent>
            <TabsContent value="budget" className="flex-1 mt-0 p-6 overflow-y-auto">
               <BudgetBreakdown data={[]} currency={trip.currency} />
               <Button className="w-full mt-6" variant="outline" onClick={() => setIsExpenseDialogOpen(true)}>Log Expense</Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ChatCompanion tripData={trip} />
    </div>
  );
}
