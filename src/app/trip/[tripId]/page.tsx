"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Clock, 
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  Plane,
  Navigation,
  Brain,
  TrendingDown,
  AlertTriangle,
  Wallet
} from "lucide-react";
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy, serverTimestamp } from "firebase/firestore";
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
import { suggestBudgetAlternatives, type SuggestBudgetAlternativesOutput } from "@/ai/flows/suggest-budget-alternatives-flow";
import dynamic from "next/dynamic";
import { useToast } from "@/hooks/use-toast";

const TripMap = dynamic(() => import("@/components/trip/TripMap"), { ssr: false });

const CATEGORIES = ["Food", "Transport", "Stay", "Activities", "Misc"];

const LOCAL_PHRASES: Record<string, string[]> = {
  Food: ["Check, please!", "Is this vegetarian?", "Water, please.", "Delicious!"],
  Transport: ["Where is the station?", "How much to the center?", "Next stop, please.", "Ticket for one."],
  Activities: ["What time do you close?", "Is there a student discount?", "Can I take photos?", "Where is the exit?"],
  Stay: ["What is the WiFi password?", "Can I have extra towels?", "What time is checkout?", "Where is breakfast?"],
  Misc: ["Hello!", "Thank you!", "Where is the restroom?", "Excuse me."]
};

