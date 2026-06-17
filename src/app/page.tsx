
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { PixelHero } from "@/components/ui/pixel-perfect-hero";
import { CardStack, type CardStackItem } from "@/components/ui/card-stack";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { LumaSpin } from "@/components/ui/luma-spin";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sparkles,
  MapPin,
  Wallet,
  MessageSquare,
  Users,
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  Star,
  Compass,
  CheckCircle,
  ChevronRight,
  Navigation,
  Brain,
  Route,
  Download,
  RefreshCw,
  Lock,
  TrendingUp,
  Clock,
  Plane,
  Hotel,
  Camera,
  Map,
  Coins,
  Mail,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import {
  useScrollReveal,
  useScrollRevealContainer,
} from "@/hooks/useScrollReveal";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SCROLL PROGRESS BAR
   SKILL.md Â§3: Performance â€” debounce-throttle on scroll events
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = document.documentElement;
        const pct =
          (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
        setProgress(Math.min(pct, 100));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="scroll-progress"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AURORA ORB â€” decorative background sphere
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function Orb({
  size,
  color,
  style,
  animDelay = "0s",
}: {
  size: number;
  color: "indigo" | "violet" | "emerald" | "rose" | "sky";
  style?: React.CSSProperties;
  animDelay?: string;
}) {
  const colorMap = {
    indigo: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)",
    violet: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
    emerald: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
    rose: "radial-gradient(circle, rgba(244,114,182,0.13) 0%, transparent 70%)",
    sky: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
  };
  return (
    <div
      aria-hidden="true"
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colorMap[color],
        filter: `blur(${size * 0.38}px)`,
        animation: `orb-drift ${12 + size / 50}s ease-in-out infinite`,
        animationDelay: animDelay,
        ...style,
      }}
    />
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAGNETIC 3D CARD
   SKILL.md Â§7: Animation â€” transform/opacity only, spring-physics feel
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function Card3D({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(1200px) rotateY(${dx * 8}deg) rotateX(${-dy * 6}deg) translateZ(18px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform =
      "perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transition: "transform 0.45s cubic-bezier(0.23,1,0.32,1)",
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPEWRITER EFFECT
   SKILL.md Â§7: Animation â€” motion conveys meaning, interruptible
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function TypewriterText({
  words,
  className = "",
}: {
  words: string[];
  className?: string;
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const typingSpeed = deleting ? 45 : 90;
    const pauseAtEnd = !deleting && charIndex === currentWord.length ? 1800 : 0;

    const timeout = setTimeout(
      () => {
        if (!deleting && charIndex < currentWord.length) {
          setCharIndex((c) => c + 1);
        } else if (!deleting && charIndex === currentWord.length) {
          setTimeout(() => setDeleting(true), pauseAtEnd);
        } else if (deleting && charIndex > 0) {
          setCharIndex((c) => c - 1);
        } else {
          setDeleting(false);
          setWordIndex((w) => (w + 1) % words.length);
        }
      },
      pauseAtEnd > 0 ? pauseAtEnd : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [wordIndex, charIndex, deleting, words]);

  // Cursor blink
  useEffect(() => {
    const cursor = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(cursor);
  }, []);

  return (
    <span className={className} aria-live="polite">
      {words[wordIndex].substring(0, charIndex)}
      <span
        aria-hidden="true"
        style={{
          opacity: showCursor ? 1 : 0,
          transition: "opacity 0.1s",
          marginLeft: "2px",
          borderRight: "3px solid currentColor",
          display: "inline-block",
          height: "0.85em",
          verticalAlign: "middle",
        }}
      />
    </span>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ANIMATED COUNTER
   SKILL.md Â§7: Animation â€” stagger + motion conveys meaning
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AnimatedNumber({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const steps = 60;
          const inc = target / steps;
          let cur = 0;
          const timer = setInterval(() => {
            cur += inc;
            if (cur >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(cur));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={nodeRef} className="stat-number">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WIREFRAME GLOBE (SVG decorative)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function WireframeGlobe({ size = 360 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 360 360"
      fill="none"
      aria-hidden="true"
      className="animate-spin-slow"
      style={{ opacity: 0.22 }}
    >
      {/* Outer circle */}
      <circle cx="180" cy="180" r="170" stroke="rgba(99,102,241,0.6)" strokeWidth="0.8" />
      {/* Equator */}
      <ellipse cx="180" cy="180" rx="170" ry="45" stroke="rgba(99,102,241,0.5)" strokeWidth="0.6" />
      {/* Tropic ellipses */}
      <ellipse cx="180" cy="180" rx="170" ry="105" stroke="rgba(139,92,246,0.4)" strokeWidth="0.6" />
      <ellipse cx="180" cy="180" rx="170" ry="158" stroke="rgba(139,92,246,0.3)" strokeWidth="0.6" />
      {/* Meridians */}
      <ellipse cx="180" cy="180" rx="45" ry="170" stroke="rgba(16,185,129,0.45)" strokeWidth="0.6" />
      <ellipse cx="180" cy="180" rx="105" ry="170" stroke="rgba(16,185,129,0.3)" strokeWidth="0.6" />
      <line x1="180" y1="10" x2="180" y2="350" stroke="rgba(244,114,182,0.4)" strokeWidth="0.6" />
      <line x1="10" y1="180" x2="350" y2="180" stroke="rgba(244,114,182,0.35)" strokeWidth="0.6" />
      {/* Glowing dots at intersections */}
      {[
        [180, 135], [225, 155], [225, 205], [180, 225],
        [135, 205], [135, 155], [180, 65], [180, 295],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="3"
          fill={i % 2 === 0 ? "rgba(99,102,241,0.9)" : "rgba(16,185,129,0.9)"}
        />
      ))}
    </svg>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN LANDING PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function LandingPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const heroImg = PlaceHolderImages.find((img) => img.id === "hero-travel");

  /* â”€â”€ Firebase data (unchanged) â”€â”€ */
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

  /* â”€â”€ Scroll-reveal refs â”€â”€ */
  const revealHeroBadge = useScrollReveal({ threshold: 0.1 });
  const revealHeroTitle = useScrollReveal({ threshold: 0.1 });
  const revealHeroSub = useScrollReveal({ threshold: 0.1 });
  const revealHeroBtns = useScrollReveal({ threshold: 0.1 });
  const revealHeroImg = useScrollReveal({ threshold: 0.05 });
  const revealStats = useScrollRevealContainer();
  const revealFeatures = useScrollRevealContainer();
  const revealBento = useScrollRevealContainer();
  const revealStepper = useScrollRevealContainer();
  const revealBenefits = useScrollRevealContainer();
  const revealTestimonials = useScrollRevealContainer();
  const revealCTA = useScrollReveal();

  /* â”€â”€ Feature data â”€â”€ */
  const features = useMemo(
    () => [
      {
        icon: Brain,
        title: "AI Travel Brain",
        desc: "Contextual intelligence that learns your travel philosophy and curates hyper-personalized routes.",
        variant: "aurora-card-indigo",
        accent: "#6366F1",
        size: "bento-1",
        large: true,
      },
      {
        icon: Wallet,
        title: "BudgetSync",
        desc: "Real-time multi-currency tracking across your entire journey.",
        variant: "aurora-card-emerald",
        accent: "#10B981",
        size: "bento-2",
        large: false,
      },
      {
        icon: Users,
        title: "Collaborative",
        desc: "Plan with your crew. Vote, sync costs, and share memories.",
        variant: "aurora-card-violet",
        accent: "#8B5CF6",
        size: "bento-3",
        large: false,
      },
      {
        icon: Route,
        title: "SmartItinerary",
        desc: "Day-by-day plans crafted around your pace and preferences.",
        variant: "aurora-card",
        accent: "#F472B6",
        size: "bento-4",
        large: false,
      },
      {
        icon: Map,
        title: "Live Map",
        desc: "Interactive mapping with real-time updates.",
        variant: "aurora-card",
        accent: "#38BDF8",
        size: "bento-5",
        large: false,
      },
      {
        icon: Download,
        title: "PDF Export",
        desc: "Offline-ready itineraries, anywhere.",
        variant: "aurora-card",
        accent: "#FBBF24",
        size: "bento-6",
        large: false,
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

  /* â”€â”€ Benefits â”€â”€ */
  const benefits = [
    {
      icon: Globe,
      title: "Multi-Currency",
      desc: "Seamless real-time conversion for 150+ currencies.",
      color: "#6366F1",
    },
    {
      icon: Zap,
      title: "Dynamic Replanning",
      desc: "Weather changes? Schedule shifts? AI adapts instantly.",
      color: "#8B5CF6",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise Security",
      desc: "Your data is protected with bank-grade encryption.",
      color: "#10B981",
    },
    {
      icon: MapPin,
      title: "PDF Portability",
      desc: "Export polished itineraries for offline access anywhere.",
      color: "#F472B6",
    },
    {
      icon: Clock,
      title: "24/7 AI Support",
      desc: "Local insights and travel answers, any time of day.",
      color: "#38BDF8",
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      desc: "Spending breakdowns, trip stats, and travel insights.",
      color: "#FBBF24",
    },
  ];

  /* â”€â”€ Testimonials â”€â”€ */
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
    { icon: Navigation, label: "Real-time Updates" },
    { icon: RefreshCw, label: "Dynamic Replanning" },
  ];

  /* â”€â”€ Testimonial carousel state â”€â”€ */
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setActiveTestimonial((i) => (i + 1) % testimonials.length),
      5000
    );
    return () => clearInterval(timer);
  }, [testimonials.length]);

  /* â”€â”€ Famous Destinations (CardStack) â”€â”€ */
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
      {/* â”€â”€ SCROLL PROGRESS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <ScrollProgressBar />

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="fixed top-0 w-full z-50 nav-aurora" role="banner">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity group"
            aria-label="VOYIQ Home"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #6366F1, #8B5CF6)",
                boxShadow:
                  "0 0 24px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Compass
                className="text-white w-5 h-5 group-hover:rotate-45 transition-transform duration-500"
                aria-hidden="true"
              />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">
              VOYIQ
            </span>
          </Link>

          {/* Nav links */}
          <nav
            className="hidden md:flex items-center gap-8 text-sm font-medium"
            aria-label="Main navigation"
          >
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "#why-voyiq", label: "Why VOYIQ" },
              { href: "/pricing", label: "Pricing" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* CTA cluster */}
          <div className="flex items-center gap-3">
            {/* Profile dropdown for signed-in users; Sign In button for guests */}
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="h-9 w-9 rounded-full overflow-hidden border-2 transition-all hover:border-primary/60"
                    style={{ border: "2px solid rgba(99,102,241,0.35)" }}
                    aria-label="Open profile menu"
                  >
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                      <AvatarFallback className="text-xs font-bold" style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white" }}>
                        {(user.displayName || user.email || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-60">
                  <PopoverHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                        <AvatarFallback className="text-xs font-bold" style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "white" }}>
                          {(user.displayName || user.email || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <PopoverTitle>{user.displayName || "Explorer"}</PopoverTitle>
                        <PopoverDescription className="truncate">{user.email}</PopoverDescription>
                      </div>
                    </div>
                  </PopoverHeader>
                  <PopoverBody className="space-y-0.5">
                    <Link href="/dashboard">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left">
                        <LayoutDashboard className="w-4 h-4 text-primary" aria-hidden="true" />
                        Dashboard
                      </button>
                    </Link>
                    <Link href="/settings">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors text-left">
                        <Settings className="w-4 h-4" aria-hidden="true" />
                        Settings
                      </button>
                    </Link>
                  </PopoverBody>
                  <PopoverFooter>
                    <button
                      onClick={() => router.push("/auth")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sign Out
                    </button>
                  </PopoverFooter>
                </PopoverContent>
              </Popover>
            ) : (
              <Link href="/auth">
                <Button
                  variant="ghost"
                  className="hidden sm:inline-flex text-muted-foreground hover:text-white hover:bg-white/8 rounded-full px-5"
                >
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              onClick={handleProceed}
              className="btn-shimmer rounded-full px-6 font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                boxShadow: "0 0 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {user ? "Plan Adventure" : "Get Started"}
              <ArrowRight className="ml-1.5 w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HERO SECTION â€” PixelPerfect
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          STATS BAR
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        className="py-16 relative overflow-hidden"
        aria-label="Key statistics"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(16,185,129,0.04) 100%)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
          aria-hidden="true"
        />
        <div
          ref={revealStats as React.RefCallback<HTMLDivElement>}
          className="container mx-auto px-4 stagger-children"
        >
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10000, suffix: "+", label: "Travelers Worldwide" },
              { value: 50000, suffix: "+", label: "Itineraries Created" },
              { value: 150, suffix: "+", label: "Countries Covered" },
              { value: 98, suffix: "%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <div key={i} className="reveal reveal-up">
                <dt className="text-4xl font-headline font-extrabold aurora-text mb-1">
                  <AnimatedNumber
                    target={stat.value}
                    suffix={stat.suffix}
                  />
                </dt>
                <dd className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MARQUEE STRIP
          SKILL.md Â§7: marquee â€” transform only, pauseable on hover
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        className="py-8 relative overflow-hidden"
        aria-label="Feature highlights"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.03) 100%)",
            borderTop: "1px solid rgba(99,102,241,0.1)",
            borderBottom: "1px solid rgba(99,102,241,0.1)",
          }}
        />
        <div className="marquee-fade overflow-hidden">
          <div className="flex">
            <div className="marquee-track">
              {[...marqueeItems, ...marqueeItems].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-8 whitespace-nowrap"
                >
                  <item.icon
                    className="w-4 h-4"
                    style={{ color: i % 3 === 0 ? "#6366F1" : i % 3 === 1 ? "#8B5CF6" : "#10B981" }}
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </span>
                  <span
                    className="w-1 h-1 rounded-full ml-4"
                    style={{ background: "rgba(99,102,241,0.5)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          FAMOUS DESTINATIONS â€” CardStack
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        className="py-24 relative overflow-hidden"
        aria-label="Famous travel destinations"
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
          aria-hidden="true"
        />
        <Orb size={400} color="violet" style={{ top: "10%", left: "-5%", opacity: 0.15 }} animDelay="-4s" />
        <Orb size={300} color="emerald" style={{ bottom: "10%", right: "-5%", opacity: 0.12 }} animDelay="-8s" />

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
            autoAdvance
            intervalMs={3200}
            pauseOnHover
            showDots
            cardWidth={540}
            cardHeight={340}
            loop
          />

          <div className="text-center mt-10">
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          BENTO FEATURES GRID
          SKILL.md Â§5: Layout â€” visual-hierarchy, container-width
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        id="features"
        className="py-32 relative overflow-hidden"
        aria-label="Features"
      >
        <Orb size={550} color="violet" style={{ top: "5%", right: "-10%", opacity: 0.18 }} animDelay="-3s" />
        <Orb size={400} color="indigo" style={{ bottom: "10%", left: "-8%", opacity: 0.15 }} animDelay="-7s" />

        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="max-w-3xl mb-16 reveal reveal-up">
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

          {/* Bento grid */}
          <div
            ref={revealBento as React.RefCallback<HTMLDivElement>}
            className="bento-grid stagger-children"
          >
            {features.map((f, i) => (
              <div key={i} className={`reveal reveal-scale ${f.size}`}>
                <Card3D className="h-full">
                  <div
                    className={`h-full p-7 rounded-3xl flex flex-col relative overflow-hidden ${f.variant}`}
                    style={{ minHeight: f.large ? "260px" : "180px" }}
                  >
                    {/* Background glow blot */}
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${f.accent}22 0%, transparent 70%)`,
                        filter: "blur(24px)",
                      }}
                      aria-hidden="true"
                    />

                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 icon-box-aurora flex-shrink-0 relative"
                      style={{ border: `1px solid ${f.accent}30` }}
                    >
                      <f.icon
                        className="w-7 h-7"
                        style={{ color: f.accent }}
                        aria-hidden="true"
                      />
                    </div>

                    <h3
                      className="text-xl font-bold mb-3"
                      style={{ color: f.large ? "white" : undefined }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm flex-1">
                      {f.desc}
                    </p>

                    <div
                      className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                      style={{ color: f.accent }}
                    >
                      Explore <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>
                </Card3D>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HOW IT WORKS â€” Stepper Timeline
          SKILL.md Â§9: Navigation â€” multi-step-progress
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        id="how-it-works"
        className="py-32 relative overflow-hidden"
        aria-label="How VOYIQ works"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
          aria-hidden="true"
        />
        <Orb size={450} color="emerald" style={{ top: "20%", left: "-5%", opacity: 0.3 }} animDelay="-5s" />

        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
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

          {/* Steps */}
          <div
            ref={revealStepper as React.RefCallback<HTMLDivElement>}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children relative"
          >
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
              <div key={i} className="reveal reveal-up flex flex-col items-center text-center">
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          BENEFITS SECTION
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        id="why-voyiq"
        className="py-32 relative overflow-hidden"
        aria-label="Why choose VOYIQ"
      >
        <Orb size={500} color="indigo" style={{ bottom: "0%", right: "-8%", opacity: 0.14 }} animDelay="-6s" />

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Left â€” benefit cards */}
            <div
              ref={revealBenefits as React.RefCallback<HTMLDivElement>}
              className="space-y-8 stagger-children"
            >
              <div className="space-y-5 reveal reveal-left">
                <Badge
                  className="mb-2 px-4 py-1.5 text-xs uppercase tracking-widest font-bold"
                  style={{
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.28)",
                    color: "#818CF8",
                  }}
                >
                  Why VOYIQ
                </Badge>
                <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
                  Prioritize the journey,
                  <br />
                  <span className="aurora-text">not the planning.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  VOYIQ understands your travel philosophy to curate experiences
                  that resonate deeply â€” no generic suggestions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((item, i) => (
                  <div
                    key={i}
                    className="reveal reveal-up flex gap-4 p-5 rounded-2xl transition-all duration-300 group hover:scale-[1.02]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1), border-color 0.3s ease, box-shadow 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${item.color}30`;
                      e.currentTarget.style.boxShadow = `0 0 24px ${item.color}12`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${item.color}18`,
                        border: `1px solid ${item.color}28`,
                      }}
                    >
                      <item.icon
                        className="w-5 h-5"
                        style={{ color: item.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1 group-hover:text-primary transition-colors text-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right â€” 3D testimonial showcase */}
            <div className="relative">
              <Orb size={320} color="violet" style={{ top: "15%", right: "5%", opacity: 0.18 }} animDelay="-2s" />
              <Card3D>
                <div
                  className="aurora-prism p-8 rounded-3xl relative overflow-hidden"
                  style={{ minHeight: "380px" }}
                >
                  {/* Rainbow top bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-3xl"
                    style={{
                      background:
                        "linear-gradient(90deg, #6366F1, #8B5CF6, #10B981, #F472B6)",
                    }}
                    aria-hidden="true"
                  />

                  <div className="flex items-center gap-4 mb-8">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))",
                        border: "1px solid rgba(99,102,241,0.3)",
                      }}
                    >
                      <Star
                        className="w-7 h-7 fill-primary text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        Loved by 10k+ Travelers
                      </h4>
                      <div className="flex gap-1 mt-1" role="img" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className="w-3.5 h-3.5 text-primary fill-primary"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Testimonial text with fade transition */}
                  <blockquote
                    className="text-lg italic mb-8 text-white/90 leading-relaxed font-medium"
                    style={{
                      transition: "opacity 0.5s ease",
                      minHeight: "80px",
                    }}
                  >
                    &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white"
                        style={{
                          background: `linear-gradient(135deg, ${testimonials[activeTestimonial].color}60, ${testimonials[activeTestimonial].color}30)`,
                          border: `1px solid ${testimonials[activeTestimonial].color}40`,
                        }}
                        aria-hidden="true"
                      >
                        {testimonials[activeTestimonial].initials}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {testimonials[activeTestimonial].author}
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: testimonials[activeTestimonial].color }}
                        >
                          {testimonials[activeTestimonial].role}
                        </p>
                      </div>
                    </div>

                    {/* Dot indicators */}
                    <div className="flex gap-1.5" role="tablist" aria-label="Testimonial navigation">
                      {testimonials.map((_, idx) => (
                        <button
                          key={idx}
                          role="tab"
                          aria-selected={idx === activeTestimonial}
                          aria-label={`View testimonial ${idx + 1}`}
                          onClick={() => setActiveTestimonial(idx)}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: idx === activeTestimonial ? "20px" : "6px",
                            height: "6px",
                            background:
                              idx === activeTestimonial
                                ? testimonials[activeTestimonial].color
                                : "rgba(255,255,255,0.2)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card3D>
            </div>
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SOCIAL PROOF â€” Avatar stack + rolling testimonials
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        className="py-20 relative overflow-hidden"
        aria-label="Community testimonials"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
          aria-hidden="true"
        />
        <div className="container mx-auto px-4">
          {/* Avatar stack */}
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

          {/* Dual marquee rows */}
          <div
            ref={revealTestimonials as React.RefCallback<HTMLDivElement>}
            className="space-y-4"
          >
            {[false, true].map((reversed, rowIdx) => (
              <div key={rowIdx} className="overflow-hidden marquee-fade">
                <div className="flex">
                  <div
                    className={`flex gap-4 ${reversed ? "marquee-track-reverse" : "marquee-track marquee-slow"}`}
                  >
                    {[...testimonials, ...testimonials].map((t, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 aurora-card rounded-2xl p-5"
                        style={{
                          width: "320px",
                          border: `1px solid ${t.color}20`,
                        }}
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
                          &ldquo;{t.quote.substring(0, 90)}...&rdquo;
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
                            <p
                              className="text-xs"
                              style={{ color: t.color }}
                            >
                              {t.role.split(" Â· ")[1]}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          CTA SECTION
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section
        className="py-32 relative overflow-hidden"
        aria-label="Get started call to action"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, transparent 65%)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
          aria-hidden="true"
        />
        <Orb
          size={500}
          color="indigo"
          style={{ top: "-30%", left: "50%", transform: "translateX(-50%)", opacity: 0.2 }}
        />
        <Orb
          size={300}
          color="emerald"
          style={{ bottom: "-10%", right: "15%", opacity: 0.14 }}
          animDelay="-5s"
        />

        <div
          ref={revealCTA as React.RefCallback<HTMLDivElement>}
          className="reveal reveal-scale container mx-auto px-4 text-center relative z-10"
        >
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
              className="btn-shimmer magnetic-btn font-bold"
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
