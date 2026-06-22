
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Brain, X, Send, Sparkles, Minimize2, MessageCircle } from "lucide-react";
import { provideAIChatAssistance } from "@/ai/flows/provide-ai-chat-assistance-flow";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "model";
  content: string;
}

export function ChatCompanion({ tripData }: { tripData: any }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hi! I'm your AI Travel Brain. Ask me anything about ${tripData?.destination || "your trip"} — local tips, food, transport, or cost saving ideas.`,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const idToken = (await auth.currentUser?.getIdToken()) || "";
      const response = await provideAIChatAssistance({
        idToken,
        tripId: tripData.id,
        tripContext: {
          destination: tripData.destination,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          budget: { total: tripData.totalBudget, currency: tripData.currency },
          travelStyle: tripData.travelStyle,
          pace: tripData.pace,
          dietPref: tripData.dietaryPreferences?.[0],
        },
        itinerarySummary: "Multi-day trip to " + tripData.destination,
        currentDate: new Date().toISOString().split("T")[0],
        chatHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        remainingBudget: tripData.totalBudget,
      });
      setMessages((prev) => [...prev, { role: "model", content: response.response }]);
    } catch (e) {
      toast({ variant: "destructive", title: "Chat Error", description: "Failed to get AI response." });
      setMessages((prev) => [...prev, { role: "model", content: "Sorry, I ran into an issue. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, tripData, auth]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div
          className="w-80 md:w-96 h-[480px] flex flex-col animate-scale-in bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary"
              >
                <Brain className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">AI Travel Brain</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-white transition-colors bg-muted"
              aria-label="Close chat"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "model" && (
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 bg-muted border border-border"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-foreground border border-border"}`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start items-end gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-muted border border-border"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                </div>
                <div
                  className="flex gap-1.5 px-4 py-3 rounded-2xl bg-muted border border-border"
                >
                  {[0, 0.2, 0.4].map((delay, j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div
            className="px-4 py-4 shrink-0 border-t border-border"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything about your trip..."
                className="flex-1 h-11 px-4 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 bg-muted border border-border focus:ring-2 focus:ring-ring"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 bg-primary text-primary-foreground"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? "bg-card border border-border" : "bg-primary text-primary-foreground"}`}
        aria-label="Toggle AI chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <>
            <Brain className="w-7 h-7 text-primary-foreground" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-primary-foreground/90">Brain</span>
          </>
        )}
      </button>
    </div>
  );
}
