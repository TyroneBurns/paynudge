import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Authentication failed.");
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      setError("Access denied. Admin privileges required.");
      setLoading(false);
      return;
    }

    navigate("/admin");
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
            <Link
              to="/"
              className="font-display font-extrabold text-2xl flex items-center gap-2 justify-center mb-6"
            >
              <div className="w-5 h-5 bg-primary rounded-md" />
              PayNudge
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold mb-4">
              <Shield className="w-3.5 h-3.5" />
              Admin Access
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Admin sign in
            </h1>
            <p className="text-muted-foreground text-sm">
              Restricted to authorised personnel only
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-border rounded-lg p-7 space-y-4"
          >
            <div>
              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@paynudge.co"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
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

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md font-bold text-sm bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign in as admin"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Not an admin?{" "}
            <Link to="/auth" className="text-primary font-bold hover:underline">
              Go to regular sign in
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AdminLoginPage;
