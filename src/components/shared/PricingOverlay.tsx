"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { X, Check, ArrowRight, Star, Zap, Crown, Globe, Rocket, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingOverlayProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const plans = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Perfect to get started",
    price: 0,
    icon: Globe,
    features: ["4 AI itineraries", "Basic budget tracking", "PDF export", "Community access"],
    cta: "Start Free",
    href: "/auth",
  },
  {
    id: "pro",
    name: "Voyager",
    tagline: "For serious travelers",
    price: 12,
    icon: Rocket,
    popular: true,
    features: ["Unlimited AI itineraries", "Advanced budget analytics", "Real-time collaboration", "AR HUD Navigation", "Collab Rooms", "GPT-4 planning"],
    cta: "Go Voyager",
    href: "/auth",
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "The ultimate experience",
    price: 29,
    icon: Crown,
    features: ["Everything in Voyager", "Offline itinerary sync", "White-glove AI curation", "Collab Rooms (10 users)", "API access", "24/7 concierge"],
    cta: "Go Elite",
    href: "/auth",
  },
];

export function PricingOverlay({ open, onClose, feature }: PricingOverlayProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      setPromoCode("");
      setUpgraded(false);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handlePromoSubmit = async () => {
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
      toast({ title: "Welcome to Premium! 🎉", description: "Your account has been upgraded. All premium features are now unlocked!" });
      setUpgraded(true);
      setTimeout(() => onClose(), 1200);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upgrade Failed", description: e.message });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-400 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`absolute inset-0 backdrop-blur-xl bg-black/10 transition-opacity duration-400 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-12 scale-[0.97]"
        }`}
      >
        <div className="glass-panel rounded-3xl p-6 md:p-10 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {feature && !upgraded && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
              <Star className="w-3 h-3" />
              Unlock {feature}
            </div>
          )}

          {upgraded && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
              <Check className="w-3 h-3" />
              Premium Activated
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-2">
              {upgraded ? "You're All Set!" : "Upgrade Your Experience"}
            </h2>
            <p className="text-sm text-white/50">
              {upgraded ? "All premium features are now unlocked. Happy travels!" : "Choose the plan that fits your journey."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-5 md:p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 ${
                    plan.popular
                      ? "glass-panel ring-1 ring-blue-500/30"
                      : "glass-panel"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-[0.15em] shadow-lg whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/5 border border-white/10">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-headline font-bold text-white mb-0.5">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-white/40">{plan.tagline}</p>
                  </div>

                  <div className="mb-5">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-headline font-bold text-white">Free</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-headline font-bold text-white">
                          ${plan.price}
                        </span>
                        <span className="text-white/40 mb-1 text-xs">/mo</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-5 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs">
                        <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/70">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === "pro" && !upgraded && (
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-[9px] font-bold uppercase text-white/30 tracking-wider">Promo Code</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          className="flex-1 h-9 px-3 rounded-lg text-xs font-mono text-center text-white placeholder:text-white/30 outline-none bg-white/5 border border-white/10 focus:ring-1 focus:ring-blue-500/50"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePromoSubmit()}
                        />
                        <button
                          onClick={handlePromoSubmit}
                          disabled={isUpgrading}
                          className="h-9 px-4 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
                        >
                          {isUpgrading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Unlock"
                          )}
                        </button>
                      </div>
                      <p className="text-[9px] text-center text-white/20">Enter a valid promotion code to unlock premium</p>
                    </div>
                  )}

                  {plan.id === "pro" && upgraded && (
                    <div className="mb-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <span className="text-xs font-bold text-emerald-400">Premium Unlocked ✓</span>
                    </div>
                  )}

                  <button
                    onClick={() => router.push(user ? "/plan/new" : plan.href)}
                    disabled={upgraded}
                    className={`w-full h-10 rounded-xl font-semibold text-xs transition-all duration-300 ${
                      upgraded
                        ? "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                        : plan.popular
                          ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                          : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {upgraded ? "Already Active" : plan.cta}
                      {!upgraded && <ArrowRight className="w-3 h-3" />}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-white/30 mt-6">
            No commitment. Cancel anytime. All plans include a 14-day free trial of premium features.
          </p>
        </div>
      </div>
    </div>
  );
}
