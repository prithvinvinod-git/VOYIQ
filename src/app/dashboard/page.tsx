
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, Wallet, Progress as ProgressIcon, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: { total: number; currency: string };
  health: number; // 0-100
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        fetchTrips(u.uid);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchTrips = async (uid: string) => {
    try {
      const q = query(collection(db, "trips"), where("ownerId", "==", uid));
      const querySnapshot = await getDocs(q);
      const fetchedTrips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      
      // Mock health for now if not present
      const formattedTrips = fetchedTrips.map(t => ({
        ...t,
        health: t.health || Math.floor(Math.random() * 40) + 60
      }));
      
      setTrips(formattedTrips);
    } catch (e) {
      console.error(e);
      // Mock trips for demo if none exist
      setTrips([
        { id: "1", destination: "Paris, France", startDate: "2024-06-12", endDate: "2024-06-18", budget: { total: 1500, currency: "USD" }, health: 85 },
        { id: "2", destination: "Tokyo, Japan", startDate: "2024-10-05", endDate: "2024-10-15", budget: { total: 3000, currency: "USD" }, health: 92 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => router.push("/"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-card/30 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-headline font-bold">V</span>
            </div>
            <span className="font-headline font-bold tracking-tight text-lg">VOYIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mr-4 hidden md:flex">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                placeholder="Search trips..." 
                className="bg-transparent border-none outline-none text-xs w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt="Avatar" width={32} height={32} />
                ) : (
                  <span className="text-xs font-bold">{user?.displayName?.[0] || "U"}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">Hello, {user?.displayName?.split(' ')[0] || "Traveler"}!</h1>
            <p className="text-muted-foreground">Ready for your next adventure?</p>
          </div>
          <Link href="/plan/new">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-8 h-12 shadow-lg shadow-primary/20">
              <Plus className="mr-2 w-5 h-5" /> New Trip
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Trips</CardTitle>
              <MapPin className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips.length}</div>
              <p className="text-xs text-muted-foreground mt-1">+1 from last month</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Score</CardTitle>
              <Wallet className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground mt-1">Excellent adherence</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Countries Visited</CardTitle>
              <ProgressIcon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">Goal: 20 this year</p>
            </CardContent>
          </Card>
        </div>

        {/* Trip List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-bold">Your Journeys</h2>
            <Button variant="link" className="text-primary hover:text-primary/80">View Archive</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`}>
                  <Card className="glass-card border-none hover:bg-white/5 transition-all group overflow-hidden">
                    <div className="p-6 flex gap-6">
                      <div className="w-32 h-32 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden">
                        <Image 
                          src={`https://picsum.photos/seed/${trip.id}/150/150`} 
                          alt={trip.destination} 
                          width={150}
                          height={150}
                          className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold truncate pr-4">{trip.destination}</h3>
                          <Badge variant={trip.health > 80 ? "default" : "secondary"} className={trip.health > 80 ? "bg-primary/20 text-primary border-none" : ""}>
                            {trip.health}% Score
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 
                            <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wallet className="w-3 h-3" />
                            <span>{trip.budget.total} {trip.budget.currency}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            <span>Itinerary Completion</span>
                            <span>{trip.health}%</span>
                          </div>
                          <Progress value={trip.health} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-2 py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-muted-foreground w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6">Start your first adventure today with VOYIQ AI.</p>
                <Link href="/plan/new">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Plan a New Trip</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
