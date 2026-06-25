"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Compass,
  Users,
  Lock,
  LayoutDashboard,
  Scan,
  Map,
  Menu,
  X,
  CreditCard,
  User,
} from "lucide-react";
import Link from "next/link";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { doc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PricingOverlay } from "@/components/shared/PricingOverlay";

const navLinks = [
  { label: "Destinations", href: "/destinations", icon: Map },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const premiumLinks = [
  { label: "Collab Hub", feature: "Collab Hub", icon: Users, route: "/collab" },
  { label: "AR Hub", feature: "AR Hub", icon: Scan, route: "/ar" },
];

export function AppNavbar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pricingFeature, setPricingFeature] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<any>(userRef);
  const isPremium = userData?.isPremium || false;

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/"));
  };

  const handlePremiumNav = (feature: string, route: string) => {
    setSidebarOpen(false);
    if (!isPremium) {
      setPricingFeature(feature);
    } else {
      router.push(route);
    }
  };

  const isActive = (href: string) => pathname === href;

  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sidebarOpen]);

  return (
    <div ref={navbarRef}>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 mt-[18px]">
          <div className="bg-white/85 backdrop-blur-md rounded-full shadow-sm px-3 py-1.5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-95 active:scale-90">
              <Image src="/logo.png" alt="Voyiq" width={22} height={22} className="object-contain" />
              <span className="font-amoria text-xl text-[#2f3131] tracking-[0.02em]">
                Voyiq.
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    isActive(link.href)
                      ? "text-[#2f3131] bg-black/[0.05]"
                      : "text-[#444748] hover:text-[#2f3131] hover:bg-black/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setPricingFeature("Pricing")}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  pathname === "/pricing"
                    ? "text-[#2f3131] bg-black/[0.05]"
                    : "text-[#444748] hover:text-[#2f3131] hover:bg-black/[0.03]"
                }`}
              >
                Pricing
              </button>
              {premiumLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handlePremiumNav(link.feature, link.route)}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg text-[#444748] hover:text-[#2f3131] hover:bg-black/[0.03] transition-all duration-200 flex items-center gap-1.5"
                >
                  {link.label}
                  {!isPremium && <Lock className="w-3 h-3 text-yellow-500/60" />}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {!user ? (
                <Link
                  href="/auth"
                  className="px-5 py-2 text-sm font-semibold rounded-full bg-[#111415] text-white hover:bg-[#323536] transition-all duration-200 scale-95 active:scale-90"
                >
                  Sign In
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white shadow-sm border border-black/15 hover:bg-gray-50 hover:shadow-md transition-all duration-200">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-blue-500/20 border border-blue-500/30">
                        {user?.photoURL ? (
                          <Image src={user.photoURL} alt="" width={28} height={28} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-[10px] font-bold text-blue-500 uppercase">
                            {(user?.displayName?.[0] || userData?.name?.[0] || "U")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#444748] max-w-[80px] truncate">
                        {user?.displayName || userData?.name || "Explorer"}
                      </span>
                      {isPremium && (
                        <span className="text-[9px] font-bold uppercase text-yellow-600 bg-yellow-500/15 px-1.5 py-0.5 rounded-full border border-yellow-500/30">
                          Pro
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl border-black/10 bg-white/90 backdrop-blur-xl"
                  >
                    <div className="px-3 py-2 flex items-center gap-3 border-b border-black/10 mb-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-blue-500/20 border border-blue-500/30">
                        {user?.photoURL ? (
                          <Image src={user.photoURL} alt="" width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs font-bold text-blue-500 uppercase">
                            {(user?.displayName?.[0] || userData?.name?.[0] || "U")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#2f3131] truncate">
                          {user?.displayName || userData?.name || "Explorer"}
                        </span>
                        <span className="text-[10px] text-[#444748]/60 truncate">{user?.email}</span>
                      </div>
                    </div>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg text-[#444748] hover:text-[#2f3131] focus:text-[#2f3131] focus:bg-black/5"
                      onClick={() => { setPricingFeature("Pricing"); }}
                    >
                      <CreditCard className="mr-2 w-4 h-4" /> Subscription
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-black/10" />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-black/5"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 w-4 h-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-[#444748] hover:text-[#2f3131]"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="md:hidden fixed top-[72px] right-4 z-[9999] w-56 rounded-xl bg-white/90 backdrop-blur-xl border border-black/10 shadow-md p-1.5">
            {user && (
              <div className="px-3 py-2 flex items-center gap-3 border-b border-black/10 mb-1">
                <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-blue-500/20 border border-blue-500/30">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs font-bold text-blue-500 uppercase">
                      {(user?.displayName?.[0] || userData?.name?.[0] || "U")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#2f3131] truncate">
                    {user?.displayName || userData?.name || "Explorer"}
                  </span>
                  <span className="text-[10px] text-[#444748]/60 truncate">{user?.email}</span>
                </div>
              </div>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative flex select-none items-center gap-2.5 px-3 py-2 text-sm outline-none transition-colors cursor-pointer rounded-lg text-[#444748] hover:text-[#2f3131] focus:text-[#2f3131] focus:bg-black/5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setPricingFeature("Pricing"); setSidebarOpen(false); }}
              className="relative flex select-none items-center gap-2.5 px-3 py-2 text-sm outline-none transition-colors cursor-pointer rounded-lg text-[#444748] hover:text-[#2f3131] focus:text-[#2f3131] focus:bg-black/5 w-full text-left"
            >
              <CreditCard className="w-4 h-4" />
              Pricing
            </button>
            <div role="separator" aria-orientation="horizontal" className="-mx-1 my-1 h-px bg-black/10" />
            {premiumLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => handlePremiumNav(link.feature, link.route)}
                  className="relative flex select-none items-center gap-2.5 px-3 py-2 text-sm outline-none transition-colors cursor-pointer rounded-lg text-[#444748] hover:text-[#2f3131] focus:text-[#2f3131] focus:bg-black/5 w-full text-left"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {!isPremium && <Lock className="w-3 h-3 text-yellow-500/60" />}
                </button>
              );
            })}
            {!user ? (
              <div className="mt-1 border-t border-black/10 pt-1">
                <Link
                  href="/auth"
                  className="relative flex select-none items-center gap-2.5 px-3 py-2 text-sm outline-none transition-colors cursor-pointer rounded-lg text-[#444748] hover:text-[#2f3131] focus:text-[#2f3131] focus:bg-black/5"
                  onClick={() => setSidebarOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="mt-1 border-t border-black/10 pt-1">
                <button
                  onClick={handleLogout}
                  className="relative flex select-none items-center gap-2.5 px-3 py-2 text-sm outline-none transition-colors cursor-pointer rounded-lg text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-black/5 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <PricingOverlay
        open={pricingFeature !== null}
        onClose={() => setPricingFeature(null)}
        feature={pricingFeature || undefined}
      />
    </div>
  );
}
