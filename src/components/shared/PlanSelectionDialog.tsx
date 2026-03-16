
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
  DialogOverlay
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Clock
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

export function PlanSelectionDialog({ trigger, onSelectFree, tripCount = 0, open: openProp, onOpenChange }: PlanSelectionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isOpen = openProp !== undefined ? openProp : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  
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
    { icon: Navigation, text: "AR Navigation", status: "upcoming" },
    { icon: Mic, text: "AI Voice Travel Assistant", status: "upcoming" },
    { icon: Languages, text: "Live Voice Translation", status: "upcoming" },
  ];

  const handleUpgrade = async () => {
    const inputCode = promoCode.trim().toLowerCase();
    
    if (inputCode !== "coet") {
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
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, {
        isPremium: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Welcome to Premium!",
        description: "Your account has been upgraded successfully. Collab features are now unlocked!"
      });
      
      // Closing with a slight delay to ensure UI states settle
      setTimeout(() => {
        setOpen(false);
      }, 150);
    } catch (e: any) {
      console.error("Upgrade error:", e);
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: e.message || "Could not process upgrade."
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
        <DialogContent className="fixed left-[50%] top-[50%] z-[110] w-full max-w-[95vw] sm:max-w-[750px] translate-x-[-50%] translate-y-[-50%] glass-card border-white/10 p-0 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] shadow-2xl">
          <DialogHeader className="p-6 sm:p-10 pb-4 text-center shrink-0">
            <DialogTitle className="text-2xl sm:text-4xl font-headline font-bold mb-2">Explorer Tiers</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm sm:text-base">
              Choose the best way to power your adventures.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-8 sm:pb-12 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`bg-white/5 border-white/10 hover:border-primary/50 transition-all flex flex-col ${isLimitReached ? 'ring-2 ring-destructive/50' : ''}`}>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="mb-6">
                    <Badge variant="outline" className="mb-3 border-primary/30 text-primary px-3 py-1">Standard</Badge>
                    <h3 className="text-xl font-bold">Free Explorer</h3>
                    <p className="text-2xl font-headline font-bold mt-2 text-white">₹0</p>
                    {isLimitReached && (
                      <div className="mt-3 flex items-center gap-2 text-destructive text-[10px] font-bold uppercase bg-destructive/10 p-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4" /> Trip Limit Reached ({tripCount}/4)
                      </div>
                    )}
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {freeFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <f.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-bold"
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

              <Card className="relative overflow-hidden border-accent/50 bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col shadow-2xl">
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-accent text-accent-foreground font-bold shadow-lg">PREMIUM</Badge>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="mb-6">
                    <Badge variant="outline" className="mb-3 border-accent/30 text-accent px-3 py-1">Unlimited Potential</Badge>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      Pro Voyager <Crown className="w-5 h-5 text-accent" />
                    </h3>
                    <p className="text-2xl font-headline font-bold mt-2 text-white">₹2,999<span className="text-xs font-normal text-muted-foreground ml-1">/year</span></p>
                  </div>
                  
                  <ul className="space-y-4 mb-6 flex-1">
                    {premiumFeatures.map((f, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm ${f.status === 'upcoming' ? 'text-muted-foreground italic' : 'font-semibold text-white'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${f.status === 'upcoming' ? 'bg-white/5' : 'bg-accent/20'}`}>
                          {f.status === 'upcoming' ? <Clock className="w-3.5 h-3.5 opacity-50" /> : <f.icon className="w-3.5 h-3.5 text-accent" />}
                        </div>
                        <div className="flex flex-col">
                          <span>{f.text}</span>
                          {f.status === 'upcoming' && <span className="text-[10px] uppercase font-bold text-accent/60 not-italic">Coming Soon</span>}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3 pt-6 border-t border-white/10 mt-auto">
                    <Label htmlFor="promo" className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Upgrade Access Code</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="promo"
                        placeholder="code: coet" 
                        className="h-11 bg-white/10 border-white/10 text-center font-mono tracking-widest focus:ring-accent"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpgrade()}
                      />
                      <Button 
                        className="h-11 bg-accent text-accent-foreground hover:bg-accent/90 px-6 font-bold shrink-0 shadow-lg shadow-accent/20"
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                      >
                        {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : "UPGRADE"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
