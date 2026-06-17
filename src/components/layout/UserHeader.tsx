
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
  Plus,
  Scan,
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
    setIsMenuOpen(false);
    if (!isPremium) { setIsPlanDialogOpen(true); }
    else { router.push("/collab"); }
  };

  const handleARClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (!isPremium) { setIsPlanDialogOpen(true); }
    else { router.push("/ar"); }
  };

  return (
    <nav
      className="border-b sticky top-0 z-40 transition-all duration-300"
      style={{
        background: "rgba(10,14,30,0.8)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottomColor: "rgba(255,255,255,0.06)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: logo + back + nav */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Link href={backHref || "/dashboard"}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-white rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 30%))",
                boxShadow: "0 0 16px rgba(0,212,184,0.35)",
              }}
            >
              <Compass className="text-primary-foreground w-4.5 h-4.5 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <span className="font-headline font-bold tracking-tight text-lg hidden sm:block text-white">
              {title || "VOYIQ"}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            <Link href="/plan/new">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-primary h-9 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> New Trip
              </Button>
            </Link>

            <Button
              variant="ghost"
              className={`gap-2 text-[10px] font-bold uppercase tracking-widest h-9 rounded-lg ${
                isPremium ? "text-accent hover:bg-accent/10" : "text-muted-foreground hover:bg-white/8 hover:text-white"
              }`}
              onClick={handleCollabClick}
            >
              <Users className="w-3.5 h-3.5" /> Collab Hub{" "}
              {!isPremium && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-40" />}
            </Button>

            <Button
              variant="ghost"
              className={`gap-2 text-[10px] font-bold uppercase tracking-widest h-9 rounded-lg ${
                isPremium ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-white/8 hover:text-white"
              }`}
              onClick={handleARClick}
            >
              <Scan className="w-3.5 h-3.5" /> AR HUD{" "}
              {!isPremium && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-40" />}
            </Button>
          </div>
        </div>

        {/* Right: user avatar dropdown */}
        <div className="flex items-center gap-3">
          <DropdownMenu modal={false} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <div
                className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full cursor-pointer transition-all duration-200 group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,212,184,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden relative"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,212,184,0.3), rgba(123,97,255,0.2))",
                    border: "1px solid rgba(0,212,184,0.3)",
                  }}
                >
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="Avatar" width={28} height={28} className="object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white uppercase">
                      {user?.displayName?.[0] || userData?.name?.[0] || "U"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-medium max-w-[80px] truncate leading-tight text-white">
                    {user?.displayName || userData?.name || "Explorer"}
                  </span>
                  {isPremium && (
                    <span
                      className="text-[8px] font-bold uppercase"
                      style={{ color: "hsl(37 91% 55%)" }}
                    >
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl"
              style={{
                background: "rgba(10,14,30,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Account
              </div>
              <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => { setIsMenuOpen(false); router.push("/dashboard"); }}>
                <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => { setIsMenuOpen(false); router.push("/plan/new"); }}>
                <Plane className="mr-2 w-4 h-4" /> Plan New Trip
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={handleCollabClick}>
                <Users className="mr-2 w-4 h-4" /> Collab Hub{" "}
                {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={handleARClick}>
                <Scan className="mr-2 w-4 h-4" /> AR HUD{" "}
                {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: "rgba(255,255,255,0.06)" }} />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PlanSelectionDialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
        onSelectFree={() => { setIsPlanDialogOpen(false); router.push("/plan/new"); }}
      />
    </nav>
  );
}
