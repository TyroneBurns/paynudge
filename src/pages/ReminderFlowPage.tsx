import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Plus, Mail, MessageSquare, Trash2, Check, Eye, Code2, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReminderRule {
  id: string;
  days_after_due: number;
  method: "email" | "sms";
  message_template: string;
  subject_line: string;
  is_active: boolean;
  organisation_id: string;
}

const DEFAULT_SEEDS: Omit<ReminderRule, "id" | "organisation_id">[] = [
  {
    days_after_due: 0,
    method: "email",
    subject_line: "Invoice {invoice_number} is due today",
    message_template: "Hi {client_name}, just a friendly reminder that invoice {invoice_number} for {amount} is due today. If you've already arranged payment please ignore this message. Pay online: {payment_url}",
    is_active: true,
  },
  {
    days_after_due: 3,
    method: "email",
    subject_line: "Invoice {invoice_number} — payment overdue",
    message_template: "Hi {client_name}, invoice {invoice_number} for {amount} was due on {due_date} and we haven't received payment yet. If there's an issue please reply to this email. Pay online: {payment_url}",
    is_active: true,
  },
  {
    days_after_due: 7,
    method: "email",
    subject_line: "Reminder: Invoice {invoice_number} now 7 days overdue",
    message_template: "Hi {client_name}, invoice {invoice_number} for {amount} due on {due_date} is now 7 days overdue. Please arrange payment as soon as possible. Pay here: {payment_url}",
    is_active: true,
  },
  {
    days_after_due: 14,
    method: "email",
    subject_line: "Final notice: Invoice {invoice_number}",
    message_template: "Hi {client_name}, invoice {invoice_number} for {amount} is now 14 days overdue. This is a final notice before we consider further action. If you have already paid please send remittance to support@paynudge.co. Pay immediately: {payment_url}",
    is_active: true,
  },
];

const VARIABLES = [
  { label: "Client Name", value: "{client_name}" },
  { label: "Invoice #", value: "{invoice_number}" },
  { label: "Amount", value: "{amount}" },
  { label: "Due Date", value: "{due_date}" },
  { label: "Pay Link", value: "{payment_url}" },
];

const DUMMY_DATA: Record<string, string> = {
  "{client_name}": "Sarah Johnson",
  "{invoice_number}": "INV-0042",
  "{amount}": "£1,250.00",
  "{due_date}": "15 March 2026",
  "{payment_url}": "https://paynudge.co",
};

function substituteVars(text: string): string {
  let result = text;
  for (const [k, v] of Object.entries(DUMMY_DATA)) {
    result = result.split(k).join(v);
  }
  return result;
}

