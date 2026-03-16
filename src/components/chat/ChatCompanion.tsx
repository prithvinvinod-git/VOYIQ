
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Sparkles, Brain } from "lucide-react";
import { provideAIChatAssistance } from "@/ai/flows/provide-ai-chat-assistance-flow";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function ChatCompanion({ tripData }: { tripData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your AI Travel Brain. How can I help you with your trip to " + (tripData?.destination || "your destination") + "?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await provideAIChatAssistance({
        tripId: tripData.id,
        tripContext: {
          destination: tripData.destination,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          budget: { total: tripData.totalBudget, currency: tripData.currency },
          travelStyle: tripData.travelStyle,
          pace: tripData.pace,
          dietPref: tripData.dietaryPreferences[0]
        },
        itinerarySummary: "Multiple day trip to " + tripData.destination,
        currentDate: new Date().toISOString().split('T')[0],
        chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
        remainingBudget: tripData.totalBudget // Simplification
      });

      setMessages(prev => [...prev, { role: 'model', content: response.response }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 glass-card border-primary/20 shadow-2xl animate-fade-in flex flex-col h-[500px]">
          <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <CardTitle className="text-sm font-headline">AI Travel Brain</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-none' 
                  : 'bg-white/10 text-white rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl px-4 py-2 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-white/5">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Ask anything..." 
                className="bg-white/5 border-white/10 text-xs h-10"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" className="bg-primary hover:bg-primary/90 flex-shrink-0" onClick={handleSend} disabled={loading}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          size="lg" 
          className="rounded-full w-16 h-16 shadow-2xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 flex flex-col gap-1 items-center justify-center p-0"
          onClick={() => setIsOpen(true)}
        >
          <Brain className="w-8 h-8" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Ask AI</span>
        </Button>
      )}
    </div>
  );
}
