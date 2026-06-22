
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Users,
  Wallet,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Navigation,
  Mic,
  Languages,
  Clock,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface PlanSelectionDialogProps {
  trigger?: React.ReactNode;
  onSelectFree: () => void;
  tripCount?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PlanSelectionDialog({
  trigger,
  onSelectFree,
  tripCount = 0,
  open: openProp,
  onOpenChange,
}: PlanSelectionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isOpen = openProp !== undefined ? openProp : internalOpen;
  const setOpen = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    else setInternalOpen(val);
    if (!val) setPromoCode("");
  };

  const isLimitReached = tripCount >= 4;

  const freeFeatures = [
    { icon: Sparkles, text: "Smart AI Itineraries" },
    { icon: Wallet, text: "Multi-Currency Budgeting" },
    { icon: MessageSquare, text: "AI Chat Companion" },
    { icon: Check, text: "Up to 4 Saved Trips" },
  ];

  const premiumFeatures = [
    { icon: Users, text: "Real-time Collab Rooms", status: "active" },
    { icon: Zap, text: "Unlimited Itineraries", status: "active" },
    { icon: Navigation, text: "AR HUD Navigation", status: "experimental" },
    { icon: Mic, text: "AI Voice Travel Assistant", status: "upcoming" },
    { icon: Languages, text: "Live Voice Translation", status: "upcoming" },
  ];

  const handleUpgrade = async () => {
    const inputCode = promoCode.trim().toLowerCase();
    if (inputCode !== "coet") {
      toast({ variant: "destructive", title: "Invalid Code", description: "Please enter a valid promotion code." });
      return;
    }
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Auth Required", description: "Please sign in to upgrade." });
      return;
    }
    setIsUpgrading(true);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { isPremium: true, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Welcome to Premium! 🎉", description: "Your account has been upgraded. Collab features are now unlocked!" });
      setTimeout(() => setOpen(false), 300);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upgrade Failed", description: e.message });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[100] bg-background/95" />
        <DialogContent
          className="fixed left-[50%] top-[50%] z-[110] w-full max-w-[95vw] sm:max-w-[760px] translate-x-[-50%] translate-y-[-50%] p-0 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-border bg-card rounded-3xl"
        >

          <DialogHeader className="p-8 sm:p-10 pb-6 text-center shrink-0 relative z-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-accent/10 border border-accent/30"
            >
              <Crown className="w-7 h-7 text-accent" />
            </div>
            <DialogTitle className="text-3xl sm:text-4xl font-headline font-bold text-white mb-2">Explorer Tiers</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm sm:text-base">
              Choose the right power level for your adventures.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-10 scrollbar-hide relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ── FREE CARD ─────────────────────────────────── */}
              <div
                className={`rounded-3xl overflow-hidden flex flex-col transition-all duration-300 bg-card border ${isLimitReached ? "border-destructive/30 opacity-60" : "border-border"}`}
              >
                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="mb-6">
                    <Badge
                      className="mb-3 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-secondary text-muted-foreground border border-border"
                    >
                      Standard
                    </Badge>
                    <h3 className="text-xl font-headline font-bold text-white mb-1">Free Explorer</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-headline font-extrabold text-white">₹0</span>
                      <span className="text-muted-foreground text-sm mb-1">/forever</span>
                    </div>

                    {isLimitReached && (
                      <div
                        className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        Trip Limit Reached ({tripCount}/4)
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3.5 mb-8 flex-1">
                    {freeFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20"
                        >
                          <f.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full h-12 rounded-2xl font-bold ${isLimitReached ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-secondary text-foreground"}`}
                    disabled={isLimitReached}
                    onClick={() => { setOpen(false); onSelectFree(); }}
                  >
                    {isLimitReached ? <><Lock className="w-4 h-4 mr-2" />Limit Reached</> : "Continue Free"}
                  </Button>
                </div>
              </div>

              {/* ── PREMIUM CARD ──────────────────────────────── */}
              <div
                className="rounded-3xl overflow-hidden flex flex-col relative bg-accent/5 border border-accent/30"
              >
                {/* Recommended badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    className="text-[10px] font-bold px-3 py-1 bg-accent text-accent-foreground"
                  >
                    RECOMMENDED
                  </Badge>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-6">
                    <Badge
                      className="mb-3 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent"
                    >
                      Premium
                    </Badge>
                    <h3 className="text-xl font-headline font-bold text-white mb-1 flex items-center gap-2">
                      Pro Voyager <Crown className="w-5 h-5 text-accent" />
                    </h3>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-headline font-extrabold text-white">₹2,999</span>
                      <span className="text-muted-foreground text-sm mb-1">/year</span>
                    </div>
                  </div>

                  <ul className="space-y-3.5 mb-6 flex-1">
                    {premiumFeatures.map((f, i) => {
                      const isUpcoming = f.status === "upcoming";
                      const isExp = f.status === "experimental";
                      return (
                        <li key={i} className={`flex items-start gap-3 text-sm ${isUpcoming ? "opacity-50" : "font-semibold text-white"}`}>
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isUpcoming ? "bg-muted border border-border" : isExp ? "bg-primary/10 border border-primary/20" : "bg-accent/10 border border-accent/20"}`}
                          >
                            {isUpcoming ? (
                              <Clock className="w-3.5 h-3.5 opacity-40" />
                            ) : (
                              <f.icon className={`w-3.5 h-3.5 ${isExp ? "text-primary" : "text-accent"}`} />
                            )}
                          </div>
                          <div>
                            <span className={isUpcoming ? "italic text-muted-foreground" : ""}>{f.text}</span>
                            {isUpcoming && <span className="block text-[10px] uppercase font-bold text-accent/50 not-italic mt-0.5">Coming Soon</span>}
                            {isExp && <span className="block text-[10px] uppercase font-bold text-primary animate-pulse mt-0.5">Experimental</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Promo code section */}
                  <div className="pt-5 mt-auto space-y-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="promo" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        Access Code
                      </Label>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase bg-accent/10 border border-accent/20 text-accent"
                      >
                        Use: coet
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="promo"
                        type="text"
                        placeholder="Enter access code"
                        className="flex-1 h-12 px-4 rounded-2xl text-sm font-mono text-center text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 bg-muted border border-border focus:ring-2 focus:ring-ring"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpgrade()}
                      />
                      <Button
                        className="h-12 px-6 font-bold rounded-2xl shrink-0 bg-accent text-accent-foreground"
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                      >
                        {isUpgrading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1.5">Unlock <ArrowRight className="w-4 h-4" /></span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
