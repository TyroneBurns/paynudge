import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useSearchParams } from "react-router-dom";
import { User, Lock, CreditCard, Bell, ClipboardList, Search, Upload, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "audit", label: "Audit Log", icon: ClipboardList },
] as const;

type TabId = typeof TABS[number]["id"];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland",
];

const CURRENCIES = [
  { code: "GBP", name: "British Pound" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
];

const SettingsPage = () => {
  const { user, loading, profile, subscription } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && ["profile","password","billing","notifications","audit"].includes(tabParam) ? tabParam : "profile");

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div>
      <div className="max-w-[700px]">
        <h1 className="font-display text-3xl font-bold mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && <ProfileTab user={user} profile={profile} />}
        {activeTab === "password" && <PasswordTab />}
        {activeTab === "billing" && <BillingTab user={user} subscription={subscription} />}
        {activeTab === "notifications" && <NotificationsTab userId={user.id} />}
        {activeTab === "audit" && <AuditLogTab userId={user.id} />}
      </div>
    </div>
  );
};

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", phone: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", phone: "+44" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", phone: "+61" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD", phone: "+64" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", phone: "+1" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", currency: "EUR", phone: "+353" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", phone: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", phone: "+33" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", phone: "+31" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD", phone: "+65" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", phone: "+27" },
];

/* ─── Profile Tab ─── */
function ProfileTab({ user, profile }: { user: any; profile: any }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("organisations").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setCompanyName(data.company_name || "");
        setTimezone((data as any).timezone || "UTC");
        setCurrency((data as any).default_currency || "USD");
        setSelectedCountry((data as any).country_code || null);
        setLogoUrl(data.logo_url || null);
        setOrgId(data.id);
      }
    })();
  }, [user.id]);

  const handleCountryChange = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code);
    if (c) {
      setSelectedCountry(c.code);
      setCurrency(c.currency);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("File must be under 2MB"); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Only PNG, JPG, and WebP files are allowed"); return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/logo.${ext}`;
      await supabase.storage.from("logos").remove([path]);
      const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      if (orgId) {
        await supabase.from("organisations").update({ logo_url: publicUrl } as any).eq("id", orgId);
      }
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded");
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast.error("Failed to upload logo");
    }
    setUploading(false);
  };

  const handleRemoveLogo = async () => {
    if (!orgId) return;
    setUploading(true);
    try {
      const { data: files } = await supabase.storage.from("logos").list(user.id);
      if (files && files.length > 0) {
        await supabase.storage.from("logos").remove(files.map((f: any) => `${user.id}/${f.name}`));
      }
      await supabase.from("organisations").update({ logo_url: null } as any).eq("id", orgId);
      setLogoUrl(null);
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
      if (orgId) {
        const country = COUNTRIES.find((c) => c.code === selectedCountry);
        await supabase.from("organisations").update({
          company_name: companyName,
          default_currency: currency,
          country_code: selectedCountry,
          default_phone_prefix: country?.phone || null,
        } as any).eq("id", orgId);
      }
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Field label="Full Name">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="settings-input" />
      </Field>
      <Field label="Email Address">
        <input value={user.email || ""} disabled className="settings-input opacity-60" />
        <p className="text-xs text-muted-foreground mt-1">Contact support to change your email address.</p>
      </Field>
      <Field label="Company Name">
        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="settings-input" />
      </Field>

      <Field label="Company Logo">
        {logoUrl ? (
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-center gap-4">
              <img src={logoUrl} alt="Company logo" className="max-h-[80px] max-w-[200px] object-contain rounded mx-auto" />
              <div className="flex-1" />
              <button
                onClick={handleRemoveLogo}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/png,image/jpeg,image/webp";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleLogoUpload(file);
              };
              input.click();
            }}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Drop logo here or </span>
              <span className="font-bold text-foreground">click to upload</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
          </div>
        )}
      </Field>

      {/* Country & Currency */}
      <Field label="Country & Currency">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCountryChange(c.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-md border-2 text-sm transition-all ${
                selectedCountry === c.code
                  ? "border-primary bg-primary/[0.05]"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="font-medium truncate">{c.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">{c.currency}</span>
              {selectedCountry === c.code && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Timezone">
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="settings-input">
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace("_", "/")}</option>)}
        </select>
      </Field>

      <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ─── Password Tab ─── */
function PasswordTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Field label="Current Password">
        <input type="password" placeholder="Enter current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="settings-input" />
      </Field>
      <Field label="New Password">
        <input type="password" placeholder="Enter new password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="settings-input" />
      </Field>
      <Field label="Confirm New Password">
        <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="settings-input" />
      </Field>
      <button onClick={handleUpdate} disabled={saving} className="px-6 py-3 rounded-md font-bold bg-foreground text-background hover:opacity-90 transition-opacity">
        {saving ? "Updating…" : "Update Password"}
      </button>
    </div>
  );
}

