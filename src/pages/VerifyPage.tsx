import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Check, AlertTriangle } from "lucide-react";

type Status = "loading" | "success" | "error";

const VerifyPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    // Check if this is a password recovery flow
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      navigate("/reset-password" + hash, { replace: true });
      return;
    }

    const verify = async () => {
      // Supabase auto-exchanges the token from the URL hash on getSession
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Check if user has an organisation (returning user) or needs onboarding (new user)
        const { data: org } = await supabase.from("organisations").select("id").eq("user_id", session.user.id).limit(1).maybeSingle();
        const dest = org ? "/dashboard" : "/onboarding";
        setStatus("success");
        setTimeout(() => navigate(dest, { replace: true }), 2000);
      } else {
        // Wait a bit and retry — token exchange can be async
        await new Promise(r => setTimeout(r, 3000));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          const { data: org } = await supabase.from("organisations").select("id").eq("user_id", retrySession.user.id).limit(1).maybeSingle();
          const dest = org ? "/dashboard" : "/onboarding";
          setStatus("success");
          setTimeout(() => navigate(dest, { replace: true }), 2000);
        } else {
          setStatus("error");
        }
      }
    };

    verify();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-20">
      <div className="text-center max-w-md mx-auto px-6">
        {status === "loading" && (
          <div className="space-y-4">
            <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground text-sm">Verifying your email…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-5 animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Email verified!</h1>
            <p className="text-muted-foreground text-sm">Setting things up for you…</p>
            <div className="w-48 h-1.5 bg-surface rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_forwards]" />
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5 animate-fade-up">
            <div className="w-20 h-20 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold">Verification link expired</h1>
            <p className="text-muted-foreground text-sm">This link may have already been used or has expired. Please sign in again.</p>
            <a href="/auth" className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all">
              Sign in instead
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default VerifyPage;
