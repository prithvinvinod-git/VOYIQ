"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export function Hero({
  eyebrow = "Innovate Without Limits",
  title,
  subtitle,
  ctaLabel = "Explore Now",
  ctaHref = "#",
  onCtaClick,
}: HeroProps) {
  return (
    <section
      id="hero"
      className="relative mx-auto w-full pt-40 px-6 text-center md:px-8
      min-h-[calc(100vh-40px)] overflow-hidden
      bg-background
      rounded-b-xl"
    >
      {/* Grid BG */}
      <div
        className="absolute -z-10 inset-0 opacity-80 h-[600px] w-full
        bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem]
        "
      />



      {/* Eyebrow */}
      {eyebrow && (
        <a href="#" className="group">
          <span
            className="text-sm text-muted-foreground mx-auto px-5 py-2
            bg-muted/30
            border border-border
            rounded-3xl w-fit tracking-tight uppercase flex items-center justify-center"
          >
            {eyebrow}
            <ChevronRight className="inline w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </a>
      )}

      {/* Title */}
      <h1
        className="animate-fade-in -translate-y-4 text-balance
        py-6 text-5xl font-semibold leading-none tracking-tighter
        text-foreground opacity-0 sm:text-6xl md:text-7xl lg:text-8xl"
      >
        {title}
      </h1>

      {/* Subtitle */}
      <p
        className="animate-fade-in mb-12 -translate-y-4 text-balance
        text-lg tracking-tight text-muted-foreground
        opacity-0 md:text-xl"
      >
        {subtitle}
      </p>

      {/* CTA */}
      {ctaLabel && (
        <div className="flex justify-center">
          {onCtaClick ? (
            <Button
              onClick={onCtaClick}
              className="bg-primary text-primary-foreground mt-[-20px] w-fit md:w-52 z-20 tracking-tighter text-center text-lg rounded-full font-bold"
            >
              {ctaLabel}
            </Button>
          ) : (
            <Button
              asChild
              className="bg-primary text-primary-foreground mt-[-20px] w-fit md:w-52 z-20 tracking-tighter text-center text-lg rounded-full font-bold"
            >
              <a href={ctaHref}>{ctaLabel}</a>
            </Button>
          )}
        </div>
      )}

      {/* Bottom Fade */}
      <div
        className="animate-fade-up relative mt-32 opacity-0"
      />
    </section>
  );
}
