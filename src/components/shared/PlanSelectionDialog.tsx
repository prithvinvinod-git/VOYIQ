
"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Sparkles, Zap, Crown, Users, Wallet, MessageSquare, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface PlanSelectionDialogProps {
  trigger: React.ReactNode;
  onSelectFree: () => void;
  tripCount?: number;
}

export function PlanSelectionDialog({ trigger, onSelectFree, tripCount = 0 }: PlanSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isLimitReached = tripCount >= 4;

  const freeFeatures = [
    { icon: Sparkles, text: "Smart AI Itineraries" },
    { icon: Wallet, text: "Multi-Currency Budgeting" },
    { icon: MessageSquare, text: "AI Chat Companion" },
    { icon: Check, text: "Up to 4 Saved Trips" },
  ];

  const premiumFeatures = [
    { icon: Users, text: "Real-time Collab Rooms" },
    { icon: Zap, text: "Unlimited Itineraries" },
    { icon: Crown, text: "Priority AI Brain" },
    { icon: Check, text: "Exclusive Pro Perks" },
  ];

  const handleUpgrade = async () => {
    if (promoCode.trim().toLowerCase() !== "coet") {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a valid promotion code to unlock Premium."
      });
      return;
    }

    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Auth Required",
        description: "Please sign in to upgrade your account."
      });
      return;
    }

    setIsUpgrading(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), {
        isPremium: true
      });
      toast({
        title: "Welcome to Premium!",
        description: "Your account has been upgraded successfully. Collab features are now unlocked!"
      });
      setOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: e.message
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[700px] glass-card border-white/10 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 md:p-8 pb-4 text-center shrink-0">
          <DialogTitle className="text-2xl md:text-3xl font-headline font-bold mb-2">Explorer Tiers</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Unlock the future of collaborative travel.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Free Plan */}
            <Card className={`bg-white/5 border-white/10 hover:border-primary/50 transition-all flex flex-col ${isLimitReached ? 'ring-2 ring-destructive/50' : ''}`}>
              <CardContent className="p-5 md:p-6 flex-1 flex flex-col">
                <div className="mb-4 md:mb-6">
                  <Badge variant="outline" className="mb-2 border-primary/30 text-primary">Standard</Badge>
                  <h3 className="text-xl md:text-2xl font-bold">Explorer</h3>
                  <p className="text-2xl md:text-3xl font-headline font-bold mt-2">Free</p>
                  {isLimitReached && (
                    <div className="mt-2 flex items-center gap-2 text-destructive text-[10px] font-bold uppercase">
                      <AlertTriangle className="w-3 h-3" /> Limit Reached ({tripCount}/4)
                    </div>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6 md:mb-8 flex-1">
                  {freeFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-3 h-3 text-primary" />
                      </div>
                      {f.text}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full h-11 md:h-12 bg-white/10 hover:bg-white/20 text-white text-sm"
                  disabled={isLimitReached}
                  onClick={() => {
                    setOpen(false);
                    onSelectFree();
                  }}
                >
                  {isLimitReached ? "Limit Reached" : "Continue Free"}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative overflow-hidden border-accent/50 bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col">
              <div className="absolute top-0 right-0 p-2">
                <Badge className="bg-accent text-accent-foreground font-bold">PRO</Badge>
              </div>
              <CardContent className="p-5 md:p-6 flex-1 flex flex-col">
                <div className="mb-4 md:mb-6">
                  <Badge variant="outline" className="mb-2 border-accent/30 text-accent">Real-time Collab</Badge>
                  <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    Premium <Crown className="w-5 h-5 text-accent" />
                  </h3>
                  <p className="text-2xl md:text-3xl font-headline font-bold mt-2">₹2,999<span className="text-xs font-normal text-muted-foreground">/yr</span></p>
                </div>
                
                <ul className="space-y-3 mb-6 flex-1">
                  {premiumFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-3 h-3 text-accent" />
                      </div>
                      {f.text}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="promo" className="text-[10px] uppercase font-bold text-muted-foreground">Enter Upgrade Code</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="promo"
                      placeholder="e.g. coet" 
                      className="h-10 bg-white/10 border-white/10 text-xs"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button 
                      className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 px-4 text-xs font-bold"
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : "UPGRADE"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
