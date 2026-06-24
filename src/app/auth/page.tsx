"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Mail, Lock, Loader2, AlertCircle, ChevronLeft, User, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111415]">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4"
      >
        <source
          src="/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradient overlays - matching homepage style */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111415]/80 via-[#111415]/60 to-[#111415]/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#111415]/40 via-transparent to-[#111415]/40" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-[100px] pointer-events-none" />

      {/* Back button */}
      <NextLink
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </NextLink>

      {/* Config error */}
      {configError && (
        <Alert variant="destructive" className="absolute top-20 left-1/2 -translate-x-1/2 z-20 max-w-md bg-destructive/20 border-destructive/30 backdrop-blur-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">{configError}</AlertDescription>
        </Alert>
      )}

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="relative">
          {/* Glow behind card */}
          <div className="absolute -inset-4 rounded-3xl bg-blue-500/5 blur-[60px]" />

          <div className="relative glass-panel rounded-3xl border border-white/10 backdrop-blur-2xl overflow-hidden">
            {/* Top gradient line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-blue-500/0 via-blue-400 to-blue-500/0" />

            <div className="p-8 md:p-10">
              {/* Logo & Brand */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/20 mb-5">
                  <Compass className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-headline font-bold text-white mb-1">
                  VOYIQ
                </h1>
                <p className="text-sm text-white/40">
                  Sign in to continue your journey
                </p>
              </div>

              <Tabs defaultValue="google" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border border-white/10 rounded-xl p-1">
                  <TabsTrigger value="google" className="rounded-lg font-semibold text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none text-white/50">Google</TabsTrigger>
                  <TabsTrigger value="email" className="rounded-lg font-semibold text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none text-white/50">Email</TabsTrigger>
                </TabsList>

                {/* Google tab */}
                <TabsContent value="google" className="space-y-4 animate-fade-in">
                  <Button
                    variant="outline"
                    className="w-full h-12 flex gap-3 text-sm rounded-xl font-medium bg-white/5 border-white/10 hover:bg-white/10 text-white"
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
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-9 bg-white/5 border border-white/10 rounded-xl p-1">
                      <TabsTrigger value="login" className="text-xs rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none text-white/50">Log In</TabsTrigger>
                      <TabsTrigger value="signup" className="text-xs rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-none text-white/50">Sign Up</TabsTrigger>
                    </TabsList>

                    <div className="space-y-4">
                      <TabsContent value="signup" className="space-y-4 mt-0">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <TabsContent value="login" className="mt-0">
                        <Button
                          className="w-full h-12 rounded-xl font-bold mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20"
                          onClick={() => handleEmailAuth(false)}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Sign In"}
                        </Button>
                      </TabsContent>
                      <TabsContent value="signup" className="mt-0">
                        <Button
                          className="w-full h-12 rounded-xl font-bold mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20"
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

              <p className="text-[11px] text-white/25 text-center mt-6 px-4 leading-relaxed">
                By continuing, you agree to VOYIQ&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom decorative text */}
        <p className="text-center text-[11px] text-white/20 mt-6 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" />
          AI-powered travel planning for the modern voyager
        </p>
      </div>
    </div>
  );
}
