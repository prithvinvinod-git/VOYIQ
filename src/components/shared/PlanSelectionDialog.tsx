"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown, Globe, Mic, Navigation, Users, Wallet, MessageSquare, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlanSelectionDialogProps {
  trigger: React.ReactNode;
  onSelectFree: () => void;
  tripCount?: number;
}

export function PlanSelectionDialog({ trigger, onSelectFree, tripCount = 0 }: PlanSelectionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const isLimitReached = tripCount >= 4;

  const freeFeatures = [
    { icon: Sparkles, text: "Smart AI Itineraries" },
    { icon: Wallet, text: "Multi-Currency Budgeting" },
    { icon: MessageSquare, text: "AI Chat Companion" },
    { icon: Users, text: "Real-time Collaboration" },
  ];

  const premiumFeatures = [
    { icon: Navigation, text: "AR Navigation" },
    { icon: Mic, text: "AI Voice Assisted Travel" },
    { icon: Globe, text: "Live Voice Translation" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] glass-card border-white/10 p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-0 text-center">
          <DialogTitle className="text-3xl font-headline font-bold mb-2">Choose Your Explorer Tier</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select the plan that best fits your travel style.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
          {/* Free Plan */}
          <Card className={`bg-white/5 border-white/10 hover:border-primary/50 transition-all flex flex-col ${isLimitReached ? 'ring-2 ring-destructive/50' : ''}`}>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-6">
                <Badge variant="outline" className="mb-2 border-primary/30 text-primary">Standard</Badge>
                <h3 className="text-2xl font-bold">Explorer</h3>
                <p className="text-3xl font-headline font-bold mt-2">Free</p>
                {isLimitReached && (
                  <div className="mt-2 flex items-center gap-2 text-destructive text-xs font-bold uppercase">
                    <AlertTriangle className="w-3 h-3" /> Limit Reached (4/4)
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full h-12 bg-white/10 hover:bg-white/20 text-white"
                disabled={isLimitReached}
                onClick={() => {
                  setOpen(false);
                  onSelectFree();
                }}
              >
                {isLimitReached ? "Limit Reached" : "Continue with Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative overflow-hidden border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col">
            <div className="absolute top-0 right-0 p-2">
              <Badge className="bg-accent text-accent-foreground font-bold">PRO</Badge>
            </div>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="mb-6">
                <Badge variant="outline" className="mb-2 border-accent/30 text-accent">Best Value</Badge>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Premium <Crown className="w-5 h-5 text-accent" />
                </h3>
                <p className="text-3xl font-headline font-bold mt-2">₹2,999<span className="text-sm font-normal text-muted-foreground">/year</span></p>
              </div>
              
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Includes everything in Free, plus:</div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {premiumFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-3 h-3 text-accent" />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              
              <Button className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