// ── Mini email preview (matching send-reminders HTML style) ─────────────────
function EmailPreview({ subject, body, daysOverdue, logoUrl, companyName }: { subject: string; body: string; daysOverdue: number; logoUrl?: string | null; companyName?: string }) {
  const statusColor = daysOverdue >= 14 ? "#DC2626" : daysOverdue >= 7 ? "#D97706" : "#00D4A8";
  const statusText = daysOverdue === 0 ? "Due Today" : `${daysOverdue} Days Overdue`;
  const renderedSubject = substituteVars(subject);
  const renderedBody = substituteVars(body);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[#f4f4f5]">
      {/* Email header */}
      <div className="bg-background border-b border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground mb-1">From: PayNudge &lt;reminders@paynudge.co&gt;</p>
        <p className="text-[11px] text-muted-foreground mb-1">To: {DUMMY_DATA["{client_name}"]} &lt;accounts@acme.com&gt;</p>
        <p className="text-sm font-semibold">{renderedSubject}</p>
      </div>
      {/* Email body */}
      <div className="p-4 flex justify-center">
        <div className="bg-white rounded-xl shadow-sm max-w-[400px] w-full overflow-hidden">
          <div className="p-6">
            {/* Logo */}
            <div className="text-center mb-5">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName || "Company"} className="mx-auto" style={{ maxHeight: 48, maxWidth: 200, objectFit: "contain", display: "block" }} />
              ) : (
                <span className="font-extrabold text-sm">{companyName || "Your Company"}</span>
              )}
            </div>
            {/* Status badge */}
            <span
              className="inline-block text-[10px] font-bold text-white px-2.5 py-1 rounded-full uppercase tracking-wider mb-4"
              style={{ backgroundColor: statusColor }}
            >
              {statusText}
            </span>
            {/* Body */}
            <p className="text-sm leading-relaxed text-[#52525b] whitespace-pre-wrap">{renderedBody}</p>
            {/* Invoice card */}
            <div className="mt-5 bg-[#f9fafb] border border-[#e4e4e7] rounded-lg p-4">
              <p className="text-[10px] font-bold text-[#18181b] uppercase tracking-wider mb-3">Invoice Details</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[#71717a]">Invoice number</span><span className="font-semibold text-[#18181b]">{DUMMY_DATA["{invoice_number}"]}</span></div>
                <div className="flex justify-between"><span className="text-[#71717a]">Due date</span><span className="font-semibold text-[#18181b]">{DUMMY_DATA["{due_date}"]}</span></div>
                <div className="flex justify-between"><span className="text-[#71717a]">Amount due</span><span className="font-bold text-[#18181b]">{DUMMY_DATA["{amount}"]}</span></div>
              </div>
            </div>
            {/* CTA */}
            <div className="mt-5 text-center">
              <span className="inline-block bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-md">Pay Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ReminderFlowPage = () => {
  const { user, loading, subscription } = useAuth();
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);
  const [orgCompanyName, setOrgCompanyName] = useState<string>("");
  const [fetching, setFetching] = useState(true);

  // Edit modal state
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [editDays, setEditDays] = useState(0);
  const [editMethod, setEditMethod] = useState<"email" | "sms">("email");
  const [editSubject, setEditSubject] = useState("");
  const [editTemplate, setEditTemplate] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deletingRule, setDeletingRule] = useState<ReminderRule | null>(null);

  const fetchRules = useCallback(async (organisationId: string) => {
    const { data } = await supabase
      .from("reminder_rules")
      .select("*")
      .eq("organisation_id", organisationId)
      .order("days_after_due");

    if (data && data.length > 0) {
      setRules(data.map((r: any) => ({ ...r, method: r.method as "email" | "sms", subject_line: r.subject_line ?? "" })));
    } else {
      const inserts = DEFAULT_SEEDS.map((s) => ({ ...s, organisation_id: organisationId }));
      const { data: created, error } = await supabase.from("reminder_rules").insert(inserts as any).select();
      if (error) {
        console.error("Failed to seed reminder rules:", error);
      }
      if (created && created.length > 0) {
        setRules(created.map((r: any) => ({ ...r, method: r.method as "email" | "sms", subject_line: r.subject_line ?? "" })));
      }
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let { data: org } = await supabase.from("organisations").select("id, logo_url, company_name, default_currency").eq("user_id", user.id).maybeSingle();
      
      // Auto-create organisation if none exists (user skipped onboarding)
      if (!org) {
        const { data: newOrg } = await supabase.from("organisations").insert({
          user_id: user.id,
          company_name: "",
          default_currency: "USD",
        }).select("id, logo_url, company_name, default_currency").single();
        org = newOrg;
      }

      if (org) {
        setOrgId(org.id);
        setOrgLogoUrl(org.logo_url);
        setOrgCompanyName(org.company_name || "");
        if (org.default_currency) {
          try {
            DUMMY_DATA["{amount}"] = new Intl.NumberFormat("en-GB", { style: "currency", currency: org.default_currency }).format(1250);
          } catch {}
        }
        await fetchRules(org.id);
      } else {
        setFetching(false);
      }
    })();
  }, [user, fetchRules]);

  if (loading || fetching)
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  // --- Handlers ---

  const openEdit = (rule: ReminderRule) => {
    setEditingRule(rule);
    setEditDays(rule.days_after_due);
    setEditMethod(rule.method);
    setEditSubject(rule.subject_line || "");
    setEditTemplate(rule.message_template);
    setShowPreview(false);
  };

  const insertVariable = (variable: string, target: "body" | "subject") => {
    if (target === "body" && bodyRef.current) {
      const el = bodyRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = editTemplate.slice(0, start) + variable + editTemplate.slice(end);
      setEditTemplate(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else if (target === "subject" && subjectRef.current) {
      const el = subjectRef.current;
      const start = el.selectionStart ?? editSubject.length;
      const end = el.selectionEnd ?? editSubject.length;
      const newVal = editSubject.slice(0, start) + variable + editSubject.slice(end);
      setEditSubject(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const saveEdit = async () => {
    if (!editingRule) return;
    setSaving(true);
    const { error } = await supabase
      .from("reminder_rules")
      .update({
        days_after_due: editDays,
        method: editMethod,
        message_template: editTemplate,
        subject_line: editSubject,
      } as any)
      .eq("id", editingRule.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save changes");
      return;
    }
    toast.success("Reminder rule updated");
    setEditingRule(null);
    if (orgId) fetchRules(orgId);
  };

  const isFree = !subscription?.subscribed;
  const FREE_STEP_LIMIT = 4;

  const addRule = async () => {
    if (!orgId) return;
    if (rules.length >= 10) {
      toast.error("Maximum of 10 reminder steps allowed");
      return;
    }
    if (isFree && rules.length >= FREE_STEP_LIMIT) {
      toast.error("Upgrade to the Paid plan to add more reminder steps");
      return;
    }
    const maxDay = rules.length > 0 ? Math.max(...rules.map((r) => r.days_after_due)) : -1;
    const newDay = maxDay + 7;

    const { error } = await supabase.from("reminder_rules").insert({
      organisation_id: orgId,
      days_after_due: newDay,
      method: "email" as const,
      subject_line: `Reminder: Invoice {invoice_number}`,
      message_template: "Hi {client_name}, invoice {invoice_number} for {amount} is overdue. Please arrange payment: {payment_url}",
      is_active: true,
    } as any);
    if (error) {
      toast.error("Failed to add reminder step");
      return;
    }
    toast.success("New reminder step added");
    fetchRules(orgId);
  };

  const confirmDelete = async () => {
    if (!deletingRule || !orgId) return;
    const { error } = await supabase.from("reminder_rules").delete().eq("id", deletingRule.id);
    if (error) {
      toast.error("Failed to delete reminder step");
    } else {
      toast.success("Reminder step deleted");
      fetchRules(orgId);
    }
    setDeletingRule(null);
  };

  const labelForDay = (d: number) => (d === 0 ? "On due date" : `Day ${d} after due date`);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-xl font-bold">Default Chase Sequence</h1>
        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Default</span>
        <span className="ml-auto text-sm text-muted-foreground">{rules.length}/10</span>
        <button
          onClick={addRule}
          className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-8">{rules.length} steps · Click a step to edit</p>

      {isFree && rules.length >= FREE_STEP_LIMIT && (
        <div className="border-2 border-primary/40 bg-primary/5 rounded-lg p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-primary text-sm">Free plan limit reached ({FREE_STEP_LIMIT} steps)</p>
            <p className="text-sm text-muted-foreground">Upgrade to add up to 10 steps per flow and create custom reminder flows.</p>
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

      {/* Timeline */}
      <div className="relative flex flex-col items-center">
        {rules.map((rule, index) => (
          <div key={rule.id} className="relative flex flex-col items-center w-full max-w-[440px]">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 z-10" />

            <div
              onClick={() => openEdit(rule)}
              className="w-full border border-border rounded-lg p-5 my-1 bg-background hover:border-muted-foreground/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {labelForDay(rule.days_after_due)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    {rule.method === "email" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                    {rule.method === "email" ? "Email" : "SMS"}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingRule(rule); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {rule.subject_line && rule.method === "email" && (
                <p className="text-sm font-semibold mb-1 truncate">{substituteVars(rule.subject_line)}</p>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{substituteVars(rule.message_template)}</p>
            </div>

            {index < rules.length - 1 && (
              <div className="flex flex-col items-center">
                <div className="w-px h-8 border-l-2 border-dashed border-muted-foreground/30" />
              </div>
            )}
          </div>
        ))}
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">No reminder steps configured.</p>
          <button onClick={addRule} className="text-primary hover:underline text-sm font-medium">
            Add your first step
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-3">
              Edit Reminder Step
              <span className="text-xs font-mono text-muted-foreground font-normal">
                {editingRule && labelForDay(editingRule.days_after_due)}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Days + Method row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Days after due date</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={editDays}
                  onChange={(e) => setEditDays(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMethod("email")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      editMethod === "email"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    onClick={() => setEditMethod("sms")}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      editMethod === "sms"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> SMS
                  </button>
                </div>
              </div>
            </div>

            {/* Subject line (email only) */}
            {editMethod === "email" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Subject line</label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g. Invoice {invoice_number} is due today"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {VARIABLES.map((v) => (
                    <button
                      key={`subj-${v.value}`}
                      onClick={() => insertVariable(v.value, "subject")}
                      className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message body */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                {editMethod === "email" ? "Email body" : "SMS message"}
              </label>
              <textarea
                ref={bodyRef}
                rows={6}
                value={editTemplate}
                onChange={(e) => setEditTemplate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono leading-relaxed"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VARIABLES.map((v) => (
                  <button
                    key={`body-${v.value}`}
                    onClick={() => insertVariable(v.value, "body")}
                    className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview toggle */}
            {editMethod === "email" && (
              <div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPreview ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? "Hide preview" : "Show email preview"}
                </button>
                {showPreview && (
                  <div className="mt-3">
                    <EmailPreview
                      subject={editSubject}
                      body={editTemplate}
                      daysOverdue={editDays}
                      logoUrl={orgLogoUrl}
                      companyName={orgCompanyName}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Save */}
            <button
              onClick={saveEdit}
              disabled={saving}
              className="w-full py-2.5 rounded-md font-bold text-sm bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder step?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {deletingRule && labelForDay(deletingRule.days_after_due).toLowerCase()} reminder step.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReminderFlowPage;
