
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Mail, Lock, Loader2, AlertCircle, ChevronLeft, User } from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function FloatingParticle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none bg-primary/40"
      style={{
        width: 3,
        height: 3,
        ...style,
      }}
    />
  );
}

function OrbRing({ size, delay }: { size: number; delay: string }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none border border-border/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: size,
        height: size,
        animation: `spin-slow ${16 + size / 60}s linear infinite`,
        animationDelay: delay,
      }}
    />
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [configError, setConfigError] = useState<string | null>(null);

  const syncUserToFirestore = async (user: any, displayName?: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, "users", user.uid);
    await setDoc(
      userRef,
      {
        id: user.uid,
        name: displayName || user.displayName || "Explorer",
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setConfigError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
      toast({ title: "Welcome aboard!", description: "You've successfully signed in with Google." });
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
        setLoading(false);
        return;
      }
      if (error.code === "auth/operation-not-allowed") {
        setConfigError("Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.");
      } else if (error.message?.includes("projectconfigservice") || error.code === "auth/unauthorized-domain") {
        setConfigError("API Restriction Error: Please ensure the 'Identity Toolkit API' is enabled in your Google Cloud Console.");
      } else {
        toast({ variant: "destructive", title: "Sign in failed", description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (!email || !password || (isSignUp && !name)) {
      toast({ variant: "destructive", title: "Missing fields", description: "All fields are required." });
      return;
    }
    setLoading(true);
    setConfigError(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await syncUserToFirestore(userCredential.user, name);
        toast({ title: "Account created!", description: "Welcome to VOYIQ." });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(result.user);
        toast({ title: "Welcome back!", description: "Successfully signed in." });
      }
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden relative bg-background">
      {/* LEFT: Visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-muted/50 border-r border-border">
        {/* Orbital rings */}
        {[200, 320, 440, 560].map((s, i) => (
          <OrbRing key={i} size={s} delay={`${i * -3}s`} />
        ))}

        {/* Center globe */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-8 bg-primary/10 border border-primary/20">
            <Compass className="w-16 h-16 text-primary" />
          </div>

          <h2 className="text-4xl font-headline font-extrabold text-foreground mb-3 tracking-tight text-center">
            VOYIQ
          </h2>
          <p className="text-muted-foreground text-center max-w-xs leading-relaxed">
            Sophisticated AI travel planning for the modern voyager.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 mt-10">
            {["AI-Crafted Itineraries", "Real-time Budget Sync", "Collaborative Planning"].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-3 bg-muted/30 border border-border rounded-full px-5 py-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-sm font-medium text-muted-foreground">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating particles */}
        {[...Array(14)].map((_, i) => (
          <FloatingParticle
            key={i}
            style={{
              left: `${5 + i * 7}%`,
              top: `${15 + (i % 5) * 16}%`,
              animation: `particle-float ${4 + (i % 3) * 2}s ease-in-out ${i * -0.5}s infinite`,
              opacity: 0.5 + (i % 3) * 0.15,
              background: i % 3 === 0 ? "hsl(var(--primary) / 0.8)" : i % 3 === 1 ? "hsl(var(--accent) / 0.7)" : "hsl(var(--primary) / 0.6)",
              width: i % 4 === 0 ? 4 : 2,
              height: i % 4 === 0 ? 4 : 2,
            }}
          />
        ))}
      </div>

      {/* RIGHT: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md space-y-5 relative z-10">
          <NextLink
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </NextLink>

          {configError && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Required</AlertTitle>
              <AlertDescription className="text-xs leading-relaxed">{configError}</AlertDescription>
            </Alert>
          )}

          {/* Auth card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Top gradient bar */}
            <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 h-0.5 w-full" />

            <div className="p-8">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground">
                    <Compass className="w-8 h-8" />
                  </div>
                </div>
                <h1 className="text-3xl font-headline font-bold text-foreground">Get Started</h1>
                <p className="text-muted-foreground mt-2 text-sm">Sign in or create an account to begin your journey.</p>
              </div>

              <Tabs defaultValue="google" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 border border-border rounded-xl p-1">
                  <TabsTrigger value="google" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Google</TabsTrigger>
                  <TabsTrigger value="email" className="rounded-lg font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">Email</TabsTrigger>
                </TabsList>

                {/* Google tab */}
                <TabsContent value="google" className="space-y-4 animate-fade-in">
                  <Button
                    variant="outline"
                    className="w-full h-14 flex gap-3 text-base rounded-2xl font-medium bg-muted/50 border-border hover:bg-muted/80"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                </TabsContent>

                {/* Email tab */}
                <TabsContent value="email" className="space-y-4 animate-fade-in">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-9 bg-muted/50 border border-border rounded-xl p-1">
                      <TabsTrigger value="login" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Log In</TabsTrigger>
                      <TabsTrigger value="signup" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                    </TabsList>

                    <div className="space-y-4">
                      <TabsContent value="signup" className="space-y-4 mt-0">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              className="pl-11 h-12 rounded-xl bg-muted/50 border border-border"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-11 h-12 rounded-xl bg-muted/50 border border-border"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-11 h-12 rounded-xl bg-muted/50 border border-border"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <TabsContent value="login" className="mt-0">
                        <Button
                          className="w-full h-12 rounded-xl font-bold mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleEmailAuth(false)}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Sign In"}
                        </Button>
                      </TabsContent>
                      <TabsContent value="signup" className="mt-0">
                        <Button
                          className="w-full h-12 rounded-xl font-bold mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleEmailAuth(true)}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Create Account"}
                        </Button>
                      </TabsContent>
                    </div>
                  </Tabs>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-muted-foreground text-center mt-6 px-4 leading-relaxed">
                By continuing, you agree to VOYIQ&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
