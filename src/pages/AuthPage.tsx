import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        // Check if user has completed onboarding (has an organisation)
        const { data: org } = await supabase
          .from("organisations")
          .select("id")
          .limit(1)
          .maybeSingle();
        navigate(org ? "/dashboard" : "/onboarding");
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Check your email to confirm your account, then sign in.");
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm";
  const labelClass = "block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2";

  return (
    <div>
      <section className="pt-32 pb-20 min-h-screen">
        <div className="container-main max-w-[420px]">
          <div className="text-center mb-8">
            <Link to="/" className="font-display font-extrabold text-2xl flex items-center gap-2 justify-center mb-6">
              <div className="w-5 h-5 bg-primary rounded-md" />
              PayNudge
            </Link>
            <h1 className="font-display text-3xl font-bold mb-2">
              {mode === "login" ? "Welcome back" : "Get started free"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Sign in to your PayNudge account" : "Create your PayNudge account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-7 space-y-4">
            {mode === "signup" && (
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
              </div>
            )}
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              {mode === "login" && (
                <Link to="/forgot-password" className="text-xs text-primary font-bold mt-1.5 inline-block hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">{error}</div>}
            {success && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-md p-3">{success}</div>}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-md font-bold text-sm bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all disabled:opacity-50">
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create free account"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>Don't have an account? <button type="button" onClick={() => setMode("signup")} className="text-primary font-bold bg-transparent">Sign up free</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => setMode("login")} className="text-primary font-bold bg-transparent">Sign in</button></>
              )}
            </p>
          </form>

          <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-6">
            <span>✓ No credit card required</span>
            <span>✓ Free plan available</span>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AuthPage;
