import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3, Users, Megaphone, Activity, Shield, RefreshCw,
  TrendingUp, DollarSign, UserPlus, Zap, Mail, Phone,
  Fingerprint, LogOut, Loader2, Send, ChevronRight, Globe, Eye, MousePointerClick,
} from "lucide-react";

// ─── Types ───
type Stats = {
  total_users: number; paid_users: number; free_users: number;
  mrr: number; arr: number; new_users_today: number; new_users_this_week: number;
  new_users_this_month: number; active_users_last_30_days: number;
  total_invoices_synced: number; total_reminders_sent: number; reminders_sent_today: number;
  email_success_rate: number; sms_success_rate: number; emails_sent: number; sms_sent: number;
  xero_connected_count: number; gmail_connected_count: number; churn_this_month: number;
  conversion_rate: number;
  campaign_emails_sent: number; campaign_open_rate: number; campaign_click_rate: number;
  campaign_bounces: number;
  unique_visitors_today: number; page_views_today: number;
  traffic_sources: Record<string, number>;
  top_countries: Array<{ country: string; count: number }>;
};

type CampaignSummary = {
  id: string; name: string; status: string; total_contacts: number;
  sent_count: number; open_count: number; click_count: number;
  bounce_count: number; unsub_count: number;
};

// ─── Helper ───
const adminFetch = async (action: string, method = "GET", body?: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin?action=${action}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
};

const formatCurrency = (cents: number) =>
  `£${(cents / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
const rate = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : "0.0");

// ─── WebAuthn / Face ID ───
const isBiometricAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
};

const storeBiometricCredential = async (userId: string): Promise<boolean> => {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "PayNudge Admin", id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: "admin@paynudge.co",
          displayName: "PayNudge Admin",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    });
    if (credential) {
      const cred = credential as PublicKeyCredential;
      localStorage.setItem("pn_biometric_cred_id", cred.id);
      localStorage.setItem("pn_biometric_user_id", userId);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Biometric registration error:", err);
    return false;
  }
};

const authenticateWithBiometric = async (): Promise<boolean> => {
  const credId = localStorage.getItem("pn_biometric_cred_id");
  if (!credId) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: Uint8Array.from(atob(credId.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
          type: "public-key",
          transports: ["internal"],
        }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
};

// ─── Stat Card (Mobile) ───
const MobileStat = ({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
    </div>
    <div className={`font-mono text-xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

// ─── Campaign Card (Mobile) ───
const CampaignCard = ({ c, onSend }: { c: CampaignSummary; onSend: () => void }) => {
  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-primary/15 text-primary",
    paused: "bg-accent/15 text-accent",
    completed: "bg-primary/15 text-primary",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm truncate flex-1 mr-2">{c.name}</h3>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColors[c.status] || statusColors.draft}`}>
          {c.status}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center mb-3">
        <div>
          <div className="font-mono text-xs font-bold">{c.total_contacts}</div>
          <div className="text-[9px] text-muted-foreground">Total</div>
        </div>
        <div>
          <div className="font-mono text-xs font-bold">{c.sent_count}</div>
          <div className="text-[9px] text-muted-foreground">Sent</div>
        </div>
        <div>
          <div className="font-mono text-xs font-bold">{rate(c.open_count, c.sent_count)}%</div>
          <div className="text-[9px] text-muted-foreground">Opens</div>
        </div>
        <div>
          <div className="font-mono text-xs font-bold">{rate(c.click_count, c.sent_count)}%</div>
          <div className="text-[9px] text-muted-foreground">Clicks</div>
        </div>
      </div>
      {c.status === "active" && (
        <button onClick={onSend}
          className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-lg py-2 text-xs font-bold">
          <Send className="w-3 h-3" /> Send Batch Now
        </button>
      )}
    </div>
  );
};

