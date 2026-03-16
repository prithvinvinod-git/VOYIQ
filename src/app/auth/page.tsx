"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Mail, Phone, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && auth && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        setRecaptchaVerifier(verifier);
      } catch (e) {
        console.error("Recaptcha init failed:", e);
      }
    }
  }, [auth, recaptchaVerifier]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setConfigError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: "Welcome aboard!",
        description: "You've successfully signed in with Google.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      if (error.code === "auth/operation-not-allowed") {
        setConfigError("Google sign-in is not enabled in your Firebase Console. Please enable it under Authentication > Sign-in method.");
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message || "An unexpected error occurred during Google sign-in.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (isSignUp: boolean) => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing fields", description: "Email and password are required." });
      return;
    }
    setLoading(true);
    setConfigError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account created!", description: "Welcome to VOYIQ." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "Successfully signed in." });
      }
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code === "auth/operation-not-allowed") {
        setConfigError("Email/Password sign-in is not enabled in your Firebase Console.");
      } else {
        toast({
          variant: "destructive",
          title: "Auth failed",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Error", description: "Enter a valid phone number with country code (e.g., +1...)." });
      return;
    }
    if (!recaptchaVerifier) {
      toast({ variant: "destructive", title: "Error", description: "Recaptcha not initialized. Please refresh." });
      return;
    }

    setLoading(true);
    setConfigError(null);
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      toast({ title: "Code sent!", description: "Check your phone for the verification code." });
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      if (error.code === "auth/operation-not-allowed") {
        setConfigError("Phone sign-in is not enabled in your Firebase Console.");
      } else {
        toast({ variant: "destructive", title: "Phone auth failed", description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      toast({ title: "Success!", description: "Phone verified successfully." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification failed", description: "Invalid code. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.1),transparent_50%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_70%,hsl(var(--accent)/0.05),transparent_50%)]" />

      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md space-y-4">
        {configError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription className="text-xs">
              {configError}
            </AlertDescription>
          </Alert>
        )}

        <Card className="glass-card border-none">
          <CardHeader className="text-center">
            <Link href="/" className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Compass className="text-primary-foreground w-8 h-8" />
              </div>
            </Link>
            <CardTitle className="text-3xl font-headline font-bold">Get Started</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Sign in or create an account to start your journey.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs defaultValue="google" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/5 border border-white/10 p-1">
                <TabsTrigger value="google">Google</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="google" className="space-y-4 animate-fade-in">
                <Button 
                  variant="outline" 
                  className="w-full h-14 flex gap-3 text-base border-white/10 hover:bg-white/5 transition-all"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="pl-10 h-12 bg-white/5 border-white/10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 h-12 bg-white/5 border-white/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5" onClick={() => handleEmailAuth(false)} disabled={loading}>
                    Sign In
                  </Button>
                  <Button className="h-12 bg-primary text-primary-foreground" onClick={() => handleEmailAuth(true)} disabled={loading}>
                    Sign Up
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 animate-fade-in">
                {!confirmationResult ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+1 234 567 8900" 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button className="w-full h-12 bg-primary text-primary-foreground" onClick={handlePhoneSignIn} disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                      Send OTP
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input 
                        id="code" 
                        placeholder="6-digit code" 
                        className="h-12 bg-white/5 border-white/10 text-center text-lg tracking-widest"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                    </div>
                    <Button className="w-full h-12 bg-primary text-primary-foreground" onClick={handleVerifyCode} disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Verify & Continue"}
                    </Button>
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setConfirmationResult(null)}>
                      Try a different number
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 text-center">
            <p className="text-xs text-muted-foreground px-6">
              By continuing, you agree to VOYIQ's <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}