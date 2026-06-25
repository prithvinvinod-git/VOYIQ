"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import FlowingMenu from "@/components/ui/FlowingMenu";
import { AppNavbar } from "@/components/layout/AppNavbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Compass, MapPin, Loader2 } from "lucide-react";
import { useFirestore, useUser, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, doc, writeBatch, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { generatePersonalizedItinerary } from "@/ai/flows/generate-personalized-itinerary";
import { useToast } from "@/hooks/use-toast";
import { ProgressiveFluxLoader } from "@/components/ui/progressive-flux-loader";
import Image from "next/image";

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 83.0,
  EUR: 0.92,
  GBP: 0.79,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

interface PlaceAutocompleteProps {
  id: string;
  label: string;
  value: string;
  results: any[];
  onChange: (v: string) => void;
  onSelect: (item: any) => void;
  placeholder: string;
}

function PlaceAutocomplete({
  id,
  label,
  value,
  results,
  onChange,
  onSelect,
  placeholder,
}: PlaceAutocompleteProps) {
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
          className="w-full h-10 pl-10 pr-3.5 rounded-xl text-sm font-medium text-white placeholder:text-white/30 bg-white/5 border border-white/10 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 outline-none"
        />
      </div>
      {results.length > 0 && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute top-full left-0 w-full mt-1.5 rounded-xl overflow-hidden z-50 bg-[#1a1b1e] border border-white/10 shadow-xl max-h-[160px] overflow-y-auto"
        >
          {results.map((item, i) => (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={false}
              className={`w-full p-2.5 text-left text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-150 ${i < results.length - 1 ? "border-b border-white/5" : ""}`}
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

const presetDestinations = [
  {
    name: "Switzerland",
    country: "Europe",
    tag: "Alpine Luxury",
    description: "Crown jewel of the Alps. From the Jungfrau's eternal snows to Lake Geneva's crystalline depths — a realm where nature paints in impossible shades.",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1600&q=80",
    price: "$1,800",
    rating: 4.9,
    bestTime: "Jun–Aug / Dec–Mar",
    style: "luxury",
    budget: 1800, // Medium budget in USD
    idealDays: 7,
  },
  {
    name: "Dubai",
    country: "UAE",
    tag: "Future Opulence",
    description: "A city sculpted from ambition. Where desert horizons meet architectural marvels and ancient souks trade stories beneath glass towers.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80",
    price: "$1,400",
    rating: 4.7,
    bestTime: "Nov–Mar",
    style: "luxury",
    budget: 1400,
    idealDays: 5,
  },
  {
    name: "Kerala",
    country: "India",
    tag: "God's Own Country",
    description: "Where emerald backwaters weave through palm-fringed shores and ancient Ayurveda traditions flow as gently as the houseboats on Vembanad Lake.",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1600&q=80",
    price: "$600",
    rating: 4.8,
    bestTime: "Oct–Mar",
    style: "balanced",
    budget: 600,
    idealDays: 6,
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    tag: "Overwater Paradise",
    description: "26 atolls strung like pearls across the equator. Where villas float on turquoise lagoons and the ocean floor becomes your ceiling.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80",
    price: "$1,900",
    rating: 4.9,
    bestTime: "Nov–Apr",
    style: "luxury",
    budget: 1900,
    idealDays: 5,
  },
  {
    name: "Iceland",
    country: "Nordic",
    tag: "Elemental Wild",
    description: "A land where fire and ice compose a symphony of extremes. Waterfalls thunder over ancient lava, geysers breathe skyward, and the aurora dances across Arctic nights.",
    image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80",
    bgImage: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1600&q=80",
    price: "$1,500",
    rating: 4.8,
    bestTime: "Jun–Aug / Sep–Mar",
    style: "adventure",
    budget: 1500,
    idealDays: 7,
  },
  {
    name: "Tokyo",
    country: "Japan",
    tag: "Trending",
    description: "Where neon-lit futurism meets ancient tranquility. From the serene Meiji Shrine to the electric streets of Shibuya — a city of perpetual discovery.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqvbe4a3pKRqZ5UoVUSvnEhC7xxNZoMbp-zCMo-a8N-x5s3aTk0BLSEYgmmOH_HO-Upz4zCDSY5Bw3hh7-1hvLAOsge-S3_lNaoYJRxpYnKUt1KYmgxLzhRH0LUhWAM4X2OLWG9xEe_ey0Zp98Btq3oU4T1YiAwuukTLN9ZxHarhRv1r19vyqkHHSRRTtnLCCbKdFYeTT-RdqDMVq-HfciYHjm6FScMv2-2R5rxmy7lcfvDayUGae2q-rDcrhLCh2POjFNqaBewj8",
    bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqvbe4a3pKRqZ5UoVUSvnEhC7xxNZoMbp-zCMo-a8N-x5s3aTk0BLSEYgmmOH_HO-Upz4zCDSY5Bw3hh7-1hvLAOsge-S3_lNaoYJRxpYnKUt1KYmgxLzhRH0LUhWAM4X2OLWG9xEe_ey0Zp98Btq3oU4T1YiAwuukTLN9ZxHarhRv1r19vyqkHHSRRTtnLCCbKdFYeTT-RdqDMVq-HfciYHjm6FScMv2-2R5rxmy7lcfvDayUGae2q-rDcrhLCh2POjFNqaBewj8",
    price: "$1,300",
    rating: 4.8,
    bestTime: "Mar–May / Sep–Nov",
    style: "balanced",
    budget: 1300,
    idealDays: 7,
  },
  {
    name: "Amalfi Coast",
    country: "Italy",
    tag: "Luxury",
    description: "A sun-drenched ribbon of pastel villages clinging to dramatic cliffs. Where limoncello flows and every curve reveals a view that steals your breath.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmall5gqWl3Llhpck8ISqwvE7A1JXLg_J4KRe8InMB87PlBhaCPR-r-EUjVRi7PXwukWGQgAT9dLFqo_IABn06lqu-gNHAKAzA2aEQgutS6v13cuP67rwMqDW7SdnnX_FLDdmN6JPvPyzQpLHxEiEzUO-U9eoObGD77zswLGOcmU0iyTFWjbNDKq27AeA0dVT7zXlR4NZLCkSnh0YvP2yS16P6vPLhtfYA6EO2KuKAjpHHcnUv_38odrWYichJSICHN2qJKTeEc5w",
    bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmall5gqWl3Llhpck8ISqwvE7A1JXLg_J4KRe8InMB87PlBhaCPR-r-EUjVRi7PXwukWGQgAT9dLFqo_IABn06lqu-gNHAKAzA2aEQgutS6v13cuP67rwMqDW7SdnnX_FLDdmN6JPvPyzQpLHxEiEzUO-U9eoObGD77zswLGOcmU0iyTFWjbNDKq27AeA0dVT7zXlR4NZLCkSnh0YvP2yS16P6vPLhtfYA6EO2KuKAjpHHcnUv_38odrWYichJSICHN2qJKTeEc5w",
    price: "$1,800",
    rating: 4.9,
    bestTime: "Apr–Oct",
    style: "luxury",
    budget: 1800,
    idealDays: 6,
  },
  {
    name: "Monteverde",
    country: "Costa Rica",
    tag: "Eco-friendly",
    description: "A misty cloudforest teeming with life. Where canopy bridges thread through emerald jungles and the call of the howler monkey is your morning alarm.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDszI0fASx7OWztcneFl4U_yfXZMA-txSMo9HxZaf52NphJ2cpUbBbVyBPyN1_55f9h5CdjoeA5sc6SHErLHZ6g2FYnoB0zrYVHZ6D3ZKx1FLV6qrY_u3t6j-y8UtiEdf8CXvsowoMj-_p9zwpMEs-2a0WIkR5mWFx_NEswfHGOqQ292XAnfOieFsDh2ajQjGF1b_HX1avGiAzbnZ049kTe6uEbkgFicD3-rOy0xgs2RCKKeSnzlNSvqz_BjTmQeG0xEhJrLxhdUs4",
    bgImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDszI0fASx7OWztcneFl4U_yfXZMA-txSMo9HxZaf52NphJ2cpUbBbVyBPyN1_55f9h5CdjoeA5sc6SHErLHZ6g2FYnoB0zrYVHZ6D3ZKx1FLV6qrY_u3t6j-y8UtiEdf8CXvsowoMj-_p9zwpMEs-2a0WIkR5mWFx_NEswfHGOqQ292XAnfOieFsDh2ajQjGF1b_HX1avGiAzbnZ049kTe6uEbkgFicD3-rOy0xgs2RCKKeSnzlNSvqz_BjTmQeG0xEhJrLxhdUs4",
    price: "$800",
    rating: 4.7,
    bestTime: "Dec–Apr",
    style: "adventure",
    budget: 800,
    idealDays: 5,
  },
];

const flowingMenuItems = presetDestinations.map((d) => {
  const styleMap: Record<string, string> = {
    luxury: "Luxury",
    adventure: "Adventure",
    balanced: "Culture",
  };
  const style = styleMap[d.style] || "Luxury";
  return {
    link: `/plan/new?destination=${encodeURIComponent(d.name)}&totalBudget=${d.budget}&travelStyle=${style}`,
    text: d.name,
    image: d.bgImage,
  };
});

export default function DestinationsPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDest, setSelectedDest] = useState<typeof presetDestinations[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numTravelers, setNumTravelers] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(false);
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<any[]>([]);

  const searchPlace = useCallback(async (val: string) => {
    setOriginQuery(val);
    if (val.length < 3) {
      setOriginResults([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`
      );
      const data = await res.json();
      setOriginResults(data);
    } catch {}
  }, []);

  const selectPlace = (item: any) => {
    setOrigin(item.display_name);
    setOriginQuery(item.display_name);
    setOriginResults([]);
  };

  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "trips"), where("ownerId", "==", user.uid));
  }, [firestore, user]);

  const { data: tripsData } = useCollection(tripsQuery);
  const tripCount = tripsData?.length || 0;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);
  const isPremium = userData?.isPremium || false;
  const isLimitReached = !isPremium && tripCount >= 4;

  const handleItemClick = (item: any) => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to plan and explore preset destinations." });
      router.push("/auth");
      return;
    }
    const dest = presetDestinations.find((d) => d.name === item.text);
    if (dest) {
      setSelectedDest(dest);
      setNumTravelers(1);
      setCurrency("USD");
      setOrigin("");
      setOriginQuery("");
      setOriginResults([]);
      setIsModalOpen(true);
    }
  };

  const handleExplore = async () => {
    if (!user || !firestore || !selectedDest) return;
    if (isLimitReached) {
      toast({ variant: "destructive", title: "Trip Limit Reached", description: "You have reached the free tier limit of 4 trips. Please upgrade to Premium." });
      return;
    }
    setLoading(true);
    setIsModalOpen(false);
    try {
      const idToken = (await user.getIdToken()) || "";
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // tomorrow
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + selectedDest.idealDays);
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      const exchangeRate = EXCHANGE_RATES[currency] || 1.0;
      const totalBudget = Math.round(selectedDest.budget * numTravelers * exchangeRate);

      const styleMap: Record<string, "Luxury" | "Adventure" | "Culture"> = {
        luxury: "Luxury",
        adventure: "Adventure",
        balanced: "Culture",
      };
      const mappedStyle = styleMap[selectedDest.style] || "Luxury";

      const requestPayload = {
        idToken,
        origin,
        destination: selectedDest.name,
        startDate: startDateStr,
        endDate: endDateStr,
        numTravelers,
        groupType: numTravelers === 1 ? "solo" : numTravelers === 2 ? "couple" : "friends",
        totalBudget,
        currency,
        travelStyle: [mappedStyle],
        pace: "Balanced",
        dietaryPreferences: ["No preference"],
        mobilityNeeds: false,
        mustIncludePlaces: "",
        mustAvoid: ""
      };

      const aiResponse = await generatePersonalizedItinerary(requestPayload as any);
      
      const batch = writeBatch(firestore);
      const tripRef = doc(collection(firestore, "trips"));
      const tripData = {
        id: tripRef.id,
        ownerId: user.uid,
        authorizedUserIds: [user.uid],
        collabRoomId: null,
        origin,
        destination: selectedDest.name,
        startDate: startDateStr,
        endDate: endDateStr,
        numTravelers,
        groupType: numTravelers === 1 ? "solo" : numTravelers === 2 ? "couple" : "friends",
        totalBudget,
        currency,
        travelStyle: [mappedStyle],
        pace: "Balanced",
        dietaryPreferences: ["No preference"],
        mobilityNeeds: false,
        mustIncludePlaces: "",
        mustAvoid: "",
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
      toast({ variant: "destructive", title: "Generation Failed", description: e.message || "Could not generate preset trip." });
      setLoading(false);
    }
  };

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
              src="/logo.png"
              alt="Voyiq Logo"
              width={112}
              height={112}
              className="object-contain filter drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
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
            Our AI is crafting your personalised itinerary for {selectedDest?.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex flex-col min-h-screen bg-[#111415] text-white antialiased selection:bg-white selection:text-[#111415] font-inter">
      <AppNavbar />

      <section className="relative h-screen w-full pt-16 md:pt-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-50">
            <source src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(17,20,21,0.5) 55%, rgba(17,20,21,0.8) 75%, #111415 88%, #111415 100%)` }} />
        </div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-5 pt-16 md:pt-8">
            <div className={`transition-all duration-1000 mt-4 md:mt-24 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <h1 className="font-amoria text-[32px] md:text-[60px] lg:text-[80px] leading-[1.05] tracking-[0.02em] font-bold text-white mb-3 md:mb-4 text-center drop-shadow-md">
                Explore the{" "}
                <span className="font-instrument-serif italic text-[#dbe1ff] hover:bg-gradient-to-r hover:from-amber-300 hover:via-yellow-200 hover:to-amber-400 hover:bg-clip-text hover:text-transparent transition-all duration-500">Extraordinary</span>
              </h1>
              <p className="text-[15px] md:text-[18px] leading-[1.6] text-[#c4c7c8] max-w-xl mx-auto text-center mb-6 md:mb-8">
                Select a preset destination and let Voyiq's AI generate a complete, optimized itinerary based on your preferences.
              </p>
            </div>
          </div>
          <div className={`h-[65vh] md:h-[85vh] w-full max-w-5xl mx-auto px-4 md:px-8 pb-4 md:pb-8 transition-all duration-1000 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
              <FlowingMenu
                items={flowingMenuItems}
                speed={20}
                textColor="#ffffff"
                bgColor="rgba(17,20,21,0.6)"
                marqueeBgColor="rgba(255,255,255,0.95)"
                marqueeTextColor="#111415"
                borderColor="rgba(255,255,255,0.12)"
                autoPlay={true}
                autoPlayInterval={2000}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Preset Trip Parameter Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md w-full bg-[#111415]/95 border border-white/10 text-white rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-400" /> Explore {selectedDest?.name}
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">
              Confirm preset parameters below to build your custom trip dashboard.
            </p>
          </DialogHeader>

          {selectedDest && (
            <div className="space-y-4 py-4">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Ideal Duration:</span>
                  <span className="font-bold text-blue-300">{selectedDest.idealDays} Days</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Travel Style:</span>
                  <span className="font-bold text-violet-300 capitalize">{selectedDest.style}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Best Time to Visit:</span>
                  <span className="font-bold text-emerald-300">{selectedDest.bestTime}</span>
                </div>
              </div>

              <PlaceAutocomplete
                id="modal-origin"
                label="Flying From"
                value={originQuery}
                results={originResults}
                placeholder="Your departure city..."
                onChange={searchPlace}
                onSelect={selectPlace}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-travelers" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Travelers</label>
                  <Select value={String(numTravelers)} onValueChange={(val) => setNumTravelers(Number(val))}>
                    <SelectTrigger id="modal-travelers" className="bg-white/5 border-white/10 text-sm h-10 rounded-xl text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b1e] border-white/10 text-white rounded-xl">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={String(n)} className="text-xs">
                          {n} Traveler{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-currency" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Currency</label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                    <SelectTrigger id="modal-currency" className="bg-white/5 border-white/10 text-sm h-10 rounded-xl text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1b1e] border-white/10 text-white rounded-xl">
                      {["USD", "INR", "EUR", "GBP"].map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c} ({CURRENCY_SYMBOLS[c]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Live converted budget view */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 flex flex-col justify-center items-center gap-1.5">
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Total Preset Budget</span>
                <span className="text-2xl font-black text-white tracking-tight">
                  {CURRENCY_SYMBOLS[currency]} {Math.round(selectedDest.budget * numTravelers * EXCHANGE_RATES[currency]).toLocaleString()}
                </span>
                <span className="text-[10px] text-white/40 font-medium">
                  {CURRENCY_SYMBOLS["USD"]} {(selectedDest.budget * numTravelers).toLocaleString()} USD equivalent
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 border border-white/10 h-10 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExplore}
              className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold gap-2 shadow-lg shadow-blue-500/20 h-10 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> Explore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="bg-[#0c0f10] border-t border-white/10 py-10 md:py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-16 gap-6 max-w-[1280px] mx-auto">
          <div className="text-[22px] md:text-[24px] leading-[1.2] font-semibold text-white font-amoria">Voyiq.</div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Support", "Press Kit"].map((label) => (
              <a key={label} className="text-[14px] md:text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors" href="#">{label}</a>
            ))}
          </div>
          <div className="text-[14px] md:text-[16px] leading-[1.5] text-[#c4c7c8]">&copy; 2024 Voyiq AI Travel. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
