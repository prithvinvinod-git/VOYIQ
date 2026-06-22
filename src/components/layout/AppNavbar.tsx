"use client";

import React, { useState } from "react";
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
  { label: "Destinations", href: "#", icon: Map },
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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[26px]">
          <div className="glass-panel rounded-[20px] px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-headline font-bold tracking-tight">
                Voyiq<span className="text-blue-400">.</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.href) ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setPricingFeature("Pricing")}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === "/pricing" ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Pricing
              </button>
              {premiumLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handlePremiumNav(link.feature, link.route)}
                  className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-1.5"
                >
                  {link.label}
                  {!isPremium && <Lock className="w-3 h-3 text-yellow-400/60" />}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {!user ? (
                <Link
                  href="/auth"
                  className="px-5 py-2 text-sm font-semibold rounded-full bg-white text-[#111415] hover:bg-white/90 transition-all duration-200"
                >
                  Sign In
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-blue-500/20 border border-blue-500/30">
                        {user?.photoURL ? (
                          <Image src={user.photoURL} alt="" width={28} height={28} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-[10px] font-bold text-blue-400 uppercase">
                            {(user?.displayName?.[0] || userData?.name?.[0] || "U")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-white/80 max-w-[80px] truncate">
                        {user?.displayName || userData?.name || "Explorer"}
                      </span>
                      {isPremium && (
                        <span className="text-[9px] font-bold uppercase text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
                          Pro
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl border-white/10 bg-[#1d2021] backdrop-blur-xl"
                  >
                    <div className="px-3 py-2 flex items-center gap-3 border-b border-white/10 mb-1">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-blue-500/20 border border-blue-500/30">
                        {user?.photoURL ? (
                          <Image src={user.photoURL} alt="" width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs font-bold text-blue-400 uppercase">
                            {(user?.displayName?.[0] || userData?.name?.[0] || "U")}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {user?.displayName || userData?.name || "Explorer"}
                        </span>
                        <span className="text-[10px] text-white/40 truncate">{user?.email}</span>
                      </div>
                    </div>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:text-white focus:bg-white/5"
                      onClick={() => { setPricingFeature("Pricing"); }}
                    >
                      <CreditCard className="mr-2 w-4 h-4" /> Subscription
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-white/5"
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
              className="md:hidden p-2 text-white/60 hover:text-white"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="md:hidden mt-2 mx-4 sm:mx-6 glass-panel rounded-2xl p-4">
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-blue-500/20 border border-blue-500/30">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs font-bold text-blue-400 uppercase">
                      {(user?.displayName?.[0] || userData?.name?.[0] || "U")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.displayName || userData?.name || "Explorer"}
                  </span>
                  <span className="text-[10px] text-white/40 truncate">{user?.email}</span>
                </div>
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`block py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href) ? "text-white" : "text-white/60 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { setPricingFeature("Pricing"); setSidebarOpen(false); }}
              className="block w-full text-left py-2 text-sm font-medium text-white/60 hover:text-white"
            >
              Pricing
            </button>
            {premiumLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handlePremiumNav(link.feature, link.route)}
                className="block w-full text-left py-2 text-sm font-medium text-white/60 hover:text-white flex items-center gap-1.5"
              >
                {link.label}
                {!isPremium && <Lock className="w-3 h-3 text-yellow-400/60" />}
              </button>
            ))}
            {!user ? (
              <Link
                href="/auth"
                className="block mt-3 px-5 py-2 text-center text-sm font-semibold rounded-full bg-white text-[#111415]"
                onClick={() => setSidebarOpen(false)}
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="block w-full mt-3 px-5 py-2 text-center text-sm font-semibold rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </nav>

      <PricingOverlay
        open={pricingFeature !== null}
        onClose={() => setPricingFeature(null)}
        feature={pricingFeature || undefined}
      />
    </>
  );
}
