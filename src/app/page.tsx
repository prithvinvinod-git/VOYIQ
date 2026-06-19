
"use client";

import React, {
  useState,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PixelHero } from "@/components/ui/pixel-perfect-hero";
import { CardStack, type CardStackItem } from "@/components/ui/card-stack";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import {
  Wallet,
  MessageSquare,
  Users,
  ArrowRight,
  Globe,
  Zap,
  Star,
  Compass,
  ChevronRight,
  Brain,
  Route,
  Download,
  RefreshCw,
  Lock,
  Plane,
  Hotel,
  Camera,
  Map,
  Coins,
  Mail,
} from "lucide-react";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { UserHeader } from "@/components/layout/UserHeader";
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";

/* ═══════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  /* ── Firebase data ── */
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

  /* â”€â”€ Auth-aware routing (unchanged) â”€â”€ */
  const handleProceed = () => {
    if (!user) { router.push("/auth"); return; }
    if (isLimitReached) { setIsPlanDialogOpen(true); }
    else { router.push("/plan/new"); }
  };

  /* ── Feature data ── */
  const features = useMemo(
    () => [
      {
        icon: Brain,
        title: "AI Travel Brain",
        desc: "Contextual intelligence that learns your travel philosophy and curates hyper-personalized routes.",
        accent: "#6366F1",
        spotlightColor: "rgba(99, 102, 241, 0.25)",
      },
      {
        icon: Wallet,
        title: "BudgetSync",
        desc: "Real-time multi-currency tracking across your entire journey.",
        accent: "#10B981",
        spotlightColor: "rgba(16, 185, 129, 0.25)",
      },
      {
        icon: Users,
        title: "Collaborative",
        desc: "Plan with your crew. Vote, sync costs, and share memories.",
        accent: "#8B5CF6",
        spotlightColor: "rgba(139, 92, 246, 0.25)",
      },
      {
        icon: Route,
        title: "SmartItinerary",
        desc: "Day-by-day plans crafted around your pace and preferences.",
        accent: "#F472B6",
        spotlightColor: "rgba(244, 114, 182, 0.25)",
      },
      {
        icon: Map,
        title: "Live Map",
        desc: "Interactive mapping with real-time updates.",
        accent: "#38BDF8",
        spotlightColor: "rgba(56, 189, 248, 0.25)",
      },
      {
        icon: Download,
        title: "PDF Export",
        desc: "Offline-ready itineraries, anywhere.",
        accent: "#FBBF24",
        spotlightColor: "rgba(251, 191, 36, 0.25)",
      },
    ],
    []
  );

  /* â”€â”€ How It Works steps â”€â”€ */
  const steps = [
    {
      num: "01",
      icon: Globe,
      title: "Tell VOYIQ your vision",
      desc: "Share your destination, dates, travel style, budget, and preferences. Our AI listens and understands context.",
      color: "#6366F1",
    },
    {
      num: "02",
      icon: Brain,
      title: "AI generates your blueprint",
      desc: "In seconds, receive a fully personalized day-by-day itinerary with curated accommodations, activities, and dining.",
      color: "#8B5CF6",
    },
    {
      num: "03",
      icon: RefreshCw,
      title: "Refine & collaborate",
      desc: "Chat with your AI to adjust any detail. Invite travel companions and plan together in real-time.",
      color: "#10B981",
    },
    {
      num: "04",
      icon: Plane,
      title: "Explore with confidence",
      desc: "Your itinerary syncs to your device. BudgetSync tracks expenses as you travel. The AI adapts to changes on the fly.",
      color: "#F472B6",
    },
  ];

  /* ── Testimonials ── */
  const testimonials = [
    {
      quote:
        "VOYIQ completely redefined my approach to travel. The AI curation is impeccable â€” it saved me 20+ hours of research.",
      author: "Sarah Jenkins",
      role: "Digital Nomad Â· 47 trips planned",
      initials: "SJ",
      stars: 5,
      color: "#6366F1",
    },
    {
      quote:
        "The BudgetSync feature alone is worth it. I always know exactly where my money is going, even across 5 different currencies.",
      author: "Marcus Chen",
      role: "Business Traveler Â· 31 trips planned",
      initials: "MC",
      stars: 5,
      color: "#10B981",
    },
    {
      quote:
        "Planning group trips used to be a nightmare. VOYIQ's collaboration tools made our 8-person Bali trip effortless.",
      author: "Priya Anand",
      role: "Travel Blogger Â· 89 trips planned",
      initials: "PA",
      stars: 5,
      color: "#8B5CF6",
    },
    {
      quote:
        "I've tried every travel app out there. Nothing comes close to the intelligence VOYIQ brings to itinerary planning.",
      author: "James O'Brien",
      role: "Adventure Seeker Â· 62 trips planned",
      initials: "JO",
      stars: 5,
      color: "#F472B6",
    },
  ];

  /* â”€â”€ Marquee items â”€â”€ */
  const marqueeItems = [
    { icon: Plane, label: "Smart Itineraries" },
    { icon: Wallet, label: "BudgetSync" },
    { icon: MessageSquare, label: "AI Companion" },
    { icon: Users, label: "Group Planning" },
    { icon: Map, label: "Live Maps" },
    { icon: Hotel, label: "Hotel Curation" },
    { icon: Camera, label: "Experience Discovery" },
    { icon: Coins, label: "Multi-Currency" },
    { icon: Download, label: "PDF Export" },
    { icon: Lock, label: "Secure Sync" },
    { icon: RefreshCw, label: "Dynamic Replanning" },
  ];

  /* ── Famous Destinations (CardStack) ── */
  const destinations: CardStackItem[] = useMemo(() => [
    {
      id: 1,
      title: "Santorini, Greece",
      description: "Iconic whitewashed villages cascading down volcanic cliffs above the Aegean.",
      imageSrc: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
      tag: "Island Escape",
    },
    {
      id: 2,
      title: "Kyoto, Japan",
      description: "Ancient temples, bamboo groves, and seasonal cherry blossoms in harmony.",
      imageSrc: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=800&q=80",
      tag: "Cultural Journey",
    },
    {
      id: 3,
      title: "Machu Picchu, Peru",
      description: "Lost Incan citadel perched high in the Andes, a UNESCO World Heritage marvel.",
      imageSrc: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80",
      tag: "Adventure",
    },
    {
      id: 4,
      title: "Amalfi Coast, Italy",
      description: "Dramatic cliffside villages, azure waters, and world-class Italian cuisine.",
      imageSrc: "https://images.unsplash.com/photo-1533605788862-af5a2bbfa5e5?w=800&q=80",
      tag: "Luxury",
    },
    {
      id: 5,
      title: "Bali, Indonesia",
      description: "Lush terraced rice fields, sacred temples, and vibrant spiritual culture.",
      imageSrc: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
      tag: "Tropical",
    },
    {
      id: 6,
      title: "Dubai, UAE",
      description: "Futuristic skyline meets golden desert sands and world-record landmarks.",
      imageSrc: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
      tag: "Luxury",
    },
  ], []);

  return (
    <div className="flex flex-col min-h-dvh overflow-x-hidden">
      <UserHeader logoHref="/" />

      <section aria-label="Hero" className="relative">
        <PixelHero
          word1="Travel"
          word2="Refined."
          description="AI-crafted itineraries personalised to your budget, style, and pace. Plan your next adventure in under 60 seconds."
          primaryCta="Begin Your Journey"
          primaryCtaMobile="Get Started"
          secondaryCta="Join the Community"
          secondaryCtaMobile="Join"
          onPrimaryClick={handleProceed}
          secondaryHref="/auth"
        />
      </section>

      <section
        className="py-16 relative overflow-hidden border-y border-white/5"
        aria-label="Key statistics"
      >
        <div className="container mx-auto px-4">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Travelers Worldwide" },
              { value: "50,000+", label: "Itineraries Created" },
              { value: "150+", label: "Countries Covered" },
              { value: "98%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <div key={i}>
                <dt className="text-4xl font-headline font-extrabold aurora-text mb-1">
                  {stat.value}
                </dt>
                <dd className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        className="py-8 border-b border-white/5"
        aria-label="Feature highlights"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {marqueeItems.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <item.icon
                  className="w-4 h-4"
                  style={{ color: i % 3 === 0 ? "#6366F1" : i % 3 === 1 ? "#8B5CF6" : "#10B981" }}
                />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="pt-16 pb-10 relative overflow-hidden border-t border-white/5"
        aria-label="Famous travel destinations"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge
              className="mb-5 px-4 py-1.5 text-xs uppercase tracking-widest font-bold inline-flex"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.28)",
                color: "#34D399",
              }}
            >
              Dream Destinations
            </Badge>
            <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
              The world is{" "}
              <span className="aurora-text-emerald">waiting for you.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Swipe through iconic destinations and let VOYIQ craft your perfect itinerary.
            </p>
          </div>

          <CardStack
            items={destinations}
            pauseOnHover
            showDots
            cardWidth={540}
            cardHeight={340}
            loop
          />

          <div className="text-center mt-6">
            <LiquidButton
              onClick={handleProceed}
              variant="aurora"
              size="xl"
              className="font-semibold"
            >
              Plan a Trip to These Places
              <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
            </LiquidButton>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="pt-8 pb-24 relative overflow-hidden border-t border-white/5"
        aria-label="Features"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <Badge
              className="mb-6 px-4 py-1.5 text-xs uppercase tracking-widest font-bold"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.28)",
                color: "#818CF8",
              }}
            >
              Explorer&apos;s Toolkit
            </Badge>
            <h2 className="text-4xl md:text-6xl font-headline font-bold mb-5 tracking-tight">
              Built for the{" "}
              <span className="aurora-text">modern voyager.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Six powerful tools. One seamless experience. Engineered for every
              type of traveler.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i}>
                <SpotlightCard
                  className="flex flex-col h-full"
                  spotlightColor={f.spotlightColor}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                    style={{
                      background: `${f.accent}15`,
                      border: `1px solid ${f.accent}30`,
                    }}
                  >
                    <f.icon
                      className="w-6 h-6"
                      style={{ color: f.accent }}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm flex-1">
                    {f.desc}
                  </p>

                  <div
                    className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                    style={{ color: f.accent }}
                  >
                    Explore <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="py-24 relative overflow-hidden border-t border-white/5"
        aria-label="How VOYIQ works"
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge
              className="mb-6 px-4 py-1.5 text-xs uppercase tracking-widest font-bold inline-flex"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.28)",
                color: "#34D399",
              }}
            >
              The Process
            </Badge>
            <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
              From idea to{" "}
              <span className="aurora-text-emerald">adventure</span>, in minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection line on desktop */}
            <div
              className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4), rgba(16,185,129,0.4), rgba(244,114,182,0.4))",
              }}
              aria-hidden="true"
            />

            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                {/* Step badge */}
                <div className="relative mb-6">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center aurora-card relative z-10"
                    style={{
                      border: `1px solid ${step.color}30`,
                      boxShadow: `0 0 32px ${step.color}20, 0 16px 48px rgba(0,0,0,0.4)`,
                    }}
                  >
                    <step.icon
                      className="w-9 h-9"
                      style={{ color: step.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-xs font-headline font-extrabold flex items-center justify-center z-20"
                    style={{
                      background: step.color,
                      color: "white",
                      boxShadow: `0 0 12px ${step.color}60`,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-20 relative overflow-hidden border-t border-white/5"
        aria-label="Community testimonials"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div
              className="flex items-center justify-center mb-4"
              role="img"
              aria-label="Community of 10,000 plus travelers"
            >
              {[
                { initials: "JD", color: "#6366F1" },
                { initials: "AL", color: "#8B5CF6" },
                { initials: "RK", color: "#10B981" },
                { initials: "MT", color: "#F472B6" },
                { initials: "CS", color: "#38BDF8" },
                { initials: "+10k", color: "#FBBF24", isCount: true },
              ].map((a, i) => (
                <div
                  key={i}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                  style={{
                    background: a.isCount
                      ? "rgba(255,255,255,0.08)"
                      : `linear-gradient(135deg, ${a.color}80, ${a.color}40)`,
                    borderColor: "hsl(var(--background))",
                    marginLeft: i === 0 ? 0 : "-10px",
                    zIndex: 6 - i,
                    fontSize: a.isCount ? "9px" : undefined,
                  }}
                  aria-hidden="true"
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              Trusted by{" "}
              <span className="text-foreground font-semibold">10,000+ travelers</span>{" "}
              across 150 countries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="aurora-card rounded-2xl p-5"
                style={{ border: `1px solid ${t.color}20` }}
              >
                <div className="flex gap-1 mb-3" aria-hidden="true">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star
                      key={s}
                      className="w-3 h-3 fill-current"
                      style={{ color: t.color }}
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 mb-4 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `${t.color}50` }}
                    aria-hidden="true"
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{t.author}</p>
                    <p className="text-xs" style={{ color: t.color }}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden border-t border-white/5"
        aria-label="Get started call to action"
      >
        <div className="container mx-auto px-4 text-center">
          <Badge
            className="mb-8 px-5 py-2 text-xs uppercase tracking-widest font-bold inline-flex"
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.28)",
              color: "#818CF8",
            }}
          >
            Start Today â€” Free Forever
          </Badge>

          <h2 className="text-4xl md:text-7xl font-headline font-extrabold mb-6 tracking-tight text-balance">
            Your next story{" "}
            <span className="aurora-text">awaits.</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-4 max-w-xl mx-auto leading-relaxed">
            Step into the future of exploration. Refined, intelligent, and
            entirely yours.
          </p>
          <p className="text-sm text-muted-foreground mb-12">
            No credit card required Â· Free plan available Â· Cancel anytime
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LiquidButton
              size="xxl"
              onClick={handleProceed}
              variant="aurora"
              className="font-bold"
            >
              {user ? "Plan Your Adventure" : "Begin Free Exploration"}
              <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
            </LiquidButton>

            <Link href="/auth">
              <Button
                variant="outline"
                size="lg"
                className="h-16 px-10 text-lg rounded-full font-semibold"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Sign In Instead
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FOOTER â€” Multi-column with newsletter
          SKILL.md Â§9: Navigation â€” destructive-nav-separation
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <footer
        className="relative pt-16 pb-8"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(6,8,20,0.9)",
        }}
        role="contentinfo"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2 space-y-5">
              <Link
                href="/"
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                aria-label="VOYIQ Home"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    boxShadow: "0 0 20px rgba(99,102,241,0.35)",
                  }}
                >
                  <Compass
                    className="text-white w-5 h-5"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xl font-headline font-bold tracking-tight">
                  VOYIQ
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Next-generation AI travel intelligence. Crafting exceptional
                journeys for the modern explorer since 2024.
              </p>
              {/* Newsletter */}
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">
                  Travel insights, weekly
                </p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => e.preventDefault()}
                  aria-label="Newsletter subscription"
                >
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative flex-1">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      id="newsletter-email"
                      type="email"
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl px-4 font-semibold text-white"
                    style={{
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    }}
                  >
                    Join
                  </Button>
                </form>
              </div>
            </div>

            {/* Product links */}
            <nav aria-label="Product links">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-foreground">
                Product
              </h3>
              <ul className="space-y-3">
                {["Features", "How it Works", "Pricing", "Dashboard", "Mobile App"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </nav>

            {/* Company + Legal links */}
            <nav aria-label="Company links">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-foreground">
                Company
              </h3>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Press Kit", "Privacy Policy", "Terms of Use"].map(
                  (item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </nav>
          </div>

          <hr className="hr-gradient mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>Â© 2024 VOYIQ AI. Crafting the future of travel.</p>
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: "0 0 4px rgba(16,185,129,0.5)" }}
                aria-hidden="true"
              />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* â”€â”€ Plan selection dialog (unchanged) â”€â”€ */}
      <PlanSelectionDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        tripCount={tripCount}
        onSelectFree={() => router.push("/plan/new")}
      />
    </div>
  );
}