export default function TripDetail() {
  const { tripId } = useParams();
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

  const currentDay = useMemo(() => {
    return itinerary?.find(d => d.dayNumber === activeDay) || itinerary?.[0];
  }, [itinerary, activeDay]);

  // Aggregate Budget Data for the Chart (Entire Trip for context)
  const budgetStats = useMemo(() => {
    const stats: Record<string, { planned: number; actual: number }> = {
      Food: { planned: 0, actual: 0 },
      Transport: { planned: 0, actual: 0 },
      Stay: { planned: 0, actual: 0 },
      Activities: { planned: 0, actual: 0 },
      Misc: { planned: 0, actual: 0 },
    };

    itinerary?.forEach(day => {
      (day.slots || []).forEach((slot: any) => {
        const cat = slot.category || "Misc";
        const key = CATEGORIES.includes(cat) ? cat : "Misc";
        stats[key].planned += slot.estimatedCostINR || 0;
      });
    });

    extraExpenses?.forEach(exp => {
      const cat = exp.category || "Misc";
      const key = CATEGORIES.includes(cat) ? cat : "Misc";
      stats[key].actual += exp.amount || 0;
    });

    return Object.entries(stats).map(([category, values]) => ({
      category,
      ...values,
    }));
  }, [itinerary, extraExpenses]);

  // Calculate Remaining Budget for Progress Bar
  const budgetProgress = useMemo(() => {
    if (!trip) return { total: 0, spent: 0, remaining: 0, percent: 0 };
    const totalSpent = extraExpenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    const remaining = Math.max(0, trip.totalBudget - totalSpent);
    const percent = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;
    return {
      total: trip.totalBudget,
      spent: totalSpent,
      remaining,
      percent
    };
  }, [trip, extraExpenses]);

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

  const handleLogExpense = () => {
    if (!firestore || !tripId || !user || !expenseAmount) return;
    
    const expData = {
      tripId,
      amount: parseFloat(expenseAmount),
      category: expenseCategory,
      note: expenseNote,
      loggedByUserId: user.uid,
      loggedAt: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(firestore, `trips/${tripId}/expenses`), expData);
    
    setExpenseAmount("");
    setExpenseNote("");
    setIsExpenseDialogOpen(false);
    toast({ title: "Expense logged!", description: `Added ${expenseAmount} to ${expenseCategory}.` });
  };

  const getAiSuggestions = async (overCategory: string, limit: number, spent: number) => {
    if (!trip) return;
    setIsAiLoading(true);
    try {
      const suggestions = await suggestBudgetAlternatives({
        tripContext: {
          destination: trip.destination,
          travelStyle: trip.travelStyle || [],
          pace: trip.pace || "Balanced",
          dietPref: (trip.dietaryPreferences || ["No preference"])[0],
          numTravelers: trip.numTravelers || 1,
        },
        overBudgetCategory: overCategory,
        budgetLimit: limit,
        amountSpent: spent,
        currency: trip.currency || "INR",
      });
      setAiSuggestions(suggestions);
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI Error", description: e.message });
    } finally {
      setIsAiLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UserHeader showBack backHref="/dashboard" title={trip.destination} />

      <div className="bg-card/40 border-b border-white/5 py-4 px-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-primary w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Itinerary Progress</span>
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
                    <p className="text-sm text-muted-foreground">Arrive by: {new Date(new Date(trip.startDate).getTime() - 86400000).toDateString()}</p>
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
                    <p className="text-xs text-muted-foreground mb-2">{slot.description}</p>
                    
                    {/* Local Phrases */}
                    <div className="bg-white/5 rounded-lg p-2 mb-2">
                       <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Local Phrases</p>
                       <div className="flex flex-wrap gap-2">
                         {(LOCAL_PHRASES[slot.category] || LOCAL_PHRASES.Misc).map((phrase, i) => (
                           <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded italic">"{phrase}"</span>
                         ))}
                       </div>
                    </div>

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
              <TabsTrigger value="budget" className="flex-1">BudgetSync</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">AI Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="flex-1 mt-0 relative">
               <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <Button size="sm" variant="secondary" className="bg-white text-black shadow-lg" onClick={() => {
                   const stops = currentDay?.slots?.map((s: any) => encodeURIComponent(s.location)).join('/') || "";
                   window.open(`https://www.google.com/maps/dir/${encodeURIComponent(trip.origin)}/${stops}/${encodeURIComponent(trip.destination)}`, '_blank');
                 }}>
                   <Navigation className="w-4 h-4 mr-2" /> Navigate Route
                 </Button>
               </div>
               <TripMap locations={currentDay?.slots || []} />
            </TabsContent>

            <TabsContent value="budget" className="flex-1 mt-0 p-6 overflow-y-auto space-y-6">
               <BudgetBreakdown data={budgetStats} currency={trip.currency} />
               
               {/* Remaining Budget Progress */}
               <Card className="glass-card border-none bg-primary/5">
                 <CardContent className="p-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Wallet className="w-4 h-4 text-primary" />
                       <span className="text-sm font-bold">Remaining Budget</span>
                     </div>
                     <span className="text-xs font-medium">{trip.currency} {budgetProgress.remaining.toFixed(0)}</span>
                   </div>
                   <Progress value={budgetProgress.percent} className="h-2" />
                   <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
                     <span>Spent: {trip.currency} {budgetProgress.spent.toFixed(0)}</span>
                     <span>Total: {trip.currency} {budgetProgress.total.toFixed(0)}</span>
                   </div>
                 </CardContent>
               </Card>

               <Button className="w-full" variant="outline" onClick={() => setIsExpenseDialogOpen(true)}>
                 <Plus className="w-4 h-4 mr-2" /> Log Manual Expense
               </Button>
               
               <div className="mt-8 space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Spending Alerts</h4>
                 {budgetStats.map(stat => (
                   stat.actual > stat.planned && stat.planned > 0 && (
                     <div key={stat.category} className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                       <AlertTriangle className="text-destructive w-5 h-5 mt-0.5" />
                       <div className="flex-1">
                         <p className="text-sm font-bold">{stat.category} is over budget!</p>
                         <p className="text-xs text-muted-foreground">Spent {trip.currency} {stat.actual.toFixed(0)} vs Planned {trip.currency} {stat.planned.toFixed(0)}</p>
                         <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => getAiSuggestions(stat.category, stat.planned, stat.actual)}>
                           Get AI Suggestions
                         </Button>
                       </div>
                     </div>
                   )
                 ))}
               </div>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 mt-0 p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="text-primary w-6 h-6" />
                  <h3 className="text-xl font-headline font-bold">AI Budget Optimizer</h3>
                </div>
                
                {!aiSuggestions && !isAiLoading && (
                  <div className="text-center py-10 glass-card rounded-2xl border-dashed">
                    <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Select an alert in BudgetSync to generate tailored suggestions.</p>
                  </div>
                )}

                {isAiLoading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Brainstorming alternatives...</p>
                  </div>
                )}

                {aiSuggestions && (
                  <div className="space-y-4 animate-fade-in">
                    {aiSuggestions.alternatives.map((alt, i) => (
                      <Card key={i} className="glass-card border-none bg-primary/5">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-primary/20 text-primary border-none">{alt.category}</Badge>
                            <div className="flex items-center gap-1 text-accent font-bold">
                              <TrendingDown className="w-4 h-4" />
                              Save ~{trip.currency} {alt.estimatedSavings}
                            </div>
                          </div>
                          <p className="text-sm font-medium leading-relaxed">{alt.suggestion}</p>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" className="w-full text-xs" onClick={() => setAiSuggestions(null)}>Clear Suggestions</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Log Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Log New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount ({trip.currency})</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="bg-white/5 border-white/10" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input 
                placeholder="What was this for?" 
                className="bg-white/5 border-white/10" 
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleLogExpense}>Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatCompanion tripData={trip} />
    </div>
  );
}
