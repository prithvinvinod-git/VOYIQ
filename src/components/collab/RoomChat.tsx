
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Users, Sparkles } from "lucide-react";
import { useCollection, useMemoFirebase, useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

interface RoomChatProps {
  roomId: string;
}

export function RoomChat({ roomId }: RoomChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const { user } = useUser();
  const firestore = useFirestore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(
      collection(firestore, `collabRooms/${roomId}/messages`),
      orderBy("createdAt", "asc")
    );
  }, [firestore, roomId]);

  const { data: messages } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!text.trim() || !user || !firestore) return;
    
    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || "Explorer",
      senderPhoto: user.photoURL,
      text: text.trim(),
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, `collabRooms/${roomId}/messages`), messageData);
    setText("");
  };

  if (!roomId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 glass-card border-accent/20 shadow-2xl animate-fade-in flex flex-col h-[500px]">
          <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between bg-accent/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                <Users className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-headline font-bold">Room Chat</CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Room: {roomId}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" ref={scrollRef}>
            {messages?.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <MessageSquare className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Start the conversation</p>
              </div>
            )}
            {messages?.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {msg.senderId !== user?.uid && (
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{msg.senderName}</span>
                  )}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  msg.senderId === user?.uid 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="p-4 border-t border-white/5 bg-white/5">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Type a message..." 
                className="bg-background/50 border-white/10 text-xs h-11 rounded-xl"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" className="bg-accent hover:bg-accent/90 flex-shrink-0 w-11 h-11 rounded-xl shadow-lg shadow-accent/20" onClick={handleSend}>
                <Send className="w-4 h-4 text-accent-foreground" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          size="lg" 
          className="rounded-full w-16 h-16 shadow-2xl shadow-accent/30 bg-accent text-accent-foreground hover:bg-accent/90 flex flex-col gap-1 items-center justify-center p-0 border-4 border-background group"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative">
            <MessageSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-accent" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Chat</span>
        </Button>
      )}
    </div>
  );
}
