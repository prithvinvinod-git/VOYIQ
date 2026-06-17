"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Globe, Brain, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────
 * BRAND LOGOS — contextualised for VOYIQ
 * ─────────────────────────────────────────────────────────────────*/

const BRAND_LOGOS = [
  () => (
    <div className="flex items-center gap-2 text-foreground/60 hover:text-foreground/90 transition-all duration-300 opacity-60 hover:opacity-100">
      <Globe className="w-5 h-5" />
      <span className="font-bold text-sm tracking-tight">150+ Countries</span>
    </div>
  ),
  () => (
    <div className="flex items-center gap-2 text-foreground/60 hover:text-foreground/90 transition-all duration-300 opacity-60 hover:opacity-100">
      <Brain className="w-5 h-5" />
      <span className="font-bold text-sm tracking-tight">GPT-4 Powered</span>
    </div>
  ),
  () => (
    <div className="flex items-center gap-2 text-foreground/60 hover:text-foreground/90 transition-all duration-300 opacity-60 hover:opacity-100">
      <Zap className="w-5 h-5" />
      <span className="font-bold text-sm tracking-tight">Instant Planning</span>
    </div>
  ),
  () => (
    <div className="flex items-center gap-2 text-foreground/60 hover:text-foreground/90 transition-all duration-300 opacity-60 hover:opacity-100">
      <Shield className="w-5 h-5" />
      <span className="font-bold text-sm tracking-tight">Secure & Private</span>
    </div>
  ),
];

/* ─────────────────────────────────────────────────────────────────
 * PIXEL CANVAS ENGINE
 * ─────────────────────────────────────────────────────────────────*/

type Pixel = {
  x: number; y: number; color: string; ctx: CanvasRenderingContext2D;
  speed: number; size: number; sizeStep: number; minSize: number;
  maxSizeInt: number; maxSize: number; delay: number; counter: number;
  counterStep: number; isIdle: boolean; isReverse: boolean; isShimmer: boolean;
  draw: () => void; appear: () => void; disappear: () => void; shimmer: () => void;
};

function createPixel(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number, y: number, color: string, baseSpeed: number, delay: number
): Pixel {
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const p: Pixel = {
    x, y, color, ctx,
    speed: rand(0.08, 0.4) * baseSpeed,
    size: 0, sizeStep: rand(0.12, 0.28), minSize: 0.5, maxSizeInt: 2,
    maxSize: rand(0.5, 2), delay, counter: 0,
    counterStep: rand(1.8, 3.2) + (canvas.width + canvas.height) * 0.008,
    isIdle: false, isReverse: false, isShimmer: false,
    draw() {
      const offset = p.maxSizeInt * 0.5 - p.size * 0.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
    },
    appear() {
      p.isIdle = false;
      if (p.counter <= p.delay) { p.counter += p.counterStep; return; }
      if (p.size >= p.maxSize) p.isShimmer = true;
      if (p.isShimmer) p.shimmer(); else p.size += p.sizeStep;
      p.draw();
    },
    disappear() {
      p.isShimmer = false; p.counter = 0;
      if (p.size <= 0) { p.isIdle = true; return; }
      p.size -= 0.1; p.draw();
    },
    shimmer() {
      if (p.size >= p.maxSize) p.isReverse = true;
      else if (p.size <= p.minSize) p.isReverse = false;
      if (p.isReverse) p.size -= p.speed; else p.size += p.speed;
    },
  };
  return p;
}

