
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
  Languages,
  ChevronLeft,
  MapPin
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

const TripMap = dynamic(() => import("@/components/trip/TripMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center"><MapPin className="text-muted-foreground w-8 h-8 opacity-20" /></div>
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
  
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Misc");
  const [expenseNote, setExpenseNote] = useState("");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !tripId || !user) return null;
    return doc(firestore, "trips", tripId as string);
  }, [firestore, tripId, user]);

  const { data: trip, isLoading: isTripLoading, error: tripError } = useDoc<any>(tripRef);

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

  const handleNavigateAll = () => {
    if (!trip || !currentDay) return;
    
    const origin = encodeURIComponent(trip.origin || "");
    const destination = encodeURIComponent(trip.destination || "");
    const waypoints = currentDay.slots?.map((s: any) => encodeURIComponent(s.location)).filter(Boolean) || [];
    
    // Construct multi-stop URL: origin -> Stop1 -> Stop2 -> ... -> destination
    const route = [origin, ...waypoints, destination].filter(Boolean).join('/');
    window.open(`https://www.google.com/maps/dir/${route}`, '_blank');
  };

  if (isUserLoading || (isTripLoading && !trip)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse">Syncing with your Travel Brain...</p>
      </div>
    );
  }

  if (tripError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-destructive w-10 h-10" />
        </div>
        <h1 className="text-3xl font-headline font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          You might not have permission to view this journey, or it has been archived.
        </p>
        <Button className="bg-primary text-primary-foreground h-12 px-8 rounded-xl" onClick={() => router.push("/dashboard")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <Plane className="text-muted-foreground w-10 h-10 opacity-40" />
        </div>
        <h1 className="text-3xl font-headline font-bold mb-2">Adventure Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          We couldn't find the trip you're looking for. It may have been deleted or moved.
        </p>
        <Button variant="outline" className="border-primary text-primary h-12 px-8 rounded-xl" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const days = itinerary || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <UserHeader showBack backHref="/dashboard" title={trip.destination} />

      <div className="bg-card/40 border-b border-white/5 py-4 px-4 sm:px-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-primary w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Itinerary Progress</span>
        </div>
        <Progress value={progressValue} className="h-2.5 flex-1 w-full max-w-xl" />
        <span className="text-xs font-bold">{Math.round(progressValue)}%</span>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 border-r border-white/5 scrollbar-hide">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {days.map((day) => (
              <Button 
                key={day.id} 
                variant={activeDay === day.dayNumber ? "default" : "outline"} 
                className={`w-16 sm:w-20 h-12 sm:h-14 rounded-xl flex-shrink-0 ${activeDay === day.dayNumber ? "bg-primary" : "border-white/10"}`} 
                onClick={() => setActiveDay(day.dayNumber)}
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] uppercase font-bold opacity-60">Day</span>
                  <span className="text-xl font-bold">{day.dayNumber}</span>
                </div>
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-headline font-bold">{currentDay?.theme || `Day ${activeDay}`}</h2>
              <div className="flex items-center gap-2 text-accent bg-accent/10 px-4 py-2 rounded-full w-fit">
                <Sun className="w-5 h-5" />
                <span className="font-bold">{currentDay?.weatherTempHigh || 24}°C</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isItineraryLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl" />)}
                </div>
              )}
              {(currentDay?.slots || []).map((slot: any, idx: number) => (
                <Card key={idx} className={`glass-card border-none transition-all group ${slot.completed ? "opacity-40" : ""}`}>
                  <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                    <Checkbox checked={slot.completed} onCheckedChange={() => handleToggleSlot(currentDay, idx)} className="mt-1 border-primary/50" />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" /> {slot.time}
                        </div>
                        <span className="text-sm font-bold text-accent">₹{slot.estimatedCostINR}</span>
                      </div>
                      <h4 className={`text-lg font-bold leading-tight ${slot.completed ? "line-through" : ""}`}>{slot.activity}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{slot.description}</p>
                      
                      {/* Local AI Phrases */}
                      {slot.localPhrases && slot.localPhrases.length > 0 && (
                        <div className="bg-white/5 rounded-2xl p-4 mt-4 border border-white/5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-primary" />
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Local Assist</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {slot.localPhrases.map((phrase: any, i: number) => (
                              <div key={i} className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-accent italic">"{phrase.phrase}"</span>
                                <span className="text-[10px] text-muted-foreground">{phrase.meaning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/5">
                        <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary px-3 py-1">{slot.category}</Badge>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {slot.location}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-2/5 flex flex-col bg-card/20 min-h-[500px] lg:min-h-0">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <TabsList className="m-4 bg-white/5 p-1 border border-white/10 rounded-2xl shrink-0">
              <TabsTrigger value="map" className="flex-1 py-3 rounded-xl font-bold">Explore Map</TabsTrigger>
              <TabsTrigger value="budget" className="flex-1 py-3 rounded-xl font-bold">BudgetSync</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 py-3 rounded-xl font-bold">Optimizer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="flex-1 mt-0 relative">
               <div className="absolute top-4 right-4 z-10">
                 <Button size="sm" variant="secondary" className="bg-white text-black shadow-2xl hover:bg-white/90 rounded-xl font-bold" onClick={handleNavigateAll}>
                   <Navigation className="w-4 h-4 mr-2" /> Navigate Day
                 </Button>
               </div>
               <TripMap locations={currentDay?.slots || []} />
            </TabsContent>

            <TabsContent value="budget" className="flex-1 mt-0 p-6 overflow-y-auto space-y-6 scrollbar-hide">
               <BudgetBreakdown data={budgetStats} currency={trip.currency} />
               
               <Card className="glass-card border-none bg-primary/5 p-6 rounded-3xl">
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                         <Wallet className="w-5 h-5 text-primary" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Left to Spend</span>
                         <span className="text-xl font-bold">{trip.currency} {budgetProgress.remaining.toFixed(0)}</span>
                       </div>
                     </div>
                   </div>
                   <Progress value={budgetProgress.percent} className="h-2.5 bg-white/10" />
                   <p className="text-[10px] text-right text-muted-foreground font-bold">{Math.round(budgetProgress.percent)}% OF TOTAL BUDGET</p>
                 </div>
               </Card>

               <Button className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/10 rounded-2xl font-bold" variant="outline" onClick={() => setIsExpenseDialogOpen(true)}>
                 <Plus className="w-5 h-5 mr-2" /> Log Actual Expense
               </Button>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 mt-0 p-6 overflow-y-auto scrollbar-hide">
              <div className="space-y-8">
                <div className="flex items-center gap-4 bg-primary/10 p-6 rounded-3xl border border-primary/20">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Brain className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-bold">AI Optimizer</h3>
                    <p className="text-xs text-muted-foreground">Smart suggestions to balance your spend.</p>
                  </div>
                </div>
                
                {aiSuggestions ? (
                  <div className="space-y-4 animate-fade-in">
                    {aiSuggestions.alternatives.map((alt, i) => (
                      <Card key={i} className="glass-card border-none bg-primary/5 hover:bg-primary/10 transition-colors rounded-3xl">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-primary/20 text-primary border-none px-3 py-1">{alt.category}</Badge>
                            <div className="flex items-center gap-2 text-accent font-bold">
                              <TrendingDown className="w-4 h-4" />
                              Save ~{trip.currency} {alt.estimatedSavings}
                            </div>
                          </div>
                          <p className="text-sm font-medium leading-relaxed">{alt.suggestion}</p>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="ghost" className="w-full text-xs opacity-50 hover:opacity-100" onClick={() => setAiSuggestions(null)}>Dismiss Suggestions</Button>
                  </div>
                ) : (
                  <div className="py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
                    <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground px-10">AI will suggest cheaper alternatives here if you exceed category budgets.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="glass-card border-white/10 max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold">Log New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest opacity-60">Amount ({trip.currency})</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold" 
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest opacity-60">Category</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/10 rounded-2xl">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest opacity-60">Note (Optional)</Label>
              <Input 
                placeholder="What was this for?" 
                className="h-14 bg-white/5 border-white/10 rounded-2xl" 
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" className="rounded-2xl h-12" onClick={() => setIsExpenseDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground h-12 rounded-2xl px-8 font-bold" onClick={handleLogExpense}>Record Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatCompanion tripData={trip} />
    </div>
  );
}
