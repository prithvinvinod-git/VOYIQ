
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Map as MapIcon, 
  Cloud, 
  Sun, 
  CloudRain, 
  Share2, 
  RefreshCw, 
  Clock, 
  ArrowLeft,
  DollarSign,
  Tag
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { ChatCompanion } from "@/components/chat/ChatCompanion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

// Map component loaded dynamically for Leaflet
const TripMap = dynamic(() => import("@/components/trip/TripMap"), { ssr: false });

export default function TripDetail() {
  const { tripId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tripDoc = await getDoc(doc(db, "trips", tripId as string));
        if (!tripDoc.exists()) {
          router.push("/dashboard");
          return;
        }
        setTrip({ id: tripDoc.id, ...tripDoc.data() });

        const itinSnap = await getDocs(query(collection(db, `trips/${tripId}/itinerary`), orderBy("dayNumber")));
        const itinData = itinSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItinerary(itinData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tripId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading your trip...</p>
        </div>
      </div>
    );
  }

  const currentDay = itinerary.find(d => d.dayNumber === activeDay);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-white/5 bg-card/50 backdrop-blur-md sticky top-0 z-40 h-16 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-headline font-bold text-lg">{trip.destination}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex border-white/10">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Export PDF
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Itinerary */}
        <div className="flex-1 lg:w-3/5 overflow-y-auto p-4 md:p-8 space-y-8 border-r border-white/5">
          {/* Day Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {itinerary.map((day) => (
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
                    <span className="font-bold">24°C</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                    <RefreshCw className="w-3 h-3 mr-1" /> Replan Day
                  </Button>
                </div>
              </div>

              {/* Slots */}
              <div className="space-y-6 relative before:absolute before:left-[1.2rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {currentDay.slots.map((slot: any, idx: number) => (
                  <div key={idx} className="relative pl-12">
                    <div className="absolute left-3 top-2 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-glow-primary" />
                    <Card className="glass-card border-none hover:bg-white/5 transition-all">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                              <Clock className="w-3 h-3" /> {slot.time}
                            </div>
                            <h3 className="text-xl font-bold">{slot.activity}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{slot.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {slot.category && <Badge variant="secondary" className="text-[10px] bg-white/5 border-white/10">{slot.category}</Badge>}
                              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-white/5">
                                <MapIcon className="w-3 h-3" /> {slot.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 flex-shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground uppercase block font-bold">Est. Cost</span>
                              <span className="font-bold text-accent">₹{slot.estimatedCostINR}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 rounded-full border border-white/5 text-[10px] font-bold">
                              Details
                            </Button>
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

        {/* Right Panel - Map/Budget */}
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
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Spent</h3>
                <div className="text-4xl font-headline font-bold">₹24,500</div>
                <p className="text-xs text-muted-foreground">Budget: ₹{trip.totalBudget} {trip.currency}</p>
              </div>

              <div className="space-y-4">
                {[
                  { cat: "Stay", spent: 12000, color: "bg-primary" },
                  { cat: "Food", spent: 4500, color: "bg-accent" },
                  { cat: "Activities", spent: 6000, color: "bg-blue-500" },
                  { cat: "Transport", spent: 2000, color: "bg-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.cat}</span>
                      <span>₹{item.spent}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${(item.spent / 24500) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <Card className="glass-card border-accent/20 bg-accent/5 p-4 rounded-xl mt-8">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-accent w-5 h-5 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold">AI Budget Tip</h4>
                    <p className="text-xs text-muted-foreground">You've spent 60% of your food budget. Consider trying local street food for dinner to save roughly ₹800 today.</p>
                    <Button variant="outline" size="sm" className="text-[10px] h-7 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      View Alternatives
                    </Button>
                  </div>
                </div>
              </Card>

              <Button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                Log New Expense
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* AI Companion */}
      <ChatCompanion tripData={trip} />
    </div>
  );
}
