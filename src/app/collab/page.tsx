"use client";

import React, { useState, useEffect, useMemo } from "react";
import { UserHeader } from "@/components/layout/UserHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogOut, Loader2, Copy, Check, MessageSquare, MapPin, Sparkles } from "lucide-react";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";

export default function CollabPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch full user data to check premium
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  // Active room data
  const roomRef = useMemoFirebase(() => {
    if (!firestore || !userData?.activeCollabRoomId) return null;
    return doc(firestore, "collabRooms", userData.activeCollabRoomId);
  }, [firestore, userData]);
  const { data: activeRoom } = useDoc<any>(roomRef);

  // Members in current room
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.activeCollabRoomId) return null;
    return collection(firestore, `collabRooms/${userData.activeCollabRoomId}/members`);
  }, [firestore, userData]);
  const { data: members } = useCollection<any>(membersQuery);

  // Trips in current room
  const roomTripsQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.activeCollabRoomId) return null;
    return query(
      collection(firestore, "trips"),
      where("collabRoomId", "==", userData.activeCollabRoomId)
    );
  }, [firestore, userData]);
  const { data: roomTrips } = useCollection<any>(roomTripsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/auth");
    if (userData && !userData.isPremium) {
      toast({ title: "Premium Required", description: "This feature is only for Premium explorers." });
      router.push("/dashboard");
    }
  }, [user, isUserLoading, userData, router, toast]);

  const generateCode = () => Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCreateRoom = async () => {
    if (!user || !firestore) return;
    const code = generateCode();
    setIsJoining(true);
    try {
      const roomRef = doc(firestore, "collabRooms", code);
      await setDocumentNonBlocking(roomRef, {
        id: code,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      }, {});

      // Add self as member
      const memberRef = doc(firestore, `collabRooms/${code}/members`, user.uid);
      await setDocumentNonBlocking(memberRef, {
        id: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
        joinedAt: new Date().toISOString()
      }, {});

      // Update user state
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
        activeCollabRoomId: code
      });

      toast({ title: "Room Created!", description: `Join code: ${code}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !firestore || !roomCode) return;
    setIsJoining(true);
    try {
      const targetRoomRef = doc(firestore, "collabRooms", roomCode.toUpperCase());
      const snap = await getDoc(targetRoomRef);
      if (!snap.exists()) {
        toast({ variant: "destructive", title: "Room Not Found", description: "Invalid code." });
        return;
      }

      // Add self as member
      const memberRef = doc(firestore, `collabRooms/${roomCode.toUpperCase()}/members`, user.uid);
      await setDocumentNonBlocking(memberRef, {
        id: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
        joinedAt: new Date().toISOString()
      }, {});

      // Update user state
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
        activeCollabRoomId: roomCode.toUpperCase()
      });

      toast({ title: "Joined!", description: `Welcome to room ${roomCode.toUpperCase()}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !firestore || !userData?.activeCollabRoomId) return;
    try {
      const memberRef = doc(firestore, `collabRooms/${userData.activeCollabRoomId}/members`, user.uid);
      await deleteDocumentNonBlocking(memberRef);
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid), {
        activeCollabRoomId: null
      });
      toast({ title: "Left Room", description: "You are no longer in the collaborative session." });
    } catch (e) {
      console.error(e);
    }
  };

  const copyCode = () => {
    const codeToCopy = userData?.activeCollabRoomId || activeRoom?.id;
    if (!codeToCopy) return;
    
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true);
      toast({ title: "Copied!", description: "Room code copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Group trips by user
  const groupedTrips = useMemo(() => {
    if (!roomTrips) return {};
    return roomTrips.reduce((acc: any, trip: any) => {
      const ownerName = members?.find(m => m.id === trip.ownerId)?.name || "Unknown Explorer";
      if (!acc[ownerName]) acc[ownerName] = [];
      acc[ownerName].push(trip);
      return acc;
    }, {});
  }, [roomTrips, members]);

  const displayCode = userData?.activeCollabRoomId || activeRoom?.id || "---";

  return (
    <div className="min-h-screen bg-background">
      <UserHeader showBack backHref="/dashboard" title="Collaboration Hub" />
      
      {/* Active Members Div - Top Right */}
      {userData?.activeCollabRoomId && (
        <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2 animate-fade-in">
          <Card className="glass-card border-accent/20 bg-accent/5 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
            <div className="flex -space-x-2 mr-2">
              {members?.slice(0, 5).map((m) => (
                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden bg-primary/20" title={m.name}>
                  {m.photoURL ? <Image src={m.photoURL} alt={m.name} width={32} height={32} /> : <span className="text-[10px] flex items-center justify-center h-full font-bold">{m.name?.[0]}</span>}
                </div>
              ))}
              {(members?.length || 0) > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                  +{members!.length - 5}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none">Live Room</p>
              <p className="text-xs font-headline font-bold">{displayCode}</p>
            </div>
          </Card>
        </div>
      )}

      <main className="container mx-auto px-4 pt-10 pb-20">
        {!userData?.activeCollabRoomId ? (
          <div className="max-w-2xl mx-auto space-y-12 py-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="text-primary w-10 h-10" />
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-bold">Plan Together.</h1>
              <p className="text-muted-foreground text-lg">Create a session and invite your travel group to brainstorm in real-time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-none hover:bg-white/5 transition-all">
                <CardHeader>
                  <CardTitle>Create Room</CardTitle>
                  <CardDescription>Generate a new code to start a group planning session.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full h-12 bg-primary text-primary-foreground" onClick={handleCreateRoom} disabled={isJoining}>
                    {isJoining ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Start New Session
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-none hover:bg-white/5 transition-all">
                <CardHeader>
                  <CardTitle>Join Room</CardTitle>
                  <CardDescription>Enter a code shared by a friend to join their session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    placeholder="Enter Code (e.g. A7B2X)" 
                    className="h-12 bg-white/5 border-white/10 uppercase font-headline text-center text-lg tracking-widest"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                  />
                  <Button variant="outline" className="w-full h-12 border-primary text-primary" onClick={handleJoinRoom} disabled={isJoining || !roomCode}>
                    Join Session
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-headline font-bold mb-2">Group Brainstorm</h2>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="px-3 py-1 border-primary/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {members?.length || 0} Members Online
                  </Badge>
                  <button onClick={copyCode} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors group">
                    Code: <span className="font-bold text-accent">{displayCode}</span> {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="/plan/new">
                  <Button className="bg-primary text-primary-foreground gap-2">
                    <Plus className="w-4 h-4" /> Add Room Trip
                  </Button>
                </Link>
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10 gap-2" onClick={handleLeaveRoom}>
                  <LogOut className="w-4 h-4" /> Leave Session
                </Button>
              </div>
            </div>

            {/* Collaborative Trips Sorted by User */}
            <div className="space-y-12">
              {Object.keys(groupedTrips).length > 0 ? (
                Object.entries(groupedTrips).map(([userName, trips]: [string, any]) => (
                  <div key={userName} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h3 className="text-xl font-bold">{userName}&apos;s Ideas</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {trips.map((trip: any) => (
                        <Link key={trip.id} href={`/trip/${trip.id}`}>
                          <Card className="glass-card border-none hover:-translate-y-1 transition-all">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-lg">{trip.destination}</h4>
                                <Badge variant="secondary" className="bg-white/5 border-none text-[10px]">
                                  {trip.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {trip.destination}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" /> AI Plan Ready
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center glass-card border-dashed border-white/10 rounded-3xl">
                  <Sparkles className="text-muted-foreground w-12 h-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-bold mb-2">No Room Trips Yet</h3>
                  <p className="text-muted-foreground mb-6">Any trip you create while in this room will show up here for everyone!</p>
                  <Link href="/plan/new">
                    <Button variant="outline" className="border-primary text-primary">Create Room Idea</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}