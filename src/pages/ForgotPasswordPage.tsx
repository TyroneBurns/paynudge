import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
            <h1 className="font-display text-3xl font-bold mb-2">Reset your password</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="bg-surface border border-border rounded-lg p-7 text-center">
              <div className="text-primary text-4xl mb-3">✉️</div>
              <p className="text-foreground font-bold mb-1">Check your email</p>
              <p className="text-muted-foreground text-sm mb-4">
                We've sent a password reset link to <span className="text-foreground">{email}</span>
              </p>
              <Link to="/auth" className="text-primary font-bold text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-7 space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
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
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary font-bold hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
