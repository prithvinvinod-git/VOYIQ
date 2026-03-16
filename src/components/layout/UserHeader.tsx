
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  ChevronLeft, 
  Compass, 
  Users, 
  Lock, 
  Plane, 
  LayoutDashboard, 
  Plus 
} from "lucide-react";
import Link from "next/link";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PlanSelectionDialog } from "@/components/shared/PlanSelectionDialog";

interface UserHeaderProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
}

export function UserHeader({ showBack, backHref, title }: UserHeaderProps) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<any>(userRef);
  const isPremium = userData?.isPremium || false;

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/"));
  };

  const handleCollabClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false); // Close the menu immediately to prevent focus lock
    
    if (!isPremium) {
      setIsPlanDialogOpen(true);
    } else {
      router.push("/collab");
    }
  };

  return (
    <nav className="border-b border-white/5 bg-card/30 backdrop-blur-md sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <Link href={backHref || "/dashboard"}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Compass className="text-primary-foreground w-5 h-5" />
              </div>
              <span className="font-headline font-bold tracking-tight text-lg hidden sm:block text-white">
                {title || "VOYIQ"}
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1 ml-4">
              <Link href="/plan/new">
                <Button variant="ghost" className="gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-primary h-9">
                  <Plus className="w-3.5 h-3.5" /> New Trip
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className={`gap-2 text-[10px] font-bold uppercase tracking-widest h-9 ${isPremium ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-white/10 hover:text-white'}`}
                onClick={handleCollabClick}
              >
                <Users className="w-3.5 h-3.5" /> Collab Hub {!isPremium && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-50" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu modal={false} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full cursor-pointer transition-all">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-white/10">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="Avatar" width={28} height={28} />
                  ) : (
                    <span className="text-[10px] font-bold text-white uppercase">{user?.displayName?.[0] || userData?.name?.[0] || "U"}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium max-w-[80px] truncate leading-tight text-white">
                    {user?.displayName || userData?.name || "Explorer"}
                  </span>
                  {isPremium && <span className="text-[8px] text-accent font-bold uppercase">Premium</span>}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-white/10 z-[100]">
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Account
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={() => { setIsMenuOpen(false); router.push("/dashboard"); }}>
                <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => { setIsMenuOpen(false); router.push("/plan/new"); }}>
                <Plane className="mr-2 w-4 h-4" /> Plan New Trip
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer" 
                onClick={handleCollabClick}
              >
                <Users className="mr-2 w-4 h-4" /> Collab Hub {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-50" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PlanSelectionDialog 
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        onSelectFree={() => {
          setIsPlanDialogOpen(false);
          router.push("/plan/new");
        }}
      />
    </nav>
  );
}
