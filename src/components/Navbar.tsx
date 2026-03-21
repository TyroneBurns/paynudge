import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/tools", label: "Tools" },
    { to: "/blog", label: "Blog" },
    { to: "/about", label: "About" },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[1000] transition-all border-b ${scrolled ? "bg-background/95 backdrop-blur-xl border-border py-4" : "bg-background border-transparent py-5"}`}>
        <div className="container-main flex justify-between items-center">
          <Link to="/" className="font-display font-extrabold text-2xl flex items-center gap-3">
            <div className="w-5 h-5 bg-primary rounded-md shadow-[0_0_18px_rgba(0,212,168,0.35)]" />
            <div>
              <div>PayNudge</div>
              <div className="hidden lg:block text-[10px] font-mono uppercase tracking-[0.25em] text-primary">AI Collections for Xero</div>
            </div>
          </Link>

          <button className="md:hidden text-foreground text-2xl bg-transparent" onClick={() => setMobileOpen(!mobileOpen)}>
            ☰
          </button>

          <div className={`${mobileOpen ? "flex" : "hidden"} md:flex gap-6 lg:gap-8 absolute md:static top-full left-0 w-full md:w-auto bg-surface md:bg-transparent flex-col md:flex-row p-6 md:p-0 border-b md:border-0 border-border z-[1001]`}>
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={`text-[15px] font-medium transition-colors ${location.pathname === l.to ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-4 mt-4 md:hidden">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                  <button onClick={async () => { await signOut(); navigate("/"); }} className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent text-left">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
                  <Link to="/auth" className="inline-flex items-center justify-center px-5 py-2.5 rounded-md font-bold text-sm bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all">Start free</Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <button onClick={async () => { await signOut(); navigate("/"); }} className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Link to="/auth" className="inline-flex items-center justify-center px-5 py-2.5 rounded-md font-bold text-sm bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {mobileOpen && <div className="fixed inset-0 bg-black/80 z-[999] md:hidden" onClick={() => setMobileOpen(false)} />}
    </>
  );
};

export default Navbar;
