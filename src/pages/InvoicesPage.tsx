import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";
import { Download, Search, AlertCircle, Mail, Plug, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { deriveInvoiceStatus, formatDueDate } from "@/lib/invoiceStatus";

const InvoicesPage = () => {
  const { user, loading, subscription } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reminderFilter, setReminderFilter] = useState("all");
  const [org, setOrg] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: orgData } = await supabase.from("organisations").select("*").eq("user_id", user.id).maybeSingle();
      setOrg(orgData);
      if (orgData) {
        const { data } = await supabase
          .from("invoices")
          .select("*, clients(name), reminders(id, sent_at, method, status)")
          .eq("organisation_id", orgData.id)
          .order("created_at", { ascending: false });
        setInvoices(data || []);
      }
      setDataLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const connectXero = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("xero-auth");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { toast.error("Failed to start Xero connection"); }
  };

  const exportCSV = () => {
    const headers = ["Invoice #", "Client", "Amount", "Currency", "Issue Date", "Due Date", "Status"];
    const rows = filtered.map((inv) => [
      inv.invoice_number || "", inv.clients?.name || "", inv.amount, inv.currency, inv.issue_date || "", inv.due_date || "", inv.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch = !search || 
      (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.clients?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesReminder = reminderFilter === "all" ||
      (reminderFilter === "sent" && (inv.reminders?.length || 0) > 0) ||
      (reminderFilter === "none" && (inv.reminders?.length || 0) === 0);
    return matchesSearch && matchesStatus && matchesReminder;
  });

  const isFree = !subscription?.subscribed;
  const FREE_INVOICE_LIMIT = 5;
  const invoiceLimitReached = isFree && invoices.length >= FREE_INVOICE_LIMIT;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Invoices</h1>
      <p className="text-muted-foreground text-sm mb-6">Manage and track all your invoices and reminders</p>

      {/* Paywall banner */}
      {invoiceLimitReached && (
        <div className="border-2 border-primary/40 bg-primary/5 rounded-lg p-4 sm:p-5 mb-4 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-primary text-sm">You've reached the {FREE_INVOICE_LIMIT} invoice limit on the Free plan.</p>
            <p className="text-sm text-muted-foreground">Upgrade to Paid to unlock 200 invoices/month, custom templates, and more.</p>
          </div>
          <button
            onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId: "price_1T8J512NdAO1MGU1UCTSlmt2" } });
                if (error) throw error;
                if (data?.url) window.location.href = data.url;
              } catch { toast.error("Failed to start checkout"); }
            }}
            className="px-4 py-2 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.3)] transition-all flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center"
          >
            <Zap className="w-4 h-4" />
            Upgrade Now
          </button>
        </div>
      )}
      {/* Export */}
      <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors mb-6">
        <Download className="w-4 h-4" />
        Export CSV
      </button>

      {/* Connection warnings */}
      {!org?.xero_tenant_id && (
        <div className="border-2 border-amber-400/50 bg-amber-400/5 rounded-lg p-4 sm:p-5 mb-4 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-500 text-sm">Xero not connected.</p>
            <p className="text-sm text-muted-foreground">Connect your Xero account to sync invoices and enable PayNudge.</p>
          </div>
          <button onClick={connectXero} className="px-4 py-2 rounded-md text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center">
            <Plug className="w-4 h-4" />
            Connect Xero
          </button>
        </div>
      )}

      <div className="border-2 border-amber-400/50 bg-amber-400/5 rounded-lg p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <Mail className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-amber-500 text-sm">Gmail not connected.</p>
          <p className="text-sm text-muted-foreground">Connect Gmail to send reminders from your own email address. Reminders will otherwise send from hello@paynudge.co.</p>
        </div>
        <button className="px-4 py-2 rounded-md text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center">
          <Mail className="w-4 h-4" />
          Connect Gmail
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer…"
            className="settings-input !pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="settings-input flex-1">
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </select>
          <select value={reminderFilter} onChange={(e) => setReminderFilter(e.target.value)} className="settings-input flex-1">
            <option value="all">All Reminders</option>
            <option value="sent">Reminder Sent</option>
            <option value="none">No Reminder</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {dataLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading invoices…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No invoices found</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Connect Xero to sync your invoices</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Invoice #</th>
                  <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Due Date</th>
                  <th className="text-left p-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status / Reminders</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const derived = deriveInvoiceStatus(inv);
                  return (
                    <tr key={inv.id} className="border-t border-border hover:bg-primary/[0.02]">
                      <td className="p-3 font-mono">{inv.invoice_number || "—"}</td>
                      <td className="p-3">{inv.clients?.name || "—"}</td>
                      <td className="p-3">{formatCurrency(Number(inv.amount), inv.currency)}</td>
                      <td className="p-3 whitespace-nowrap">{formatDueDate(inv.due_date)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2.5 py-1 rounded font-bold whitespace-nowrap ${derived.colorClass}`}>
                          {derived.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Need this for the empty state
const FileText = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default InvoicesPage;
