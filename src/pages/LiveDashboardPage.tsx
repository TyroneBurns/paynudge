import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { deriveInvoiceStatus, formatDueDate } from "@/lib/invoiceStatus";

const LiveDashboardPage = () => {
  const { user, profile, subscription, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("xero") === "connected") {
      toast.success("Xero connected successfully!");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadData().then(() => {
      // Auto-sync Xero on dashboard load if connected
      autoSyncXero();
    });
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: orgData } = await supabase.from("organisations").select("*").eq("user_id", user.id).maybeSingle();
    setOrg(orgData);
    if (orgData) {
      const [invRes, auditRes] = await Promise.all([
        supabase.from("invoices").select("*, clients(name), reminders(id, sent_at, method, status)").eq("organisation_id", orgData.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("audit_log").select("*").eq("organisation_id", orgData.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setInvoices(invRes.data || []);
      setAuditLogs(auditRes.data || []);
    }
    setLoading(false);
  };

  const connectXero = async () => {
    const { data } = await supabase.functions.invoke("xero-auth");
    if (data?.url) window.location.href = data.url;
  };

  const autoSyncXero = async () => {
    if (autoSynced) return;
    // Check if org has Xero connected after data loads
    const { data: orgData } = await supabase.from("organisations").select("xero_tenant_id").eq("user_id", user!.id).maybeSingle();
    if (!orgData?.xero_tenant_id) return;
    setAutoSynced(true);
    setSyncing(true);
    const { error } = await supabase.functions.invoke("xero-sync");
    if (error) {
      console.error("Auto Xero sync error:", error);
    } else {
      toast.success("Xero synced automatically");
    }
    await loadData();
    setSyncing(false);
  };

  const syncXero = async () => {
    setSyncing(true);
    const { error } = await supabase.functions.invoke("xero-sync");
    if (error) {
      toast.error("Sync failed — please try again");
      console.error("Xero sync error:", error);
    } else {
      toast.success("Xero sync complete");
    }
    await loadData();
    setSyncing(false);
  };

  // statusColors removed — now using deriveInvoiceStatus

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const defaultCurrency = org?.default_currency || "USD";
  const totalOutstanding = invoices.filter(i => i.status !== "paid" && i.status !== "voided").reduce((s, i) => s + Number(i.amount), 0);
  const totalRecovered = paidInvoices.reduce((s, i) => s + Number(i.amount), 0);
  const recoveryRate = totalInvoices > 0 ? Math.round((paidInvoices.length / totalInvoices) * 100) : 0;
  const overdueInvoices = invoices.filter(i => i.status === "overdue");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-primary/15 bg-surface px-5 py-6 shadow-[0_16px_42px_rgba(0,0,0,0.24)] sm:px-6 lg:px-7">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-primary">AI collections cockpit</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-[58ch]">Welcome back, {profile?.full_name || profile?.email}. This customer dashboard now shares the same premium language as your Control Centre while keeping the workflow lighter and easier to operate.</p>
        </div>
        <div className="flex gap-2">
          {!org?.xero_tenant_id ? (
            <button onClick={connectXero} className="px-5 py-2.5 rounded-md font-bold text-sm bg-primary text-primary-foreground">Connect Xero</button>
          ) : (
            <button onClick={syncXero} disabled={syncing} className="px-5 py-2.5 rounded-md font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50">
              {syncing ? "Syncing..." : "↻ Sync Xero"}
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(syncing ? Array(4).fill(null) : [
          { label: "Total Invoices", value: totalInvoices.toString(), icon: "📄" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding, defaultCurrency), icon: "💰", amber: true },
          { label: "Recovered", value: formatCurrency(totalRecovered, defaultCurrency), icon: "📈", teal: true },
          { label: "Recovery Rate", value: `${recoveryRate}%`, icon: "🎯", teal: true },
        ]).map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            {s ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{s.icon}</span>
                  <div className="text-xs text-muted-foreground tracking-wider uppercase">{s.label}</div>
                </div>
                <div className={`font-mono text-2xl font-bold ${s.teal ? "text-primary" : s.amber ? "text-accent" : ""}`}>{s.value}</div>
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-7 w-20" />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
      {/* Recent invoices */}
      <div className="bg-surface border border-border rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h3 className="font-display font-bold">Recent Invoices</h3>
          <Link to="/invoices" className="text-sm text-primary font-medium">View All</Link>
        </div>
        {syncing ? (
          <div className="p-4 space-y-3">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {org?.xero_tenant_id ? "No invoices synced yet. Click Sync Xero above." : "Connect Xero to start syncing invoices."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">Invoice</th>
                <th className="text-left p-4 font-medium">Client</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Due</th>
                <th className="text-left p-4 font-medium">Status / Reminders</th>
              </tr></thead>
              <tbody>
                {invoices.slice(0, 5).map((inv) => {
                  const derived = deriveInvoiceStatus(inv);
                  return (
                    <tr key={inv.id} className="border-b border-border hover:bg-primary/[0.02]">
                      <td className="p-4 font-mono">{inv.invoice_number || "—"}</td>
                      <td className="p-4">{inv.clients?.name || "—"}</td>
                      <td className="p-4">{formatCurrency(Number(inv.amount), inv.currency)}</td>
                      <td className="p-4 whitespace-nowrap">{formatDueDate(inv.due_date)}</td>
                      <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded font-bold whitespace-nowrap ${derived.colorClass}`}>{derived.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-8">
      {/* Collection Rate Over Time */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <h3 className="font-display font-bold mb-1">Collection Rate Over Time</h3>
        <p className="text-xs text-muted-foreground mb-6">Track payment collection trends</p>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Historical data will appear as you collect payments over time
        </div>
      </div>

      {/* Overdue Aging Breakdown */}
      <div className="bg-surface border border-border rounded-md p-6 mb-8">
        <h3 className="font-display font-bold mb-1">Overdue Aging Breakdown</h3>
        <p className="text-xs text-muted-foreground mb-6">Distribution of overdue invoices by age</p>
        {overdueInvoices.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No overdue invoices</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Aging data will appear once invoices are synced</p>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            {overdueInvoices.length} overdue invoices
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <h3 className="font-display font-bold mb-1">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mb-6">Latest actions and events</p>
        {auditLogs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <Activity className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No activity yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Activity will appear as reminders are sent</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                </div>
                {log.detail && <span className="text-xs text-muted-foreground">{log.detail}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};

export default LiveDashboardPage;
