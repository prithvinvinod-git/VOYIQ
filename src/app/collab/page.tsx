
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message || "Failed to leave room." }); }
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
    <div className="min-h-screen bg-[#111415] relative overflow-hidden">
      {/* Video background with reduced opacity */}
      <div className="absolute top-0 left-0 w-full h-[55vh] overflow-hidden pointer-events-none z-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover object-top opacity-30">
          <source src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              transparent 0%,
              transparent 25%,
              rgba(17,20,21,0.08) 40%,
              rgba(17,20,21,0.2) 55%,
              rgba(17,20,21,0.5) 70%,
              rgba(17,20,21,0.75) 82%,
              #111415 92%,
              #111415 100%
            )`,
          }}
        />
      </div>
      <AppNavbar />

      {/* Floating live room indicator */}
      {userData?.activeCollabRoomId && (
        <>
          <div className="fixed top-20 right-4 z-40 flex flex-col items-end gap-2 animate-fade-in">
            <button onClick={() => setIsMemberListOpen(true)} className="hover:scale-105 transition-transform active:scale-95">
              <div className="p-3 rounded-2xl flex items-center gap-3 cursor-pointer glass-panel border-blue-500/20">
                <div className="flex -space-x-2">
                  {members?.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary/10 border-2 border-card"
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold bg-muted/50 border-2 border-card text-muted-foreground">
                      +{members!.length - 4}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Live</p>
                  </div>
                  <p className="text-xs font-headline font-bold text-foreground">{displayCode}</p>
                </div>
              </div>
            </button>
          </div>
          <RoomChat roomId={userData.activeCollabRoomId} />
        </>
      )}

      {/* Member list dialog */}
      <Dialog open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border rounded-2xl">
          <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 h-0.5 w-full" />
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
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
                className="flex items-center justify-between p-3 rounded-2xl transition-all duration-200 bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-primary/10 border border-primary/20">
                    {m.photoURL ? (
                      <Image src={m.photoURL} alt={m.name} width={40} height={40} className="object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{m.name?.[0] || "U"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      {m.name}
                      {m.id === user?.uid && (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(m.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full animate-pulse bg-primary" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="ghost" className="flex-1 h-11 rounded-2xl" onClick={() => setIsMemberListOpen(false)}>Close</Button>
            <Button
              className="h-11 px-6 rounded-2xl font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={copyCode}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-grow relative z-10 px-4 md:px-8 pt-20">
        {!userData?.activeCollabRoomId ? (
          /* ── No room: entry screens ─────────────────────────────── */
          <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Create */}
            <div className="rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-500 group"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.5), 0 0 15px rgba(59,130,246,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="mb-6 p-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <Radio className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-headline font-bold text-white mb-3">Start New Session</h2>
              <p className="text-sm text-white/60 mb-8 max-w-[240px]">Initialize a private workspace and invite your crew to co-create in real-time.</p>
              <Button
                className="w-full mt-auto h-12 rounded-xl font-bold gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                onClick={handleCreateRoom}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Radio className="w-4 h-4" /> Create Room</>}
              </Button>
            </div>

            {/* Join */}
            <div className="rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-500 group"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px -15px rgba(0,0,0,0.5), 0 0 15px rgba(59,130,246,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="mb-6 p-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <Hash className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-headline font-bold text-white mb-3">Join Existing Room</h2>
              <p className="text-sm text-white/60 mb-8 max-w-[240px]">Enter a session code to join an active exploration hub with your team.</p>
              <div className="w-full mb-4">
                <div className="relative rounded-xl border border-white/10 bg-white/5 transition-all focus-within:border-blue-500/50">
                  <Input
                    type="text"
                    placeholder="Enter room code..."
                    className="w-full bg-transparent border-none py-4 px-6 text-white placeholder:text-white/40 text-sm text-center tracking-widest uppercase font-bold"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-bold gap-2 border border-white/20 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm"
                onClick={handleJoinRoom}
                disabled={isJoining || !roomCode}
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Join Session</>}
              </Button>
            </div>
          </div>
        </div>
        ) : (
          /* ── In room: brainstorm view ────────────────────────────── */
          <div className="space-y-10 w-full max-w-5xl mx-auto pt-16 pb-12">
            {/* Room header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-1.5" />
                    {members?.length || 0} Online
                  </Badge>
                  <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                    Code: <span className="font-bold text-blue-400">{displayCode}</span>
                    {copied ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-white">Group Brainstorm</h2>
              </div>
              <div className="flex gap-3">
                <Link href="/plan/new?collab=true">
                  <Button className="h-11 px-6 rounded-xl font-bold gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4" /> Add Room Trip
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="h-11 px-4 rounded-xl gap-2 font-bold text-red-400 border border-red-400/30 hover:bg-red-500/10"
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
                      <div className="bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 h-1 w-10 rounded-full" />
                      <h3 className="text-lg font-bold text-white/80">{userName}&apos;s Ideas</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {trips.map((trip: any) => (
                        <Link key={trip.id} href={`/trip/${trip.id}`}>
                          <div className="p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(59,130,246,0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-bold text-white">{trip.destination}</h4>
                              <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {trip.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400" />{trip.destination}</span>
                              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-cyan-400" />AI Plan Ready</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px dashed rgba(255,255,255,0.15)' }}
                >
                  <Sparkles className="w-12 h-12 mx-auto mb-5 text-blue-400/40" />
                  <h3 className="text-xl font-headline font-bold mb-3 text-white">No Room Trips Yet</h3>
                  <p className="text-white/50 mb-8 max-w-sm mx-auto">Any trip created while in this room will appear here for everyone.</p>
                  <Link href="/plan/new?collab=true">
                    <Button className="h-12 px-8 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
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
