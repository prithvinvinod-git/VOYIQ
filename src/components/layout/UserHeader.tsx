"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, Menu, Compass } from "lucide-react";
import Link from "next/link";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface UserHeaderProps {
  showBack?: boolean;
  backHref?: string;
  title?: string;
}

export function UserHeader({ showBack, backHref, title }: UserHeaderProps) {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/"));
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
          <div className="flex items-center gap-2">
            {!showBack && (
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Compass className="text-primary-foreground w-5 h-5" />
              </div>
            )}
            <span className="font-headline font-bold tracking-tight text-lg hidden sm:block">
              {title || "VOYIQ"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full cursor-pointer transition-all">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-white/10">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="Avatar" width={28} height={28} />
                  ) : (
                    <span className="text-[10px] font-bold">{user?.displayName?.[0] || "U"}</span>
                  )}
                </div>
                <span className="text-xs font-medium max-w-[100px] truncate">
                  {user?.displayName || "Explorer"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card border-white/10">
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Account
              </div>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard")}>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/plan/new")}>
                Plan New Trip
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 w-4 h-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
