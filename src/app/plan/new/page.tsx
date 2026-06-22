
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
  User,
  HeartHandshake,
  UsersRound,
  PartyPopper,
} from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, writeBatch, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedItinerary } from "@/ai/flows/generate-personalized-itinerary";
import { Badge } from "@/components/ui/badge";
import { AppNavbar } from "@/components/layout/AppNavbar";
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
  { value: "solo", label: "Solo", icon: User },
  { value: "couple", label: "Couple", icon: HeartHandshake },
  { value: "family", label: "Family", icon: UsersRound },
  { value: "friends", label: "Friends", icon: PartyPopper },
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
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${className} ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}
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
        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        )}
        <input
          id={id}
          {...props}
          className={`w-full h-14 rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 outline-none bg-secondary border border-border focus:ring-2 focus:ring-ring ${Icon ? "pl-11" : "pl-4"} pr-4`}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground/70 pl-1" id={`${id}-hint`}>{hint}</p>}
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
        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 pl-11 pr-4 rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 bg-secondary border border-border focus:ring-2 focus:ring-ring"
        />
      </div>
      {results.length > 0 && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute top-full left-0 w-full mt-2 rounded-2xl overflow-hidden z-50 bg-popover border border-border"
        >
          {results.map((item, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={false}
              className={`w-full p-4 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors duration-150 ${i < results.length - 1 ? "border-b border-border" : ""}`}
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 relative px-6">

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center animate-float-slow bg-primary/10 border border-primary/30"
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[550px] h-[550px] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-500/8 blur-[110px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>
      <AppNavbar />

      <div className="flex-1 flex items-start justify-center p-4 md:p-8 pt-24 md:pt-28 relative z-10">
        <div className="w-full max-w-3xl">

          <div className="glass-panel p-6 md:p-8 space-y-8">

          {/* Step indicator */}
          <nav aria-label="Trip creation progress" className="space-y-5">
            {/* Step bubbles */}
            <div className="flex items-center justify-between" role="list">
              {STEPS.map((s, i) => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center gap-2" role="listitem" aria-current={isActive ? "step" : undefined}>
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 font-bold ${isCompleted ? "bg-primary/15 border border-primary/30 text-primary" : isActive ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-muted-foreground/50"}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <s.icon className="w-5 h-5" aria-hidden="true" />}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 ${isCompleted ? "bg-primary/30" : "bg-border"}`} role="presentation" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full overflow-hidden bg-secondary" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full transition-all duration-700 bg-primary"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </nav>

          {/* Limit warning */}
          {isLimitReached && (
            <div
              className="flex items-start gap-4 p-5 rounded-2xl bg-destructive/10 border border-destructive/20"
              role="alert"
            >
              <AlertCircle className="text-destructive w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Free plan trip limit reached ({tripCount}/4)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Premium to plan unlimited adventures.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowPlanDialog(true)}
                variant="outline"
                className="shrink-0 rounded-xl font-bold text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Upgrade
              </Button>
            </div>
          )}

          {/* Collab notice */}
          {isCollabMode && userData?.activeCollabRoomId && (
            <div
              className="flex items-center gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20"
            >
              <UsersIcon className="text-accent w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs font-bold text-accent uppercase tracking-wider">Adding to Collab Room: {userData.activeCollabRoomId}</p>
            </div>
          )}

          {/* Main wizard card */}
          <div
            className="rounded-2xl overflow-hidden glass-panel"
          >
            {/* Chromatic top bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

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
                    <fieldset className="space-y-2">
                      <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Travel Group</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {GROUP_TYPES.map((gt) => {
                          const Icon = gt.icon;
                          return (
                            <button
                              key={gt.value}
                              type="button"
                              role="radio"
                              aria-checked={formData.groupType === gt.value}
                              onClick={() => setFormData((p) => ({ ...p, groupType: gt.value as any }))}
                              className={`h-14 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${formData.groupType === gt.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}
                            >
                              <Icon className="w-4 h-4" aria-hidden="true" /> {gt.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
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
                      <Label htmlFor="currency" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Currency</Label>
                      <Select value={formData.currency} onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}>
                        <SelectTrigger id="currency" className="h-14 rounded-2xl font-medium">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
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

                  <fieldset className="space-y-3">
                    <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Travel Style (Multi-select)</legend>
                    <div className="flex flex-wrap gap-3">
                      {TRAVEL_STYLES.map((s) => (
                        <Chip key={s.label} active={formData.travelStyle.includes(s.label)} onClick={() => toggleStyle(s.label)}>
                          <s.icon className="w-4 h-4" />
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Travel Pace</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {PACE_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          role="radio"
                          aria-checked={formData.pace === p.value}
                          onClick={() => setFormData((prev) => ({ ...prev, pace: p.value as any }))}
                          className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer min-h-[80px] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${formData.pace === p.value ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"}`}
                        >
                          <div className="text-sm font-bold text-foreground mb-1">{p.label}</div>
                          <div className="text-[10px] text-muted-foreground">{p.sub}</div>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {/* ── STEP 3: Preferences ─────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">Fine Preferences</h2>
                    <p className="text-muted-foreground">Help the AI craft the perfect tailored experience for you.</p>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dietary Preference</legend>
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
                  </fieldset>

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
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 glass-panel border-blue-500/20"
                    >
                      <Plane className="w-9 h-9 text-blue-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">Ready to Fly?</h2>
                    <p className="text-muted-foreground">Review your adventure configuration and launch.</p>
                  </div>

                  {/* Summary card */}
                  <div
                    className="rounded-2xl p-6 space-y-4 glass-panel"
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
                        className="flex justify-between items-start gap-4 text-sm border-b border-border pb-3"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                        <span className="text-right font-medium text-foreground max-w-xs">{item.value}</span>
                      </div>
                    ))}
                    {isCollabMode && userData?.activeCollabRoomId && (
                      <p className="text-accent font-bold text-xs pt-2">Sharing with Collab Room: {userData.activeCollabRoomId}</p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-16 text-lg rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSubmit}
                    disabled={loading || isLimitReached}
                  >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" /> Generating Itinerary...
                      </span>
                    ) : isLimitReached ? (
                      "Upgrade Required to Continue"
                    ) : (
                      <span className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5" aria-hidden="true" /> Generate My Adventure
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {/* ── Navigation buttons ────────────────────────────────── */}
              {!loading && (
                <nav aria-label="Wizard navigation" className="flex justify-between items-center mt-10 pt-8 border-t border-border">
                  <Button
                    variant="ghost"
                    disabled={step === 1}
                    onClick={handleBack}
                    className="h-12 px-6 rounded-2xl font-bold gap-2 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
                  </Button>

                  {step < 4 && (
                    <Button
                      onClick={handleNext}
                      variant="secondary"
                      className="h-12 px-8 rounded-2xl font-bold gap-2"
                    >
                      Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  )}
                </nav>
              )}
            </div>
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
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground text-sm animate-pulse">Loading Wizard...</p>
          </div>
        </div>
      }
    >
      <TripWizardContent />
    </Suspense>
  );
}
