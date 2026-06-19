
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
  Home,
  Menu,
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface UserHeaderProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
  logoHref?: string;
}

export function UserHeader({
  showBack,
  backHref,
  title,
  logoHref = "/dashboard",
}: UserHeaderProps) {
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

          <Link href={logoHref} className="flex items-center gap-2.5 group">
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
            <Link href="/">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-primary h-9 rounded-lg text-slate-300"
              >
                <Home className="w-3.5 h-3.5" /> Home
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-primary h-9 rounded-lg text-slate-300"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Button>
            </Link>

            <Link href="/plan/new">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-primary h-9 rounded-lg text-slate-300"
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

        {/* Right: auth actions or user menu */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/auth" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white hover:bg-white/8 rounded-lg h-9 px-4 text-xs font-bold uppercase tracking-widest"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  className="rounded-lg h-9 px-4 text-xs font-bold uppercase tracking-widest text-white"
                  style={{
                    background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 30%))",
                    boxShadow: "0 0 16px rgba(0,212,184,0.25)",
                  }}
                >
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
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
              <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => { setIsMenuOpen(false); router.push("/"); }}>
                <Home className="mr-2 w-4 h-4" /> Home
              </DropdownMenuItem>
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
          )}

          {/* Mobile hamburger navigation drawer */}
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-white rounded-xl h-9 w-9 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 border-l"
                style={{
                  background: "rgba(10,14,30,0.98)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255,255,255,0.1)",
                  boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
                }}
              >
                <div className="h-full flex flex-col justify-between pt-6 pb-4">
                  <div className="space-y-6">
                    <SheetHeader className="text-left">
                      <SheetTitle className="text-xl font-headline font-bold text-white flex items-center gap-2">
                        <Compass className="text-primary w-5 h-5" /> VOYIQ
                      </SheetTitle>
                    </SheetHeader>

                    {/* User profile section inside sheet */}
                    {user && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative border border-primary/30">
                          {user.photoURL ? (
                            <Image src={user.photoURL} alt="Avatar" width={40} height={40} className="object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white uppercase">
                              {user.displayName?.[0] || userData?.name?.[0] || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white truncate">
                            {user.displayName || userData?.name || "Explorer"}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </div>
                    )}

                    {/* Navigation links */}
                    <div className="flex flex-col gap-2">
                      <Link href="/" className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5"
                        >
                          <Home className="w-4 h-4 text-slate-400" /> Home
                        </Button>
                      </Link>

                      <Link href="/dashboard" className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5"
                        >
                          <LayoutDashboard className="w-4 h-4 text-indigo-400" /> Dashboard
                        </Button>
                      </Link>

                      <Link href="/plan/new" className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" /> New Trip
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 rounded-xl text-xs font-bold uppercase tracking-wider ${
                          isPremium ? "text-accent hover:bg-accent/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        }`}
                        onClick={handleCollabClick}
                      >
                        <Users className="w-4 h-4 text-violet-400" /> Collab Hub
                        {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
                      </Button>

                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 rounded-xl text-xs font-bold uppercase tracking-wider ${
                          isPremium ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        }`}
                        onClick={handleARClick}
                      >
                        <Scan className="w-4 h-4 text-cyan-400" /> AR HUD
                        {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
                      </Button>
                    </div>
                  </div>

                  {/* Logout button at bottom of mobile sheet */}
                  {user && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