function PixelCanvas({ colors, gap = 6, speed = 30 }: { colors: string[]; gap?: number; speed?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef(performance.now());
  const reducedMotionRef = useRef(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || colors.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.floor(width), h = Math.floor(height);
    canvas.width = w; canvas.height = h;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const effectiveSpeed = reducedMotionRef.current ? 0 : Math.min(speed, 100) * 0.001;
    const pixels: Pixel[] = [];
    for (let x = 0; x < w; x += gap) {
      for (let y = 0; y < h; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dx = x - w / 2, dy = y - h / 2;
        const delay = reducedMotionRef.current ? 0 : Math.sqrt(dx * dx + dy * dy) * 0.65;
        pixels.push(createPixel(ctx, canvas, x, y, color, effectiveSpeed, delay));
      }
    }
    pixelsRef.current = pixels;
  }, [colors, gap, speed]);

  const animate = useCallback((mode: "appear" | "disappear") => {
    cancelAnimationFrame(animationRef.current);
    const frameInterval = 1000 / 60;
    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const elapsed = now - lastFrameRef.current;
      if (elapsed < frameInterval) return;
      lastFrameRef.current = now - (elapsed % frameInterval);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pixels = pixelsRef.current;
      for (const pixel of pixels) pixel[mode]();
      if (pixels.every((p) => p.isIdle)) cancelAnimationFrame(animationRef.current);
    };
    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    init();
    const resizeObserver = new ResizeObserver(() => init());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);
    animate("appear");
    return () => { resizeObserver.disconnect(); cancelAnimationFrame(animationRef.current); };
  }, [init, animate]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 * HERO COMPONENT — VOYIQ contextualised
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
}

