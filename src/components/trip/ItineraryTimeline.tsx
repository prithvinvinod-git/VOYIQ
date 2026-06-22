"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, MapPin, Utensils, Car, Hotel, Target, Languages, Sun } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_STYLES: Record<string, { dot: string; line: string; label: string; bg: string; icon: React.ElementType }> = {
  Food: { dot: "hsl(152, 76%, 40%)", line: "hsl(152, 76%, 40% / 0.25)", label: "text-emerald-400", bg: "hsl(152, 76%, 40% / 0.08)", icon: Utensils },
  Transport: { dot: "hsl(258, 90%, 66%)", line: "hsl(258, 90%, 66% / 0.25)", label: "text-violet-400", bg: "hsl(258, 90%, 66% / 0.08)", icon: Car },
  Stay: { dot: "hsl(38, 92%, 50%)", line: "hsl(38, 92%, 50% / 0.25)", label: "text-amber-400", bg: "hsl(38, 92%, 50% / 0.08)", icon: Hotel },
  Activities: { dot: "hsl(217, 91%, 60%)", line: "hsl(217, 91%, 60% / 0.25)", label: "text-blue-400", bg: "hsl(217, 91%, 60% / 0.08)", icon: Target },
  Misc: { dot: "hsl(var(--muted-foreground))", line: "hsl(var(--border))", label: "text-muted-foreground", bg: "hsl(var(--muted))", icon: MapPin },
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Misc;
}

function TimeBadge({ time }: { time: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/10"
    >
      <Clock className="w-3 h-3" aria-hidden="true" />
      {time}
    </div>
  );
}

interface Slot {
  time: string;
  activity: string;
  description: string;
  location: string;
  estimatedCostINR: number;
  category: string;
  completed?: boolean;
  localPhrases?: { phrase: string; meaning: string }[];
}

interface ItineraryTimelineProps {
  slots: Slot[];
  dayNumber: number;
  onToggleSlot: (slotIdx: number) => void;
}

function ActivityCard({
  slot,
  index,
  onToggle,
}: {
  slot: Slot;
  index: number;
  onToggle: () => void;
}) {
  const style = getCategoryStyle(slot.category);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="relative"
    >
      {/* Timeline connector dot */}
      <div
        className="absolute left-0 top-6 w-3 h-3 rounded-full -translate-x-[5px] z-10 ring-2 ring-background"
        style={{ background: style.dot }}
        aria-hidden="true"
      />

      <div
        className={`ml-6 rounded-2xl overflow-hidden transition-all duration-300 border border-border ${
          slot.completed ? "opacity-50 bg-muted" : "bg-card"
        }`}
      >
        {/* Category top accent */}
        <div className="h-1 w-full rounded-t-2xl" style={{ background: style.dot }} />

        <div className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={slot.completed}
              onCheckedChange={onToggle}
              className="mt-1 border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              aria-label={`Mark "${slot.activity}" as ${slot.completed ? "incomplete" : "complete"}`}
            />
            <div className="flex-1 min-w-0 space-y-3">
              {/* Top row: time + cost */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <TimeBadge time={slot.time} />
                <span className="text-sm font-bold tabular-nums text-accent whitespace-nowrap">
                  ₹{slot.estimatedCostINR}
                </span>
              </div>

              {/* Activity title */}
              <h4
                className={`text-base font-bold leading-tight ${
                  slot.completed ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {slot.activity}
              </h4>

              {/* Description */}
              <p
                className={`text-sm leading-relaxed ${
                  isExpanded ? "" : "line-clamp-2"
                } text-muted-foreground`}
              >
                {slot.description}
              </p>
              {slot.description.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted border border-border ${style.label}`}
                >
                  {slot.category}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                  <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[180px]" title={slot.location}>
                    {slot.location}
                  </span>
                </div>
              </div>

              {/* Local phrases */}
              {slot.localPhrases && slot.localPhrases.length > 0 && (
                <details className="rounded-xl mt-2 overflow-hidden">
                  <summary
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer text-primary hover:text-primary/80 transition-colors bg-primary/5"
                  >
                    <Languages className="w-3 h-3" aria-hidden="true" />
                    Local phrases ({slot.localPhrases.length})
                  </summary>
                  <div
                    className="p-3 space-y-2 bg-muted"
                  >
                    {slot.localPhrases.map((phrase, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium italic text-foreground">
                          &ldquo;{phrase.phrase}&rdquo;
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {phrase.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ItineraryTimeline({ slots, dayNumber, onToggleSlot }: ItineraryTimelineProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.focus();
    }
  }, [dayNumber]);

  return (
    <div
      ref={listRef}
      role="list"
      aria-label={`Day ${dayNumber} itinerary activities`}
      tabIndex={-1}
      className="relative space-y-0 focus:outline-none"
    >
      {/* Vertical timeline line */}
      <div
        className="absolute left-[5px] top-0 bottom-0 w-px bg-border/50"
        aria-hidden="true"
      />

      <AnimatePresence mode="wait">
        <div className="space-y-6">
          {slots.map((slot, idx) => (
            <ActivityCard
              key={`${dayNumber}-${idx}`}
              slot={slot}
              index={idx}
              onToggle={() => onToggleSlot(idx)}
            />
          ))}
        </div>
      </AnimatePresence>

      {slots.length === 0 && (
        <div
          className="ml-6 p-8 text-center rounded-2xl border border-dashed border-border"
        >
          <Sun className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No activities planned for this day yet.</p>
        </div>
      )}
    </div>
  );
}

export function DaySelector({
  days,
  activeDay,
  onDayChange,
}: {
  days: { dayNumber: number; theme?: string }[];
  activeDay: number;
  onDayChange: (day: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, day: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDayChange(day);
    }
  };

  return (
    <nav
      ref={scrollRef}
      role="tablist"
      aria-label="Trip days"
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
    >
      {days.map((day) => {
        const isActive = activeDay === day.dayNumber;
        return (
          <button
            key={day.dayNumber}
            role="tab"
            aria-selected={isActive}
            aria-label={`Day ${day.dayNumber}${day.theme ? `: ${day.theme}` : ""}`}
            onClick={() => onDayChange(day.dayNumber)}
            onKeyDown={(e) => handleKeyDown(e, day.dayNumber)}
            className={`flex-shrink-0 w-[68px] h-[68px] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 font-bold focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 ${
              isActive
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            <span className="text-[8px] uppercase font-bold opacity-70 leading-none">Day</span>
            <span className="text-lg font-extrabold leading-none">{day.dayNumber}</span>
          </button>
        );
      })}
    </nav>
  );
}