// ─── Main Component ───
const AdminAppPage = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "login" | "biometric" | "authenticated">("checking");

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ─── Init ───
  useEffect(() => {
    const init = async () => {
      const bioAvail = await isBiometricAvailable();
      setBiometricAvailable(bioAvail);
      const credId = localStorage.getItem("pn_biometric_cred_id");
      setBiometricEnrolled(!!credId);

      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const isAdminUser = await verifyAdmin(session.user.id);
        if (isAdminUser) {
          setIsAdmin(true);
          setAuthState("authenticated");
          setLoading(false);
          loadData();
          return;
        }
      }

      // Try biometric auth if enrolled
      if (bioAvail && credId) {
        setAuthState("biometric");
        setLoading(false);
        // Auto-trigger biometric
        handleBiometricAuth();
      } else {
        setAuthState("login");
        setLoading(false);
      }
    };
    init();
  }, []);

  const verifyAdmin = async (userId: string): Promise<boolean> => {
    const { data } = await supabase.from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "admin").single();
    return !!data;
  };

  const loadData = useCallback(async () => {
    try {
      const [statsData, campaignsData] = await Promise.all([
        adminFetch("stats"),
        supabase.from("campaigns").select("id, name, status, total_contacts, sent_count, open_count, click_count, bounce_count, unsub_count").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats(statsData);
      setCampaigns((campaignsData.data || []) as CampaignSummary[]);
    } catch (err: any) {
      toast({ title: "Error loading data", description: err.message, variant: "destructive" });
    }
  }, []);

  // ─── Auth handlers ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const { error } = await signIn(email, password);
    if (error) { setLoginError(error.message); setLoginLoading(false); return; }

    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) { setLoginError("Auth failed"); setLoginLoading(false); return; }

    const admin = await verifyAdmin(u.id);
    if (!admin) {
      await supabase.auth.signOut();
      setLoginError("Admin access required");
      setLoginLoading(false);
      return;
    }

    // Offer to enrol biometric
    if (biometricAvailable && !biometricEnrolled) {
      const enrolled = await storeBiometricCredential(u.id);
      if (enrolled) {
        setBiometricEnrolled(true);
        toast({ title: "Face ID enabled", description: "Next time you can sign in with Face ID" });
      }
    }

    setIsAdmin(true);
    setAuthState("authenticated");
    loadData();
    setLoginLoading(false);
  };

  const handleBiometricAuth = async () => {
    const ok = await authenticateWithBiometric();
    if (ok) {
      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const admin = await verifyAdmin(session.user.id);
        if (admin) {
          setIsAdmin(true);
          setAuthState("authenticated");
          loadData();
          return;
        }
      }
      // Biometric passed but no session — need to login
      setAuthState("login");
      toast({ title: "Session expired", description: "Please sign in again" });
    } else {
      setAuthState("login");
    }
  };

  const handleSendBatch = async () => {
    try {
      toast({ title: "Sending batch…" });
      const { data, error } = await supabase.functions.invoke("campaign-sender", { body: { scheduled: true } });
      if (error) throw error;
      toast({ title: "Batch sent!", description: `Sent: ${data?.sent ?? 0}, Bounced: ${data?.bounced ?? 0}` });
      loadData();
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
  };

  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingTemplateId, setSendingTemplateId] = useState<string | null>(null);

  const TEST_EMAIL = "Tyrone.burns@gmail.com";

  const FLOW_TEMPLATES = [
    { id: "friendly-nudge", label: "Email 1 — Friendly Nudge", day: "Day 1", subject: "⚠️ Quick question about your unpaid invoices" },
    { id: "pain-point", label: "Email 2 — Pain Point", day: "Day 3", subject: "🔴 US small businesses are owed $825 billion in unpaid invoices" },
    { id: "social-proof", label: "Email 3 — Social Proof", day: "Day 7", subject: "📎 What if your invoices chased themselves?" },
    { id: "final-push", label: "Email 4 — Final Push", day: "Day 14", subject: "⏰ Last chance — free invoice reminder setup" },
    { id: "re-engagement", label: "Email 5 — Re-engagement", day: "Day 30", subject: "💰 Still chasing invoices manually?" },
  ];

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-email", {
        body: { email: TEST_EMAIL },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "✅ Test email sent!", description: `Check ${TEST_EMAIL}` });
      } else {
        toast({ title: "Email failed", description: data?.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSendingTestEmail(false);
  };

  const handleSendFlowEmail = async (templateId: string) => {
    setSendingTemplateId(templateId);
    try {
      const tpl = FLOW_TEMPLATES.find(t => t.id === templateId);
      if (!tpl) throw new Error("Template not found");

      // Fetch attachment_url from the most recent active campaign that has one
      let attachmentUrl: string | null = null;
      const { data: activeCampaign } = await supabase
        .from("campaigns")
        .select("attachment_url")
        .in("status", ["active", "draft", "paused"])
        .not("attachment_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (activeCampaign?.attachment_url) {
        attachmentUrl = activeCampaign.attachment_url;
      }

      const personalizedSubject = tpl.subject
        .replace(/\{first_name\}/g, "Tyrone")
        .replace(/\{company_name\}/g, "PayNudge Test");

      // Use campaign-sender style email wrapper
      const wrap = (c: string) => `<div style="background:#f4f4f5;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;"><div style="height:4px;background:#00D4A8;"></div><div style="padding:32px 36px;"><div style="text-align:center;margin-bottom:28px;"><div style="display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:20px;color:#18181b;"><div style="width:16px;height:16px;background:#00D4A8;border-radius:3px;"></div>PayNudge</div></div>${c}</div><div style="padding:20px 36px;border-top:1px solid #e4e4e7;text-align:center;"><p style="color:#a1a1aa;font-size:12px;margin:0;">PayNudge · Automated invoice reminders · paynudge.co</p></div></div></div>`;
      const cta = (t: string) => `<p style="margin:28px 0;text-align:center;"><a href="https://paynudge.co" style="display:inline-block;background:#00D4A8;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${t}</a></p>`;
      const bs = 'style="color:#52525b;font-size:15px;line-height:1.7;margin:0 0 16px;"';

      const bodies: Record<string, string> = {
        "friendly-nudge": wrap(`<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi Tyrone,</h1><p ${bs}>Quick question — how much time did you spend last month chasing clients for payment?</p><p ${bs}>For most small business owners, it's hours of awkward follow-up emails, phone calls that go to voicemail, and that uncomfortable feeling every time you have to ask again.</p><p ${bs}>PayNudge connects to your <strong>Xero account</strong> and handles all of it automatically. When an invoice goes unpaid, it sends professional, escalating reminders on your behalf — so you get paid without the awkward conversations.</p>${cta("See how it works")}<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
        "pain-point": wrap(`<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi Tyrone,</h1><p ${bs}><strong>$825 billion.</strong></p><p ${bs}>That's how much US small businesses are currently owed in unpaid invoices, according to the Federal Reserve.</p><p ${bs}>The average small business waits <strong>72 days to get paid</strong> — more than double the standard 30-day terms.</p><p ${bs}><strong>PayNudge removes the awkwardness entirely.</strong></p>${cta("Start for free — no credit card needed")}<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
        "social-proof": wrap(`<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi Tyrone,</h1><p ${bs}>Most business owners hate asking for money. So they wait. And watch their cash flow suffer.</p><p ${bs}><strong>PayNudge flips that dynamic.</strong> Connect Xero → PayNudge monitors invoices → Sends professional reminders automatically.</p><p ${bs}>No more awkward phone calls. No more chasing spreadsheets.</p>${cta("Connect Xero and get started free")}<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
        "final-push": wrap(`<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi Tyrone,</h1><p ${bs}>I wanted to reach out one last time.</p><p ${bs}>If PayNudge Test has even one overdue invoice right now, PayNudge can start chasing it automatically today — completely free.</p><p ${bs}>No credit card. No setup fees. No contracts.</p><p ${bs}>The average overdue invoice in the US is <strong>$4,200</strong>. How many do you have sitting unpaid right now?</p>${cta("Claim your free account")}<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
        "re-engagement": wrap(`<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi Tyrone,</h1><p ${bs}>Still sending payment follow-ups yourself?</p><p ${bs}>Every day an invoice sits unpaid is money sitting in someone else's bank account instead of yours.</p><p ${bs}>PayNudge automates the whole process — connects to Xero, monitors your invoices, and sends professional reminders automatically. Takes 2 minutes to set up.</p>${cta("Try PayNudge free →")}<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
      };

      const html = bodies[templateId];
      if (!html) throw new Error("Template not found");

      const { data, error } = await supabase.functions.invoke("test-email", {
        body: { email: TEST_EMAIL, subject: personalizedSubject, html, attachment_url: attachmentUrl },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: `✅ ${tpl.label} sent!`, description: `Check ${TEST_EMAIL}${attachmentUrl ? " · PDF attached" : ""}` });
      } else {
        toast({ title: "Email failed", description: data?.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSendingTemplateId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsAdmin(false);
    setAuthState("login");
  };

  // ─── Pull to refresh ───
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const pullDelta = useRef(0);
  const [pullOffset, setPullOffset] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    } else {
      pullStartY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) {
      pullDelta.current = Math.min(delta, 120);
      setPullOffset(pullDelta.current * 0.4);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDelta.current > 60 && !refreshing) {
      setRefreshing(true);
      setPullOffset(48);
      await loadData();
      setRefreshing(false);
    }
    pullStartY.current = null;
    pullDelta.current = 0;
    setPullOffset(0);
  }, [refreshing, loadData]);

  // ─── Tabs config ───
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "users", label: "Users", icon: Users },
    { id: "actions", label: "Actions", icon: Zap },
  ];

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // ─── Biometric prompt ───
  if (authState === "biometric") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-area-inset">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6">
          <Fingerprint className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold mb-2">PayNudge Admin</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">Authenticate with Face ID to continue</p>
        <button onClick={handleBiometricAuth}
          className="w-full max-w-xs bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm">
          Use Face ID
        </button>
        <button onClick={() => setAuthState("login")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground">
          Sign in with password instead
        </button>
      </div>
    );
  }

  // ─── Login ───
  if (authState === "login" || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-area-inset">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold">Admin Sign In</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@paynudge.co" required
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" required minLength={6}
              className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            {loginError && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">{loginError}</div>
            )}
            <button type="submit" disabled={loginLoading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm disabled:opacity-50">
              {loginLoading ? "Verifying…" : "Sign In"}
            </button>
          </form>

          {biometricAvailable && biometricEnrolled && (
            <button onClick={() => { setAuthState("biometric"); handleBiometricAuth(); }}
              className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Fingerprint className="w-4 h-4" /> Use Face ID
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Authenticated Admin App ───
  return (
    <div className="min-h-screen bg-background safe-area-inset" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 pt-[env(safe-area-inset-top)] pb-3">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">PN</span>
            </div>
            <span className="font-display font-bold text-sm">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="px-4 py-4 overflow-y-auto"
        style={{ transform: `translateY(${pullOffset}px)`, transition: pullOffset === 0 || refreshing ? 'transform 0.3s ease' : 'none' }}>
        
        {/* Pull indicator */}
        {(pullOffset > 0 || refreshing) && (
          <div className="flex items-center justify-center -mt-2 mb-3">
            <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`}
              style={{ opacity: Math.min(pullOffset / 48, 1) }} />
          </div>
        )}
        {activeTab === "overview" && stats && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <MobileStat label="MRR" value={formatCurrency(stats.mrr)} icon={DollarSign} accent />
              <MobileStat label="ARR" value={formatCurrency(stats.arr)} icon={TrendingUp} />
              <MobileStat label="Total Users" value={stats.total_users} sub={`${stats.paid_users} paid`} icon={Users} />
              <MobileStat label="New Today" value={stats.new_users_today} sub={`${stats.new_users_this_week} this week`} icon={UserPlus} accent />
              <MobileStat label="Reminders Sent" value={stats.total_reminders_sent} sub={`${stats.reminders_sent_today} today`} icon={Mail} />
              <MobileStat label="Invoices" value={stats.total_invoices_synced} icon={BarChart3} />
              <MobileStat label="Email Rate" value={`${stats.email_success_rate}%`} icon={Mail} />
              <MobileStat label="SMS Rate" value={`${stats.sms_success_rate}%`} icon={Phone} />
              <MobileStat label="Xero" value={stats.xero_connected_count} sub="connected" icon={Activity} />
              <MobileStat label="Conversion" value={`${stats.conversion_rate}%`} icon={Zap} accent />
            </div>

            {/* Campaign Analytics */}
            <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider pt-2">Campaigns</h3>
            
            {/* Aggregate stats */}
            <div className="grid grid-cols-2 gap-3">
              <MobileStat label="Emails Sent" value={stats.campaign_emails_sent} icon={Megaphone} accent />
              <MobileStat label="Bounced" value={stats.campaign_bounces} icon={Activity} />
            </div>

            {/* Delivery Funnel */}
            {stats.campaign_emails_sent > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Delivery Funnel</h4>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-1.5" />
                    <div className="font-mono text-lg font-bold">{stats.campaign_emails_sent}</div>
                    <div className="text-[10px] text-muted-foreground">Delivered</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-1.5" />
                    <div className="font-mono text-lg font-bold">{Math.round(stats.campaign_emails_sent * stats.campaign_open_rate / 100)}</div>
                    <div className="text-[10px] text-muted-foreground">Opened</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-center">
                    <div className="w-3 h-3 bg-accent rounded-full mx-auto mb-1.5" />
                    <div className="font-mono text-lg font-bold">{Math.round(stats.campaign_emails_sent * stats.campaign_click_rate / 100)}</div>
                    <div className="text-[10px] text-muted-foreground">Clicked</div>
                  </div>
                </div>
              </div>
            )}

            {/* Per-campaign breakdown */}
            {campaigns.filter(c => c.sent_count > 0).length > 0 && (
              <div className="space-y-3">
                {campaigns.filter(c => c.sent_count > 0).map(c => {
                  const openPct = c.sent_count > 0 ? ((c.open_count / c.sent_count) * 100).toFixed(1) : "0.0";
                  const clickPct = c.sent_count > 0 ? ((c.click_count / c.sent_count) * 100).toFixed(1) : "0.0";
                  const bouncePct = c.total_contacts > 0 ? ((c.bounce_count / c.total_contacts) * 100).toFixed(1) : "0.0";
                  const unsubPct = c.total_contacts > 0 ? ((c.unsub_count / c.total_contacts) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold truncate flex-1 mr-2">{c.name}</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          c.status === "active" ? "bg-primary/15 text-primary" :
                          c.status === "completed" ? "bg-primary/15 text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.status}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div>
                          <div className="font-mono text-sm font-bold">{c.sent_count}</div>
                          <div className="text-[8px] text-muted-foreground uppercase">Sent</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm font-bold text-primary">{openPct}%</div>
                          <div className="text-[8px] text-muted-foreground uppercase">Open</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm font-bold text-primary">{clickPct}%</div>
                          <div className="text-[8px] text-muted-foreground uppercase">Click</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm font-bold">{bouncePct}%</div>
                          <div className="text-[8px] text-muted-foreground uppercase">Bounce</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm font-bold">{unsubPct}%</div>
                          <div className="text-[8px] text-muted-foreground uppercase">Unsub</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Visitor Analytics */}
            <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider pt-2">Visitors</h3>
            <div className="grid grid-cols-2 gap-3">
              <MobileStat label="Unique Today" value={stats.unique_visitors_today} icon={Users} accent />
              <MobileStat label="Page Views" value={stats.page_views_today} sub="today" icon={Eye} />
            </div>

            {/* Traffic Sources */}
            {stats.traffic_sources && Object.keys(stats.traffic_sources).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Traffic Sources</h4>
                <div className="space-y-2">
                  {Object.entries(stats.traffic_sources)
                    .sort((a, b) => b[1] - a[1])
                    .map(([source, count]) => {
                      const total = Object.values(stats.traffic_sources).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
                      const labels: Record<string, string> = {
                        direct: "Direct",
                        campaign_email: "Campaign Email",
                        google: "Google",
                        referral: "Referral",
                        twitter: "Twitter/X",
                        linkedin: "LinkedIn",
                        facebook: "Facebook",
                        reddit: "Reddit",
                        bing: "Bing",
                      };
                      return (
                        <div key={source} className="flex items-center gap-2">
                          <MousePointerClick className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs flex-1">{labels[source] || source}</span>
                          <span className="text-xs font-mono font-bold">{count}</span>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Top Countries */}
            {stats.top_countries && stats.top_countries.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Top Countries</h4>
                <div className="space-y-2">
                  {stats.top_countries.map(({ country, count }) => (
                    <div key={country} className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs flex-1">{country}</span>
                      <span className="text-xs font-mono font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "overview" && !stats && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">Campaigns</h2>
              <button onClick={() => navigate("/admin")}
                className="text-xs text-primary flex items-center gap-1">
                Full view <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No campaigns</p>
            ) : (
              campaigns.map(c => (
                <CampaignCard key={c.id} c={c} onSend={handleSendBatch} />
              ))
            )}
          </div>
        )}

        {activeTab === "users" && stats && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg">Users</h2>
            <div className="grid grid-cols-2 gap-3">
              <MobileStat label="Total" value={stats.total_users} icon={Users} accent />
              <MobileStat label="Paid" value={stats.paid_users} icon={DollarSign} />
              <MobileStat label="Free" value={stats.free_users} icon={Users} />
              <MobileStat label="Active (30d)" value={stats.active_users_last_30_days} icon={Activity} />
              <MobileStat label="Churn" value={stats.churn_this_month} sub="this month" icon={TrendingUp} />
              <MobileStat label="Gmail" value={stats.gmail_connected_count} sub="connected" icon={Mail} />
            </div>
            <button onClick={() => navigate("/admin")}
              className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3 text-sm text-muted-foreground">
              View full user list <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeTab === "actions" && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg">Quick Actions</h2>
            
            <button onClick={handleSendBatch}
              className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Send Campaign Batch</div>
                <div className="text-[11px] text-muted-foreground">Trigger next 25 emails immediately</div>
              </div>
            </button>

            <button onClick={handleSendTestEmail} disabled={sendingTestEmail}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">{sendingTestEmail ? "Sending…" : "Send Test Email"}</div>
                <div className="text-[11px] text-muted-foreground">Send to Tyrone.burns@gmail.com</div>
              </div>
            </button>

            {/* Test Flow Emails */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Test Campaign Flow</h3>
              <p className="text-[11px] text-muted-foreground mb-3">Send each email in the sequence to {TEST_EMAIL}</p>
              <div className="space-y-2">
                {FLOW_TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => handleSendFlowEmail(tpl.id)}
                    disabled={sendingTemplateId === tpl.id}
                    className="w-full bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">
                        {sendingTemplateId === tpl.id ? "Sending…" : tpl.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{tpl.day}</div>
                    </div>
                    <Send className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={loadData}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Refresh Data</div>
                <div className="text-[11px] text-muted-foreground">Reload all admin stats</div>
              </div>
            </button>

            <button onClick={() => navigate("/admin")}
              className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Full Admin Panel</div>
                <div className="text-[11px] text-muted-foreground">Open complete admin dashboard</div>
              </div>
            </button>

            {biometricAvailable && !biometricEnrolled && (
              <button onClick={async () => {
                const ok = await storeBiometricCredential(user!.id);
                if (ok) {
                  setBiometricEnrolled(true);
                  toast({ title: "Face ID enabled!" });
                }
              }}
                className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Enable Face ID</div>
                  <div className="text-[11px] text-muted-foreground">Sign in faster next time</div>
                </div>
              </button>
            )}

            {biometricEnrolled && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs text-primary">
                <Fingerprint className="w-3.5 h-3.5" />
                Face ID is enabled
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around py-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[64px] transition-colors ${
                activeTab === t.id ? "text-primary" : "text-muted-foreground"
              }`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminAppPage;
