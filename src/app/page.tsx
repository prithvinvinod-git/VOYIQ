"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import {
  ArrowRight,
  ArrowLeft,
  Star,
  MapPin,
  Brain,
  Wallet,
  Users,
  Calendar,
  Map,
  FileText,
  TrendingUp,
  Gem,
  Mountain,
  Leaf,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import CardSwap, { Card as SwapCard } from "@/components/ui/CardSwap";
import dynamic from "next/dynamic";
const Lanyard = dynamic(() => import("@/components/ui/Lanyard"), { ssr: false });

function useCounter(target: number, enabled: boolean, decimals = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const speed = 200;
    const inc = target / speed;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(decimals > 0 ? +current.toFixed(decimals) : Math.ceil(current));
      }
    }, 10);
    return () => clearInterval(timer);
  }, [enabled, target, decimals]);
  return count;
}

export default function LandingPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "trips"),
      where("ownerId", "==", user.uid)
    );
  }, [firestore, user]);
  const { data: tripsData } = useCollection(tripsQuery);

  const tripCount = tripsData?.length || 0;
  const isPremium = userData?.isPremium || false;
  const isLimitReached = !isPremium && tripCount >= 4;

  const handleProceed = () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (isLimitReached) {
      setIsPlanDialogOpen(true);
    } else {
      router.push("/plan/new");
    }
  };

  const [genDeparture, setGenDeparture] = useState("");
  const [genDestination, setGenDestination] = useState("");
  const [genTravelers, setGenTravelers] = useState<number | "">("");
  const [genBudget, setGenBudget] = useState<number | "">("");
  const [genCurrency, setGenCurrency] = useState("USD");
  const [genStyles, setGenStyles] = useState<string[]>([]);

  const handleGenTrip = () => {
    if (!user) { router.push("/auth"); return; }
    const params = new URLSearchParams();
    if (genDeparture) params.set("origin", genDeparture);
    if (genDestination) params.set("destination", genDestination);
    if (genTravelers) params.set("numTravelers", String(genTravelers));
    if (genBudget) params.set("totalBudget", String(genBudget));
    if (genCurrency) params.set("currency", genCurrency);
    if (genStyles.length > 0) params.set("travelStyle", genStyles.join(","));
    router.push(`/plan/new?${params.toString()}`);
  };

  useEffect(() => {
    const els = document.querySelectorAll(".reveal-stitch");
    const observers: IntersectionObserver[] = [];
    els.forEach((el) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("active");
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    const grid = document.getElementById("features-grid");
    if (!grid) return;
    const handler = (e: MouseEvent) => {
      document.querySelectorAll(".spotlight-card").forEach((card) => {
        const rect = card.getBoundingClientRect();
        (card as HTMLElement).style.setProperty(
          "--mouse-x",
          `${e.clientX - rect.left}px`
        );
        (card as HTMLElement).style.setProperty(
          "--mouse-y",
          `${e.clientY - rect.top}px`
        );
      });
    };
    grid.addEventListener("mousemove", handler);
    return () => grid.removeEventListener("mousemove", handler);
  }, []);

  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#111415";
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  const [countersVisible, setCountersVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const travelers = useCounter(10, countersVisible);
  const countries = useCounter(50, countersVisible);
  const tripsPlanned = useCounter(1, countersVisible);
  const rating = useCounter(4.9, countersVisible, 1);

  const destRef = useRef<HTMLDivElement>(null);
  const scrollDest = (dir: "left" | "right") => {
    destRef.current?.scrollBy({
      left: dir === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);



  const destinations = [
    {
      name: "Tokyo",
      country: "Japan",
      price: "$2,400",
      tag: "Trending",
      tagIcon: TrendingUp,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAqvbe4a3pKRqZ5UoVUSvnEhC7xxNZoMbp-zCMo-a8N-x5s3aTk0BLSEYgmmOH_HO-Upz4zCDSY5Bw3hh7-1hvLAOsge-S3_lNaoYJRxpYnKUt1KYmgxLzhRH0LUhWAM4X2OLWG9xEe_ey0Zp98Btq3oU4T1YiAwuukTLN9ZxHarhRv1r19vyqkHHSRRTtnLCCbKdFYeTT-RdqDMVq-HfciYHjm6FScMv2-2R5rxmy7lcfvDayUGae2q-rDcrhLCh2POjFNqaBewj8",
    },
    {
      name: "Amalfi Coast",
      country: "Italy",
      price: "$3,800",
      tag: "Luxury",
      tagIcon: Gem,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAmall5gqWl3Llhpck8ISqwvE7A1JXLg_J4KRe8InMB87PlBhaCPR-r-EUjVRi7PXwukWGQgAT9dLFqo_IABn06lqu-gNHAKAzA2aEQgutS6v13cuP67rwMqDW7SdnnX_FLDdmN6JPvPyzQpLHxEiEzUO-U9eoObGD77zswLGOcmU0iyTFWjbNDKq27AeA0dVT7zXlR4NZLCkSnh0YvP2yS16P6vPLhtfYA6EO2KuKAjpHHcnUv_38odrWYichJSICHN2qJKTeEc5w",
    },
    {
      name: "Reykjavik",
      country: "Iceland",
      price: "$1,900",
      tag: "Adventure",
      tagIcon: Mountain,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD118ctIjik3J_AWnOGgErTB-mkU318btY-UejdoBJF0WFauPFf4bVQu5n1-lP6bJRnJb-6-zSTxWR9WgRM7hC61CotLAV0dINKfZXvQ9B3KBOg6oJoZAV7Qt0JPKssxinM8QB1f-ieOpnW87DH-QTKEfzJ90ed0wbKSDZYE9MZL7FFKE_ZEORHCvZEWyxGeghDDWudqIGMe2gh-SpiL3f0rnqAUS3ybvVj8ZwMj1Xa1sPSbj3nXwocryg0ZfcWnrW2c8aofMGXlQU",
    },
    {
      name: "Monteverde",
      country: "Costa Rica",
      price: "$1,500",
      tag: "Eco-friendly",
      tagIcon: Leaf,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDszI0fASx7OWztcneFl4U_yfXZMA-txSMo9HxZaf52NphJ2cpUbBbVyBPyN1_55f9h5CdjoeA5sc6SHErLHZ6g2FYnoB0zrYVHZ6D3ZKx1FLV6qrY_u3t6j-y8UtiEdf8CXvsowoMj-_p9zwpMEs-2a0WIkR5mWFx_NEswfHGOqQ292XAnfOieFsDh2ajQjGF1b_HX1avGiAzbnZ049kTe6uEbkgFicD3-rOy0xgs2RCKKeSnzlNSvqz_BjTmQeG0xEhJrLxhdUs4",
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI Travel Brain",
      desc: "A sophisticated neural engine that learns your preferences, dynamically suggesting hidden gems and optimal routes.",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
    },
    {
      icon: Wallet,
      title: "BudgetSync",
      desc: "Real-time financial tracking integrated directly into your itinerary. Predictive algorithms prevent overspending.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
    },
    {
      icon: Users,
      title: "Collaborative Canvas",
      desc: "Invite friends and family to a multiplayer workspace. Vote on activities, share notes, and finalize plans synchronously.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
    },
    {
      icon: Calendar,
      title: "Smart Itineraries",
      desc: "Fluid scheduling that automatically adjusts when flights are delayed or reservations change. Total peace of mind.",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
    },
    {
      icon: Map,
      title: "Spatial Mapping",
      desc: "High-fidelity, 3D interactive maps that plot your day seamlessly, minimizing transit time and maximizing exploration.",
      image: "https://images.unsplash.com/photo-1526778548025-fa2f459b5eb9?w=600&q=80",
    },
    {
      icon: FileText,
      title: "Cinematic Export",
      desc: "Generate stunning, magazine-quality PDF briefs of your trip. Perfect for offline viewing or printing as a keepsake.",
      image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=600&q=80",
    },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#111415] text-white antialiased selection:bg-white selection:text-[#111415] font-inter">
      <nav
        className="bg-white/60 backdrop-blur-md rounded-full shadow-sm pl-4 pr-2 py-2 flex items-center justify-between w-full md:w-fit mx-auto fixed top-4 left-1/2 -translate-x-1/2 z-[9999] md:gap-8 transition-all duration-300 hover:bg-white/70 max-w-[95vw]"
        role="navigation"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-[#2f3131] mr-4 sm:mr-8 transition-transform hover:scale-95 active:scale-90"
        >
          <Image src="/logo.png" alt="Voyiq" width={28} height={28} className="object-contain" />
          <span className="font-amoria text-2xl text-[#2f3131] tracking-[0.02em]">
            Voyiq.
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a className="text-[16px] leading-[1.5] text-[#444748] hover:text-black transition-colors" href="#">
            Destinations
          </a>
          <Link className="text-[16px] leading-[1.5] text-[#444748] hover:text-black transition-colors" href="/pricing">
            Pricing
          </Link>
          <Link className="text-[16px] leading-[1.5] text-[#444748] hover:text-black transition-colors" href="/dashboard">
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleProceed}
            className="bg-[#111415] text-white px-4 md:px-6 py-2 rounded-full text-[10px] md:text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase hover:bg-[#323536] transition-colors ml-2 md:ml-4 shadow-lg scale-95 active:scale-90"
          >
            Start Exploring
          </button>
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#2f3131] hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNavOpen && (
        <div className="md:hidden fixed top-20 left-1/2 -translate-x-1/2 z-[9999] glass-panel rounded-2xl p-3 flex flex-col gap-1 backdrop-blur-xl w-fit min-w-[200px]">
          <a className="text-[14px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-white/10" href="#">Destinations</a>
          <Link className="text-[14px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-white/10" href="/pricing">Pricing</Link>
          <Link className="text-[14px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-white/10" href="/dashboard">Dashboard</Link>
        </div>
      )}

      <section className="relative h-screen mb-12 px-0 pt-0 pb-0.5">
        <div className="absolute inset-0 mt-[6px] ml-[6px] mr-[6px] rounded-[20px_20px_0_0] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a3a] via-[#111415] to-[#0d1b2a]" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4"
          >
            <source
              src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#111415] via-[#111415]/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col">

            <div className="flex-grow" />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 w-full max-w-[1280px] mx-auto px-5">
              <div className="flex-1 max-w-2xl">
                <h1 className="text-[44px] md:text-[80px] leading-[1.05] tracking-[0.02em] font-bold text-white mb-4 drop-shadow-md font-amoria">
                  Travel Refined. Experience{" "}
                  <br />
                  <span className="font-instrument-serif text-[48px] md:text-[88px] leading-[1.05] font-light text-[#dbe1ff] italic hover:bg-gradient-to-r hover:from-amber-300 hover:via-yellow-200 hover:to-amber-400 hover:bg-clip-text hover:text-transparent transition-all duration-500">
                    Luxury
                  </span>
                </h1>
                <p className="text-[18px] leading-[1.6] text-[#c4c7c8] max-w-lg drop-shadow">
                  Elevate your journey with AI-crafted itineraries that adapt to
                  your rhythm. Immerse yourself in the world&apos;s most
                  breathtaking destinations without the friction of planning.
                </p>
              </div>

              {/* Trip Generator Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5 w-full lg:w-[420px] border border-white/20 flex-shrink-0 relative overflow-hidden">
                <h2 className="text-[20px] leading-[1.2] font-semibold text-[#2f3131] mb-4">
                  Generate new trip!
                </h2>
                <div className="flex flex-col gap-3">
                  <input
                    value={genDeparture}
                    onChange={(e) => setGenDeparture(e.target.value)}
                    className="w-full bg-transparent border border-[#444748] rounded-xl px-3.5 py-2.5 text-sm text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors outline-none"
                    placeholder="Departure"
                    type="text"
                  />
                  <input
                    value={genDestination}
                    onChange={(e) => setGenDestination(e.target.value)}
                    className="w-full bg-transparent border border-[#444748] rounded-xl px-3.5 py-2.5 text-sm text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors outline-none"
                    placeholder="Destination"
                    type="text"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={genTravelers || ""}
                      onChange={(e) => setGenTravelers(parseInt(e.target.value) || ("" as any))}
                      className="w-full bg-transparent border border-[#444748] rounded-xl px-3.5 py-2.5 text-sm text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors outline-none"
                      placeholder="People"
                      type="number"
                      min="1"
                    />
                    <div className="flex gap-2">
                      <input
                        value={genBudget || ""}
                        onChange={(e) => setGenBudget(parseInt(e.target.value) || ("" as any))}
                        className="flex-1 bg-transparent border border-[#444748] rounded-xl px-3.5 py-2.5 text-sm text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors outline-none min-w-0"
                        placeholder="Budget"
                        type="number"
                        min="0"
                      />
                      <select
                        value={genCurrency}
                        onChange={(e) => setGenCurrency(e.target.value)}
                        className="w-20 bg-transparent border border-[#444748] rounded-xl px-2 py-2.5 text-sm text-[#2f3131] focus:border-[#2f3131] transition-colors outline-none"
                      >
                        <option value="USD">$</option>
                        <option value="EUR">€</option>
                        <option value="GBP">£</option>
                        <option value="INR">₹</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase text-[#444748] mb-2">
                      Style
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["Adventure", "Luxury", "Budget", "Culture"].map((s) => (
                        <label key={s} className="cursor-pointer">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={genStyles.includes(s)}
                            onChange={() => {
                              setGenStyles((prev) =>
                                prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                              );
                            }}
                          />
                          <div className="px-3.5 py-1.5 rounded-full border border-[#444748] text-[#444748] text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase peer-checked:bg-[#2f3131] peer-checked:text-white peer-checked:border-[#2f3131] transition-all hover:border-[#2f3131]/50">
                            {s}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGenTrip}
                    className="w-full bg-[#111415] text-white py-2.5 rounded-xl text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase hover:bg-[#323536] transition-colors mt-1 flex items-center justify-center gap-2 group"
                  >
                    Generate
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-grow" />
          </div>
      </section>

      <section
        ref={statsRef}
        className="py-16 border-y border-white/5 bg-[#111415]/30 backdrop-blur-sm relative z-10 px-5 md:px-16"
        aria-label="Statistics"
      >
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 reveal-stitch">
          <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-white mb-1">
              <span>{travelers}</span>K+
            </div>
            <div className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#c4c7c8] uppercase tracking-wider">
              Travelers
            </div>
          </div>
          <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-white mb-1">
              {countries}+
            </div>
            <div className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#c4c7c8] uppercase tracking-wider">
              Countries
            </div>
          </div>
          <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-white mb-1">
              {tripsPlanned}M+
            </div>
            <div className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#c4c7c8] uppercase tracking-wider">
              Trips Planned
            </div>
          </div>
          <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <div className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-white mb-1 flex items-baseline justify-center gap-1">
              {rating}
              <Star className="w-5 h-5 fill-current text-white" />
            </div>
            <div className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#c4c7c8] uppercase tracking-wider">
              App Rating
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-white/5 overflow-hidden bg-[#0c0f10]/50 relative z-10">
        <div className="slider">
          <div className="slide-track">
            {(() => {
              const brands = [
                "CONDE NAST",
                "AER LINGUS",
                "FOUR SEASONS",
                "VIRGIN ATLANTIC",
                "AMEX TRAVEL",
                "SINGAPORE AIR",
                "MARRIOTT",
              ];
              const items: React.ReactNode[] = [];
              const doubled = [...brands, ...brands];
              doubled.forEach((brand, i) => {
                items.push(
                  <div key={`brand-${i}`} className="slide flex items-center">
                    <span className="text-[24px] leading-[1.2] font-warren text-[#c4c7c8]/50 tracking-widest mr-10">
                      {brand}
                    </span>
                    <Image src="/spacer.png" alt="" width={24} height={24} className="object-contain opacity-50 mr-10" />
                  </div>
                );
              });
              return items;
            })()}
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10 px-5 md:px-16 overflow-hidden" aria-label="Destinations">
        <div className="max-w-[1280px] mx-auto mb-12 flex justify-between items-end reveal-stitch">
          <div>
            <h2 className="font-amoria text-[36px] md:text-[68px] leading-[1.1] font-bold text-white mb-2 tracking-[0.02em]">
              Curated Escapes
            </h2>
            <p className="text-[18px] leading-[1.6] text-[#c4c7c8]">
              Where algorithmic precision meets natural beauty.
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scrollDest("left")}
              className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-[#444748]"
              aria-label="Scroll left"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => scrollDest("right")}
              className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-colors border border-[#444748]"
              aria-label="Scroll right"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div
          ref={destRef}
          className="flex gap-6 overflow-x-auto no-scrollbar pb-8 -mx-5 px-5 md:-mx-16 md:px-16 snap-x snap-mandatory reveal-stitch"
        >
          {destinations.map((d) => {
            const TagIcon = d.tagIcon;
            return (
              <div
                key={d.name}
                className="min-w-[85vw] md:min-w-[400px] h-[380px] md:h-[500px] rounded-2xl overflow-hidden relative group snap-center shrink-0 border border-white/10"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${d.image}')` }}
                />
                <div className="absolute inset-0 glass-overlay" />
                <div className="absolute top-4 left-4 glass-panel px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md bg-black/20">
                  <TagIcon className="w-[14px] h-[14px] text-white" />
                  <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-white uppercase tracking-widest">
                    {d.tag}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-[32px] leading-[1.2] tracking-[-0.02em] font-semibold text-white mb-1 drop-shadow-md">
                    {d.name}
                  </h3>
                  <p className="text-[16px] leading-[1.5] text-[#c4c7c8] mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {d.country}
                  </p>
                  <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-white glass-panel px-3 py-1 rounded-full">
                      From {d.price}
                    </span>
                    <button
                      onClick={handleProceed}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#323536] hover:text-white transition-colors"
                      aria-label={`Plan trip to ${d.name}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="py-24 relative z-10 px-5 md:px-16 bg-[#0c0f10]/80 border-t border-white/5 overflow-hidden lg:overflow-visible"
        aria-label="Features"
      >
        <div className="absolute left-0 top-0 w-[700px] h-[800px] -translate-x-1/4 -translate-y-[100px] pointer-events-none z-20 hidden md:block">
          <Lanyard
            position={[0, 0, 30]}
            fov={20}
            lanyardWidth={0.6}
            frontImage="/logo.png"
            backImage="/logo.png"
          />
        </div>
        <div className="max-w-[1280px] mx-auto reveal-stitch mb-16 text-center">
          <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#c4c7c8] tracking-widest uppercase mb-4 inline-block">
            The Toolkit
          </span>
          <h2 className="font-amoria text-[36px] md:text-[68px] leading-[1.1] font-bold text-white mb-4 tracking-[0.02em]">
            Intelligence built in.
          </h2>
          <p className="text-[18px] leading-[1.6] text-[#c4c7c8] max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with intuitive design to
            handle the complexity of travel planning, leaving you with just the
            joy of the journey.
          </p>
        </div>

        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 reveal-stitch">
          <div className="hidden lg:block flex-1 max-w-lg lg:pt-[300px]">
            <p className="text-[15px] leading-relaxed text-[#c4c7c8] mb-6">
              Every feature is crafted to eliminate friction and amplify the
              experience — from neural trip planning to real-time budget
              intelligence.
            </p>
            <div className="flex flex-wrap gap-3">
              {features.map((f) => (
                <span
                  key={f.title}
                  className="text-[11px] leading-none tracking-[0.05em] font-semibold uppercase text-[#c4c7c8]/60 border border-white/10 rounded-full px-3.5 py-2"
                >
                  {f.title}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 w-full max-w-full lg:overflow-visible lg:w-[580px] h-[260px] lg:h-[520px] relative z-10">
            <div className="scale-[0.8] lg:scale-100 origin-top-left w-[500px] lg:w-auto">
            <CardSwap
              width={500}
              height={320}
              cardDistance={60}
              verticalDistance={70}
              delay={4000}
              pauseOnHover
              skewAmount={5}
              mobileCardDistance={30}
              mobileVerticalDistance={20}
              mobileSkewAmount={2}
              easing="elastic"
            >
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <SwapCard key={f.title}>
                    <div className="p-7 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/[0.08]">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-white tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-[13px] leading-relaxed text-[#c4c7c8] mb-3">
                        {f.desc}
                      </p>
                      <div className="relative w-full h-[110px] rounded-lg overflow-hidden mt-auto">
                        <img src={f.image} alt={f.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1113]/60 to-transparent" />
                      </div>
                    </div>
                  </SwapCard>
                );
              })}
            </CardSwap>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10 px-5 md:px-16 mb-12">
        <div className="max-w-4xl mx-auto glass-panel p-8 md:p-20 rounded-3xl text-center relative overflow-hidden border border-[#444748] reveal-stitch">
          <h2 className="font-instrument-serif text-[36px] md:text-[68px] leading-[1.1] font-bold text-white mb-6 tracking-tight">
            Ready for your next journey?
          </h2>
          <p className="text-[18px] leading-[1.6] text-[#c4c7c8] mb-10 max-w-xl mx-auto">
            Join the thousands of sophisticated explorers who have refined their
            travel experience with Voyiq.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleProceed}
              className="w-full sm:w-auto inline-flex items-center justify-center text-[12px] leading-[1] tracking-[0.05em] font-semibold bg-white text-[#111415] px-8 py-4 rounded-full hover:bg-[#323536] hover:text-white transition-all uppercase tracking-widest group"
            >
              Start Exploring Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#0c0f10] border-t border-white/10 py-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-16 gap-6 max-w-[1280px] mx-auto">
          <div className="text-[24px] leading-[1.2] font-semibold text-white">
            Voyiq.
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors"
              href="#"
            >
              Cookie Policy
            </a>
            <a
              className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors"
              href="#"
            >
              Support
            </a>
            <a
              className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors"
              href="#"
            >
              Press Kit
            </a>
          </div>
          <div className="text-[16px] leading-[1.5] text-[#c4c7c8]">
            &copy; 2024 Voyiq AI Travel. All rights reserved.
          </div>
        </div>
      </footer>

      <PlanSelectionDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        tripCount={tripCount}
        onSelectFree={() => router.push("/plan/new")}
      />
    </main>
  );
}
