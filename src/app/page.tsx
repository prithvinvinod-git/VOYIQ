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
  Check,
  Mail,
  Link as LinkIcon,
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
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";

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

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSubmitted(true);
      setSending(false);
      setForm({ name: "", email: "", message: "" });
    }, 800);
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

  const serviceTags = ["Itinerary", "Flights", "Hotels", "Experiences"];
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

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
    },
    {
      icon: Wallet,
      title: "BudgetSync",
      desc: "Real-time financial tracking integrated directly into your itinerary. Predictive algorithms prevent overspending.",
    },
    {
      icon: Users,
      title: "Collaborative Canvas",
      desc: "Invite friends and family to a multiplayer workspace. Vote on activities, share notes, and finalize plans synchronously.",
    },
    {
      icon: Calendar,
      title: "Smart Itineraries",
      desc: "Fluid scheduling that automatically adjusts when flights are delayed or reservations change. Total peace of mind.",
    },
    {
      icon: Map,
      title: "Spatial Mapping",
      desc: "High-fidelity, 3D interactive maps that plot your day seamlessly, minimizing transit time and maximizing exploration.",
    },
    {
      icon: FileText,
      title: "Cinematic Export",
      desc: "Generate stunning, magazine-quality PDF briefs of your trip. Perfect for offline viewing or printing as a keepsake.",
    },
  ];

  return (
    <main className="relative flex flex-col min-h-screen bg-[#111415] text-white antialiased selection:bg-white selection:text-[#111415] font-inter">
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
            <nav
              className="bg-white/60 backdrop-blur-md rounded-full shadow-sm pl-4 pr-2 py-2 flex items-center justify-between w-fit mx-auto mt-[30px] md:gap-8 transition-all duration-300 hover:bg-white/70"
              role="navigation"
              aria-label="Main navigation"
            >
              <Link
                href="/"
                className="flex items-center gap-2 text-[#2f3131] mr-4 sm:mr-8 transition-transform hover:scale-95 active:scale-90"
              >
                <svg
                  fill="currentColor"
                  height="24"
                  viewBox="0 0 256 256"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
                </svg>
                <span className="font-bold text-[#2f3131] hidden md:block tracking-tight">
                  Voyiq.
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-6">
                <a className="text-[16px] leading-[1.5] text-[#444748] hover:text-[#2f3131] transition-colors" href="#">
                  Destinations
                </a>
                <Link className="text-[16px] leading-[1.5] text-[#444748] hover:text-[#2f3131] transition-colors" href="/pricing">
                  Pricing
                </Link>
                <Link className="text-[16px] leading-[1.5] text-[#444748] hover:text-[#2f3131] transition-colors" href="/dashboard">
                  Dashboard
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleProceed}
                  className="bg-[#111415] text-white px-6 py-2 rounded-full text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase hover:bg-[#323536] transition-colors ml-4 shadow-lg scale-95 active:scale-90"
                >
                  Start Exploring
                </button>
                <button
                  className="md:hidden w-10 h-10 flex items-center justify-center text-[#2f3131] hover:bg-white/20 rounded-full transition-colors"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                >
                  {mobileNavOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </nav>

            {mobileNavOpen && (
              <div className="md:hidden mt-2 glass-panel rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl">
                <a className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors" href="#">Destinations</a>
                <Link className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors" href="/pricing">Pricing</Link>
                <Link className="text-[16px] leading-[1.5] text-[#c4c7c8] hover:text-white transition-colors" href="/dashboard">Dashboard</Link>
              </div>
            )}

            <div className="flex-grow" />

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 w-full max-w-[1280px] mx-auto mt-12 md:mt-0">
              <div className="flex-1 max-w-2xl">
                <h1 className="text-[64px] leading-[1.1] tracking-[-0.04em] font-bold text-white mb-4 drop-shadow-md">
                  Travel Refined. Experience{" "}
                  <br />
                  <span className="font-instrument-serif text-[68px] leading-[1.1] font-light text-[#dbe1ff] italic">
                    Luxury
                  </span>
                </h1>
                <p className="text-[18px] leading-[1.6] text-[#c4c7c8] max-w-lg drop-shadow">
                  Elevate your journey with AI-crafted itineraries that adapt to
                  your rhythm. Immerse yourself in the world&apos;s most
                  breathtaking destinations without the friction of planning.
                </p>
              </div>

              <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full lg:w-[480px] border border-white/20 text-[#2f3131] flex-shrink-0 relative overflow-hidden">
                <div
                  className={`absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center transition-opacity duration-500 ${
                    submitted ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="w-16 h-16 bg-[#1d2021] rounded-full flex items-center justify-center mb-4 text-white">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-[24px] leading-[1.2] font-semibold text-[#2f3131]">
                    You&apos;re all set!
                  </h3>
                  <p className="text-[16px] leading-[1.5] text-[#c4c7c8] text-center mt-2 px-6">
                    We&apos;ve received your message and will be in touch shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-6 py-2 border border-[#8e9192] rounded-full text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase text-[#2f3131] hover:bg-[#1d2021] hover:text-white transition-colors"
                  >
                    Send another
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[24px] leading-[1.2] font-semibold text-[#2f3131]">
                      Say hello!
                    </h2>
                    <div className="flex gap-2">
                      <a
                        href="#"
                        className="w-8 h-8 rounded-full border border-[#444748] flex items-center justify-center text-[#2f3131] hover:bg-[#1d2021] hover:text-white transition-colors"
                        aria-label="Email us"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      <a
                        href="#"
                        className="w-8 h-8 rounded-full border border-[#444748] flex items-center justify-center text-[#2f3131] hover:bg-[#1d2021] hover:text-white transition-colors"
                        aria-label="Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-transparent border-b border-[#444748] px-0 py-2 text-[16px] leading-[1.5] text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors rounded-none resize-none"
                        placeholder="Name"
                        required
                        type="text"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-transparent border-b border-[#444748] px-0 py-2 text-[16px] leading-[1.5] text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors rounded-none"
                        placeholder="Email"
                        required
                        type="email"
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full bg-transparent border-b border-[#444748] px-0 py-2 text-[16px] leading-[1.5] text-[#2f3131] placeholder:text-[#636565] focus:border-[#2f3131] transition-colors rounded-none resize-none"
                      placeholder="Tell us about your project..."
                      required
                      rows={3}
                    />
                  </div>

                  <div className="mt-2">
                    <p className="text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase text-[#444748] mb-3">
                      I&apos;m looking for:
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto hide-scrollbar pb-2">
                      {serviceTags.map((s) => (
                        <label key={s} className="cursor-pointer">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={selectedServices.includes(s)}
                            onChange={() => toggleService(s)}
                          />
                          <div className="px-4 py-1.5 rounded-full border border-[#444748] text-[#444748] text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase peer-checked:bg-[#2f3131] peer-checked:text-white peer-checked:border-[#2f3131] transition-all hover:border-[#2f3131]/50">
                            {s}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[#111415] text-white py-3 rounded-xl text-[12px] leading-[1] tracking-[0.05em] font-semibold uppercase hover:bg-[#323536] transition-colors mt-2 flex items-center justify-center gap-2 group"
                  >
                    {sending ? (
                      "Sending..."
                    ) : (
                      <>
                        Send my message
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
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
              return [...brands, ...brands].map((brand, i) => (
                <div key={i} className="slide">
                  <span className="text-[24px] leading-[1.2] font-semibold text-[#c4c7c8]/50 font-bold tracking-widest">
                    {brand}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      <section className="py-24 relative z-10 px-5 md:px-16 overflow-hidden" aria-label="Destinations">
        <div className="max-w-[1280px] mx-auto mb-12 flex justify-between items-end reveal-stitch">
          <div>
            <h2 className="font-instrument-serif text-[68px] leading-[1.1] font-bold text-white mb-2">
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
                className="min-w-[85vw] md:min-w-[400px] h-[500px] rounded-2xl overflow-hidden relative group snap-center shrink-0 border border-white/10"
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
        className="py-24 relative z-10 px-5 md:px-16 bg-[#0c0f10]/80 border-t border-white/5"
        aria-label="Features"
      >
        <div className="max-w-[1280px] mx-auto reveal-stitch mb-16 text-center">
          <span className="text-[12px] leading-[1] tracking-[0.05em] font-semibold text-[#c4c7c8] tracking-widest uppercase mb-4 inline-block">
            The Toolkit
          </span>
          <h2 className="font-instrument-serif text-[68px] leading-[1.1] font-bold text-white mb-4">
            Intelligence built in.
          </h2>
          <p className="text-[18px] leading-[1.6] text-[#c4c7c8] max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with intuitive design to
            handle the complexity of travel planning, leaving you with just the
            joy of the journey.
          </p>
        </div>

        <div
          id="features-grid"
          className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal-stitch"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="glass-panel p-8 rounded-2xl spotlight-card h-full flex flex-col border border-white/5 hover:border-white/20 transition-colors duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#323536] flex items-center justify-center mb-6 border border-[#444748]">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-[24px] leading-[1.2] font-semibold text-white mb-3">
                  {f.title}
                </h3>
                <p className="text-[16px] leading-[1.5] text-[#c4c7c8] flex-grow">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-24 relative z-10 px-5 md:px-16 mb-12">
        <div className="max-w-4xl mx-auto glass-panel p-12 md:p-20 rounded-3xl text-center relative overflow-hidden border border-[#444748] reveal-stitch">
          <h2 className="font-instrument-serif text-[68px] leading-[1.1] font-bold text-white mb-6 tracking-tight">
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
