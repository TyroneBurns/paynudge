import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import AdminCampaignsTab from "@/components/AdminCampaignsTab";
import {
  BarChart3, Users, Activity, Heart, Shield, Search, ChevronDown,
  Check, X, Mail, RefreshCw, AlertTriangle, AlertCircle, CheckCircle2,
  TrendingUp, DollarSign, UserPlus, Zap, Megaphone, Phone, Loader2,
  Trash2, Ban, RotateCcw,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ───
type Stats = {
  total_users: number; paid_users: number; free_users: number;
  mrr: number; arr: number; new_users_today: number; new_users_this_week: number;
  new_users_this_month: number; active_users_last_30_days: number;
  total_invoices_synced: number; total_reminders_sent: number; reminders_sent_today: number;
  email_success_rate: number; sms_success_rate: number; emails_sent: number; sms_sent: number;
  xero_connected_count: number; gmail_connected_count: number; churn_this_month: number;
  conversion_rate: number;
};

type AdminUser = {
  user_id: string; email: string; full_name: string | null;
  subscription_status: string; created_at: string; last_sign_in_at: string | null;
  xero_connected: boolean; gmail_connected: boolean;
  invoices_synced: number; reminders_sent: number;
};

type HealthData = {
  errors_this_week: number; warnings_this_week: number;
  recent_errors: any[]; last_xero_sync: string | null; last_reminder_run: string | null;
  email_failures_24h: number; sms_failures_24h: number; broken_xero_connections: any[];
};

type DormantUser = { user_id: string; email: string; full_name: string | null; created_at: string };

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

const formatCurrency = (cents: number) => `£${(cents / 100).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const timeAgo = (d: string | null) => {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Stat Card ───
const StatCard = ({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) => (
  <div className="bg-surface border border-border rounded-lg p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
    </div>
    <div className={`font-mono text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

// ─── Plan Badge ───
const PlanBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: "bg-primary/15 text-primary",
    free: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive",
    past_due: "bg-accent/15 text-accent",
  };
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase ${colors[status] || colors.free}`}>
      {status}
    </span>
  );
};

// ─── Status Indicator ───
const StatusIndicator = ({ status, label, detail }: { status: "green" | "amber" | "red"; label: string; detail: string }) => {
  const colors = { green: "bg-primary", amber: "bg-accent", red: "bg-destructive" };
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
};

// ─── Main Component ───
const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [signupsChart, setSignupsChart] = useState<any[]>([]);
  const [remindersChart, setRemindersChart] = useState<any[]>([]);
  const [paidChart, setPaidChart] = useState<any[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [dormantUsers, setDormantUsers] = useState<DormantUser[]>([]);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [showDormant, setShowDormant] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState("");
  const [smsStatus, setSmsStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [smsError, setSmsError] = useState("");
  const [smsSid, setSmsSid] = useState("");

  // Test Email state
  const [testEmail, setTestEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailError, setEmailError] = useState("");
  const [emailId, setEmailId] = useState("");

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!data) { navigate("/dashboard"); return; }
    setIsAdmin(true);
    setLoading(false);
    loadAllData();
  };

  const loadAllData = useCallback(async () => {
    try {
      const [statsData, usersData, signups, reminders, paid, healthData, dormant, audit] = await Promise.all([
        adminFetch("stats"),
        adminFetch("users"),
        adminFetch("signups-chart"),
        adminFetch("reminders-chart"),
        adminFetch("paid-chart"),
        adminFetch("health"),
        adminFetch("dormant-users"),
        adminFetch("audit&days=7"),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setSignupsChart(signups);
      setRemindersChart(reminders);
      setPaidChart(paid);
      setHealth(healthData);
      setDormantUsers(dormant.dormant_users || []);
      setAuditLogs(audit.logs || []);
    } catch (err: any) {
      console.error("Admin load error:", err);
      toast({ title: "Error loading admin data", description: err.message, variant: "destructive" });
    }
  }, []);

  const handleUpdatePlan = async (userId: string, newStatus: string) => {
    setUpdatingPlan(true);
    try {
      await adminFetch("update-subscription", "POST", { user_id: userId, subscription_status: newStatus });
      toast({ title: "Plan updated", description: `Set to ${newStatus}` });
      setSelectedUser(prev => prev ? { ...prev, subscription_status: newStatus } : null);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, subscription_status: newStatus } : u));
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
    setUpdatingPlan(false);
  };

  const handleSendActivation = async (email: string, name: string | null) => {
    try {
      await adminFetch("send-activation-email", "POST", { email, name: name || "" });
      toast({ title: "Activation email sent", description: `Sent to ${email}` });
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUser(true);
    try {
      await adminFetch("delete-user", "POST", { user_id: userId });
      toast({ title: "User deleted", description: "User and all related data have been removed" });
      setSelectedUser(null);
      setConfirmDelete(false);
      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
    setDeletingUser(false);
  };

  const handleCancelSubscription = async (userId: string) => {
    setCancellingSubscription(true);
    try {
      await adminFetch("cancel-subscription", "POST", { user_id: userId });
      toast({ title: "Subscription cancelled", description: "Stripe subscription has been cancelled" });
      setSelectedUser(prev => prev ? { ...prev, subscription_status: "cancelled" } : null);
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, subscription_status: "cancelled" } : u));
    } catch (err: any) {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    }
    setCancellingSubscription(false);
  };

  const handleRefund = async (userId: string) => {
    setRefunding(true);
    try {
      const result = await adminFetch("refund", "POST", { user_id: userId });
      const amount = result.amount ? `£${(result.amount / 100).toFixed(2)}` : "";
      toast({ title: "Payment refunded", description: `Refunded ${amount}` });
    } catch (err: any) {
      toast({ title: "Refund failed", description: err.message, variant: "destructive" });
    }
    setRefunding(false);
  };

  const formatPhoneE164 = (raw: string): string => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    if (raw.startsWith("+")) return raw;
    return `+${digits}`;
  };

  const isPhoneValid = testPhone.replace(/\D/g, "").length >= 10;
  const isEmailValid = testEmail.includes("@") && testEmail.includes(".");

  const sendTestSms = async () => {
    if (!isPhoneValid) return;
    setSmsStatus("sending");
    setSmsError("");
    setSmsSid("");
    const { data, error } = await supabase.functions.invoke("test-sms", {
      body: { phone: formatPhoneE164(testPhone) },
    });
    if (error || !data?.success) {
      setSmsStatus("error");
      setSmsError(data?.error || error?.message || "Unknown error");
    } else {
      setSmsStatus("success");
      setSmsSid(data.sid || "");
    }
  };

  const sendTestEmail = async () => {
    if (!isEmailValid) return;
    setEmailStatus("sending");
    setEmailError("");
    setEmailId("");
    const { data, error } = await supabase.functions.invoke("test-email", {
      body: { email: testEmail },
    });
    if (error || !data?.success) {
      setEmailStatus("error");
      setEmailError(data?.error || error?.message || "Unknown error");
    } else {
      setEmailStatus("success");
      setEmailId(data.id || "");
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.full_name?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesPlan = planFilter === "all" || u.subscription_status === planFilter;
    return matchesSearch && matchesPlan;
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "health", label: "System Health", icon: Heart },
    { id: "audit", label: "Audit Log", icon: Shield },
  ];

  return (
    <div className="min-h-screen pt-16 sm:pt-20">
      <div className="container-main py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Internal PayNudge administration</p>
          </div>
          <button onClick={loadAllData} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 sm:mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {!stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(8).fill(null).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="MRR" value={formatCurrency(stats.mrr)} sub={`ARR: ${formatCurrency(stats.arr)}`} icon={DollarSign} accent />
                  <StatCard label="Total Users" value={stats.total_users} sub={`${stats.active_users_last_30_days} active (30d)`} icon={Users} />
                  <StatCard label="Paid Users" value={stats.paid_users} sub={`${stats.conversion_rate}% conversion`} icon={TrendingUp} accent />
                  <StatCard label="Free Users" value={stats.free_users} sub={`${stats.churn_this_month} churned this month`} icon={UserPlus} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="New Today" value={stats.new_users_today} sub={`${stats.new_users_this_week} this week`} icon={UserPlus} />
                  <StatCard label="New This Month" value={stats.new_users_this_month} icon={UserPlus} />
                  <StatCard label="Invoices Synced" value={stats.total_invoices_synced.toLocaleString()} icon={BarChart3} />
                  <StatCard label="Reminders Sent" value={stats.total_reminders_sent.toLocaleString()} sub={`${stats.reminders_sent_today} today`} icon={Zap} accent />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Email Success" value={`${stats.email_success_rate}%`} sub={`${stats.emails_sent} total`} icon={Mail} />
                  <StatCard label="SMS Success" value={`${stats.sms_success_rate}%`} sub={`${stats.sms_sent} total`} icon={Zap} />
                  <StatCard label="Xero Connected" value={stats.xero_connected_count} icon={Check} />
                  <StatCard label="Gmail Connected" value={stats.gmail_connected_count} icon={Mail} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                className="bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="past_due">Past Due</option>
              </select>
              <button onClick={() => setShowDormant(!showDormant)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  showDormant ? "bg-accent/10 text-accent border-accent/30" : "bg-surface border-border text-muted-foreground"
                }`}>
                Dormant ({dormantUsers.length})
              </button>
            </div>

            {/* Dormant users section */}
            {showDormant && dormantUsers.length > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Dormant Users — signed up 7+ days ago, never synced Xero
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dormantUsers.map(u => (
                    <div key={u.user_id} className="flex items-center justify-between bg-surface border border-border rounded-md px-4 py-2.5 text-sm">
                      <div>
                        <span className="font-medium">{u.full_name || "No name"}</span>
                        <span className="text-muted-foreground ml-2">{u.email}</span>
                        <span className="text-muted-foreground ml-2 text-xs">Signed up {formatDate(u.created_at)}</span>
                      </div>
                      <button onClick={() => handleSendActivation(u.email, u.full_name)}
                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-md font-medium hover:bg-primary/20 transition-colors flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Send activation email
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-left p-4 font-medium">Signed Up</th>
                      <th className="text-left p-4 font-medium">Last Active</th>
                      <th className="text-center p-4 font-medium">Xero</th>
                      <th className="text-center p-4 font-medium">Gmail</th>
                      <th className="text-right p-4 font-medium">Invoices</th>
                      <th className="text-right p-4 font-medium">Reminders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.user_id} onClick={() => { setSelectedUser(u); setConfirmDelete(false); }}
                        className="border-b border-border hover:bg-surface-hover cursor-pointer transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{u.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="p-4"><PlanBadge status={u.subscription_status} /></td>
                        <td className="p-4 text-muted-foreground text-xs font-mono">{formatDate(u.created_at)}</td>
                        <td className="p-4 text-muted-foreground text-xs">{timeAgo(u.last_sign_in_at)}</td>
                        <td className="p-4 text-center">{u.xero_connected ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                        <td className="p-4 text-center">{u.gmail_connected ? <Check className="w-4 h-4 text-primary mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />}</td>
                        <td className="p-4 text-right font-mono">{u.invoices_synced}</td>
                        <td className="p-4 text-right font-mono">{u.reminders_sent}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── CAMPAIGNS TAB ─── */}
        {activeTab === "campaigns" && <AdminCampaignsTab />}

        {/* ─── ANALYTICS TAB ─── */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Signups Chart */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-4">New Signups — Last 30 Days</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signupsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 18%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(222 14% 53%)" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(222 14% 53%)" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(220 16% 9%)", border: "1px solid hsl(222 16% 18%)", borderRadius: "8px", fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="#00D4A8" strokeWidth={2} dot={false} name="Signups" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reminders Chart */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-4">Reminders Sent — Last 30 Days</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={remindersChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 18%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(222 14% 53%)" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(222 14% 53%)" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(220 16% 9%)", border: "1px solid hsl(222 16% 18%)", borderRadius: "8px", fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="email" stackId="a" fill="#00D4A8" name="Email" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sms" stackId="a" fill="#F5A623" name="SMS" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cumulative Paid Users */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-4">Cumulative Paid Users</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paidChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 18%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(222 14% 53%)" }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(222 14% 53%)" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(220 16% 9%)", border: "1px solid hsl(222 16% 18%)", borderRadius: "8px", fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="#F5A623" strokeWidth={2} dot={false} name="Paid Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ─── SYSTEM HEALTH TAB ─── */}
        {activeTab === "health" && health && (
          <div className="space-y-6">
            {/* Status cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusIndicator
                status={health.last_xero_sync && (Date.now() - new Date(health.last_xero_sync).getTime()) < 2 * 3600000 ? "green" : health.last_xero_sync ? "amber" : "red"}
                label="Xero Sync"
                detail={health.last_xero_sync ? `Last run: ${timeAgo(health.last_xero_sync)}` : "Never run"}
              />
              <StatusIndicator
                status={health.last_reminder_run && (Date.now() - new Date(health.last_reminder_run).getTime()) < 2 * 3600000 ? "green" : health.last_reminder_run ? "amber" : "red"}
                label="Reminder Engine"
                detail={health.last_reminder_run ? `Last run: ${timeAgo(health.last_reminder_run)}` : "Never run"}
              />
              <StatusIndicator
                status={health.email_failures_24h === 0 ? "green" : health.email_failures_24h < 5 ? "amber" : "red"}
                label="Resend API"
                detail={`${health.email_failures_24h} failures (24h)`}
              />
              <StatusIndicator
                status={health.sms_failures_24h === 0 ? "green" : health.sms_failures_24h < 5 ? "amber" : "red"}
                label="Twilio"
                detail={`${health.sms_failures_24h} failures (24h)`}
              />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-lg p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${health.errors_this_week > 0 ? "bg-destructive/10" : "bg-primary/10"}`}>
                  <AlertCircle className={`w-5 h-5 ${health.errors_this_week > 0 ? "text-destructive" : "text-primary"}`} />
                </div>
                <div>
                  <div className="font-mono text-xl font-bold">{health.errors_this_week}</div>
                  <div className="text-xs text-muted-foreground">Errors this week</div>
                </div>
              </div>
              <div className="bg-surface border border-border rounded-lg p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${health.warnings_this_week > 0 ? "bg-accent/10" : "bg-primary/10"}`}>
                  <AlertTriangle className={`w-5 h-5 ${health.warnings_this_week > 0 ? "text-accent" : "text-primary"}`} />
                </div>
                <div>
                  <div className="font-mono text-xl font-bold">{health.warnings_this_week}</div>
                  <div className="text-xs text-muted-foreground">Warnings this week</div>
                </div>
              </div>
            </div>

            {/* Broken Xero connections */}
            {health.broken_xero_connections.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Expired Xero Connections ({health.broken_xero_connections.length})
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {health.broken_xero_connections.map((o: any) => (
                    <div key={o.id}>{o.company_name} — expired {timeAgo(o.xero_token_expiry)}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent errors table */}
            {health.recent_errors.length > 0 && (
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-semibold">Recent Errors (7 days)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-4 font-medium">Time</th>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Action</th>
                        <th className="text-left p-4 font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {health.recent_errors.map((e: any) => (
                        <tr key={e.id} className="border-b border-border">
                          <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                          <td className="p-4 text-xs">{e.user_email}</td>
                          <td className="p-4 font-medium">{e.action}</td>
                          <td className="p-4 text-muted-foreground max-w-xs truncate">{e.detail || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Integration Test Tools ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Test SMS Card */}
              <div className="bg-surface border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Send Test SMS</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Verify your Twilio integration is working correctly.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={testPhone}
                    onChange={(e) => { setTestPhone(e.target.value); setSmsStatus("idle"); }}
                    className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <button
                    onClick={sendTestSms}
                    disabled={!isPhoneValid || smsStatus === "sending"}
                    className="px-4 py-2 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {smsStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    {smsStatus === "sending" ? "Sending…" : "Send Test SMS"}
                  </button>
                </div>
                {smsStatus === "success" && (
                  <div className="flex items-start gap-2 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div>SMS delivered successfully — Twilio is working ✓</div>
                      {smsSid && <div className="font-mono text-[10px] text-muted-foreground mt-1">{smsSid}</div>}
                    </div>
                  </div>
                )}
                {smsStatus === "error" && (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="font-mono text-xs">{smsError}</div>
                  </div>
                )}
              </div>

              {/* Test Email Card */}
              <div className="bg-surface border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Send Test Email</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Verify your Resend integration and domain are working correctly.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={testEmail}
                    onChange={(e) => { setTestEmail(e.target.value); setEmailStatus("idle"); }}
                    className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={sendTestEmail}
                    disabled={!isEmailValid || emailStatus === "sending"}
                    className="px-4 py-2 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {emailStatus === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {emailStatus === "sending" ? "Sending…" : "Send Test Email"}
                  </button>
                </div>
                {emailStatus === "success" && (
                  <div className="flex items-start gap-2 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div>Email sent successfully — Resend is working ✓</div>
                      {emailId && <div className="font-mono text-[10px] text-muted-foreground mt-1">{emailId}</div>}
                    </div>
                  </div>
                )}
                {emailStatus === "error" && (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="font-mono text-xs">{emailError}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── AUDIT LOG TAB ─── */}
        {activeTab === "audit" && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">Action</th>
                    <th className="text-left p-4 font-medium">Detail</th>
                    <th className="text-left p-4 font-medium">Level</th>
                    <th className="text-left p-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-border">
                      <td className="p-4 font-bold">{log.action}</td>
                      <td className="p-4 text-muted-foreground max-w-sm truncate">{log.detail || "—"}</td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase ${
                          log.level === "success" ? "bg-primary/15 text-primary"
                          : log.level === "error" ? "bg-destructive/15 text-destructive"
                          : log.level === "warning" ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground"
                        }`}>{log.level}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No audit logs found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── USER DETAIL DRAWER ─── */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-md bg-background border-l border-border h-full overflow-y-auto animate-slide-in-right"
              onClick={e => e.stopPropagation()}>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">User Detail</h2>
                  <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Name</div>
                    <div className="font-medium">{selectedUser.full_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Email</div>
                    <div className="font-mono text-sm">{selectedUser.email}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">Plan</div>
                      <PlanBadge status={selectedUser.subscription_status} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">Signed Up</div>
                      <div className="text-sm">{formatDate(selectedUser.created_at)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">Last Active</div>
                      <div className="text-sm">{timeAgo(selectedUser.last_sign_in_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase mb-1">Invoices</div>
                      <div className="font-mono text-sm">{selectedUser.invoices_synced}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {selectedUser.xero_connected ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/40" />}
                      <span className="text-sm">Xero</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUser.gmail_connected ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/40" />}
                      <span className="text-sm">Gmail</span>
                    </div>
                  </div>
                </div>

                {/* Plan actions */}
                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground uppercase mb-3">Change Plan</div>
                  <div className="flex gap-2 flex-wrap">
                    {["free", "active", "cancelled"].map(s => (
                      <button key={s} disabled={updatingPlan || selectedUser.subscription_status === s}
                        onClick={() => handleUpdatePlan(selectedUser.user_id, s)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                          selectedUser.subscription_status === s
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-surface border-border text-muted-foreground hover:text-foreground"
                        }`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stripe actions */}
                {selectedUser.subscription_status === "active" && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="text-xs text-muted-foreground uppercase mb-3">Stripe Actions</div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleCancelSubscription(selectedUser.user_id)}
                        disabled={cancellingSubscription}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                      >
                        {cancellingSubscription ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                        Cancel Subscription
                      </button>
                      <button
                        onClick={() => handleRefund(selectedUser.user_id)}
                        disabled={refunding}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                      >
                        {refunding ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        Refund Last Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* Danger zone */}
                <div className="border-t border-destructive/20 pt-4">
                  <div className="text-xs text-destructive uppercase mb-3">Danger Zone</div>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete User
                    </button>
                  ) : (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-3">
                      <p className="text-xs text-destructive font-medium">
                        Are you sure? This will permanently delete <strong>{selectedUser.email}</strong> and all their data. This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(selectedUser.user_id)}
                          disabled={deletingUser}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                          {deletingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Yes, Delete Forever
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="text-xs px-3 py-1.5 rounded-md font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
