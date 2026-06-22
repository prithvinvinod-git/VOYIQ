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
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link href={backHref || "/dashboard"}>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground border border-border rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Link href={logoHref} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 30%))",
              }}
            >
              <Compass className="text-primary-foreground w-4.5 h-4.5 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <span className="font-headline font-bold tracking-tight text-lg hidden sm:block text-foreground">
              {title || "VOYIQ"}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 ml-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground h-9 rounded-lg"
              >
                <Home className="w-3.5 h-3.5" /> Home
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground h-9 rounded-lg"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Button>
            </Link>

            <Link href="/plan/new">
              <Button
                variant="ghost"
                className="gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground h-9 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> New Trip
              </Button>
            </Link>

            <Button
              variant="ghost"
              className={`gap-2 text-[10px] font-bold uppercase tracking-widest h-9 rounded-lg ${
                isPremium ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={handleCollabClick}
            >
              <Users className="w-3.5 h-3.5" /> Collab Hub{" "}
              {!isPremium && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-40" />}
            </Button>

            <Button
              variant="ghost"
              className={`gap-2 text-[10px] font-bold uppercase tracking-widest h-9 rounded-lg ${
                isPremium ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted"
              }`}
              onClick={handleARClick}
            >
              <Scan className="w-3.5 h-3.5" /> AR HUD{" "}
              {!isPremium && <Lock className="w-2.5 h-2.5 ml-0.5 opacity-40" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!user ? (
            <>
              <Link href="/auth" className="hidden sm:block">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg h-9 px-4 text-xs font-bold uppercase tracking-widest"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button
                  className="rounded-lg h-9 px-4 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                  style={{
                    background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 30%))",
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
                className="flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full cursor-pointer transition-colors duration-200 group border border-border bg-background hover:bg-muted"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden relative bg-muted border border-border">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="Avatar" width={28} height={28} className="object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-foreground uppercase">
                      {user?.displayName?.[0] || userData?.name?.[0] || "U"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-medium max-w-[80px] truncate leading-tight text-foreground">
                    {user?.displayName || userData?.name || "Explorer"}
                  </span>
                  {isPremium && (
                    <span className="text-[8px] font-bold uppercase text-amber-500">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border-border bg-background"
            >
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Account
              </div>
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => { setIsMenuOpen(false); router.push("/"); }}>
                <Home className="mr-2 w-4 h-4" /> Home
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => { setIsMenuOpen(false); router.push("/dashboard"); }}>
                <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => { setIsMenuOpen(false); router.push("/plan/new"); }}>
                <Plane className="mr-2 w-4 h-4" /> Plan New Trip
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={handleCollabClick}>
                <Users className="mr-2 w-4 h-4" /> Collab Hub{" "}
                {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={handleARClick}>
                <Scan className="mr-2 w-4 h-4" /> AR HUD{" "}
                {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground rounded-xl h-9 w-9 flex items-center justify-center border border-border"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 border-l border-border bg-background"
              >
                <div className="h-full flex flex-col justify-between pt-6 pb-4">
                  <div className="space-y-6">
                    <SheetHeader className="text-left">
                      <SheetTitle className="text-xl font-headline font-bold text-foreground flex items-center gap-2">
                        <Compass className="text-primary w-5 h-5" /> VOYIQ
                      </SheetTitle>
                    </SheetHeader>

                    {user && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden relative border border-border">
                          {user.photoURL ? (
                            <Image src={user.photoURL} alt="Avatar" width={40} height={40} className="object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-foreground uppercase">
                              {user.displayName?.[0] || userData?.name?.[0] || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">
                            {user.displayName || userData?.name || "Explorer"}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Link href="/" className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Home className="w-4 h-4" /> Home
                        </Button>
                      </Link>

                      <Link href="/dashboard" className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Button>
                      </Link>

                      <Link href="/plan/new" className="w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Plus className="w-4 h-4" /> New Trip
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          isPremium ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={handleCollabClick}
                      >
                        <Users className="w-4 h-4" /> Collab Hub
                        {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
                      </Button>

                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          isPremium ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted"
                        }`}
                        onClick={handleARClick}
                      >
                        <Scan className="w-4 h-4" /> AR HUD
                        {!isPremium && <Lock className="w-3 h-3 ml-auto opacity-40" />}
                      </Button>

                      <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Theme</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>

                  {user && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 rounded-lg text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
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
