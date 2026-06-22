"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MapPin,
  Calendar,
  Wallet,
  Star,
  Zap,
  Download,
  Loader2,
  ArrowRight,
  Flame,
  Trophy,
  Globe,
  TrendingUp,
  Clock,
  Route,
  ChevronRight,
  Check,
  Send,
  MoreHorizontal,
  Activity,
} from "lucide-react";
import Link from "next/link";
import {
  useUser,
  useCollection,
  useFirestore,
  useMemoFirebase,
  useDoc,
} from "@/firebase";
import {
  collection,
  query,
  where,
  doc,
  getDocs,
  orderBy,
  Query,
  DocumentData,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { useToast } from "@/hooks/use-toast";
import { useScrollReveal, useScrollRevealContainer } from "@/hooks/useScrollReveal";
import { LumaSpin } from "@/components/ui/luma-spin";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
  health: number;
  totalCompletedSlots?: number;
  ownerId?: string;
  authorizedUserIds?: string[];
  createdAt?: string;
}

/* ── Count-up hook ── */
function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return target === 0 ? 0 : val;
}

function TripCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0">
        <Skeleton className="sm:w-48 h-44 sm:h-auto rounded-none" />
        <div className="flex-1 p-5 space-y-4">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-1.5 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyTrips({ onNew }: { onNew: () => void }) {
  return (
    <div className="glass-panel rounded-2xl py-20 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-white/5 border border-white/10">
        <Route className="w-7 h-7 text-blue-400/70" />
      </div>
      <h3 className="text-2xl font-headline font-bold mb-2 text-white">
        No adventures yet
      </h3>
      <p className="text-sm text-white/50 mb-8 max-w-xs mx-auto">
        Let VOYIQ AI craft your first personalized itinerary in seconds.
      </p>
      <Button
        onClick={onNew}
        className="bg-blue-500 hover:bg-blue-600 text-white h-11 px-8 rounded-xl font-semibold text-sm"
      >
        <Plus className="mr-2 w-4 h-4" />
        Plan Your First Journey
      </Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [exportingTripId, setExportingTripId] = useState<string | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isUserLoading && !user) router.push("/auth");
  }, [user, isUserLoading, router]);

  /* ── User doc ── */
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  /* ── Trips query ── */
  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "trips"),
      where("authorizedUserIds", "array-contains", user.uid)
    ) as Query<DocumentData>;
  }, [firestore, user]);

  const { data: tripsData, isLoading: isTripsLoading } = useCollection<Trip>(tripsQuery);

  /* ── Gamification stats ── */
  const stats = useMemo(() => {
    if (!tripsData) {
      return {
        explorationScore: 0,
        currentLevel: 1,
        levelProgress: 0,
        streakDays: 0,
        xpRemaining: 200,
        completedCount: 0,
        totalTrips: 0,
      };
    }

    const totalCompleted = tripsData.reduce(
      (acc, t) => acc + (t.totalCompletedSlots || 0),
      0
    );
    const totalXP = totalCompleted * 50 + tripsData.length * 20;
    const level = Math.floor(totalXP / 200) + 1;
    const progressInLevel = totalXP % 200;
    const levelProgressPercent = (progressInLevel / 200) * 100;
    const xpRemaining = 200 - progressInLevel;

    const accountCreationDate = user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime)
      : new Date();
    const daysSinceCreation = Math.floor(
      (Date.now() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const streak = tripsData.length > 0 ? Math.max(1, Math.min(daysSinceCreation + 1, 30)) : 0;

    return {
      explorationScore: totalXP,
      currentLevel: level,
      levelProgress: levelProgressPercent,
      xpRemaining,
      streakDays: streak,
      completedCount: totalCompleted,
      totalTrips: tripsData.length,
    };
  }, [tripsData, user]);

  /* ── PDF Export ── */
  const generateGoogleMapsLink = (slots: any[]) => {
    if (!slots?.length) return "";
    const origin = encodeURIComponent(slots[0].location);
    if (slots.length === 1)
      return `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${origin}&travelmode=driving`;
    const waypoints = slots
      .slice(1, -1)
      .map((s: any) => encodeURIComponent(s.location))
      .filter(Boolean);
    const destination = encodeURIComponent(slots[slots.length - 1].location);
    const wq = waypoints.length > 0 ? `&waypoints=${waypoints.join("|")}` : "";
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${wq}&travelmode=driving`;
  };

  const handleExportPDF = async (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore) return;
    setExportingTripId(trip.id);
    try {
      const itQuery = query(
        collection(firestore, `trips/${trip.id}/itineraryDays`),
        orderBy("dayNumber")
      );
      const snap = await getDocs(itQuery);
      const days = snap.docs.map((d) => d.data());
      if (days.length === 0) {
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: "No itinerary data found for this trip.",
        });
        return;
      }
      const pw = window.open("", "_blank");
      if (!pw) return;
      pw.document.write(`
        <html><head><title>VOYIQ — ${trip.destination}</title>
        <style>
          body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#111;padding:40px}
          .header{border-bottom:3px solid #0EA5E9;padding-bottom:20px;margin-bottom:40px}
          h1{margin:0;color:#0EA5E9;font-size:32px}
          .day{border-left:4px solid #EA580C;padding-left:20px;margin-bottom:40px}
          .day-header{font-size:20px;font-weight:bold;margin-bottom:10px}
          .slot{margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px}
          .time{font-weight:bold;color:#666;font-size:12px}
          .activity{font-weight:bold;font-size:16px;margin:4px 0}
          .location{font-size:12px;color:#888}
          .nav-link{display:inline-block;background:#0EA5E9;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:12px;margin-top:10px}
          @media print{.nav-link{display:none}}
        </style></head><body>
        <div class="header"><h1>VOYIQ | TRAVEL REFINED</h1>
        <p>Curated journey through <strong>${trip.destination}</strong></p></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:30px">
          <div><strong>Destination:</strong> ${trip.destination}<br>
          <strong>Dates:</strong> ${new Date(trip.startDate).toLocaleDateString()} – ${new Date(trip.endDate).toLocaleDateString()}</div>
          <div><strong>Budget:</strong> ${trip.totalBudget} ${trip.currency}<br>
          <strong>Health:</strong> ${Math.round(trip.health)}%</div>
        </div>
        ${days
          .map(
            (day: any) => `
          <div class="day">
            <div class="day-header">Day ${day.dayNumber}: ${day.theme || "Exploration"}</div>
            ${day.slots
              .map(
                (slot: any) => `
              <div class="slot">
                <div class="time">${slot.time}</div>
                <div class="activity">${slot.activity}</div>
                <div>${slot.description}</div>
                <div class="location">${slot.location}</div>
              </div>`
              )
              .join("")}
            <a href="${generateGoogleMapsLink(day.slots)}" class="nav-link">&#x1F4CD; Open Day ${day.dayNumber} in Maps</a>
          </div>`
          )
          .join("")}
        <script>window.print();</script></body></html>`);
      pw.document.close();
      toast({ title: "PDF Generated", description: "Your itinerary is ready." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setExportingTripId(null);
    }
  };

  /* ── Loading state ── */
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#111415] flex flex-col items-center justify-center gap-6">
        <LumaSpin />
        <p className="text-white/50 text-sm animate-pulse">Loading your adventures...</p>
      </div>
    );
  }

  if (!user) return null;

  const trips = tripsData || [];
  const isPremium = userData?.isPremium || false;
  const isLimitReached = !isPremium && trips.length >= 4;

  const handleNewTripClick = () => {
    if (isLimitReached) setIsPlanDialogOpen(true);
    else router.push("/plan/new");
  };

  const displayName =
    user?.displayName?.split(" ")[0] ||
    userData?.name?.split(" ")[0] ||
    "Explorer";

  return (
    <div className="min-h-screen bg-[#111415] text-white overflow-x-hidden">
      <AppNavbar />

      {/* ── Main content ── */}
      <main className="relative pt-32 pb-20 px-4 md:px-8 lg:px-12 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Dashboard
              </span>
              {stats.streakDays > 0 && (
                <span className="text-[11px] font-semibold flex items-center gap-1 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  <Flame className="w-3 h-3" />
                  {stats.streakDays} day streak
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-white leading-tight">
              Welcome back,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                {displayName}!
              </span>
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {trips.length > 0
                ? `${trips.length} refined adventure${trips.length > 1 ? "s" : ""} in your portfolio.`
                : "Your next adventure awaits. Start planning below."}
            </p>
          </div>
          <Button
            onClick={handleNewTripClick}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-7 h-11 font-semibold text-sm shadow-lg shadow-blue-500/20 w-full md:w-auto"
          >
            <Send className="mr-2 w-4 h-4" />
            Design New Adventure
          </Button>
          <PlanSelectionDialog
            open={isPlanDialogOpen}
            onOpenChange={setIsPlanDialogOpen}
            tripCount={trips.length}
            onSelectFree={() => {
              setIsPlanDialogOpen(false);
              router.push("/plan/new");
            }}
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              icon: Trophy,
              label: "Status",
              value: `Level ${stats.currentLevel} Explorer`,
              sub: `${stats.explorationScore} XP`,
              iconClass: "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400",
            },
            {
              icon: Flame,
              label: "Activity",
              value: `${stats.streakDays} Day Streak`,
              sub: stats.streakDays > 0 ? "Keep exploring!" : "Create a trip to start",
              iconClass: "bg-orange-500/10 border border-orange-500/20 text-orange-400",
            },
            {
              icon: Globe,
              label: "Visited",
              value: `${trips.length} Destination${trips.length !== 1 ? "s" : ""}`,
              sub: "Mapped globally",
              iconClass: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
            },
            {
              icon: Star,
              label: "Completed",
              value: `${stats.completedCount} Activities`,
              sub: `${stats.completedCount * 50} XP earned`,
              iconClass: "bg-violet-500/10 border border-violet-500/20 text-violet-400",
            },
          ].map((s) => (
            <div key={s.label} className="glass-panel rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {s.label}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.iconClass}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-headline font-bold text-white mb-0.5">
                {s.value}
              </div>
              <p className="text-[11px] text-white/40 font-medium">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        {stats.explorationScore > 0 && (
          <div className="glass-panel rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">
                  Level {stats.currentLevel} &rarr; Level {stats.currentLevel + 1}
                </span>
              </div>
              <span className="text-[11px] text-white/40 font-medium">
                {stats.xpRemaining} XP remaining
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${stats.levelProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-white/60 tabular-nums">
                {stats.explorationScore} / {stats.currentLevel * 200} XP
              </span>
            </div>
          </div>
        )}

        {/* Trips section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
              Active Journeys
              <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {trips.length} / {isPremium ? "\u221E" : "4"}
              </span>
            </h2>
          </div>

          {isTripsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TripCardSkeleton />
              <TripCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {trips.length > 0 ? (
                trips.map((trip) => (
                  <Link key={trip.id} href={`/trip/${trip.id}`}>
                    <div className="glass-panel rounded-2xl overflow-hidden group transition-all duration-300 hover:border-blue-500/30 cursor-pointer">
                      <div className="flex flex-col sm:flex-row gap-0">
                        <div className="relative sm:w-44 h-36 sm:h-auto overflow-hidden flex-shrink-0">
                          <Image
                            src={`https://picsum.photos/seed/${trip.id}/400/300`}
                            alt={trip.destination}
                            width={400}
                            height={300}
                            className="object-cover w-full h-full opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#111415]/90" />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                trip.health > 80
                                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                                  : "bg-white/10 border border-white/10 text-white/60"
                              }`}
                            >
                              {Math.round(trip.health || 0)}% Refined
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <h3 className="text-base font-bold text-white truncate">
                                {trip.destination}
                              </h3>
                              <MoreHorizontal className="w-4 h-4 text-white/20 flex-shrink-0" />
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/40 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                <span>
                                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Wallet className="w-3 h-3 text-violet-400" />
                                <span>
                                  {trip.totalBudget} {trip.currency}
                                </span>
                              </div>
                            </div>

                            {/* Health & Budget status */}
                            <div className="flex gap-4 mb-3">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${trip.health > 80 ? "bg-emerald-400" : "bg-yellow-400"}`} />
                                <span className="text-[11px] text-white/50">Health</span>
                                <span className={`text-[11px] font-semibold ${trip.health > 80 ? "text-emerald-400" : "text-yellow-400"}`}>
                                  {Math.round(trip.health)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span className="text-[11px] text-white/50">Budget</span>
                                <span className="text-[11px] font-semibold text-blue-400">On Track</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/30">
                              <span>Preparation</span>
                              <span>{Math.round(trip.health || 0)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                                style={{ width: `${trip.health || 0}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                              onClick={(e) => handleExportPDF(e, trip)}
                              disabled={exportingTripId === trip.id}
                            >
                              {exportingTripId === trip.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                              ) : (
                                <Download className="w-3 h-3 mr-1.5" />
                              )}
                              Export PDF
                            </Button>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 flex-shrink-0 group-hover:bg-blue-500/20 transition-all duration-200">
                              <ChevronRight className="w-4 h-4 text-blue-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="lg:col-span-2">
                  <EmptyTrips onNew={handleNewTripClick} />
                </div>
              )}
            </div>
          )}
        </div>


      </main>
    </div>
  );
}
