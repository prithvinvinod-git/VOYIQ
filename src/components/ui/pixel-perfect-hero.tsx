"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Globe, Brain, Zap, Shield, Sparkles, MapPin, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

/* ─────────────────────────────────────────────────────────────────
 * Lazy-load GradientBlinds to keep SSR clean
 * ─────────────────────────────────────────────────────────────────*/
const GradientBlinds = dynamic(() => import("./GradientBlinds"), { ssr: false });

/* ─────────────────────────────────────────────────────────────────
 * SPLINE VIEWER — web component wrapper
 * ─────────────────────────────────────────────────────────────────*/
function SplineViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Inject the Spline viewer script once
    const existingScript = document.querySelector(
      'script[src*="splinetool/viewer"]'
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://unpkg.com/@splinetool/viewer@1.12.97/build/spline-viewer.js";
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !ref.current) return;
    ref.current.innerHTML = "";
    const el = document.createElement("spline-viewer") as any;
    el.setAttribute("url", url);
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    el.style.background = "transparent";
    ref.current.appendChild(el);
  }, [loaded, url]);

  return (
    <div
      ref={ref}
      className="w-full h-full"
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
 * BRAND FEATURE PILLS — mobile showcase row
 * ─────────────────────────────────────────────────────────────────*/
const FEATURE_PILLS = [
  { icon: Globe, label: "150+ Countries", color: "#6366F1" },
  { icon: Brain, label: "Gemini AI", color: "#8B5CF6" },
  { icon: Zap, label: "60s Planning", color: "#10B981" },
  { icon: Shield, label: "Secure & Private", color: "#F472B6" },
  { icon: MapPin, label: "Live Maps", color: "#38BDF8" },
  { icon: Wallet, label: "BudgetSync", color: "#FBBF24" },
];

/* ─────────────────────────────────────────────────────────────────
 * FLOATING STAT BADGE — appears over the Spline scene
 * ─────────────────────────────────────────────────────────────────*/
function StatBadge({
  value,
  label,
  color,
  style,
}: {
  value: string;
  label: string;
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="relative pointer-events-none select-none w-max block"
      style={{
        backdropFilter: "blur(12px)",
        background: "rgba(6,8,20,0.72)",
        border: `1px solid ${color}30`,
        borderRadius: "14px",
        padding: "10px 16px",
        boxShadow: `0 0 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
        ...style,
      }}
    >
      <div
        className="text-xl font-black leading-none"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[11px] text-white/50 font-medium mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * HERO COMPONENT
 * ─────────────────────────────────────────────────────────────────*/
export interface PixelHeroProps {
  word1?: string;
  word2?: string;
  description?: string;
  primaryCta?: string;
  primaryCtaMobile?: string;
  secondaryCta?: string;
  secondaryCtaMobile?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  secondaryHref?: string;
  splineUrl?: string;
  lite?: boolean;
}

export function PixelHero({
  word1 = "Travel",
  word2 = "Refined.",
  description = "AI-crafted itineraries personalised to your budget, style, and pace. Plan your next adventure in under 60 seconds.",
  primaryCta = "Begin Your Journey",
  primaryCtaMobile = "Get Started",
  secondaryCta = "Join the Community",
  secondaryCtaMobile = "Join",
  onPrimaryClick,
  onSecondaryClick,
  secondaryHref = "/auth",
  splineUrl,
  lite = false,
}: PixelHeroProps) {
  const [isLoaded, setIsLoaded] = useState(lite);
  const [pillIdx, setPillIdx] = useState(0);

  useEffect(() => {
    if (lite) return;
    const t = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(t);
  }, [lite]);

  useEffect(() => {
    if (lite) return;
    const iv = setInterval(
      () => setPillIdx((i) => (i + 1) % FEATURE_PILLS.length),
      2200
    );
    return () => clearInterval(iv);
  }, [lite]);

  const hasSpline = !!splineUrl && !lite;

  return (
    <div className="relative w-full min-h-[100dvh] bg-background overflow-hidden isolate">
      {/* ── Keyframes ────────────────────────────────────────────── */}
      <style>{`
        @keyframes hero-pill-marquee {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .hero-pill-marquee { animation: hero-pill-marquee 22s linear infinite; }

        @keyframes hero-badge-float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-8px) rotate(1deg); }
        }
        .hero-badge-float { animation: hero-badge-float 5s ease-in-out infinite; }
        .hero-badge-float-slow { animation: hero-badge-float 7s ease-in-out infinite reverse; }

        @keyframes voyiq-shimmer-text {
          0%   { background-position: 200% center; }
          100% { background-position: 0% center; }
        }
        .voyiq-glass-text {
          color: transparent;
          background: linear-gradient(
            135deg,
            rgba(255,255,255,1)   0%,
            rgba(255,255,255,0.4) 25%,
            rgba(255,255,255,0.1) 45%,
            rgba(255,255,255,0.9) 55%,
            rgba(255,255,255,0.2) 75%,
            rgba(255,255,255,1)   100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-stroke: 1.5px rgba(255,255,255,0.2);
          filter: drop-shadow(0 12px 28px rgba(0,0,0,0.4));
          animation: voyiq-shimmer-text 8s linear infinite;
        }

        @keyframes spline-reveal {
          from { opacity: 0; transform: scale(0.92) translateX(20px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }
        .spline-reveal { animation: spline-reveal 1.1s cubic-bezier(0.23,1,0.32,1) forwards; animation-delay: 0.4s; opacity: 0; }

        /* Mobile scroll-snap pill row */
        .mobile-pill-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .mobile-pill-scroll::-webkit-scrollbar { display: none; }
        .mobile-pill-scroll > * { scroll-snap-align: start; flex-shrink: 0; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          GRADIENT BLINDS BACKGROUND (full bleed)
          ════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <GradientBlinds
          gradientColors={["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#6366F1"]}
          angle={0}
          noise={0.25}
          blindCount={14}
          blindMinWidth={60}
          spotlightRadius={0.6}
          spotlightSoftness={0.85}
          spotlightOpacity={0.8}
          mouseDampening={0.18}
          distortAmount={0.2}
          shineDirection="left"
          mixBlendMode="screen"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(6,8,20,0.05) 0%, rgba(6,8,20,0.35) 60%, rgba(6,8,20,0.55) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: "linear-gradient(to bottom, transparent, hsl(234,45%,5%))",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN HERO CONTENT
          ════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "relative z-10 w-full min-h-[100dvh] flex flex-col",
          // Desktop: two-column row layout
          hasSpline ? "lg:flex-row lg:items-center" : "items-center justify-center"
        )}
      >
        {/* ── LEFT COLUMN — Text Content ────────────────────────── */}
        <div
          className={cn(
            "flex flex-col justify-center px-5 sm:px-8 md:px-12",
            // Mobile: stack vertically with top padding for the nav
            "pt-28 pb-8 md:pt-32 md:pb-12",
            // Desktop with Spline: take 50% width, center vertically
            hasSpline
              ? "lg:w-1/2 lg:pt-0 lg:pb-0 lg:pl-16 lg:pr-6 lg:min-h-[100dvh]"
              : "w-full max-w-3xl mx-auto text-center"
          )}
        >
          {/* ── Trust pill ── */}
          <div
            className={cn(
              "inline-flex items-center gap-2 mb-6 self-start",
              !hasSpline && "self-center"
            )}
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(-12px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <span
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide"
              style={{
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a5b4fc",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Powered by Gemini AI
            </span>
          </div>

          {/* ── Headline ── */}
          <h1
            className={cn(
              lite ? "text-white font-headline" : "voyiq-glass-text font-headline",
              "leading-[1.0] tracking-tight mb-5",
              // Mobile: large but not huge
              "text-[3.2rem] xs:text-[3.8rem] sm:text-6xl",
              // Desktop: very large
              "md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]",
              !hasSpline && "text-center"
            )}
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(28px)",
              transition: "opacity 0.9s ease, transform 0.9s ease",
              transitionDelay: "0.1s",
            }}
          >
            <span className="font-serif italic font-medium block sm:inline">{word1}</span>
            <span className="font-sans font-extrabold block sm:inline sm:ml-3">{word2}</span>
          </h1>

          {/* ── Description ── */}
          <p
            className={cn(
              "text-white/65 leading-relaxed mb-8 max-w-md",
              "text-base sm:text-lg md:text-xl",
              !hasSpline && "text-center mx-auto"
            )}
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.9s ease, transform 0.9s ease",
              transitionDelay: "0.2s",
            }}
          >
            {description}
          </p>

          {/* ── CTA Buttons ── */}
          <div
            className={cn(
              "flex flex-row flex-wrap gap-3 mb-10",
              !hasSpline && "justify-center"
            )}
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.9s ease, transform 0.9s ease",
              transitionDelay: "0.3s",
            }}
          >
            {/* Primary CTA */}
            <button
              onClick={onPrimaryClick}
              className="relative inline-flex items-center gap-2 rounded-2xl px-5 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                boxShadow: "0 0 28px rgba(99,102,241,0.45), inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
            >
              <span className="inline sm:hidden">{primaryCtaMobile}</span>
              <span className="hidden sm:inline">{primaryCta}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Secondary CTA */}
            {onSecondaryClick ? (
              <button
                onClick={onSecondaryClick}
                className="relative inline-flex items-center gap-2 rounded-2xl px-5 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-base font-semibold text-white/80 transition-all duration-200 hover:scale-[1.03] hover:text-white active:scale-[0.97] cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span className="inline sm:hidden">{secondaryCtaMobile}</span>
                <span className="hidden sm:inline">{secondaryCta}</span>
              </button>
            ) : (
              <a
                href={secondaryHref}
                className="relative inline-flex items-center gap-2 rounded-2xl px-5 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-base font-semibold text-white/80 transition-all duration-200 hover:scale-[1.03] hover:text-white active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span className="inline sm:hidden">{secondaryCtaMobile}</span>
                <span className="hidden sm:inline">{secondaryCta}</span>
              </a>
            )}
          </div>

          {/* ══════════════════════════════════════════════
              MOBILE FEATURE PILLS (scrollable row)
              Only visible on < lg when spline is present,
              or always when no spline
              ══════════════════════════════════════════ */}
          <div
            className={cn(
              "mb-6",
              hasSpline ? "lg:hidden" : "block"
            )}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 1s ease",
              transitionDelay: "0.45s",
            }}
          >
            <p className="text-[11px] uppercase tracking-widest text-white/35 font-semibold mb-3">
              Built for every explorer
            </p>
            <div className="mobile-pill-scroll pb-2">
              {FEATURE_PILLS.map((pill, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300"
                  style={{
                    background:
                      pillIdx === i
                        ? `${pill.color}22`
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${pillIdx === i ? pill.color + "50" : "rgba(255,255,255,0.08)"}`,
                    color: pillIdx === i ? pill.color : "rgba(255,255,255,0.45)",
                  }}
                >
                  <pill.icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {pill.label}
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* ── RIGHT COLUMN — Spline 3D Scene ───────────────────── */}
        {hasSpline && (
          <div
            className={cn(
              // Mobile: full-width strip with fixed height below the text
              "relative w-full h-[300px] xs:h-[340px] sm:h-[400px]",
              // Desktop: right half, full viewport height
              "lg:w-1/2 lg:h-auto lg:min-h-[100dvh] lg:flex lg:items-center lg:justify-center lg:overflow-visible"
            )}
            aria-hidden="true"
          >
            {/* Spline scene — scaled and clipped to hide watermark */}
            <div className="spline-reveal absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-[118%] h-[118%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <SplineViewer url={splineUrl!} />
              </div>
            </div>

            {/* Small glow effect at top left of Right Column */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                width: "250px",
                height: "250px",
                top: "5%",
                left: "5%",
                background: "radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)",
                filter: "blur(40px)",
                zIndex: 1,
              }}
            />

            {/* Floating stat badges — desktop only */}
            <div
              className="hidden lg:block hero-badge-float absolute z-20"
              style={{ top: "18%", left: "4%" }}
            >
              <StatBadge value="50K+" label="Itineraries Created" color="#6366F1" />
            </div>
            <div
              className="hidden lg:block hero-badge-float-slow absolute z-20"
              style={{ bottom: "22%", right: "8%" }}
            >
              <StatBadge value="4.9★" label="User Rating" color="#FBBF24" />
            </div>
            <div
              className="hidden lg:block absolute z-20"
              style={{
                bottom: "38%",
                left: "12%",
                animation: "hero-badge-float 8s ease-in-out infinite",
                animationDelay: "-3s",
              }}
            >
              <StatBadge value="60s" label="Trip Generated" color="#10B981" />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP LOGO STRIP (bottom of hero, hidden on mobile)
          ════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "hidden md:flex absolute bottom-8 left-0 right-0 z-10 flex-col items-center gap-3",
          hasSpline ? "lg:hidden" : ""
        )}
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 1s ease, transform 1s ease",
          transitionDelay: "0.6s",
        }}
      >
        <span className="text-[11px] uppercase tracking-widest text-white/30 font-medium">
          Built for every kind of explorer
        </span>
        <div className="relative w-full max-w-3xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
          <div className="flex w-max hero-pill-marquee gap-14 py-2">
            <div className="flex gap-14 items-center">
              {FEATURE_PILLS.map((p, i) => (
                <div key={i} className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity">
                  <p.icon className="w-4 h-4" style={{ color: p.color }} aria-hidden="true" />
                  <span className="text-sm font-semibold text-white/70">{p.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-14 items-center" aria-hidden="true">
              {FEATURE_PILLS.map((p, i) => (
                <div key={`c-${i}`} className="flex items-center gap-2 opacity-50 hover:opacity-90 transition-opacity">
                  <p.icon className="w-4 h-4" style={{ color: p.color }} aria-hidden="true" />
                  <span className="text-sm font-semibold text-white/70">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PixelHero;
