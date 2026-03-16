
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
  Wallet,
  Languages
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
    if (!firestore || !tripId || !user) return null;
    return doc(firestore, "trips", tripId as string);
  }, [firestore, tripId, user]);

  const { data: trip, isLoading: isTripLoading } = useDoc<any>(tripRef);

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

  const currentDay = useMemo(() => {
    return itinerary?.find(d => d.dayNumber === activeDay) || itinerary?.[0];
  }, [itinerary, activeDay]);

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

    extraExpenses?.forEach(exp => {
      const cat = exp.category || "Misc";
      const key = CATEGORIES.includes(cat) ? cat : "Misc";
      stats[key].actual += exp.amount || 0;
    });

    return Object.entries(stats).map(([category, values]) => ({
      category,
      ...values,
    }));
  }, [currentDay, extraExpenses]);

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

  const { progressValue } = useMemo(() => {
    if (!itinerary) return { progressValue: 0 };
    let total = 0;
    let completed = 0;
    itinerary.forEach(day => {
      (day.slots || []).forEach((slot: any) => {
        total++;
        if (slot.completed) completed++;
      });
    });
    return {
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
                    <p className="text-xs text-muted-foreground mb-4">{slot.description}</p>
                    
                    {/* Local AI Phrases */}
                    {slot.localPhrases && slot.localPhrases.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Languages className="w-3 h-3 text-primary" />
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Useful Local Phrases</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {slot.localPhrases.map((phrase: any, i: number) => (
                            <div key={i} className="flex flex-col">
                              <span className="text-xs font-bold text-accent italic">"{phrase.phrase}"</span>
                              <span className="text-[10px] text-muted-foreground">{phrase.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                   <Navigation className="w-4 h-4 mr-2" /> Navigate
                 </Button>
               </div>
               <TripMap locations={currentDay?.slots || []} />
            </TabsContent>

            <TabsContent value="budget" className="flex-1 mt-0 p-6 overflow-y-auto space-y-6">
               <BudgetBreakdown data={budgetStats} currency={trip.currency} />
               
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
                 </CardContent>
               </Card>

               <Button className="w-full" variant="outline" onClick={() => setIsExpenseDialogOpen(true)}>
                 <Plus className="w-4 h-4 mr-2" /> Log Expense
               </Button>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 mt-0 p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="text-primary w-6 h-6" />
                  <h3 className="text-xl font-headline font-bold">Optimizer</h3>
                </div>
                
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
                    <Button variant="outline" className="w-full text-xs" onClick={() => setAiSuggestions(null)}>Clear</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleLogExpense}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatCompanion tripData={trip} />
    </div>
  );
}
