
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { UserHeader } from "@/components/layout/UserHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  LogOut,
  Loader2,
  Copy,
  Check,
  MapPin,
  Sparkles,
  Clock,
  ArrowRight,
  Radio,
  Hash,
} from "lucide-react";
import {
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/firebase";
import { collection, doc, query, where, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomChat } from "@/components/collab/RoomChat";

export default function CollabPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<any>(userRef);

  const roomRef = useMemoFirebase(() => {
    if (!firestore || !userData?.activeCollabRoomId) return null;
    return doc(firestore, "collabRooms", userData.activeCollabRoomId);
  }, [firestore, userData]);
  const { data: activeRoom } = useDoc<any>(roomRef);

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.activeCollabRoomId) return null;
    return collection(firestore, `collabRooms/${userData.activeCollabRoomId}/members`);
  }, [firestore, userData]);
  const { data: members } = useCollection<any>(membersQuery);

  const roomTripsQuery = useMemoFirebase(() => {
    if (!firestore || !userData?.activeCollabRoomId) return null;
    return query(collection(firestore, "trips"), where("collabRoomId", "==", userData.activeCollabRoomId));
  }, [firestore, userData]);
  const { data: roomTrips } = useCollection<any>(roomTripsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/auth");
    if (userData && !userData.isPremium) {
      toast({ title: "Premium Required", description: "Collab is a Premium feature." });
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
      await setDocumentNonBlocking(roomRef, { id: code, createdBy: user.uid, createdAt: new Date().toISOString() }, {});
      const memberRef = doc(firestore, `collabRooms/${code}/members`, user.uid);
      await setDocumentNonBlocking(memberRef, { id: user.uid, name: user.displayName || userData?.name || "Explorer", photoURL: user.photoURL, joinedAt: new Date().toISOString() }, {});
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid), { activeCollabRoomId: code });
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
      if (!snap.exists()) { toast({ variant: "destructive", title: "Room Not Found", description: "Invalid code." }); return; }
      const memberRef = doc(firestore, `collabRooms/${roomCode.toUpperCase()}/members`, user.uid);
      await setDocumentNonBlocking(memberRef, { id: user.uid, name: user.displayName || userData?.name || "Explorer", photoURL: user.photoURL, joinedAt: new Date().toISOString() }, {});
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid), { activeCollabRoomId: roomCode.toUpperCase() });
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
      await updateDocumentNonBlocking(doc(firestore, "users", user.uid), { activeCollabRoomId: null });
      toast({ title: "Left Room", description: "You've left the collaborative session." });
    } catch (e) { console.error(e); }
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

  const groupedTrips = useMemo(() => {
    if (!roomTrips) return {};
    return roomTrips.reduce((acc: any, trip: any) => {
      const ownerName = members?.find((m) => m.id === trip.ownerId)?.name || "Unknown Explorer";
      if (!acc[ownerName]) acc[ownerName] = [];
      acc[ownerName].push(trip);
      return acc;
    }, {});
  }, [roomTrips, members]);

  const displayCode = userData?.activeCollabRoomId || activeRoom?.id || "---";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-0">
        <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,212,184,0.05) 0%, transparent 70%)", filter: "blur(80px)", top: "-100px", right: "-100px" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(123,97,255,0.04) 0%, transparent 70%)", filter: "blur(80px)", bottom: "-100px", left: "10%" }} />
      </div>

      <UserHeader showBack backHref="/dashboard" title="Collaboration Hub" />

      {/* Floating live room indicator */}
      {userData?.activeCollabRoomId && (
        <>
          <div className="fixed top-20 right-4 z-40 flex flex-col items-end gap-2 animate-fade-in">
            <button onClick={() => setIsMemberListOpen(true)} className="hover:scale-105 transition-transform active:scale-95">
              <div
                className="p-3 rounded-2xl flex items-center gap-3 cursor-pointer"
                style={{
                  background: "rgba(10,14,30,0.9)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(0,212,184,0.2)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,184,0.08)",
                }}
              >
                <div className="flex -space-x-2">
                  {members?.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                      style={{ border: "2px solid rgba(10,14,30,0.9)", background: "rgba(0,212,184,0.15)" }}
                      title={m.name}
                    >
                      {m.photoURL ? (
                        <Image src={m.photoURL} alt={m.name} width={32} height={32} className="object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-primary">{m.name?.[0]}</span>
                      )}
                    </div>
                  ))}
                  {(members?.length || 0) > 4 && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ border: "2px solid rgba(10,14,30,0.9)", background: "rgba(255,255,255,0.08)", color: "white" }}>
                      +{members!.length - 4}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Live</p>
                  </div>
                  <p className="text-xs font-headline font-bold text-white">{displayCode}</p>
                </div>
              </div>
            </button>
          </div>
          <RoomChat roomId={userData.activeCollabRoomId} />
        </>
      )}

      {/* Member list dialog */}
      <Dialog open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
        <DialogContent
          className="sm:max-w-md rounded-3xl border-none"
          style={{
            background: "rgba(10,14,30,0.97)",
            backdropFilter: "blur(30px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          }}
        >
          <div className="h-0.5 w-full -mt-6 mb-6" style={{ background: "linear-gradient(90deg, #00D4B8, #7B61FF, #F5A623)" }} />
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,212,184,0.12)", border: "1px solid rgba(0,212,184,0.2)" }}>
                <Users className="w-5 h-5 text-primary" />
              </div>
              Room Members
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Active explorers in room <span className="font-bold text-accent">{displayCode}</span>
            </p>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-hide py-2">
            {members?.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-2xl transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(0,212,184,0.1)", border: "1px solid rgba(0,212,184,0.15)" }}>
                    {m.photoURL ? (
                      <Image src={m.photoURL} alt={m.name} width={40} height={40} className="object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{m.name?.[0] || "U"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      {m.name}
                      {m.id === user?.uid && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,184,0.12)", border: "1px solid rgba(0,212,184,0.2)", color: "#00D4B8" }}>You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(m.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00D4B8", boxShadow: "0 0 8px rgba(0,212,184,0.6)" }} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Button variant="ghost" className="flex-1 h-11 rounded-2xl" onClick={() => setIsMemberListOpen(false)}>Close</Button>
            <Button
              className="h-11 px-6 rounded-2xl font-bold gap-2"
              style={{ background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", color: "hsl(222 47% 9%)" }}
              onClick={copyCode}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 pt-10 pb-28 relative z-10">
        {!userData?.activeCollabRoomId ? (
          /* ── No room: entry screens ─────────────────────────────── */
          <div className="max-w-2xl mx-auto space-y-14 py-8">
            <div className="text-center space-y-5 animate-fade-in">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto animate-float-slow"
                style={{ background: "linear-gradient(135deg, rgba(0,212,184,0.2), rgba(123,97,255,0.1))", border: "1px solid rgba(0,212,184,0.3)", boxShadow: "0 0 50px rgba(0,212,184,0.2)" }}
              >
                <Users className="text-primary w-12 h-12" />
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-white">Plan Together.</h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                Create a live session and invite your travel crew to brainstorm in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create */}
              <div
                className="p-7 rounded-3xl space-y-5 transition-all duration-300 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, rgba(0,212,184,0.07) 0%, rgba(10,14,30,0.7) 100%)", border: "1px solid rgba(0,212,184,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,212,184,0.12)", border: "1px solid rgba(0,212,184,0.2)" }}>
                  <Plus className="text-primary w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-white mb-1">Start New Session</h3>
                  <p className="text-sm text-muted-foreground">Generate a private room code and invite your crew.</p>
                </div>
                <Button
                  className="btn-shimmer w-full h-12 rounded-2xl font-bold gap-2"
                  onClick={handleCreateRoom}
                  disabled={isJoining}
                  style={{ background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", color: "hsl(222 47% 9%)", boxShadow: "0 0 20px rgba(0,212,184,0.3)" }}
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  Create Room
                </Button>
              </div>

              {/* Join */}
              <div
                className="p-7 rounded-3xl space-y-5 transition-all duration-300 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, rgba(123,97,255,0.07) 0%, rgba(10,14,30,0.7) 100%)", border: "1px solid rgba(123,97,255,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(123,97,255,0.12)", border: "1px solid rgba(123,97,255,0.2)" }}>
                  <Hash className="text-purple-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-headline font-bold text-white mb-1">Join Existing Room</h3>
                  <p className="text-sm text-muted-foreground">Enter a code shared by your travel partner.</p>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. A7B2X)"
                    className="w-full h-12 px-4 rounded-2xl text-sm font-bold uppercase text-center text-white placeholder:text-muted-foreground/60 outline-none transition-all duration-200 tracking-widest"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(123,97,255,0.4)"; }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
                  />
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-bold gap-2"
                    style={{ background: "rgba(123,97,255,0.1)", border: "1px solid rgba(123,97,255,0.25)", color: "#a78bfa" }}
                    onClick={handleJoinRoom}
                    disabled={isJoining || !roomCode}
                  >
                    {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Join Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── In room: brainstorm view ────────────────────────────── */
          <div className="space-y-12">
            {/* Room header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className="text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest"
                    style={{ background: "rgba(0,212,184,0.1)", border: "1px solid rgba(0,212,184,0.2)", color: "#00D4B8" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
                    {members?.length || 0} Online
                  </Badge>
                  <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
                    Code: <span className="font-bold text-accent">{displayCode}</span>
                    {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-white">Group Brainstorm</h2>
              </div>
              <div className="flex gap-3">
                <Link href="/plan/new?collab=true">
                  <Button
                    className="btn-shimmer h-11 px-6 rounded-2xl font-bold gap-2"
                    style={{ background: "linear-gradient(135deg, hsl(172 100% 42%), hsl(172 100% 35%))", color: "hsl(222 47% 9%)", boxShadow: "0 0 16px rgba(0,212,184,0.3)" }}
                  >
                    <Plus className="w-4 h-4" /> Add Room Trip
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="h-11 px-4 rounded-2xl gap-2 font-bold"
                  style={{ color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  onClick={handleLeaveRoom}
                >
                  <LogOut className="w-4 h-4" /> Leave
                </Button>
              </div>
            </div>

            {/* Trips grid */}
            <div className="space-y-12">
              {Object.keys(groupedTrips).length > 0 ? (
                Object.entries(groupedTrips).map(([userName, trips]: [string, any]) => (
                  <div key={userName} className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #00D4B8, #7B61FF)" }} />
                      <h3 className="text-lg font-bold text-white">{userName}&apos;s Ideas</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {trips.map((trip: any) => (
                        <Link key={trip.id} href={`/trip/${trip.id}`}>
                          <div
                            className="p-5 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                            style={{ background: "linear-gradient(135deg, rgba(0,212,184,0.05) 0%, rgba(10,14,30,0.7) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-bold text-white">{trip.destination}</h4>
                              <span className="text-[9px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(0,212,184,0.1)", color: "#00D4B8", border: "1px solid rgba(0,212,184,0.2)" }}>
                                {trip.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-accent" />{trip.destination}</span>
                              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" />AI Plan Ready</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className="py-24 text-center rounded-3xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
                >
                  <Sparkles className="w-12 h-12 mx-auto mb-5 animate-pulse" style={{ color: "rgba(0,212,184,0.4)" }} />
                  <h3 className="text-xl font-headline font-bold mb-3 text-white">No Room Trips Yet</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Any trip created while in this room will appear here for everyone.</p>
                  <Link href="/plan/new?collab=true">
                    <Button
                      className="h-12 px-8 rounded-2xl font-bold"
                      style={{ background: "rgba(0,212,184,0.12)", border: "1px solid rgba(0,212,184,0.25)", color: "#00D4B8" }}
                    >
                      <Plus className="mr-2 w-4 h-4" /> Create Room Idea
                    </Button>
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
