
"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  Route,
  DollarSign,
  Smile,
} from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, writeBatch, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedItinerary } from "@/ai/flows/generate-personalized-itinerary";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { ProgressiveFluxLoader } from "@/components/ui/progressive-flux-loader";
import Image from "next/image";
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
  { num: 1, label: "Route", icon: Route },
  { num: 2, label: "Budget", icon: DollarSign },
  { num: 3, label: "Vibe", icon: Smile },
  { num: 4, label: "Launch", icon: Sparkles },
];

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
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${className} ${active ? "bg-blue-500/20 border border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]" : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"}`}
    >
      {children}
    </button>
  );
}

function GlassInput({
  id,
  label,
  icon,
  hint,
  ...props
}: {
  id: string;
  label: string;
  icon?: React.ElementType;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const Icon = icon as React.ComponentType<{ className?: string; "aria-hidden"?: string }> | undefined;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-widest text-white/40"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400/60 pointer-events-none" aria-hidden="true" />
        )}
        <input
          id={id}
          {...props}
          className={`w-full h-11 rounded-xl text-sm font-medium text-white placeholder:text-white/30 bg-white/5 border border-white/10 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 outline-none ${Icon ? "pl-10" : "pl-3.5"} pr-3.5`}
        />
      </div>
      {hint && <p className="text-[10px] text-white/25 pl-1">{hint}</p>}
    </div>
  );
}

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
    <div className="relative space-y-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-widest text-white/40"
      >
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400/60 pointer-events-none" aria-hidden="true" />
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
          className="w-full h-11 pl-10 pr-3.5 rounded-xl text-sm font-medium text-white placeholder:text-white/30 bg-white/5 border border-white/10 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 outline-none"
        />
      </div>
      {results.length > 0 && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute top-full left-0 w-full mt-1.5 rounded-xl overflow-hidden z-50 bg-[#1a1b1e] border border-white/10 shadow-xl"
        >
          {results.map((item, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={false}
              className={`w-full p-3 text-left text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-150 ${i < results.length - 1 ? "border-b border-white/5" : ""}`}
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

function TripWizardContent() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const isCollabMode = searchParams.get("collab") === "true";
  const prefilledOrigin = searchParams.get("origin") || "";
  const prefilledDest = searchParams.get("destination") || "";
  const prefilledTravelers = searchParams.get("numTravelers");
  const prefilledBudget = searchParams.get("totalBudget");
  const prefilledCurrency = searchParams.get("currency");
  const prefilledStyle = searchParams.get("travelStyle");

  const [queryVal, setQueryVal] = useState(prefilledDest);
  const [originQuery, setOriginQuery] = useState(prefilledOrigin);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  const [formData, setFormData] = useState({
    origin: prefilledOrigin || "",
    destination: prefilledDest || "",
    startDate: "",
    endDate: "",
    numTravelers: prefilledTravelers ? parseInt(prefilledTravelers) : ("" as unknown as number),
    groupType: "solo" as any,
    totalBudget: prefilledBudget ? parseInt(prefilledBudget) : 0,
    currency: prefilledCurrency || "USD",
    travelStyle: prefilledStyle
      ? prefilledStyle.split(",").map((s) => {
          const trimmed = s.trim();
          const lower = trimmed.toLowerCase();
          if (lower === "luxury") return "Luxury";
          if (lower === "adventure") return "Adventure";
          if (lower === "balanced" || lower === "culture") return "Culture";
          if (lower === "food") return "Food";
          if (lower === "nature") return "Nature";
          if (lower === "budget") return "Budget";
          if (lower === "wellness") return "Wellness";
          if (lower === "backpacking") return "Backpacking";
          return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        })
      : ([] as string[]),
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
      <div className="min-h-screen bg-[#111415] flex flex-col items-center justify-center gap-10 relative overflow-hidden px-6">
        {/* Video background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-25">
            <source src="/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4" type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, rgba(17,20,21,0.2) 0%, #111415 100%)`,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-10 max-w-md w-full">
          <style>{`
            @keyframes oscillate {
              0%, 100% { transform: translateY(0px) rotate(-3deg) scale(1); }
              50% { transform: translateY(-15px) rotate(3deg) scale(1.05); }
            }
            .animate-oscillate {
              animation: oscillate 4s ease-in-out infinite;
            }
          `}</style>
          <div className="relative w-28 h-28 animate-oscillate flex items-center justify-center">
            <Image
              src="/whitelogo.png"
              alt="Voyiq Logo"
              width={112}
              height={112}
              className="object-contain"
              priority
            />
          </div>
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
            className="w-full"
            textClassName="text-white"
          />
          <p className="text-white/40 text-sm text-center">
            Our AI is crafting your personalised itinerary
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111415] text-white overflow-x-hidden relative">
      {/* Video background */}
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

      <div className="relative z-10 flex-1 flex items-start justify-center p-4 md:p-6 pt-24 md:pt-28">
        <div className="w-full max-w-4xl">

          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Chromatic top bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />

            <div className="p-5 sm:p-7 md:p-8">

              {/* ── Compact Stepper ── */}
              <div className="mb-6">
                <div className="flex items-center justify-between" role="list">
                  {STEPS.map((s, i) => {
                    const isCompleted = step > s.num;
                    const isActive = step === s.num;
                    return (
                      <React.Fragment key={s.num}>
                        <div className="flex items-center gap-2" role="listitem" aria-current={isActive ? "step" : undefined}>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 text-xs font-bold ${
                              isCompleted
                                ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                                : isActive
                                ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                                : "bg-white/5 border border-white/10 text-white/30"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${
                              isActive ? "text-blue-300" : isCompleted ? "text-white/80" : "text-white/50"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-[2px] mx-2 rounded-full ${isCompleted ? "bg-blue-500/40" : "bg-white/10"}`} role="presentation" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                {/* Thin progress bar */}
                <div className="mt-3 h-1 rounded-full overflow-hidden bg-white/5" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Limit warning */}
              {isLimitReached && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-5" role="alert">
                  <AlertCircle className="text-red-400 w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Free plan trip limit reached ({tripCount}/4)</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Upgrade to Premium to plan unlimited adventures.</p>
                  </div>
                  <Button size="sm" onClick={() => setShowPlanDialog(true)} variant="outline" className="shrink-0 rounded-lg text-[10px] font-bold text-red-400 border-red-500/30 hover:bg-red-500/10 px-3 h-8">
                    Upgrade
                  </Button>
                </div>
              )}

              {/* Collab notice */}
              {isCollabMode && userData?.activeCollabRoomId && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-5">
                  <UsersIcon className="text-blue-400 w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Adding to Collab Room: {userData.activeCollabRoomId}</p>
                </div>
              )}

              {/* ── STEP 1: Where & When ── */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-white">Where & When?</h2>
                    <p className="text-xs text-white/40 mt-0.5">Set your origin, destination, and travel dates.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PlaceAutocomplete id="origin" label="Flying From" value={originQuery} results={originResults} placeholder="Your departure city..." onChange={(v) => searchPlace(v, "origin")} onSelect={(i) => selectPlace(i, "origin")} />
                    <PlaceAutocomplete id="destination" label="Flying To" value={queryVal} results={searchResults} placeholder="Your dream destination..." onChange={(v) => searchPlace(v, "dest")} onSelect={(i) => selectPlace(i, "dest")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput id="startDate" label="Departure Date" type="date" icon={Calendar} value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} />
                    <GlassInput id="endDate" label="Return Date" type="date" icon={Calendar} value={formData.endDate} onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput id="travelers" label="Number of Travelers" type="number" min="1" icon={UsersIcon} placeholder="How many people?" value={formData.numTravelers || ""} onChange={(e) => setFormData((p) => ({ ...p, numTravelers: parseInt(e.target.value) || ("" as any) }))} />
                    <fieldset className="space-y-1.5">
                      <legend className="text-[10px] font-bold uppercase tracking-widest text-white/40">Travel Group</legend>
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
                              className={`h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${formData.groupType === gt.value ? "bg-blue-500/20 border border-blue-500/40 text-blue-300" : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"}`}
                            >
                              <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {gt.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Budget & Vibe ── */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-white">Budget & Vibe</h2>
                    <p className="text-xs text-white/40 mt-0.5">How do you like to travel and what is your financial plan?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="currency" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Currency</label>
                      <Select value={formData.currency} onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}>
                        <SelectTrigger id="currency" className="h-11 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-[#1a1b1e] border border-white/10 text-white">
                          {COMMON_CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-sm">
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

                  <fieldset className="space-y-2">
                    <legend className="text-[10px] font-bold uppercase tracking-widest text-white/40">Travel Style (Multi-select)</legend>
                    <div className="flex flex-wrap gap-2">
                      {TRAVEL_STYLES.map((s) => (
                        <Chip key={s.label} active={formData.travelStyle.includes(s.label)} onClick={() => toggleStyle(s.label)}>
                          <s.icon className="w-3.5 h-3.5" />
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-2">
                    <legend className="text-[10px] font-bold uppercase tracking-widest text-white/40">Travel Pace</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PACE_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          role="radio"
                          aria-checked={formData.pace === p.value}
                          onClick={() => setFormData((prev) => ({ ...prev, pace: p.value as any }))}
                          className={`p-3 rounded-xl text-left transition-all duration-200 cursor-pointer min-h-[60px] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${formData.pace === p.value ? "bg-blue-500/10 border border-blue-500/30" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
                        >
                          <div className="text-xs font-bold text-white mb-0.5">{p.label}</div>
                          <div className="text-[9px] text-white/40">{p.sub}</div>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {/* ── STEP 3: Preferences ── */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-white">Fine Preferences</h2>
                    <p className="text-xs text-white/40 mt-0.5">Help the AI craft the perfect tailored experience for you.</p>
                  </div>

                  <fieldset className="space-y-2">
                    <legend className="text-[10px] font-bold uppercase tracking-widest text-white/40">Dietary Preference</legend>
                    <div className="flex flex-wrap gap-2">
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

              {/* ── STEP 4: Review & Launch ── */}
              {step === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-blue-500/10 border border-blue-500/30">
                      <Plane className="w-7 h-7 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-headline font-bold text-white">Ready to Fly?</h2>
                    <p className="text-xs text-white/40 mt-0.5">Review your adventure configuration and launch.</p>
                  </div>

                  <div className="rounded-xl p-5 space-y-3 bg-white/5 border border-white/10">
                    {[
                      { label: "Route", value: `${formData.origin || "—"} → ${formData.destination || "—"}` },
                      { label: "Dates", value: `${formData.startDate || "—"} to ${formData.endDate || "—"}` },
                      { label: "Travelers", value: `${formData.numTravelers || "—"} ${formData.groupType}(s)` },
                      { label: "Budget", value: `${formData.totalBudget} ${formData.currency}` },
                      { label: "Style", value: formData.travelStyle.join(", ") || "Any" },
                      { label: "Pace", value: formData.pace },
                      { label: "Dietary", value: formData.dietaryPreferences.join(", ") },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-start gap-4 border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{item.label}</span>
                        <span className="text-right text-xs font-medium text-white/80 max-w-xs">{item.value}</span>
                      </div>
                    ))}
                    {isCollabMode && userData?.activeCollabRoomId && (
                      <p className="text-blue-300 font-bold text-[10px] pt-1">Sharing with Collab Room: {userData.activeCollabRoomId}</p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 text-sm rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    onClick={handleSubmit}
                    disabled={loading || isLimitReached}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4" aria-hidden="true" /> Generating Itinerary...
                      </span>
                    ) : isLimitReached ? (
                      "Upgrade Required to Continue"
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" aria-hidden="true" /> Generate My Adventure
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {/* ── Navigation ── */}
              {!loading && (
                <nav aria-label="Wizard navigation" className="flex justify-between items-center mt-6 pt-5 border-t border-white/10">
                  <Button
                    variant="ghost"
                    disabled={step === 1}
                    onClick={handleBack}
                    className="h-10 px-5 rounded-xl font-bold gap-1.5 text-xs disabled:opacity-30 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back
                  </Button>

                  {step < 4 && (
                    <Button
                      onClick={handleNext}
                      className="h-10 px-6 rounded-xl font-bold gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </nav>
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
        <div className="min-h-screen bg-[#111415] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-400 animate-spin" />
            <p className="text-white/40 text-xs animate-pulse">Loading Wizard...</p>
          </div>
        </div>
      }
    >
      <TripWizardContent />
    </Suspense>
  );
}