export function PixelHero({
  word1 = "Travel",
  word2 = "Refined.",
  description = "AI-crafted itineraries personalised to you. Plan your next adventure in under 60 seconds.",
  primaryCta = "Start Planning Free",
  primaryCtaMobile = "Start Free",
  secondaryCta = "Watch Demo",
  secondaryCtaMobile = "Demo",
  onPrimaryClick,
  onSecondaryClick,
  secondaryHref = "#features",
}: PixelHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [themeColors, setThemeColors] = useState<string[]>([]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const div = document.createElement("div");
    document.body.appendChild(div);
    div.className = "text-muted-foreground";
    const muted = getComputedStyle(div).color;
    div.className = "text-primary";
    const primary = getComputedStyle(div).color;
    document.body.removeChild(div);
    // Aurora pixel palette: mostly muted with occasional primary accent
    setThemeColors([muted, muted, muted, muted, primary, muted]);
    const t = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full min-h-[100dvh] bg-background flex flex-col justify-between md:justify-center md:gap-6 py-8 md:py-0 px-2 sm:px-6 overflow-hidden select-none isolate">
      <style>{`
        @keyframes marquee-voyiq {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-voyiq { animation: marquee-voyiq 20s linear infinite; }
        .voyiq-glass-text {
          color: transparent;
          background: linear-gradient(135deg,
            rgba(255,255,255,1) 0%,
            rgba(255,255,255,0.4) 25%,
            rgba(255,255,255,0.1) 45%,
            rgba(255,255,255,0.9) 55%,
            rgba(255,255,255,0.2) 75%,
            rgba(255,255,255,1) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-stroke: 1.5px rgba(255,255,255,0.25);
          filter: drop-shadow(0 15px 35px rgba(0,0,0,0.4)) drop-shadow(0 5px 10px rgba(0,0,0,0.2));
          animation: shimmer-voyiq 8s linear infinite;
        }
        @keyframes shimmer-voyiq {
          0%   { background-position: 200% center; }
          100% { background-position: 0% center; }
        }
      `}</style>

      {/* Pixel canvas background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {themeColors.length > 0 && <PixelCanvas colors={themeColors} gap={6} speed={30} />}
        {/* Radial vignette so content stays readable */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_80%)] opacity-85" />
        {/* Extra aurora at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.7), rgba(139,92,246,0.4), transparent)" }} />
      </div>

      {/* Heading */}
      <div className="flex flex-col items-center justify-center text-center order-1 mt-28 sm:mt-16 md:mt-0 pointer-events-none w-full relative z-10">
        <h1 className="voyiq-glass-text flex flex-row items-center justify-center gap-1.5 sm:gap-4 lg:gap-6 px-1 w-full flex-wrap text-[2.8rem] xs:text-[3.2rem] sm:text-6xl md:text-8xl lg:text-9xl leading-none">
          <span className="font-serif italic font-medium">{word1}</span>
          <span className="font-sans font-extrabold tracking-tighter">{word2}</span>
        </h1>
      </div>

      {/* Description + mobile marquee */}
      <div className="flex flex-col items-center justify-center text-center my-auto md:my-0 order-2 px-1 w-full pointer-events-none relative z-10">
        <p className="text-sm sm:text-lg md:text-xl font-light text-foreground/80 max-w-[95%] sm:max-w-md md:max-w-xl px-1 leading-relaxed">
          {description}
        </p>

        {/* Mobile marquee */}
        <div className="block md:hidden w-full mt-12 pointer-events-auto">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-4">
            Built for every explorer
          </div>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
            <div className="flex w-max gap-10 py-1 animate-marquee-voyiq">
              <div className="flex gap-10 items-center">{BRAND_LOGOS.map((Logo, i) => <Logo key={i} />)}</div>
              <div className="flex gap-10 items-center" aria-hidden="true">{BRAND_LOGOS.map((Logo, i) => <Logo key={`c-${i}`} />)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div
        className={cn(
          "pointer-events-auto flex flex-row items-center justify-center gap-3 mt-4 md:mt-10 mb-4 md:mb-0 order-4 md:order-3 transition-all duration-1000 transform px-1 relative z-10",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
        style={{ transitionDelay: "450ms" }}
      >
        <button
          onClick={onPrimaryClick}
          className="relative inline-flex h-10 md:h-12 items-center justify-center gap-1.5 md:gap-2 rounded-xl px-4 md:px-8 text-xs md:text-sm font-semibold text-white shadow-lg ring-1 ring-indigo-500/30 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", boxShadow: "0 0 28px rgba(99,102,241,0.4), inset 0 1px 1px rgba(255,255,255,0.3)" }}
        >
          <span className="inline md:hidden">{primaryCtaMobile}</span>
          <span className="hidden md:inline">{primaryCta}</span>
          <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {onSecondaryClick ? (
          <button
            onClick={onSecondaryClick}
            className="relative inline-flex h-10 md:h-12 items-center justify-center gap-1.5 md:gap-2 rounded-xl bg-gradient-to-b from-card/80 to-card px-4 md:px-8 text-xs md:text-sm font-semibold text-card-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-md transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span className="inline md:hidden">{secondaryCtaMobile}</span>
            <span className="hidden md:inline">{secondaryCta}</span>
          </button>
        ) : (
          <a
            href={secondaryHref}
            className="relative inline-flex h-10 md:h-12 items-center justify-center gap-1.5 md:gap-2 rounded-xl bg-gradient-to-b from-card/80 to-card px-4 md:px-8 text-xs md:text-sm font-semibold text-card-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-md transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span className="inline md:hidden">{secondaryCtaMobile}</span>
            <span className="hidden md:inline">{secondaryCta}</span>
          </a>
        )}
      </div>

      {/* Desktop marquee */}
      <div
        className={cn(
          "hidden md:flex absolute bottom-8 left-0 right-0 w-full z-10 pointer-events-auto flex-col items-center justify-center gap-4 transition-all duration-1000 transform order-3 md:order-4",
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
        style={{ transitionDelay: "600ms" }}
      >
        <span className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium select-none">
          Built for every kind of explorer
        </span>
        <div className="relative w-full max-w-3xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
          <div className="flex w-max gap-16 py-3 animate-marquee-voyiq">
            <div className="flex gap-16 items-center">{BRAND_LOGOS.map((Logo, i) => <Logo key={i} />)}</div>
            <div className="flex gap-16 items-center" aria-hidden="true">{BRAND_LOGOS.map((Logo, i) => <Logo key={`c-${i}`} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PixelHero;
