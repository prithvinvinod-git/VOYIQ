"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserHeader } from "@/components/layout/UserHeader";
import { useUser } from "@/firebase";
import {
  Check,
  Zap,
  Crown,
  Rocket,
  Star,
  ArrowRight,
  Sparkles,
  Globe,
  Brain,
  Shield,
  Download,
  Users,
  MessageSquare,
  Infinity,
} from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "Explorer",
    tagline: "Perfect to get started",
    price: { monthly: 0, annual: 0 },
    icon: Globe,
    color: "#6366F1",
    glow: "rgba(99,102,241,0.15)",
    border: "rgba(99,102,241,0.25)",
    popular: false,
    features: [
      { label: "4 AI-generated itineraries", included: true },
      { label: "Basic budget tracking", included: true },
      { label: "PDF export", included: true },
      { label: "Community access", included: true },
      { label: "Unlimited trips", included: false },
      { label: "Priority AI model", included: false },
      { label: "Collaboration rooms", included: false },
      { label: "24/7 concierge support", included: false },
    ],
    cta: "Start Free",
    href: "/auth",
  },
  {
    id: "pro",
    name: "Voyager",
    tagline: "For serious travel enthusiasts",
    price: { monthly: 12, annual: 9 },
    icon: Rocket,
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.2)",
    border: "rgba(139,92,246,0.35)",
    popular: true,
    features: [
      { label: "Unlimited AI itineraries", included: true },
      { label: "Advanced budget analytics", included: true },
      { label: "PDF export + sharing", included: true },
      { label: "Priority community access", included: true },
      { label: "Real-time collaboration", included: true },
      { label: "GPT-4 powered planning", included: true },
      { label: "Offline itinerary access", included: false },
      { label: "24/7 concierge support", included: false },
    ],
    cta: "Go Voyager",
    href: "/auth",
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "The ultimate travel experience",
    price: { monthly: 29, annual: 22 },
    icon: Crown,
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.3)",
    popular: false,
    features: [
      { label: "Everything in Voyager", included: true },
      { label: "Offline itinerary sync", included: true },
      { label: "White-glove AI curation", included: true },
      { label: "Custom travel preferences AI", included: true },
      { label: "Collaboration rooms (10 users)", included: true },
      { label: "API access", included: true },
      { label: "Priority AI model", included: true },
      { label: "24/7 concierge support", included: true },
    ],
    cta: "Go Elite",
    href: "/auth",
  },
];

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes — upgrade or downgrade at any time. Changes take effect immediately with pro-rated billing.",
  },
  {
    q: "What happens to my trips if I downgrade?",
    a: "Your existing trips are never deleted. You'll just lose access to premium features on new trips beyond the free limit.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes! Students get 40% off any paid plan. Contact us with your .edu email to verify.",
  },
  {
    q: "How does the AI itinerary generation work?",
    a: "VOYIQ uses GPT-4 to analyze your destination, dates, budget and travel style to craft a fully personalized day-by-day itinerary in seconds.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <UserHeader />

      {/* Aurora background orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] pointer-events-none -z-0 opacity-30"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4), transparent)", filter: "blur(80px)" }} />
      <div className="fixed top-40 right-1/4 w-[400px] h-[400px] pointer-events-none -z-0 opacity-20"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5), transparent)", filter: "blur(80px)" }} />
      <div className="fixed bottom-0 left-0 w-80 h-80 pointer-events-none -z-0 opacity-20"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.4), transparent)", filter: "blur(60px)" }} />

      <main className="container mx-auto px-4 pt-28 pb-24 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge
            className="mb-6 px-4 py-1.5 text-xs uppercase tracking-widest font-bold"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#818CF8" }}
          >
            <Sparkles className="w-3 h-3 mr-1.5 inline" />
            Transparent Pricing
          </Badge>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight mb-6">
            Travel smarter,{" "}
            <span className="aurora-text">pay less.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Start free. Scale as your adventures grow. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!annual ? "text-white" : "text-muted-foreground"}`}>Monthly</span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300"
              style={{ background: annual ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.1)" }}
              aria-checked={annual}
              role="switch"
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                style={{ transform: annual ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${annual ? "text-white" : "text-muted-foreground"}`}>
              Annual
              <span className="px-2 py-0.5 text-xs rounded-full font-bold" style={{ background: "rgba(16,185,129,0.2)", color: "#34D399" }}>
                Save 25%
              </span>
            </span>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-24">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = annual ? plan.price.annual : plan.price.monthly;
            return (
              <div
                key={plan.id}
                className="relative rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: plan.popular
                    ? `linear-gradient(135deg, ${plan.glow} 0%, rgba(10,12,35,0.95) 100%)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${plan.border}`,
                  boxShadow: plan.popular
                    ? `0 0 60px ${plan.glow}, 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`
                    : "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                      style={{ background: `linear-gradient(135deg, ${plan.color}, rgba(139,92,246,0.8))` }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: plan.glow, border: `1px solid ${plan.border}` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-white mb-1">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  {price === 0 ? (
                    <div className="text-5xl font-headline font-extrabold text-white">Free</div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-headline font-extrabold text-white">${price}</span>
                      <span className="text-muted-foreground mb-2 text-sm">/mo</span>
                    </div>
                  )}
                  {annual && price > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Billed annually (${price * 12}/yr)</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-3 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: f.included ? plan.glow : "rgba(255,255,255,0.04)",
                          border: `1px solid ${f.included ? plan.border : "rgba(255,255,255,0.08)"}`,
                        }}
                      >
                        <Check className="w-3 h-3" style={{ color: f.included ? plan.color : "rgba(255,255,255,0.2)" }} />
                      </div>
                      <span className={f.included ? "" : "line-through"}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => router.push(user ? "/plan/new" : plan.href)}
                  className="w-full h-12 rounded-2xl font-bold text-white transition-all duration-300"
                  style={{
                    background: plan.popular
                      ? `linear-gradient(135deg, ${plan.color}, rgba(99,102,241,0.8))`
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${plan.border}`,
                    boxShadow: plan.popular ? `0 0 30px ${plan.glow}` : "none",
                  }}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison callout */}
        <div className="max-w-4xl mx-auto mb-24">
          <div
            className="rounded-3xl p-8 md:p-12"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(10,12,35,0.9))",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <h2 className="text-3xl font-headline font-bold text-center mb-10">
              Everything you need to travel{" "}
              <span className="aurora-text">brilliantly</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Brain, label: "AI-Powered Planning", desc: "GPT-4 crafts your perfect day" },
                { icon: Shield, label: "Secure & Private", desc: "Bank-grade encryption" },
                { icon: Download, label: "PDF Export", desc: "Offline-ready itineraries" },
                { icon: Users, label: "Collaboration", desc: "Plan with your group" },
                { icon: Globe, label: "150+ Countries", desc: "Global destination support" },
                { icon: MessageSquare, label: "AI Chat", desc: "24/7 travel guidance" },
                { icon: Zap, label: "Instant Generation", desc: "Itinerary in under 60s" },
                { icon: Infinity, label: "Unlimited Trips", desc: "On paid plans" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-headline font-bold text-center mb-10">
            Frequently asked <span className="aurora-text">questions</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <h3 className="font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-6">Still have questions?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/auth")}
                className="rounded-full px-8 h-12 font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  boxShadow: "0 0 32px rgba(99,102,241,0.4)",
                }}
              >
                <Star className="mr-2 w-4 h-4" />
                Start for Free
              </Button>
              <Button
                variant="outline"
                className="rounded-full px-8 h-12 font-semibold border-white/10 hover:bg-white/5"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
