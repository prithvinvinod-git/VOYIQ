
"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users as UsersIcon,
  AlertCircle,
  Calendar,
  Wallet,
  Globe,
  Wind,
  Utensils,
  Zap,
  Leaf,
  Mountain,
  Camera,
  Heart,
  CheckCircle2,
  Loader2,
  Plane,
} from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, writeBatch, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedItinerary } from "@/ai/flows/generate-personalized-itinerary";
import { Badge } from "@/components/ui/badge";
import { UserHeader } from "@/components/layout/UserHeader";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { ProgressiveFluxLoader } from "@/components/ui/progressive-flux-loader";
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

const TRAVEL_STYLES = [
  { label: "Adventure", icon: Mountain },
  { label: "Culture", icon: Camera },
  { label: "Food", icon: Utensils },
  { label: "Nature", icon: Leaf },
  { label: "Luxury", icon: Heart },
  { label: "Budget", icon: Wallet },
  { label: "Wellness", icon: Wind },
  { label: "Backpacking", icon: Globe },
];

const GROUP_TYPES = [
  { value: "solo", label: "Solo", emoji: "🧭" },
  { value: "couple", label: "Couple", emoji: "💫" },
  { value: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { value: "friends", label: "Friends", emoji: "🎉" },
];

const DIETARY = ["Vegetarian", "Vegan", "Non-veg", "Halal", "No preference"];

const PACE_OPTIONS = [
  { value: "Relaxed", label: "Relaxed", sub: "Slow, few spots/day" },
  { value: "Balanced", label: "Balanced", sub: "Mix of activity & rest" },
  { value: "Active", label: "Active", sub: "Packed, maximize coverage" },
];

const STEPS = [
  { num: 1, label: "Route", icon: MapPin },
  { num: 2, label: "Budget", icon: Wallet },
  { num: 3, label: "Vibe", icon: Heart },
  { num: 4, label: "Launch", icon: Sparkles },
];

/* ── Chip / toggle button ──────────────────────────────────────────── */
function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] flex items-center gap-2 ${className}`}
      style={
        active
          ? {
              background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))",
              color: "hsl(222 47% 9%)",
              boxShadow: "0 0 20px rgba(0,212,184,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
              transform: "translateY(-1px)",
            }
          : {
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }
      }
    >
      {children}
    </button>
  );
}

/* ── Glass input field ─────────────────────────────────────────────── */
function GlassInput({
  id,
  label,
  icon: Icon,
  hint,
  ...props
}: {
  id: string;
  label: string;
  icon?: React.ElementType;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          id={id}
          {...props}
          className={`w-full h-14 rounded-2xl text-sm font-medium text-white placeholder:text-muted-foreground/60 transition-all duration-200 outline-none ${Icon ? "pl-11" : "pl-4"} pr-4`}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
            ...(props.style || {}),
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(0,212,184,0.4)";
            (e.target as HTMLInputElement).style.boxShadow =
              "0 0 0 3px rgba(0,212,184,0.12), inset 0 2px 4px rgba(0,0,0,0.2)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.target as HTMLInputElement).style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2)";
          }}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground/70 pl-1">{hint}</p>}
    </div>
  );
}

/* ── Autocomplete dropdown ─────────────────────────────────────────── */
function PlaceAutocomplete({
  id,
  label,
  value,
  results,
  onChange,
  onSelect,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  results: any[];
  onChange: (v: string) => void;
  onSelect: (item: any) => void;
  placeholder: string;
}) {
  return (
    <div className="relative space-y-2">
      <Label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {label}
      </Label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 pl-11 pr-4 rounded-2xl text-sm font-medium text-white placeholder:text-muted-foreground/60 outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(0,212,184,0.4)";
            (e.target as HTMLInputElement).style.boxShadow =
              "0 0 0 3px rgba(0,212,184,0.12), inset 0 2px 4px rgba(0,0,0,0.2)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.target as HTMLInputElement).style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.2)";
          }}
        />
      </div>
      {results.length > 0 && (
        <div
          className="absolute top-full left-0 w-full mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(10,14,30,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {results.map((item, i) => (
            <button
              key={i}
              type="button"
              className="w-full p-4 text-left text-sm text-muted-foreground hover:text-white hover:bg-white/8 transition-colors duration-150"
              style={{ borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              onMouseDown={() => onSelect(item)}
            >
              <span className="line-clamp-1">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TRIP WIZARD CONTENT
   ══════════════════════════════════════════════════════════════════════ */
function TripWizardContent() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [queryVal, setQueryVal] = useState("");
  const [originQuery, setOriginQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const isCollabMode = searchParams.get("collab") === "true";

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
    mustAvoid: "",
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
    if (!isUserLoading && !user) { router.push("/auth"); }
  }, [user, isUserLoading, router]);

  const searchPlace = useCallback(async (val: string, type: "origin" | "dest") => {
    if (type === "origin") setOriginQuery(val);
    else setQueryVal(val);
    if (val.length < 3) { type === "origin" ? setOriginResults([]) : setSearchResults([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`
      );
      const data = await res.json();
      if (type === "origin") setOriginResults(data);
      else setSearchResults(data);
    } catch {}
  }, []);

  const selectPlace = (item: any, type: "origin" | "dest") => {
    if (type === "origin") {
      setFormData((p) => ({ ...p, origin: item.display_name }));
      setOriginQuery(item.display_name);
      setOriginResults([]);
    } else {
      setFormData((p) => ({ ...p, destination: item.display_name }));
      setQueryVal(item.display_name);
      setSearchResults([]);
    }
  };

  const handleNext = () => step < 4 && setStep((s) => (s + 1) as Step);
  const handleBack = () => step > 1 && setStep((s) => (s - 1) as Step);
  const toggleStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      travelStyle: prev.travelStyle.includes(style)
        ? prev.travelStyle.filter((s) => s !== style)
        : [...prev.travelStyle, style],
    }));
  };

  const handleSubmit = async () => {
    if (!user || !firestore) return;
    if (isLimitReached) { setShowPlanDialog(true); return; }
    if (!formData.numTravelers || formData.numTravelers < 1) {
      toast({ variant: "destructive", title: "Missing field", description: "Please enter a valid number of travelers." });
      return;
    }
    setLoading(true);
    try {
      const idToken = (await user.getIdToken()) || "";
      const aiResponse = await generatePersonalizedItinerary({ idToken, ...formData, travelStyle: formData.travelStyle as any } as any);
      const batch = writeBatch(firestore);
      const tripRef = doc(collection(firestore, "trips"));
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
        createdAt: new Date().toISOString(),
      };
      batch.set(tripRef, tripData);
      for (const day of aiResponse.days) {
        const dayRef = doc(collection(firestore, `trips/${tripRef.id}/itineraryDays`));
        batch.set(dayRef, { ...day, id: dayRef.id, tripId: tripRef.id, tripOwnerId: user.uid, tripAuthorizedUserIds: [user.uid] });
      }
      await batch.commit();
      router.push(`/trip/${tripRef.id}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const progressPct = (step / 4) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 relative overflow-hidden px-6">
        {/* Ambient orbs */}
        <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)", filter: "blur(80px)", top: "-5%", left: "10%" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", filter: "blur(80px)", bottom: "5%", right: "10%" }} />

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center animate-float-slow"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))",
            border: "1px solid rgba(99,102,241,0.35)",
            boxShadow: "0 0 40px rgba(99,102,241,0.3)",
          }}
        >
          <Sparkles className="w-9 h-9 text-primary animate-pulse" />
        </div>

        {/* Flux loader */}
        <ProgressiveFluxLoader
          duration={18}
          loop={false}
          showLabel
          phases={[
            { at: 0,   label: "Gathering intel..." },
            { at: 20,  label: "Designing routes..." },
            { at: 45,  label: "Optimising budget..." },
            { at: 70,  label: "Curating experiences..." },
            { at: 90,  label: "Almost ready..." },
            { at: 100, label: "Ready!" },
          ]}
          className="w-full max-w-md"
          textClassName="text-white"
        />

        <p className="text-muted-foreground text-sm text-center">
          Our AI is crafting your personalised itinerary
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader showBack backHref={isCollabMode ? "/collab" : "/dashboard"} title={isCollabMode ? "Room Adventure" : "New Adventure"} />

      {/* Background ambiance */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,212,184,0.06) 0%, transparent 70%)", filter: "blur(80px)", top: "-100px", right: "-100px" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(123,97,255,0.05) 0%, transparent 70%)", filter: "blur(80px)", bottom: "-100px", left: "-100px" }} />
      </div>

      <div className="flex-1 flex items-start justify-center p-4 md:p-8 pt-8 md:pt-12 relative z-10">
        <div className="w-full max-w-3xl space-y-8">

          {/* Step indicator */}
          <div className="space-y-5">
            {/* Step bubbles */}
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 font-bold"
                        style={
                          isCompleted
                            ? { background: "rgba(0,212,184,0.15)", border: "1px solid rgba(0,212,184,0.3)", color: "#00D4B8" }
                            : isActive
                            ? { background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", boxShadow: "0 0 20px rgba(0,212,184,0.4)", color: "hsl(222 47% 9%)" }
                            : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }
                        }
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest hidden sm:block"
                        style={{ color: isActive ? "#00D4B8" : "rgba(255,255,255,0.35)" }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-px mx-2" style={{ background: isCompleted ? "rgba(0,212,184,0.3)" : "rgba(255,255,255,0.08)" }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, hsl(172 100% 42%), #00fff2)",
                  boxShadow: "0 0 12px rgba(0,212,184,0.5)",
                }}
              />
            </div>
          </div>

          {/* Limit warning */}
          {isLimitReached && (
            <div
              className="flex items-start gap-4 p-5 rounded-2xl"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle className="text-destructive w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Free plan trip limit reached ({tripCount}/4)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Premium to plan unlimited adventures.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowPlanDialog(true)}
                className="shrink-0 rounded-xl font-bold"
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                Upgrade
              </Button>
            </div>
          )}

          {/* Collab notice */}
          {isCollabMode && userData?.activeCollabRoomId && (
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}
            >
              <UsersIcon className="text-accent w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold text-accent uppercase tracking-wider">Adding to Collab Room: {userData.activeCollabRoomId}</p>
            </div>
          )}

          {/* Main wizard card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,184,0.04) 0%, rgba(10,14,30,0.8) 50%, rgba(123,97,255,0.03) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Chromatic top bar */}
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #00D4B8, #7B61FF, #F5A623)" }} />

            <div className="p-5 sm:p-8 md:p-10">
              {/* ── STEP 1: Where & When ─────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">Where & When?</h2>
                    <p className="text-muted-foreground">Set your origin, destination, and travel dates.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PlaceAutocomplete id="origin" label="Flying From" value={originQuery} results={originResults} placeholder="Your departure city..." onChange={(v) => searchPlace(v, "origin")} onSelect={(i) => selectPlace(i, "origin")} />
                    <PlaceAutocomplete id="destination" label="Flying To" value={queryVal} results={searchResults} placeholder="Your dream destination..." onChange={(v) => searchPlace(v, "dest")} onSelect={(i) => selectPlace(i, "dest")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassInput id="startDate" label="Departure Date" type="date" icon={Calendar} value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} />
                    <GlassInput id="endDate" label="Return Date" type="date" icon={Calendar} value={formData.endDate} onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassInput id="travelers" label="Number of Travelers" type="number" min="1" icon={UsersIcon} placeholder="How many people?" value={formData.numTravelers || ""} onChange={(e) => setFormData((p) => ({ ...p, numTravelers: parseInt(e.target.value) || ("" as any) }))} />
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Travel Group</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {GROUP_TYPES.map((gt) => (
                          <button
                            key={gt.value}
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, groupType: gt.value as any }))}
                            className="h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 cursor-pointer"
                            style={
                              formData.groupType === gt.value
                                ? { background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", color: "hsl(222 47% 9%)", boxShadow: "0 0 16px rgba(0,212,184,0.3)" }
                                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
                            }
                          >
                            <span className="text-base">{gt.emoji}</span> {gt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Budget & Vibe ────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">Budget & Vibe</h2>
                    <p className="text-muted-foreground">How do you like to travel and what is your financial plan?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Currency</Label>
                      <Select value={formData.currency} onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}>
                        <SelectTrigger
                          className="h-14 rounded-2xl font-medium"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent
                          className="rounded-2xl"
                          style={{ background: "rgba(10,14,30,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {COMMON_CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.symbol} {c.code} — {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <GlassInput
                      id="budget"
                      label="Total Budget"
                      type="number"
                      icon={Wallet}
                      placeholder="Enter your budget amount"
                      value={formData.totalBudget || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, totalBudget: parseInt(e.target.value) || 0 }))}
                      hint="Across all travelers for the whole trip."
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Travel Style (Multi-select)</Label>
                    <div className="flex flex-wrap gap-3">
                      {TRAVEL_STYLES.map((s) => (
                        <Chip key={s.label} active={formData.travelStyle.includes(s.label)} onClick={() => toggleStyle(s.label)}>
                          <s.icon className="w-4 h-4" />
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Travel Pace</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PACE_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, pace: p.value as any }))}
                          className="p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer min-h-[80px]"
                          style={
                            formData.pace === p.value
                              ? { background: "linear-gradient(135deg, rgba(0,212,184,0.2), rgba(0,212,184,0.05))", border: "1px solid rgba(0,212,184,0.35)", boxShadow: "0 0 20px rgba(0,212,184,0.15)" }
                              : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
                          }
                        >
                          <div className="text-sm font-bold text-white mb-1">{p.label}</div>
                          <div className="text-[10px] text-muted-foreground">{p.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Preferences ─────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">Fine Preferences</h2>
                    <p className="text-muted-foreground">Help the AI craft the perfect tailored experience for you.</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Dietary Preference</Label>
                    <div className="flex flex-wrap gap-3">
                      {DIETARY.map((d) => (
                        <Chip
                          key={d}
                          active={formData.dietaryPreferences.includes(d)}
                          onClick={() => setFormData((p) => ({ ...p, dietaryPreferences: [d] as any }))}
                        >
                          {d}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  <GlassInput
                    id="must-include"
                    label="Must-See Places or Experiences"
                    placeholder="e.g. Eiffel Tower, local markets, cooking class..."
                    value={formData.mustIncludePlaces}
                    onChange={(e) => setFormData((p) => ({ ...p, mustIncludePlaces: e.target.value }))}
                    hint="AI will prioritise these in your itinerary."
                  />
                  <GlassInput
                    id="must-avoid"
                    label="Things to Avoid"
                    placeholder="e.g. crowded tourist traps, spicy food..."
                    value={formData.mustAvoid}
                    onChange={(e) => setFormData((p) => ({ ...p, mustAvoid: e.target.value }))}
                    hint="AI will exclude these from your plan."
                  />
                </div>
              )}

              {/* ── STEP 4: Review & Launch ──────────────────────────── */}
              {step === 4 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center">
                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                      style={{ background: "linear-gradient(135deg, rgba(0,212,184,0.2), rgba(123,97,255,0.1))", border: "1px solid rgba(0,212,184,0.3)", boxShadow: "0 0 40px rgba(0,212,184,0.2)" }}
                    >
                      <Plane className="w-9 h-9 text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">Ready to Fly?</h2>
                    <p className="text-muted-foreground">Review your adventure configuration and launch.</p>
                  </div>

                  {/* Summary card */}
                  <div
                    className="rounded-2xl p-6 space-y-4"
                    style={{ background: "rgba(0,212,184,0.04)", border: "1px solid rgba(0,212,184,0.12)" }}
                  >
                    {[
                      { label: "Route", value: `${formData.origin || "—"} → ${formData.destination || "—"}` },
                      { label: "Dates", value: `${formData.startDate || "—"} to ${formData.endDate || "—"}` },
                      { label: "Travelers", value: `${formData.numTravelers || "—"} ${formData.groupType}(s)` },
                      { label: "Budget", value: `${formData.totalBudget} ${formData.currency}` },
                      { label: "Style", value: formData.travelStyle.join(", ") || "Any" },
                      { label: "Pace", value: formData.pace },
                      { label: "Dietary", value: formData.dietaryPreferences.join(", ") },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-start gap-4 text-sm"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "12px" }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                        <span className="text-right font-medium text-white max-w-xs">{item.value}</span>
                      </div>
                    ))}
                    {isCollabMode && userData?.activeCollabRoomId && (
                      <p className="text-accent font-bold text-xs pt-2">Sharing with Collab Room: {userData.activeCollabRoomId}</p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className="btn-shimmer w-full h-16 text-lg rounded-2xl font-bold"
                    onClick={handleSubmit}
                    disabled={loading || isLimitReached}
                    style={{
                      background: isLimitReached ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))",
                      boxShadow: isLimitReached ? "none" : "0 0 40px rgba(0,212,184,0.35), 0 8px 24px rgba(0,0,0,0.4)",
                      color: isLimitReached ? "rgba(255,255,255,0.3)" : "hsl(222 47% 9%)",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="animate-spin w-5 h-5" /> Generating Itinerary...
                      </span>
                    ) : isLimitReached ? (
                      "Upgrade Required to Continue"
                    ) : (
                      <span className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5" /> Generate My Adventure
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {/* ── Navigation buttons ────────────────────────────────── */}
              {!loading && (
                <div className="flex justify-between items-center mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Button
                    variant="ghost"
                    disabled={step === 1}
                    onClick={handleBack}
                    className="h-12 px-6 rounded-2xl font-bold gap-2 disabled:opacity-30"
                    style={{ background: step > 1 ? "rgba(255,255,255,0.04)" : "transparent", border: step > 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>

                  {step < 4 && (
                    <Button
                      onClick={handleNext}
                      className="h-12 px-8 rounded-2xl font-bold gap-2"
                      style={{ background: "rgba(0,212,184,0.12)", border: "1px solid rgba(0,212,184,0.25)", color: "#00D4B8" }}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlanSelectionDialog open={showPlanDialog} onOpenChange={setShowPlanDialog} tripCount={tripCount} onSelectFree={() => setShowPlanDialog(false)} />
    </div>
  );
}

export default function TripWizard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "hsl(172 100% 42%)", borderRightColor: "rgba(0,212,184,0.2)" }} />
            <p className="text-muted-foreground text-sm animate-pulse">Loading Wizard...</p>
          </div>
        </div>
      }
    >
      <TripWizardContent />
    </Suspense>
  );
}