/* ─── Billing Tab ─── */
function BillingTab({ user, subscription }: { user: any; subscription: any }) {
  const isPaid = subscription?.subscribed;
  const [loadingPortal, setLoadingPortal] = useState(false);

  const openPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { toast.error("Failed to open billing portal"); }
    setLoadingPortal(false);
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_1T8J512NdAO1MGU1UCTSlmt2" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { toast.error("Failed to start checkout"); }
  };

  return (
    <div className="space-y-8">
      <div className="border border-border rounded-lg p-6">
        <h3 className="font-display text-xl font-bold mb-1">{isPaid ? "Paid Plan" : "Free Plan"}</h3>
        <p className="text-sm text-muted-foreground mb-4">{isPaid ? "200 invoices per month" : "0 of 5 invoices used this month"}</p>
        {!isPaid && (
          <button onClick={handleUpgrade} className="w-full py-3 rounded-md font-bold bg-foreground text-background hover:opacity-90 transition-opacity mb-4">
            Upgrade to Paid – $29/mo
          </button>
        )}
        {isPaid && (
          <button onClick={openPortal} disabled={loadingPortal} className="w-full py-3 rounded-md font-bold border border-border text-foreground hover:bg-surface-hover transition-colors mb-4">
            {loadingPortal ? "Loading…" : "Manage Subscription"}
          </button>
        )}
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Usage</span>
          <span>0/{isPaid ? 200 : 5} invoices</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
        </div>
      </div>

      {!isPaid && (
        <div className="border border-border rounded-lg p-6">
          <h3 className="font-display text-lg font-bold mb-3">Why upgrade to Paid?</h3>
          <ul className="space-y-2">
            {["Chase up to 200 invoices per month (vs 5 on Free)", "Create up to 6 custom reminder flows", "CSV data export", "Priority support"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Payment History</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">No payment history. Upgrade to Paid to see your payment history.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications Tab ─── */
const NOTIFICATION_OPTIONS = [
  { key: "reminder_sent", title: "Reminder sent successfully", desc: "Get notified when a reminder email or SMS is sent to a client." },
  { key: "reminder_failed", title: "Reminder send failed", desc: "Get notified when a reminder fails to send (bounced, invalid number, etc.)." },
  { key: "reminder_digest", title: "Daily reminder digest", desc: "Receive a daily summary email of all reminder activity across your invoices." },
  { key: "email_opened", title: "Email opened", desc: "Get notified when a client opens a reminder email." },
  { key: "invoice_paid", title: "Invoice paid", desc: "Get notified when an invoice is marked as paid in Xero." },
  { key: "new_invoice_synced", title: "New invoice synced", desc: "Get notified when a new invoice is synced from Xero." },
  { key: "client_no_contact_info", title: "Client missing contact info", desc: "Get alerted when a synced client has no email or phone on file." },
  { key: "integration_issues", title: "Integration issues", desc: "Get notified about connection problems with Xero, Gmail, or Twilio." },
  { key: "plan_limits", title: "Plan limits", desc: "Get notified when approaching or reaching your plan limits." },
] as const;

function NotificationsTab({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("notification_preferences" as any).select("*").eq("user_id", userId).single();
      if (data) {
        const d = data as any;
        const p: Record<string, boolean> = {};
        NOTIFICATION_OPTIONS.forEach((o) => { p[o.key] = d[o.key] ?? true; });
        setPrefs(p);
      } else {
        const defaults: Record<string, any> = { user_id: userId };
        NOTIFICATION_OPTIONS.forEach((o) => { defaults[o.key] = true; });
        await supabase.from("notification_preferences" as any).insert(defaults as any);
        const p: Record<string, boolean> = {};
        NOTIFICATION_OPTIONS.forEach((o) => { p[o.key] = true; });
        setPrefs(p);
      }
      setLoaded(true);
    })();
  }, [userId]);

  const toggle = async (key: string) => {
    const newVal = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: newVal }));
    await supabase.from("notification_preferences" as any).update({ [key]: newVal } as any).eq("user_id", userId);
  };

  if (!loaded) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div>
      <p className="text-muted-foreground text-sm mb-6">Choose which notifications you want to receive.</p>
      <div className="border border-border rounded-lg divide-y divide-border">
        {NOTIFICATION_OPTIONS.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between p-4">
            <div>
              <p className="font-bold text-sm">{opt.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
            <button
              onClick={() => toggle(opt.key)}
              className={`relative w-12 h-7 rounded-full transition-colors ${prefs[opt.key] ? "bg-foreground" : "bg-secondary"}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-background transition-transform ${prefs[opt.key] ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Audit Log Tab ─── */
function AuditLogTab({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_log").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      setLogs(data || []);
      setLoaded(true);
    })();
  }, [userId]);

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.detail || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input placeholder="Search audit log…" value={search} onChange={(e) => setSearch(e.target.value)} className="settings-input pl-10" />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Timestamp</th>
              <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Action</th>
              <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">User</th>
              <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody>
            {!loaded && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {loaded && filtered.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No audit log entries yet. Activity will be recorded as you use PayNudge.</td></tr>
            )}
            {filtered.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-3 text-sm">{log.action}</td>
                <td className="p-3 text-xs text-muted-foreground">{log.user_id?.slice(0, 8)}…</td>
                <td className="p-3 text-xs text-muted-foreground">{log.detail || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Shared ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      {children}
    </div>
  );
}

export default SettingsPage;
