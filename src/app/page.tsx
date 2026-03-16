
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  MapPin, 
  Wallet, 
  MessageSquare, 
  Users, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LandingPage() {
  const heroImg = PlaceHolderImages.find(img => img.id === "hero-travel");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-headline font-bold">V</span>
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">VOYIQ</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Free Forever</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Planning
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-none">AI Powered</Badge>
            <span className="text-xs font-medium text-muted-foreground">Version 2.0 is live!</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold mb-6 tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Your <span className="gradient-text">AI Travel Brain</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Personalized itineraries, real-time budget tracking, and a smart chat companion. 
            All in one free platform built for modern explorers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link href="/plan/new">
              <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90">
                Plan Your First Trip <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/10 hover:bg-white/5">
              Explore Sample
            </Button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="container mx-auto px-4 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/10">
            <Image 
              src={heroImg?.imageUrl || ""} 
              alt="Travel Planning" 
              width={1200}
              height={600}
              className="w-full object-cover"
              data-ai-hint="travel landscape"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-24 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Everything you need to roam freely</h2>
            <p className="text-muted-foreground">Smart tools designed to replace your messy spreadsheets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: "SmartItinerary", desc: "Claude-powered day-by-day plans tailored to your pace and budget." },
              { icon: Wallet, title: "BudgetSync", desc: "Track every rupee and get AI alerts when you're over-spending." },
              { icon: MessageSquare, title: "AI Companion", desc: "A constant travel brain in your pocket for local tips and changes." },
              { icon: Users, title: "Collaborate", desc: "Invite friends to vote on activities and plan together in real-time." },
            ].map((f, i) => (
              <Card key={i} className="glass-card border-none hover:bg-white/10 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tier Info */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <Badge variant="outline" className="border-accent text-accent mb-4">100% Free Forever</Badge>
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">No Hidden Fees. No Credit Card Required.</h2>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited trip itineraries",
                  "Shared collaborative planning",
                  "Real-time weather & maps",
                  "Offline mode supported"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <ShieldCheck className="text-primary w-5 h-5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Join VOYIQ Today</Button>
              </Link>
            </div>
            <div className="flex-1 w-full max-w-md">
              <Card className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <span className="font-bold">Budget Breakdown</span>
                  <span className="text-xs text-muted-foreground">Live View</span>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Activities</span>
                      <span className="text-primary">45%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[45%]" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stay</span>
                      <span className="text-accent">30%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-accent h-full w-[30%]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-headline font-bold">V</span>
            </div>
            <span className="text-lg font-headline font-bold tracking-tight">VOYIQ</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2024 VOYIQ AI. Built with love for explorers everywhere.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
