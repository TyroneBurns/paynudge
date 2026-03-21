import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery (handles page refresh)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    }
    setLoading(false);
  };

  const inputClass =
    "w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm";
  const labelClass =
    "block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2";

  return (
    <div>
      <section className="pt-32 pb-20 min-h-screen">
        <div className="container-main max-w-[420px]">
          <div className="text-center mb-8">
            <Link to="/" className="font-display font-extrabold text-2xl flex items-center gap-2 justify-center mb-6">
              <div className="w-5 h-5 bg-primary rounded-md" />
              PayNudge
            </Link>
            <h1 className="font-display text-3xl font-bold mb-2">Set new password</h1>
            <p className="text-muted-foreground text-sm">Enter your new password below</p>
          </div>

          {!isRecovery ? (
            <div className="bg-surface border border-border rounded-lg p-7 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                This link is invalid or has expired.
              </p>
              <Link to="/auth" className="text-primary font-bold text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : success ? (
            <div className="bg-surface border border-border rounded-lg p-7 text-center">
              <div className="text-primary text-4xl mb-3">✓</div>
              <p className="text-foreground font-bold mb-1">Password updated</p>
              <p className="text-muted-foreground text-sm">Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-7 space-y-4">
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  className={inputClass}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md font-bold text-sm bg-primary text-primary-foreground hover:shadow-[0_0_20px_hsla(var(--primary)/0.4)] transition-all disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
