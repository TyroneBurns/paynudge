import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any | null;
  subscription: { subscribed: boolean; product_id: string | null; subscription_end: string | null } | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<AuthContextType["subscription"]>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    setProfile(data);
    // Use profile subscription_status as immediate source of truth
    if (data?.subscription_status === "active") {
      setSubscription(prev => prev?.subscribed ? prev : { subscribed: true, product_id: null, subscription_end: data.subscription_end });
    }
  };

  const refreshSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      console.log("[PayNudge] check-subscription response:", { data, error });
      if (!error && data && typeof data.subscribed === "boolean") {
        setSubscription(data);
      } else {
        // Fallback: check profile subscription_status from DB
        console.warn("[PayNudge] Edge function failed, falling back to profile:", error);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("subscription_status, subscription_end").eq("user_id", user.id).single();
          if (profileData?.subscription_status === "active") {
            setSubscription({ subscribed: true, product_id: null, subscription_end: profileData.subscription_end });
          }
        }
      }
    } catch (e) {
      console.error("Subscription check failed:", e);
    }
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          refreshSubscription();
        }, 0);
      } else {
        setProfile(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        refreshSubscription();
      }
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  // Refresh subscription periodically, and aggressively after checkout
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const isPostCheckout = params.get("checkout") === "success";

    if (isPostCheckout) {
      let attempts = 0;
      const fast = setInterval(async () => {
        attempts++;
        await refreshSubscription();
        if (subscription?.subscribed) {
          clearInterval(fast);
          // Fire confetti celebration
          const end = Date.now() + 2500;
          const fire = () => {
            confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors: ["#10b981", "#34d399", "#6ee7b7", "#ffffff"] });
            if (Date.now() < end) requestAnimationFrame(fire);
          };
          fire();
          toast.success("🎉 Welcome to PayNudge Paid!", {
            description: "Your subscription is now active. Enjoy all premium features!",
            duration: 6000,
          });
          const url = new URL(window.location.href);
          url.searchParams.delete("checkout");
          window.history.replaceState({}, "", url.pathname);
        } else if (attempts >= 20) {
          clearInterval(fast);
          toast.info("Subscription is being processed", {
            description: "It may take a moment to activate. We'll update your status automatically.",
          });
          const url = new URL(window.location.href);
          url.searchParams.delete("checkout");
          window.history.replaceState({}, "", url.pathname);
        }
      }, 3000);
      return () => clearInterval(fast);
    }

    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, subscription?.subscribed]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, subscription, signUp, signIn, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};
