
"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MapPin,
  Calendar,
  Wallet,
  Star,
  Zap,
  Download,
  Loader2,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, getDocs, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { UserHeader } from "@/components/layout/UserHeader";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";
import { useToast } from "@/hooks/use-toast";
import { useScrollReveal, useScrollRevealContainer } from "@/hooks/useScrollReveal";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
  health: number;
  totalCompletedSlots?: number;
}

/* ── 3D tilt card wrapper ──────────────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(1000px) rotateY(${dx * 5}deg) rotateX(${-dy * 4}deg) translateZ(12px)`;
    card.style.boxShadow = `${dx * -12}px ${dy * -8}px 40px rgba(0,0,0,0.5), 0 0 50px rgba(0,212,184,0.08)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)";
    card.style.boxShadow = "";
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────────────────── */
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  variant: "teal" | "amber";
  progress?: number;
}) {
  const isTeal = variant === "teal";
  const color = isTeal ? "#00D4B8" : "#F5A623";
  const glow = isTeal ? "rgba(0,212,184,0.15)" : "rgba(245,166,35,0.12)";
  const border = isTeal ? "rgba(0,212,184,0.2)" : "rgba(245,166,35,0.2)";

  return (
    <TiltCard>
      <div
        className="p-6 rounded-3xl h-full"
        style={{
          background: `linear-gradient(135deg, ${glow} 0%, rgba(15,20,40,0.8) 100%)`,
          border: `1px solid ${border}`,
          boxShadow: `0 0 30px ${glow}, 0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${glow}`, border: `1px solid ${border}` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <div className="text-2xl font-headline font-extrabold text-white mb-1">{value}</div>
        {sub && <p className="text-xs text-muted-foreground font-medium">{sub}</p>}
      </div>
    </TiltCard>
  );
}

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [exportingTripId, setExportingTripId] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) { router.push("/auth"); }
  }, [user, isUserLoading, router]);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "trips"), where("authorizedUserIds", "array-contains", user.uid));
  }, [firestore, user]);

  const { data: tripsData, isLoading: isTripsLoading } = useCollection<Trip>(tripsQuery);

  const stats = useMemo(() => {
    if (!tripsData) return { explorationScore: 0, currentLevel: 1, levelProgress: 0, streakDays: 0, completedCount: 0, xpRemaining: 200 };
    const totalCompleted = tripsData.reduce((acc, t) => acc + (t.totalCompletedSlots || 0), 0);
    const totalXP = totalCompleted * 50;
    const level = Math.floor(totalXP / 200) + 1;
    const progressInCurrentLevel = totalXP % 200;
    const levelProgressPercent = (progressInCurrentLevel / 200) * 100;
    const xpRemaining = 200 - progressInCurrentLevel;
    const streak = tripsData.some((t) => (t.totalCompletedSlots || 0) > 0) ? 4 : 0;
    return { explorationScore: totalXP, currentLevel: level, levelProgress: levelProgressPercent, xpRemaining, streakDays: streak, completedCount: totalCompleted };
  }, [tripsData]);

  const generateGoogleMapsLink = (slots: any[]) => {
    if (!slots || slots.length === 0) return "";
    const origin = encodeURIComponent(slots[0].location);
    if (slots.length === 1) return `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${origin}&travelmode=driving`;
    const waypoints = slots.slice(1, -1).map((s: any) => encodeURIComponent(s.location)).filter(Boolean);
    const destination = encodeURIComponent(slots[slots.length - 1].location);
    const waypointQuery = waypoints.length > 0 ? `&waypoints=${waypoints.join("|")}` : "";
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointQuery}&travelmode=driving`;
  };

  const handleExportPDF = async (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firestore) return;
    setExportingTripId(trip.id);
    try {
      const itQuery = query(collection(firestore, `trips/${trip.id}/itineraryDays`), orderBy("dayNumber"));
      const snap = await getDocs(itQuery);
      const days = snap.docs.map((d) => d.data());
      if (days.length === 0) {
        toast({ variant: "destructive", title: "Export Failed", description: "No itinerary data found for this trip." });
        return;
      }
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      const html = `<html><head><title>VOYIQ Itinerary - ${trip.destination}</title><style>body{font-family:'Syne','Plus Jakarta Sans',sans-serif;background:white;color:black;padding:40px}.header{border-bottom:2px solid #00D4B8;padding-bottom:20px;margin-bottom:40px}h1{margin:0;color:#00D4B8;font-size:32px}.day{border-left:4px solid #F5A623;padding-left:20px;margin-bottom:40px}.day-header{font-size:20px;font-weight:bold;margin-bottom:10px}.slot{margin-bottom:15px;border-bottom:1px solid #eee;padding-bottom:10px}.time{font-weight:bold;color:#666;font-size:12px}.activity{font-weight:bold;font-size:16px;margin:4px 0}.location{font-size:12px;color:#888}.nav-link{display:inline-block;background:#00D4B8;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:12px;margin-top:10px}@media print{.nav-link{display:none}}</style></head><body><div class="header"><h1>VOYIQ | TRAVEL REFINED</h1><p>Your curated journey through ${trip.destination}</p></div><div style="display:flex;justify-content:space-between;margin-bottom:30px"><div><strong>Destination:</strong> ${trip.destination}<br><strong>Dates:</strong> ${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}</div><div><strong>Total Budget:</strong> ${trip.totalBudget} ${trip.currency}<br><strong>Plan Health:</strong> ${Math.round(trip.health)}%</div></div>${days.map((day: any) => `<div class="day"><div class="day-header">Day ${day.dayNumber}: ${day.theme || "Exploration"}</div>${day.slots.map((slot: any) => `<div class="slot"><div class="time">${slot.time}</div><div class="activity">${slot.activity}</div><div>${slot.description}</div><div class="location">${slot.location}</div></div>`).join("")}<a href="${generateGoogleMapsLink(day.slots)}" class="nav-link">Open Day ${day.dayNumber} in Maps</a></div>`).join("")}<script>window.print();</script></body></html>`;
      printWindow.document.write(html);
      printWindow.document.close();
      toast({ title: "PDF Generated", description: "Your itinerary is ready for printing." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setExportingTripId(null);
    }
  };

  /* Scroll reveal refs */
  const revealHeader = useScrollReveal({ threshold: 0.1 });
  const revealTrips = useScrollRevealContainer();
  const revealStats = useScrollRevealContainer();

  if (isUserLoading || isTripsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div
          className="w-14 h-14 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "hsl(172 100% 42%)", borderRightColor: "rgba(0,212,184,0.2)" }}
        />
        <p className="text-muted-foreground font-headline text-sm animate-pulse-subtle">Loading your adventures...</p>
      </div>
    );
  }

  const trips = tripsData || [];
  const isPremium = userData?.isPremium || false;
  const isLimitReached = !isPremium && trips.length >= 4;

  const handleNewTripClick = () => {
    if (isLimitReached) { setIsPlanDialogOpen(true); }
    else { router.push("/plan/new"); }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-x-hidden">
      {/* Background orbs */}
      <div
        className="fixed top-0 right-0 w-96 h-96 pointer-events-none -z-0"
        style={{
          background: "radial-gradient(circle, rgba(0,212,184,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-80 h-80 pointer-events-none -z-0"
        style={{
          background: "radial-gradient(circle, rgba(123,97,255,0.05) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <UserHeader />

      <main className="container mx-auto px-4 pt-10 relative z-10">
        {/* Page header */}
        <div
          ref={revealHeader as React.RefCallback<HTMLDivElement>}
          className="reveal reveal-up flex flex-col md:flex-row md:items-center justify-between gap-6 mb-14"
        >
          <div className="w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                className="text-[10px] px-3 py-1 uppercase tracking-widest font-bold"
                style={{ background: "rgba(0,212,184,0.1)", border: "1px solid rgba(0,212,184,0.2)", color: "#00D4B8" }}
              >
                Command Center
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-2 text-white leading-tight">
              Welcome back,{" "}
              <span className="gradient-text">
                {user?.displayName?.split(" ")[0] || userData?.name?.split(" ")[0] || "Explorer"}!
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              {trips.length > 0
                ? `${trips.length} refined adventure${trips.length > 1 ? "s" : ""} in your portfolio.`
                : "Start your first refined adventure today."}
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleNewTripClick}
            className="btn-shimmer rounded-2xl px-8 h-12 font-bold w-full md:w-auto shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))",
              boxShadow: "0 0 24px rgba(0,212,184,0.3), 0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            <Plus className="mr-2 w-5 h-5" /> Design New Adventure
          </Button>

          <PlanSelectionDialog
            open={isPlanDialogOpen}
            onOpenChange={setIsPlanDialogOpen}
            tripCount={trips.length}
            onSelectFree={() => { setIsPlanDialogOpen(false); router.push("/plan/new"); }}
          />
        </div>

        {/* Trip grid */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-headline font-bold text-white">Active Journeys</h2>
            <Button variant="link" className="text-primary hover:text-primary/80 text-xs font-bold uppercase tracking-widest">
              History
            </Button>
          </div>

          <div
            ref={revealTrips as React.RefCallback<HTMLDivElement>}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children"
          >
            {trips.length > 0 ? (
              trips.map((trip) => (
                <div key={trip.id} className="reveal reveal-up">
                  <Link href={`/trip/${trip.id}`}>
                    <TiltCard>
                      <div
                        className="rounded-3xl overflow-hidden group transition-all duration-300"
                        style={{
                          background: "linear-gradient(135deg, rgba(0,212,184,0.06) 0%, rgba(15,20,40,0.7) 100%)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="flex flex-col sm:flex-row gap-0">
                          {/* Image */}
                          <div className="relative sm:w-48 h-44 sm:h-auto overflow-hidden flex-shrink-0">
                            <Image
                              src={`https://picsum.photos/seed/${trip.id}/400/300`}
                              alt={trip.destination}
                              width={400}
                              height={300}
                              className="object-cover w-full h-full opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            />
                            <div
                              className="absolute inset-0"
                              style={{ background: "linear-gradient(to right, transparent 60%, rgba(10,14,30,0.8) 100%)" }}
                            />
                            {/* Health badge on image */}
                            <div className="absolute top-3 left-3">
                              <Badge
                                className="text-[9px] font-bold px-2 py-0.5"
                                style={{
                                  background: trip.health > 80 ? "rgba(0,212,184,0.2)" : "rgba(255,255,255,0.1)",
                                  border: trip.health > 80 ? "1px solid rgba(0,212,184,0.3)" : "1px solid rgba(255,255,255,0.1)",
                                  color: trip.health > 80 ? "#00D4B8" : "white",
                                  backdropFilter: "blur(8px)",
                                }}
                              >
                                {Math.round(trip.health || 0)}% Refined
                              </Badge>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                            <div>
                              <h3 className="text-lg font-bold text-white mb-3 truncate pr-2">{trip.destination}</h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-4 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-accent" />
                                  <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Wallet className="w-3 h-3 text-primary" />
                                  <span>{trip.totalBudget} {trip.currency}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {/* Progress bar */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  <span>Itinerary Completion</span>
                                  <span>{Math.round(trip.health || 0)}%</span>
                                </div>
                                <div
                                  className="h-1.5 rounded-full overflow-hidden"
                                  style={{ background: "rgba(255,255,255,0.06)" }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${trip.health || 0}%`,
                                      background: "linear-gradient(90deg, hsl(172 100% 42%), #00fff2)",
                                      boxShadow: "0 0 8px rgba(0,212,184,0.5)",
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                  style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                  }}
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
                                <div
                                  className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(0,212,184,0.1)", border: "1px solid rgba(0,212,184,0.2)" }}
                                >
                                  <ArrowRight className="w-4 h-4 text-primary" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TiltCard>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-2 reveal reveal-scale">
                <div
                  className="py-24 text-center rounded-3xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float-slow"
                    style={{ background: "rgba(0,212,184,0.08)", border: "1px solid rgba(0,212,184,0.15)" }}
                  >
                    <FileText className="text-primary w-9 h-9 opacity-50" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold mb-3 text-white">No active journeys</h3>
                  <p className="text-muted-foreground mb-8 font-medium max-w-sm mx-auto">
                    Initialize your first refined adventure with VOYIQ AI.
                  </p>
                  <Button
                    onClick={handleNewTripClick}
                    className="btn-shimmer h-12 px-8 rounded-2xl font-bold"
                    style={{ background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", boxShadow: "0 0 24px rgba(0,212,184,0.3)" }}
                  >
                    <Plus className="mr-2 w-4 h-4" /> Plan a New Journey
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div
          ref={revealStats as React.RefCallback<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children"
        >
          <div className="reveal reveal-up">
            <StatCard
              title={`Level ${stats.currentLevel} Voyager`}
              value={`${stats.explorationScore} XP`}
              sub={`${stats.xpRemaining} XP to next tier`}
              icon={Star}
              variant="teal"
            >
            </StatCard>
          </div>
          <div className="reveal reveal-up">
            <StatCard
              title="Journey Streak"
              value={`${stats.streakDays} Days`}
              sub="Consistent exploration verified."
              icon={Zap}
              variant="amber"
            />
          </div>
          <div className="reveal reveal-up">
            <StatCard
              title="Destinations Visited"
              value={`${trips.length}`}
              sub="Mapped across global coordinates."
              icon={MapPin}
              variant="teal"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
