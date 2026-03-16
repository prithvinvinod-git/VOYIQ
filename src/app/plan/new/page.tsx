
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Calendar as CalendarIcon, 
  Wallet, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Check
} from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedItinerary } from "@/ai/flows/generate-personalized-itinerary";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Step = 1 | 2 | 3 | 4;

export default function TripWizard() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    numTravelers: 1,
    groupType: "solo" as any,
    totalBudget: 1000,
    currency: "INR",
    travelStyle: [] as string[],
    pace: "Balanced" as any,
    dietaryPreferences: ["No preference"] as any[],
    mobilityNeeds: false,
    mustIncludePlaces: "",
    mustAvoid: ""
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

  const searchDestination = async (val: string) => {
    setQuery(val);
    if (val.length < 3) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  const selectDestination = (item: any) => {
    setFormData({ ...formData, destination: item.display_name });
    setQuery(item.display_name);
    setSearchResults([]);
  };

  const handleNext = () => step < 4 && setStep((s) => (s + 1) as Step);
  const handleBack = () => step > 1 && setStep((s) => (s - 1) as Step);

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      travelStyle: prev.travelStyle.includes(style)
        ? prev.travelStyle.filter(s => s !== style)
        : [...prev.travelStyle, style]
    }));
  };

  const handleSubmit = async () => {
    if (!user || !firestore) return;
    setLoading(true);
    try {
      const aiResponse = await generatePersonalizedItinerary({
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        numTravelers: formData.numTravelers,
        groupType: formData.groupType,
        totalBudget: formData.totalBudget,
        currency: formData.currency,
        travelStyle: formData.travelStyle as any,
        pace: formData.pace,
        dietaryPreferences: formData.dietaryPreferences,
        mobilityNeeds: formData.mobilityNeeds,
        mustIncludePlaces: formData.mustIncludePlaces,
        mustAvoid: formData.mustAvoid
      });

      const batch = writeBatch(firestore);
      const tripRef = doc(collection(firestore, "trips"));
      
      const tripData = {
        id: tripRef.id,
        ownerId: user.uid,
        authorizedUserIds: [user.uid],
        ...formData,
        status: "active",
        health: 100,
        createdAt: new Date().toISOString()
      };

      batch.set(tripRef, tripData);

      for (const day of aiResponse.days) {
        const dayRef = doc(collection(firestore, `trips/${tripRef.id}/itineraryDays`));
        batch.set(dayRef, {
          ...day,
          id: dayRef.id,
          tripId: tripRef.id,
          tripOwnerId: user.uid,
          tripAuthorizedUserIds: [user.uid]
        });
      }

      await batch.commit();

      toast({ title: "Itinerary Generated!", description: "Taking you to your new trip." });
      router.push(`/trip/${tripRef.id}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_70%)]" />
      
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-muted-foreground">Step {step} of 4</span>
            <span className="text-primary font-bold">
              {step === 1 && "Destination & Dates"}
              {step === 2 && "Budget & Style"}
              {step === 3 && "Preferences"}
              {step === 4 && "Review & Generate"}
            </span>
          </div>
          <Progress value={step * 25} className="h-2 bg-white/5" />
        </div>

        <Card className="glass-card border-none shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-headline font-bold">Where are we going?</h2>
                  <p className="text-muted-foreground">Enter a city, country or landmark.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <Label className="mb-2 block">Destination</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search places..." 
                        className="pl-10 h-12 bg-white/5 border-white/10"
                        value={query}
                        onChange={(e) => searchDestination(e.target.value)}
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-xl overflow-hidden z-50">
                        {searchResults.map((item, i) => (
                          <button 
                            key={i}
                            className="w-full p-4 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 text-sm"
                            onClick={() => selectDestination(item)}
                          >
                            {item.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="date" 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          value={formData.startDate}
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="date" 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          value={formData.endDate}
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Who's coming along?</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["solo", "couple", "family", "friends"].map((type) => (
                        <Button 
                          key={type}
                          variant={formData.groupType === type ? "default" : "outline"}
                          className={`h-12 capitalize ${formData.groupType === type ? "bg-primary text-primary-foreground" : "border-white/10 hover:bg-white/5"}`}
                          onClick={() => setFormData({...formData, groupType: type as any})}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-headline font-bold">Budget & Vibe</h2>
                  <p className="text-muted-foreground">Help us tailor the activities to your style.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Total Budget</Label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="number"
                          placeholder="Amount"
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          value={formData.totalBudget}
                          onChange={(e) => setFormData({...formData, totalBudget: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input 
                        placeholder="INR"
                        className="h-12 bg-white/5 border-white/10"
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Travel Style (Select all that apply)</Label>
                    <div className="flex flex-wrap gap-3">
                      {["Adventure", "Culture", "Food", "Nature", "Luxury", "Budget"].map((s) => (
                        <Badge 
                          key={s}
                          className={`px-4 py-2 text-sm cursor-pointer transition-all border ${
                            formData.travelStyle.includes(s) 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-transparent text-muted-foreground border-white/10 hover:border-white/20"
                          }`}
                          onClick={() => toggleStyle(s)}
                        >
                          {s} {formData.travelStyle.includes(s) && <Check className="ml-1 w-3 h-3 inline" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>What's the pace?</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Relaxed", "Balanced", "Packed"].map((p) => (
                        <Button 
                          key={p}
                          variant={formData.pace === p ? "default" : "outline"}
                          className={`h-12 ${formData.pace === p ? "bg-primary text-primary-foreground" : "border-white/10"}`}
                          onClick={() => setFormData({...formData, pace: p as any})}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h2 className="text-3xl font-headline font-bold">Final Touches</h2>
                  <p className="text-muted-foreground">Dietary preferences and must-see spots.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Dietary Preference</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Vegetarian", "Vegan", "Non-veg", "Halal", "No preference"].map((d) => (
                        <Button
                          key={d}
                          size="sm"
                          variant={formData.dietaryPreferences.includes(d) ? "default" : "outline"}
                          className={`rounded-full ${formData.dietaryPreferences.includes(d) ? "bg-primary" : "border-white/10"}`}
                          onClick={() => setFormData({...formData, dietaryPreferences: [d] as any})}
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Must-Include Places (Optional)</Label>
                    <textarea 
                      className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-primary/50"
                      placeholder="e.g. Louvre Museum, Eiffel Tower..."
                      value={formData.mustIncludePlaces}
                      onChange={(e) => setFormData({...formData, mustIncludePlaces: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anything to avoid?</Label>
                    <Input 
                      className="h-12 bg-white/5 border-white/10"
                      placeholder="e.g. Crowded markets, hiking..."
                      value={formData.mustAvoid}
                      onChange={(e) => setFormData({...formData, mustAvoid: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-2 text-center">
                  <h2 className="text-3xl font-headline font-bold">Looks Perfect!</h2>
                  <p className="text-muted-foreground">Review your trip details before we build it.</p>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Destination</span>
                      <p className="font-bold truncate">{formData.destination || "Not set"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Dates</span>
                      <p className="font-bold">{formData.startDate} → {formData.endDate}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Budget</span>
                      <p className="font-bold">{formData.totalBudget} {formData.currency}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Style</span>
                      <p className="font-bold truncate">{formData.travelStyle.join(", ")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-6">
                  {loading ? (
                    <div className="space-y-4 w-full flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <div className="text-center">
                        <p className="font-bold text-lg">Generating Your Itinerary...</p>
                        <p className="text-sm text-muted-foreground">Our AI is hand-picking activities for you.</p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full md:w-auto h-16 px-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20"
                      onClick={handleSubmit}
                    >
                      <Sparkles className="mr-2 w-5 h-5" /> Generate Itinerary
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!loading && (
              <div className="mt-12 flex justify-between">
                <Button 
                  variant="ghost" 
                  disabled={step === 1}
                  onClick={handleBack}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                {step < 4 && (
                  <Button 
                    className="bg-white/10 hover:bg-white/20 text-white"
                    onClick={handleNext}
                    disabled={step === 1 && !formData.destination}
                  >
                    Next Step <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
