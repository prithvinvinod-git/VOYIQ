"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ShieldCheck,
  Globe,
  Zap,
  Star
} from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";

export default function LandingPage() {
  const router = useRouter();
  const heroImg = PlaceHolderImages.find(img => img.id === "hero-travel");

  const handleProceed = (destination: string) => {
    router.push(destination);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-headline font-bold">V</span>
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">VOYIQ</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#benefits" className="hover:text-primary transition-colors">Why VOYIQ</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <PlanSelectionDialog 
              trigger={<Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">Get Started</Button>}
              onSelectFree={() => handleProceed("/auth")}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in shadow-xl">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Meet Your AI Travel Brain</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-extrabold mb-8 tracking-tighter animate-fade-in leading-tight" style={{ animationDelay: '0.1s' }}>
            ROAM SMART.<br/><span className="gradient-text">PLAN EFFORTLESS.</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Ditch the spreadsheets. VOYIQ uses AI to build hyper-personalized itineraries and track your budget in real-time. 
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <PlanSelectionDialog 
              trigger={
                <Button size="lg" className="h-16 px-10 text-lg bg-primary hover:bg-primary/90 rounded-full shadow-2xl shadow-primary/20">
                  Create My First Trip <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              }
              onSelectFree={() => handleProceed("/plan/new")}
            />
            <PlanSelectionDialog 
              trigger={
                <Button variant="outline" size="lg" className="h-16 px-10 text-lg border-white/10 hover:bg-white/5 rounded-full backdrop-blur-sm">
                  Join for Free
                </Button>
              }
              onSelectFree={() => handleProceed("/auth")}
            />
          </div>
        </div>

        {/* Hero Visual */}
        <div className="container mx-auto px-4 mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="relative max-w-6xl mx-auto rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,212,184,0.1)]">
            <Image 
              src={heroImg?.imageUrl || ""} 
              alt="VOYIQ Dashboard Preview" 
              width={1200}
              height={600}
              className="w-full object-cover aspect-video"
              data-ai-hint="travel landscape"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-4 justify-center">
               <Badge className="bg-white/10 backdrop-blur-md border-white/20 px-4 py-2 text-sm">Interactive Maps</Badge>
               <Badge className="bg-white/10 backdrop-blur-md border-white/20 px-4 py-2 text-sm">Live Budget Tracking</Badge>
               <Badge className="bg-white/10 backdrop-blur-md border-white/20 px-4 py-2 text-sm">AI Chat Companion</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-32 bg-white/[0.01] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-20">
            <h2 className="text-4xl md:text-6xl font-headline font-bold mb-6 tracking-tight">The explorer's toolkit.</h2>
            <p className="text-xl text-muted-foreground">Sophisticated AI that works so you can wander.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Sparkles, title: "SmartItinerary", desc: "Day-by-day plans tailored to your pace, dietary needs, and vibe.", color: "text-primary" },
              { icon: Wallet, title: "BudgetSync", desc: "Currency-aware expense tracking. Know exactly where your money goes.", color: "text-accent" },
              { icon: MessageSquare, title: "AI Travel Brain", desc: "A smart companion in your pocket to answer local questions 24/7.", color: "text-primary" },
              { icon: Users, title: "Real-time Collab", desc: "Plan with friends. Vote on spots and share costs instantly.", color: "text-accent" },
            ].map((f, i) => (
              <Card key={i} className="glass-card border-none hover:bg-white/10 transition-all hover:-translate-y-2 p-4">
                <CardContent className="pt-6">
                  <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner`}>
                    <f.icon className={`${f.color} w-7 h-7`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits / Social Proof */}
      <section id="benefits" className="py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Focus on the journey, not the logistics.</h2>
                <p className="text-lg text-muted-foreground">VOYIQ learns your travel style to save you hours of manual research.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { icon: Globe, title: "Multi-Currency", desc: "Automatic conversion for global explorers." },
                  { icon: Zap, title: "Instant Replan", desc: "Weather changes? One click and your day is fixed." },
                  { icon: ShieldCheck, title: "Private & Secure", desc: "Your data is yours. Safe encrypted cloud sync." },
                  { icon: MapPin, title: "Offline Ready", desc: "Access your plans even without data connection." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
               <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10 rounded-full" />
               <div className="glass-card p-8 rounded-[2rem] border-white/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <Star className="text-accent w-6 h-6 fill-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold">Loved by 10k+ Travelers</h4>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-accent fill-accent" />)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xl italic mb-6">"VOYIQ literally changed how I travel. I used to spend weeks planning. Now I just tell the AI what I like and it builds a dream trip in seconds."</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div>
                      <p className="font-bold">Sarah Jenkins</p>
                      <p className="text-xs text-muted-foreground">Digital Nomad</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 border-t border-white/5 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-headline font-bold mb-8">Ready to start roamin'?</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">Join the future of travel planning today. No hidden fees, just pure exploration.</p>
          <PlanSelectionDialog 
            trigger={
              <Button size="lg" className="h-16 px-12 text-xl bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shadow-2xl shadow-accent/20">
                Get Started Free
              </Button>
            }
            onSelectFree={() => handleProceed("/auth")}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-headline font-bold">V</span>
            </div>
            <span className="text-lg font-headline font-bold tracking-tight">VOYIQ</span>
          </Link>
          <div className="text-sm text-muted-foreground">
            © 2024 VOYIQ AI. Built for explorers, by explorers.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-white">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-white">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-white">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
