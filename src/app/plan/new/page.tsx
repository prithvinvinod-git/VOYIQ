
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Users as UsersIcon,
  AlertCircle
} from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, writeBatch, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedItinerary } from "@/ai/flows/generate-personalized-itinerary";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UserHeader } from "@/components/layout/UserHeader";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = 1 | 2 | 3 | 4;

const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

function TripWizardContent() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [queryVal, setQueryVal] = useState("");
  const [originQuery, setOriginQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [originResults, setOriginResults] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const isCollabMode = searchParams.get('collab') === 'true';

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    numTravelers: "" as unknown as number,
    groupType: "solo" as any,
    totalBudget: 0,
    currency: "USD",
    travelStyle: [] as string[],
    pace: "Balanced" as any,
    dietaryPreferences: ["No preference"] as any[],
    mobilityNeeds: false,
    mustIncludePlaces: "",
    mustAvoid: ""
  });

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "trips"), where("ownerId", "==", user.uid));
  }, [firestore, user]);
  
  const { data: tripsData } = useCollection(tripsQuery);
  const tripCount = tripsData?.length || 0;
  const isPremium = userData?.isPremium || false;
  const isLimitReached = !isPremium && tripCount >= 4;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

  const searchPlace = async (val: string, type: 'origin' | 'dest') => {
    if (type === 'origin') setOriginQuery(val);
    else setQueryVal(val);

    if (val.length < 3) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`);
      const data = await res.json();
      if (type === 'origin') setOriginResults(data);
      else setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  const selectPlace = (item: any, type: 'origin' | 'dest') => {
    if (type === 'origin') {
      setFormData({ ...formData, origin: item.display_name });
      setOriginQuery(item.display_name);
      setOriginResults([]);
    } else {
      setFormData({ ...formData, destination: item.display_name });
      setQueryVal(item.display_name);
      setSearchResults([]);
    }
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
    
    if (isLimitReached) {
      toast({ 
        variant: "destructive", 
        title: "Upgrade Required", 
        description: "You've reached the limit of 4 trips on the Free Explorer plan." 
      });
      return;
    }

    if (!formData.numTravelers || formData.numTravelers < 1) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid number of travelers." });
      return;
    }
    
    setLoading(true);
    try {
      const aiResponse = await generatePersonalizedItinerary({
        ...formData,
        travelStyle: formData.travelStyle as any,
      } as any);

      const batch = writeBatch(firestore);
      const tripRef = doc(collection(firestore, "trips"));
      
      // Only attach to collab room if accessed via the collab link
      const collabId = isCollabMode ? userData?.activeCollabRoomId : null;

      const tripData = {
        id: tripRef.id,
        ownerId: user.uid,
        authorizedUserIds: [user.uid],
        collabRoomId: collabId || null,
        ...formData,
        status: "active",
        health: 0,
        totalCompletedSlots: 0,
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
      router.push(`/trip/${tripRef.id}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UserHeader showBack backHref={isCollabMode ? "/collab" : "/dashboard"} title={isCollabMode ? "Room Adventure" : "New Adventure"} />
      
      <div className="p-4 md:p-8 flex items-center justify-center relative min-h-[calc(100vh-64px)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_70%)]" />
        
        <div className="w-full max-w-4xl space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-muted-foreground">Step {step} of 4</span>
              <div className="flex items-center gap-4">
                 {isLimitReached && <Badge variant="destructive" className="animate-pulse">Free Limit Reached</Badge>}
                 <span className="text-primary font-bold">
                  {step === 1 && "Basic Info"}
                  {step === 2 && "Budget & Style"}
                  {step === 3 && "Preferences"}
                  {step === 4 && "Review & Generate"}
                </span>
              </div>
            </div>
            <Progress value={step * 25} className="h-2 bg-white/5" />
          </div>

          <Card className="glass-card border-none shadow-2xl overflow-visible">
            <CardContent className="p-8 md:p-12">
              {isLimitReached && step !== 4 && (
                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
                  <AlertCircle className="text-destructive w-5 h-5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">You&apos;ve reached your free trip limit.</p>
                    <p className="text-xs text-muted-foreground">Upgrade to Premium to plan more than 4 adventures.</p>
                  </div>
                  <PlanSelectionDialog 
                    tripCount={tripCount}
                    trigger={<Button size="sm" variant="destructive">Upgrade</Button>}
                    onSelectFree={() => {}}
                  />
                </div>
              )}

              {isCollabMode && userData?.activeCollabRoomId && (
                <div className="mb-8 p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-2">
                  <UsersIcon className="text-accent w-4 h-4" />
                  <p className="text-xs font-bold text-accent uppercase">Adding trip to Collab Room: {userData.activeCollabRoomId}</p>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-bold">Where and When?</h2>
                    <p className="text-muted-foreground">Set your origin, destination and travel dates.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <Label className="mb-2 block">Origin (From)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Current city..." 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          value={originQuery}
                          onChange={(e) => searchPlace(e.target.value, 'origin')}
                        />
                      </div>
                      {originResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-xl overflow-hidden z-50">
                          {originResults.map((item, i) => (
                            <button key={i} className="w-full p-4 text-left hover:bg-white/10 border-b border-white/5 text-sm" onClick={() => selectPlace(item, 'origin')}>
                              {item.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <Label className="mb-2 block">Destination (To)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search places..." 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          value={queryVal}
                          onChange={(e) => searchPlace(e.target.value, 'dest')}
                        />
                      </div>
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-xl overflow-hidden z-50">
                          {searchResults.map((item, i) => (
                            <button key={i} className="w-full p-4 text-left hover:bg-white/10 border-b border-white/5 text-sm" onClick={() => selectPlace(item, 'dest')}>
                              {item.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" className="h-12 bg-white/5 border-white/10" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}/>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" className="h-12 bg-white/5 border-white/10" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Number of People</Label>
                      <div className="relative">
                        <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="How many people?"
                          className="pl-10 h-12 bg-white/5 border-white/10" 
                          value={formData.numTravelers || ""} 
                          onChange={(e) => setFormData({...formData, numTravelers: parseInt(e.target.value) || "" as any})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Travel Group</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["solo", "couple", "family", "friends"].map((type) => (
                          <Button key={type} variant={formData.groupType === type ? "default" : "outline"} className={`h-12 capitalize ${formData.groupType === type ? "bg-primary" : "border-white/10"}`} onClick={() => setFormData({...formData, groupType: type as any})}>
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
                    <p className="text-muted-foreground">How do you like to travel?</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={formData.currency} onValueChange={(val) => setFormData({...formData, currency: val})}>
                        <SelectTrigger className="h-12 bg-white/5 border-white/10"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="glass-card">
                          {COMMON_CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Budget</Label>
                      <Input type="number" placeholder="Amount" className="h-12 bg-white/5 border-white/10" value={formData.totalBudget || ""} onChange={(e) => setFormData({...formData, totalBudget: parseInt(e.target.value) || 0})}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Travel Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Adventure", "Culture", "Food", "Nature", "Luxury", "Budget"].map(s => (
                        <Badge key={s} className={`px-4 py-2 cursor-pointer border ${formData.travelStyle.includes(s) ? "bg-primary border-primary" : "bg-transparent border-white/10 text-muted-foreground"}`} onClick={() => toggleStyle(s)}>
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                   <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-bold">Preferences</h2>
                    <p className="text-muted-foreground">Any specific dietary needs or must-sees?</p>
                  </div>
                  <div className="space-y-4">
                    <Label>Dietary Preference</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Vegetarian", "Vegan", "Non-veg", "Halal", "No preference"].map(d => (
                        <Button key={d} size="sm" variant={formData.dietaryPreferences.includes(d) ? "default" : "outline"} className={`rounded-full ${formData.dietaryPreferences.includes(d) ? "bg-primary" : "border-white/10"}`} onClick={() => setFormData({...formData, dietaryPreferences: [d] as any})}>
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8 animate-fade-in text-center">
                  <h2 className="text-3xl font-headline font-bold">Ready to Fly?</h2>
                  <div className="glass-card p-6 text-left rounded-2xl bg-primary/5 border-primary/20">
                    <p><strong>From:</strong> {formData.origin || "Not set"}</p>
                    <p><strong>To:</strong> {formData.destination || "Not set"}</p>
                    <p><strong>Dates:</strong> {formData.startDate} to {formData.endDate}</p>
                    <p><strong>Travelers:</strong> {formData.numTravelers} ({formData.groupType})</p>
                    {isCollabMode && userData?.activeCollabRoomId && (
                       <p className="mt-2 text-accent font-bold">Sharing with Collab Room: {userData.activeCollabRoomId}</p>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full h-16 bg-primary text-primary-foreground text-lg shadow-xl shadow-primary/20" 
                    onClick={handleSubmit} 
                    disabled={loading || isLimitReached}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2"><Sparkles className="animate-spin" /> Generating...</span>
                    ) : isLimitReached ? (
                      "Limit Reached - Please Upgrade"
                    ) : (
                      "Generate My Trip"
                    )}
                  </Button>
                </div>
              )}

              {!loading && (
                <div className="mt-12 flex justify-between">
                  <Button variant="ghost" disabled={step === 1} onClick={handleBack}><ChevronLeft className="mr-2" /> Back</Button>
                  {step < 4 && <Button className="bg-white/10 text-white" onClick={handleNext}>Next <ChevronRight className="ml-2" /></Button>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TripWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Sparkles className="animate-spin text-primary" /></div>}>
      <TripWizardContent />
    </Suspense>
  );
}
