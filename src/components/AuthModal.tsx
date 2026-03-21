import { useState, useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  mode: "login" | "signup";
  onClose: () => void;
  onSwitchMode: (mode: "login" | "signup") => void;
}

const AuthModal = ({ isOpen, mode, onClose, onSwitchMode }: AuthModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-lg p-10 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl bg-transparent">×</button>

        {mode === "login" ? (
          <>
            <h2 className="font-display text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground text-sm mb-8">Sign in to your PayNudge account</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" placeholder="you@company.com" className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
            </div>
            <button className="w-full py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all mb-4">Sign in</button>
            <div className="text-center text-muted-foreground text-sm mb-4">or</div>
            <button className="w-full py-3.5 rounded-md font-bold border border-border text-foreground hover:bg-surface-hover transition-all mb-4">Continue with Google</button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button onClick={() => onSwitchMode("signup")} className="text-primary underline bg-transparent font-medium">Sign up free</button>
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-2">Get started free</h2>
            <p className="text-muted-foreground text-sm mb-8">Create your PayNudge account</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" placeholder="you@company.com" className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input type="text" placeholder="Your Company Ltd" className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors" />
              </div>
            </div>
            <button className="w-full py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all mb-4">Create free account</button>
            <div className="text-center text-muted-foreground text-sm mb-4">or</div>
            <button className="w-full py-3.5 rounded-md font-bold border border-border text-foreground hover:bg-surface-hover transition-all mb-4">Continue with Google</button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => onSwitchMode("login")} className="text-primary underline bg-transparent font-medium">Sign in</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
