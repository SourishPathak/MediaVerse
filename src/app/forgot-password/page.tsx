
"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/firebase";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Uplink Transmitted",
        description: "Check your email for recovery instructions.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Transmission Error",
        description: error.message || "Could not send recovery link.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-10" />
      
      <GlassCard className="w-full max-w-md p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary items-center justify-center shadow-[0_0_30px_rgba(190,123,241,0.4)] mb-4">
            <Film className="text-white w-8 h-8" />
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-glow">Vault Recovery</h1>
          <p className="text-muted-foreground">Restore access to your media archives.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="explorer@mediaverse.io" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 rounded-xl h-12"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80 font-bold gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Recovery Link <Send className="w-4 h-4" /></>}
          </Button>
        </form>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
