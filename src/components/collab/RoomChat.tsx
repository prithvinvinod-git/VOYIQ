
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Users } from "lucide-react";
import { useCollection, useMemoFirebase, useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

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
    <>
      {/* Centered Chat Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl glass-card border-primary/20 shadow-2xl flex flex-col h-[600px] max-h-[85vh]">
            <CardHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-headline font-bold">Group Brainstorm</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Room: {roomId}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 rounded-full h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
              {messages?.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                  <MessageSquare className="w-16 h-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">Coordinate your refined journey here.</p>
                </div>
              )}
              {messages?.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    {msg.senderId !== user?.uid && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{msg.senderName}</span>
                    )}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-md transition-all ${
                    msg.senderId === user?.uid 
                    ? 'bg-primary text-primary-foreground rounded-br-none font-medium' 
                    : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </CardContent>

            <CardFooter className="p-6 border-t border-white/5 bg-white/5">
              <div className="flex w-full gap-3">
                <Input 
                  placeholder="Type a message to the group..." 
                  className="bg-background/50 border-white/10 h-14 rounded-2xl px-6 text-sm"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button 
                  size="icon" 
                  className="bg-primary hover:bg-primary/90 flex-shrink-0 w-14 h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95" 
                  onClick={handleSend}
                >
                  <Send className="w-5 h-5 text-primary-foreground" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Floating Chat Trigger - Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button 
            size="lg" 
            className="rounded-full w-20 h-20 shadow-2xl shadow-primary/30 bg-primary text-primary-foreground hover:bg-primary/90 flex flex-col gap-1 items-center justify-center p-0 border-4 border-background group transition-all hover:scale-105 active:scale-95"
            onClick={() => setIsOpen(true)}
          >
            <div className="relative">
              <MessageSquare className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full border-2 border-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Chat</span>
          </Button>
        </div>
      )}
    </>
  );
}
