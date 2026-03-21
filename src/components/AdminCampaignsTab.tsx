import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Papa from "papaparse";
import {
  Plus, Upload, FileText, Eye, Pause, Play, Trash2, BarChart3,
  ChevronRight, ChevronLeft, Mail, AlertTriangle, Download, X,
  Smile, Paperclip, Monitor, Smartphone, Search, Zap, Check, Send,
  Clock,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ───
type Campaign = {
  id: string; name: string; subject: string; body_html: string;
  body_text: string; attachment_url: string | null;
  status: string; created_at: string; total_contacts: number;
  sent_count: number; open_count: number; click_count: number;
  bounce_count: number; unsub_count: number; sequence_id?: string | null;
  last_batch_at: string | null; contacts_processed: number;
  pending_count?: number; // computed client-side
};

type CampaignContact = {
  id: string; email: string; first_name: string | null;
  last_name: string | null; company_name: string | null;
  status: string; sent_at: string | null; opened_at: string | null;
  clicked_at: string | null; error_message: string | null;
};

// ─── Email Design System ───
const emailWrap = (content: string) => `<div style="background:#f4f4f5;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;">
<div style="height:4px;background:#00D4A8;"></div>
<div style="padding:32px 36px;">
<div style="text-align:center;margin-bottom:28px;">
<div style="display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:20px;color:#18181b;">
<div style="width:16px;height:16px;background:#00D4A8;border-radius:3px;"></div>PayNudge</div>
</div>
${content}
</div>
<div style="padding:20px 36px;border-top:1px solid #e4e4e7;text-align:center;">
<p style="color:#a1a1aa;font-size:12px;margin:0;">PayNudge · Automated invoice reminders for US small businesses · paynudge.co</p>
<p style="margin:8px 0 0;color:#a1a1aa;font-size:11px;">You're receiving this because you have a business relationship with us. To unsubscribe, <a href="{unsubscribe_url}" style="color:#a1a1aa;text-decoration:underline;">click here</a>.</p>
</div>
</div>
</div>`;

const ctaButton = (text: string) =>
  `<p style="margin:28px 0;text-align:center;"><a href="https://paynudge.co" style="display:inline-block;background:#00D4A8;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${text}</a></p>`;

const bodyStyle = 'style="color:#52525b;font-size:15px;line-height:1.7;margin:0 0 16px;"';

// ─── Campaign Templates ───
type CampaignTemplate = {
  id: string;
  name: string;
  tone: string;
  description: string;
  defaultSubject: string;
  dayLabel: string;
  bodyHtml: string;
};

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "friendly-nudge",
    name: "The Friendly Nudge",
    tone: "Warm & curious",
    description: "A soft introduction that opens with empathy about chasing payments and positions PayNudge as the effortless solution.",
    dayLabel: "Day 1",
    defaultSubject: "⚠️ Quick question about your unpaid invoices",
    bodyHtml: emailWrap(`
<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi {first_name},</h1>
<p ${bodyStyle}>Quick question — how much time did you spend last month chasing clients for payment?</p>
<p ${bodyStyle}>For most small business owners, it's hours of awkward follow-up emails, phone calls that go to voicemail, and that uncomfortable feeling every time you have to ask again.</p>
<p ${bodyStyle}>PayNudge connects to your <strong>Xero account</strong> and handles all of it automatically. When an invoice goes unpaid, it sends professional, escalating reminders on your behalf — so you get paid without the awkward conversations.</p>
<p ${bodyStyle}>We've attached a sample reminder so you can see exactly what your clients would receive.</p>
${ctaButton("See how it works")}
<p style="color:#a1a1aa;font-size:13px;margin:0;">Takes 2 minutes to set up. No credit card required. Free to start.</p>
<p style="color:#a1a1aa;font-size:13px;margin:12px 0 0;">— The PayNudge Team</p>`),
  },
  {
    id: "pain-point",
    name: "The Pain Point",
    tone: "Stat-led & urgent",
    description: "Leads with the $825 billion unpaid invoices stat and paints the problem vividly before presenting the automated solution.",
    dayLabel: "Day 3",
    defaultSubject: "🔴 US small businesses are owed $825 billion in unpaid invoices",
    bodyHtml: emailWrap(`
<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi {first_name},</h1>
<p ${bodyStyle}><strong>$825 billion.</strong></p>
<p ${bodyStyle}>That's how much US small businesses are currently owed in unpaid invoices, according to the Federal Reserve.</p>
<p ${bodyStyle}>The average small business waits <strong>72 days to get paid</strong> — more than double the standard 30-day terms. And most owners don't chase because they don't want to damage the relationship.</p>
<p ${bodyStyle}><strong>PayNudge removes the awkwardness entirely.</strong> It connects to Xero and sends automated, professional payment reminders at exactly the right time:</p>
<div style="background:#f4f4f5;border-radius:8px;padding:16px 20px;margin:20px 0;">
<p style="color:#52525b;font-size:14px;margin:0 0 8px;"><strong>📧 Day 0</strong> — Friendly reminder on the due date</p>
<p style="color:#52525b;font-size:14px;margin:0 0 8px;"><strong>📧 Day 3</strong> — Polite follow-up</p>
<p style="color:#52525b;font-size:14px;margin:0 0 8px;"><strong>📧 Day 7</strong> — Firm but professional nudge</p>
<p style="color:#52525b;font-size:14px;margin:0;"><strong>📱 Day 14</strong> — Final notice before escalation</p>
</div>
<p ${bodyStyle}>Your clients get reminded. You stay professional. You get paid faster.</p>
${ctaButton("Start for free — no credit card needed")}
<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
  },
  {
    id: "social-proof",
    name: "The Social Proof",
    tone: "Case study & proof",
    description: "Positions PayNudge through the lens of results — what if your invoices chased themselves? Highlights key benefits and speed.",
    dayLabel: "Day 7",
    defaultSubject: "📎 What if your invoices chased themselves?",
    bodyHtml: emailWrap(`
<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi {first_name},</h1>
<p ${bodyStyle}>Most business owners hate asking for money. So they wait. And wait. And watch their cash flow suffer while clients take their time.</p>
<p ${bodyStyle}><strong>PayNudge flips that dynamic.</strong> Here's how it works:</p>
<div style="margin:20px 0;">
<p style="color:#52525b;font-size:15px;margin:0 0 10px;">1. Connect your Xero account (takes 2 minutes)</p>
<p style="color:#52525b;font-size:15px;margin:0 0 10px;">2. PayNudge monitors your invoices automatically</p>
<p style="color:#52525b;font-size:15px;margin:0 0 10px;">3. When payment is overdue, it sends professionally worded reminders on your behalf — by email and SMS</p>
<p style="color:#52525b;font-size:15px;margin:0;">4. The moment an invoice is paid, reminders stop automatically</p>
</div>
<p ${bodyStyle}>No more awkward phone calls. No more chasing spreadsheets. No more wondering who owes you what.</p>
<p ${bodyStyle}>We've attached a sample reminder email so you can see exactly what your clients receive. It's professional, firm, and gets results.</p>
${ctaButton("Connect Xero and get started free")}
<p style="color:#a1a1aa;font-size:13px;margin:0;">Takes 2 minutes. Works with any Xero account. Cancel anytime.</p>
<p style="color:#a1a1aa;font-size:13px;margin:12px 0 0;">— The PayNudge Team</p>`),
  },
  {
    id: "final-push",
    name: "The Final Push",
    tone: "Urgent & personal",
    description: "A last-chance email with urgency and scarcity. Acknowledges they're busy and makes the free offer crystal clear.",
    dayLabel: "Day 14",
    defaultSubject: "⏰ Last chance — free invoice reminder setup for {company_name}",
    bodyHtml: emailWrap(`
<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi {first_name},</h1>
<p ${bodyStyle}>I wanted to reach out one last time.</p>
<p ${bodyStyle}>If {company_name} has even one overdue invoice right now, PayNudge can start chasing it automatically today — completely free.</p>
<p ${bodyStyle}>No credit card. No setup fees. No contracts.</p>
<p ${bodyStyle}>Just connect your Xero account, and PayNudge starts monitoring your invoices immediately. Every overdue invoice gets a professional reminder sequence sent automatically, in your name, until it's paid.</p>
<p ${bodyStyle}>The average overdue invoice in the US is <strong>$4,200</strong>. How many do you have sitting unpaid right now?</p>
${ctaButton("Claim your free account")}
<p style="color:#a1a1aa;font-size:13px;margin:0;">Setup takes 2 minutes. This offer is always free to start.</p>
<p style="color:#a1a1aa;font-size:13px;margin:12px 0 0;">— The PayNudge Team</p>`),
  },
  {
    id: "re-engagement",
    name: "The Re-engagement",
    tone: "Direct & punchy",
    description: "Short, sharp, and provocative. Just 4 sentences that cut through the noise and drive action.",
    dayLabel: "Day 30",
    defaultSubject: "💰 Still chasing invoices manually, {first_name}?",
    bodyHtml: emailWrap(`
<h1 style="font-size:22px;margin:0 0 20px;color:#18181b;">Hi {first_name},</h1>
<p ${bodyStyle}>Still sending payment follow-ups yourself?</p>
<p ${bodyStyle}>Every day an invoice sits unpaid is money sitting in someone else's bank account instead of yours.</p>
<p ${bodyStyle}>PayNudge automates the whole process — connects to Xero, monitors your invoices, and sends professional reminders automatically. Takes 2 minutes to set up.</p>
<p ${bodyStyle}>It's free to start. No credit card required.</p>
${ctaButton("Try PayNudge free →")}
<p style="color:#a1a1aa;font-size:13px;margin:0;">— The PayNudge Team</p>`),
  },
];

const SEQUENCE_STEPS = [
  { templateId: "friendly-nudge", label: "Send 1: Immediately on activation", defaultOn: true },
  { templateId: "pain-point", label: "Send 2: Day 3 (re-engagement)", defaultOn: true },
  { templateId: "social-proof", label: "Send 3: Day 7 (follow-up)", defaultOn: true },
  { templateId: "final-push", label: "Send 4: Day 14 (final push)", defaultOn: false },
  { templateId: "re-engagement", label: "Send 5: Day 30 (re-engagement)", defaultOn: false },
];

const EMOJI_PICKS = ["⚠️", "🔴", "📎", "💰", "⏰", "🚨", "📧", "💳", "📄", "✅"];

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const formatDateTime = (d: string | null) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-primary/15 text-primary",
    paused: "bg-accent/15 text-accent",
    completed: "bg-primary/15 text-primary",
  };
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

const ContactStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    sent: "bg-primary/15 text-primary",
    opened: "bg-primary/15 text-primary",
    clicked: "bg-primary/20 text-primary",
    bounced: "bg-destructive/15 text-destructive",
    unsubscribed: "bg-accent/15 text-accent",
    converted: "bg-primary/20 text-primary",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};

// ─── Main Component ───
const AdminCampaignsTab = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [testEmail, setTestEmail] = useState(() => localStorage.getItem("admin_test_email") || "");
  const [sendingTestId, setSendingTestId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsCampaign, setAnalyticsCampaign] = useState<Campaign | null>(null);
  const [analyticsContacts, setAnalyticsContacts] = useState<CampaignContact[]>([]);
  const [analyticsFilter, setAnalyticsFilter] = useState("all");

  // Create form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CampaignTemplate | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sequenceSteps, setSequenceSteps] = useState(SEQUENCE_STEPS.map(s => s.defaultOn));

  // CSV import state
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [colMap, setColMap] = useState<Record<string, string>>({ email: "", first_name: "", last_name: "", company_name: "" });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      // Fetch pending counts for active campaigns
      const enriched = await Promise.all(
        (data as Campaign[]).map(async (c) => {
          if (c.status === "active" || c.status === "paused") {
            const { count } = await supabase
              .from("campaign_contacts")
              .select("*", { count: "exact", head: true })
              .eq("campaign_id", c.id)
              .eq("status", "pending");
            return { ...c, pending_count: count ?? 0 };
          }
          return { ...c, pending_count: 0 };
        })
      );
      setCampaigns(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const selectedTemplate = CAMPAIGN_TEMPLATES.find(t => t.id === selectedTemplateId) || null;

  const resetForm = () => {
    setName(""); setSubject(""); setSelectedTemplateId(null);
    setAttachmentUrl(null); setAttachmentName(""); setCsvData([]);
    setCsvColumns([]); setColMap({ email: "", first_name: "", last_name: "", company_name: "" });
    setStep(1); setEditingCampaignId(null);
    setSequenceSteps(SEQUENCE_STEPS.map(s => s.defaultOn));
  };

  const handleSelectTemplate = (template: CampaignTemplate) => {
    setSelectedTemplateId(template.id);
    if (!subject || CAMPAIGN_TEMPLATES.some(t => t.defaultSubject === subject)) {
      setSubject(template.defaultSubject);
    }
    if (!name || CAMPAIGN_TEMPLATES.some(t => t.name === name) || name.startsWith("PayNudge Outreach")) {
      setName(template.name);
    }
  };

  const handleSaveDraft = async () => {
    if (!name.trim()) { toast({ title: "Campaign name required", variant: "destructive" }); return; }
    if (!selectedTemplate && !editingCampaignId) { toast({ title: "Please select a template", variant: "destructive" }); return; }

    try {
      const bodyHtml = selectedTemplate?.bodyHtml || "";
      if (editingCampaignId) {
        await supabase.from("campaigns").update({
          name, subject, body_html: bodyHtml, attachment_url: attachmentUrl,
        }).eq("id", editingCampaignId);
        toast({ title: "Campaign updated" });
      } else {
        const { data, error } = await supabase.from("campaigns").insert({
          name, subject, body_html: bodyHtml, attachment_url: attachmentUrl,
          status: "draft", total_contacts: csvData.length,
        }).select().single();

        if (error) throw error;
        if (data && csvData.length > 0) {
          await importContacts((data as any).id);
        }
        toast({ title: "Campaign saved as draft" });
      }
      setCreating(false); resetForm(); fetchCampaigns();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  const handleActivate = async () => {
    if (!name.trim()) { toast({ title: "Campaign name required", variant: "destructive" }); return; }
    if (!selectedTemplate && !editingCampaignId) { toast({ title: "Please select a template", variant: "destructive" }); return; }

    try {
      const bodyHtml = selectedTemplate?.bodyHtml || "";
      if (editingCampaignId) {
        await supabase.from("campaigns").update({
          name, subject, body_html: bodyHtml, attachment_url: attachmentUrl, status: "active",
        }).eq("id", editingCampaignId);
      } else {
        const { data, error } = await supabase.from("campaigns").insert({
          name, subject, body_html: bodyHtml, attachment_url: attachmentUrl,
          status: "active", total_contacts: csvData.length,
        }).select().single();

        if (error) throw error;
        if (data && csvData.length > 0) {
          await importContacts((data as any).id);
        }
      }
      toast({ title: "Campaign activated!", description: "Emails will be sent at the next scheduled batch." });
      setCreating(false); resetForm(); fetchCampaigns();
    } catch (err: any) {
      toast({ title: "Activation failed", description: err.message, variant: "destructive" });
    }
  };

  const importContacts = async (campaignId: string) => {
    setImporting(true);
    const BATCH = 50;
    const rows = csvData.map(row => ({
      campaign_id: campaignId,
      email: row[colMap.email]?.trim(),
      first_name: colMap.first_name ? row[colMap.first_name]?.trim() || null : null,
      last_name: colMap.last_name ? row[colMap.last_name]?.trim() || null : null,
      company_name: colMap.company_name ? row[colMap.company_name]?.trim() || null : null,
      status: "pending",
    })).filter(r => r.email);

    const seen = new Set<string>();
    const unique = rows.filter(r => {
      const lower = r.email.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);
      await supabase.from("campaign_contacts").insert(batch);
      setImportProgress(Math.round(((i + batch.length) / unique.length) * 100));
    }

    await supabase.from("campaigns").update({ total_contacts: unique.length }).eq("id", campaignId);
    setImporting(false);
  };

  const handleCsvParse = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setCsvColumns(results.meta.fields || []);
        const fields = results.meta.fields || [];
        const autoMap: Record<string, string> = { email: "", first_name: "", last_name: "", company_name: "" };
        for (const f of fields) {
          const fl = f.toLowerCase();
          if (fl.includes("email")) autoMap.email = f;
          if (fl.includes("first") && fl.includes("name")) autoMap.first_name = f;
          if (fl.includes("last") && fl.includes("name")) autoMap.last_name = f;
          if (fl.includes("company") || fl.includes("business") || fl.includes("org")) autoMap.company_name = f;
        }
        setColMap(autoMap);
      },
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCsvParse(file);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".pdf")) {
      toast({ title: "Only PDF files allowed", variant: "destructive" }); return;
    }
    setUploading(true);
    const path = `attachments/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("campaign-attachments").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("campaign-attachments").getPublicUrl(path);
      setAttachmentUrl(urlData.publicUrl);
      setAttachmentName(file.name);
      toast({ title: "PDF attached" });
    }
    setUploading(false);
  };

  const handleTogglePause = async (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaign.id);
    toast({ title: `Campaign ${newStatus}` });
    fetchCampaigns();
  };

  const handleSendBatchNow = async () => {
    try {
      toast({ title: "Triggering batch send…" });
      const { data, error } = await supabase.functions.invoke("campaign-sender", {
        body: { scheduled: true },
      });
      if (error) throw error;
      toast({ title: "Batch sent!", description: `Sent: ${data?.sent ?? 0}, Bounced: ${data?.bounced ?? 0}` });
      fetchCampaigns();
    } catch (err: any) {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSendTestEmail = async (campaign: Campaign) => {
    if (!testEmail || !testEmail.includes("@")) {
      toast({ title: "Set a test email address first", description: "Enter it in the field above the campaign list.", variant: "destructive" });
      return;
    }
    setSendingTestId(campaign.id);
    try {
      const personalizedHtml = campaign.body_html
        .replace(/\{first_name\}/g, "Test")
        .replace(/\{company_name\}/g, "Test Co")
        .replace(/\{unsubscribe_url\}/g, "#");

      const { data, error } = await supabase.functions.invoke("test-email", {
        body: {
          email: testEmail,
          subject: `[TEST] ${campaign.subject}`,
          html: personalizedHtml,
          attachment_url: campaign.attachment_url ?? undefined,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Unknown error");
      toast({
        title: "Test email sent!",
        description: `Sent to ${testEmail}${campaign.attachment_url ? " (with PDF attachment)" : ""}`,
      });
    } catch (err: any) {
      toast({ title: "Test send failed", description: err.message, variant: "destructive" });
    } finally {
      setSendingTestId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign and all contacts?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast({ title: "Campaign deleted" });
    fetchCampaigns();
  };

  const handleViewAnalytics = async (campaign: Campaign) => {
    setAnalyticsCampaign(campaign);
    setAnalyticsFilter("all");
    const { data } = await supabase
      .from("campaign_contacts")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false });
    setAnalyticsContacts((data as any) || []);
    setAnalyticsOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setName(campaign.name);
    setSubject(campaign.subject);
    // Try to match existing template
    const match = CAMPAIGN_TEMPLATES.find(t => campaign.body_html === t.bodyHtml);
    setSelectedTemplateId(match?.id || "friendly-nudge");
    setAttachmentUrl(campaign.attachment_url);
    setAttachmentName(campaign.attachment_url ? "Attached PDF" : "");
    setStep(1);
    setCreating(true);
  };

  const handleQuickLaunch = () => {
    resetForm();
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setName(`PayNudge Outreach — ${today}`);
    const t = CAMPAIGN_TEMPLATES[0];
    setSelectedTemplateId(t.id);
    setSubject(t.defaultSubject);
    setStep(3); // Jump to import
    setCreating(true);
  };

  const exportContacts = (statusFilter: string) => {
    const filtered = statusFilter === "all" ? analyticsContacts : analyticsContacts.filter(c => c.status === statusFilter);
    const csv = Papa.unparse(filtered.map(c => ({
      Email: c.email,
      "First Name": c.first_name || "",
      "Last Name": c.last_name || "",
      Company: c.company_name || "",
      Status: c.status,
      "Sent At": c.sent_at || "",
      "Opened At": c.opened_at || "",
    })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-contacts-${statusFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rate = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";

  // ─── CREATE FLOW ───
  if (creating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">
            {editingCampaignId ? "Edit Campaign" : "Create Campaign"}
          </h2>
          <button onClick={() => { setCreating(false); resetForm(); }}
            className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2">
          {["Campaign Setup", "Choose Template", "Import & Attach"].map((label, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                step === i + 1 ? "bg-primary/10 text-primary" : "bg-surface text-muted-foreground"
              }`}>
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {/* Step 1: Campaign Setup */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-2 block">Campaign Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Q1 Invoice Outreach"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase mb-2 block">Subject Line</label>
              <div className="relative">
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. ⚠️ Invoice overdue – action required"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={() => setShowEmoji(!showEmoji)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded bg-accent/50 text-muted-foreground hover:text-foreground text-xs">
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              {showEmoji && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {EMOJI_PICKS.map(e => (
                    <button key={e} onClick={() => { setSubject(prev => e + " " + prev); setShowEmoji(false); }}
                      className="p-2 text-lg bg-surface rounded hover:bg-accent/50">{e}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Subject preview */}
            {subject && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-[10px] text-muted-foreground uppercase mb-2">Inbox Preview</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">T</div>
                  <div>
                    <p className="text-sm font-semibold">Tom @ PayNudge</p>
                    <p className="text-sm">{subject.replace(/\{first_name\}/g, "John").replace(/\{company_name\}/g, "Acme Inc")}</p>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => setStep(2)} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2">
              Next: Choose Template <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Choose Template */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-3">
              {CAMPAIGN_TEMPLATES.map(template => (
                <button key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface hover:border-primary/30"
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {selectedTemplateId === template.id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                        <h4 className="font-semibold text-sm">{template.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{template.dayLabel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{template.tone}</p>
                      <p className="text-xs text-muted-foreground/80 line-clamp-2">{template.description}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}
                      className="flex-shrink-0 text-xs text-primary flex items-center gap-1 hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-md font-medium">
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                  </div>
                </button>
              ))}
            </div>

            {/* Sequence Builder */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Campaign Sequence</h4>
              <p className="text-xs text-muted-foreground mb-3">Toggle which sends to include. Each fires automatically when the previous one completes.</p>
              <div className="space-y-2">
                {SEQUENCE_STEPS.map((s, i) => (
                  <label key={s.templateId} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={sequenceSteps[i]}
                      onChange={() => setSequenceSteps(prev => prev.map((v, j) => j === i ? !v : v))}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                    <span className={`text-sm ${sequenceSteps[i] ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-surface border border-border text-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(3)}
                disabled={!selectedTemplateId}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                Next: Import & Attach <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Import Contacts + Attachment */}
        {step === 3 && (
          <div className="space-y-5">
            {/* CSV Import */}
            <div>
              <h3 className="text-xs text-muted-foreground uppercase mb-3 font-semibold">Import Contacts</h3>
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-start gap-3 mb-3">
                <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-accent">⚖️ Only send to contacts with a legitimate business relationship (GDPR).</p>
              </div>

              {csvData.length === 0 ? (
                <div className="bg-surface border-2 border-dashed border-border rounded-lg p-8 text-center"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvParse(f); }}>
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-3">Drag & drop a CSV file or click to upload</p>
                  <label className="inline-block cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                    Choose CSV
                    <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <>
                  <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{csvData.length} contacts loaded</p>
                      <button onClick={() => { setCsvData([]); setCsvColumns([]); }}
                        className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {["email", "first_name", "last_name", "company_name"].map(field => (
                        <div key={field}>
                          <label className="text-[10px] text-muted-foreground uppercase mb-1 block">{field.replace("_", " ")}</label>
                          <select value={colMap[field]} onChange={e => setColMap(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs">
                            <option value="">— skip —</option>
                            {csvColumns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border text-xs text-muted-foreground">Preview (first 5 rows)</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            {csvColumns.slice(0, 5).map(c => <th key={c} className="text-left p-2 font-medium text-muted-foreground">{c}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-border">
                              {csvColumns.slice(0, 5).map(c => <td key={c} className="p-2 truncate max-w-[160px]">{row[c]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {!colMap.email && (
                    <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg">Email column mapping is required</div>
                  )}
                </>
              )}
            </div>

            {/* PDF Attachment */}
            <div>
              <h3 className="text-xs text-muted-foreground uppercase mb-3 font-semibold">PDF Attachment (optional)</h3>
              <div className="bg-surface border-2 border-dashed border-border rounded-lg p-6 text-center">
                {attachmentUrl ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{attachmentName}</p>
                      <p className="text-xs text-muted-foreground">PDF attached</p>
                    </div>
                    <button onClick={() => { setAttachmentUrl(null); setAttachmentName(""); }}
                      className="text-muted-foreground hover:text-destructive ml-4"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <Paperclip className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground mb-2">Attach a sample invoice PDF</p>
                    <label className="inline-block cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20">
                      {uploading ? "Uploading..." : "Choose PDF"}
                      <input type="file" accept=".pdf" onChange={handleAttachmentUpload} className="hidden" />
                    </label>
                  </>
                )}
              </div>
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${importProgress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">{importProgress}% imported...</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-surface border border-border text-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSaveDraft} disabled={importing}
                className="flex-1 bg-surface border border-border text-foreground py-3 rounded-lg font-medium">
                Save as Draft
              </button>
              <button onClick={handleActivate} disabled={importing || (!editingCampaignId && !colMap.email)}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium">
                🚀 Activate
              </button>
            </div>
          </div>
        )}

        {/* Template Preview Modal */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{previewTemplate?.name} — Preview</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="bg-[#f4f4f5] rounded-lg p-4">
                <div dangerouslySetInnerHTML={{
                  __html: (previewTemplate?.bodyHtml || "")
                    .replace(/\{first_name\}/g, "John")
                    .replace(/\{company_name\}/g, "Acme Ltd")
                    .replace(/\{unsubscribe_url\}/g, "#")
                }} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── CAMPAIGN LIST ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">{campaigns.length} campaigns</p>
        <div className="flex gap-2">
          <button onClick={handleQuickLaunch}
            className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/20">
            <Zap className="w-4 h-4" /> Quick Launch
          </button>
          <button onClick={() => { resetForm(); setCreating(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      {/* Test email config */}
      <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
        <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">Test email:</span>
        <input
          type="email"
          placeholder="you@example.com"
          value={testEmail}
          onChange={e => { setTestEmail(e.target.value); localStorage.setItem("admin_test_email", e.target.value); }}
          className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Used by "Send Test" buttons below</span>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Contacts</th>
                <th className="text-right p-4 font-medium">Sent</th>
                <th className="text-right p-4 font-medium">Open %</th>
                <th className="text-right p-4 font-medium">Click %</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const processed = c.total_contacts - (c.pending_count ?? 0);
                const progressPct = c.total_contacts > 0 ? Math.round((processed / c.total_contacts) * 100) : 0;
                const batchAge = c.last_batch_at ? Math.round((Date.now() - new Date(c.last_batch_at).getTime()) / 60000) : null;

                return (
                <tr key={c.id} className="border-b border-border hover:bg-surface-hover">
                  <td className="p-4">
                    <p className="font-medium">{c.name}</p>
                    {c.status === "active" && (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[120px]">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{processed}/{c.total_contacts} sent</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {batchAge !== null
                            ? `Last batch ${batchAge < 1 ? "just now" : `${batchAge}m ago`} · Next ~30min`
                            : "Pending first run"}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                  <td className="p-4 text-right font-mono">{c.total_contacts}</td>
                  <td className="p-4 text-right font-mono">{c.sent_count}</td>
                  <td className="p-4 text-right font-mono">{rate(c.open_count, c.sent_count)}%</td>
                  <td className="p-4 text-right font-mono">{rate(c.click_count, c.sent_count)}%</td>
                  <td className="p-4 text-muted-foreground text-xs font-mono">{formatDate(c.created_at)}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <button onClick={() => handleEdit(c)} title="Edit"
                        className="p-1.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      {(c.status === "active" || c.status === "paused") && (
                        <button onClick={() => handleTogglePause(c)} title={c.status === "active" ? "Pause" : "Resume"}
                          className="p-1.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                          {c.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {c.status === "active" && (
                        <button onClick={() => handleSendBatchNow()} title="Send batch now"
                          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleSendTestEmail(c)}
                        disabled={sendingTestId === c.id}
                        title={`Send test email${c.attachment_url ? " (with PDF)" : ""}`}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold disabled:opacity-50">
                        {sendingTestId === c.id ? (
                          <span className="animate-pulse">Sending…</span>
                        ) : (
                          <><Mail className="w-3 h-3" /> Test{c.attachment_url ? " 📎" : ""}</>
                        )}
                      </button>
                      <button onClick={() => handleViewAnalytics(c)} title="Analytics"
                        className="p-1.5 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} title="Delete"
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {campaigns.length === 0 && !loading && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No campaigns yet. Click <strong>Quick Launch</strong> to fire off your first campaign in seconds.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ANALYTICS SHEET ─── */}
      <Sheet open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[640px] p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="font-display font-bold text-lg">
              {analyticsCampaign?.name || "Campaign Analytics"}
            </SheetTitle>
          </SheetHeader>

          {analyticsCampaign && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Sent", value: analyticsCampaign.sent_count },
                  { label: "Open %", value: `${rate(analyticsCampaign.open_count, analyticsCampaign.sent_count)}%` },
                  { label: "Click %", value: `${rate(analyticsCampaign.click_count, analyticsCampaign.sent_count)}%` },
                  { label: "Bounce %", value: `${rate(analyticsCampaign.bounce_count, analyticsCampaign.total_contacts)}%` },
                  { label: "Unsub %", value: `${rate(analyticsCampaign.unsub_count, analyticsCampaign.total_contacts)}%` },
                ].map(s => (
                  <div key={s.label} className="bg-surface border border-border rounded-lg p-3 text-center">
                    <div className="font-mono text-lg font-bold">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Funnel */}
              <div className="bg-surface border border-border rounded-lg p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Delivery Funnel</h4>
                <div className="flex items-center gap-4 text-sm">
                  {[
                    { label: "Delivered", value: analyticsCampaign.sent_count, color: "bg-primary" },
                    { label: "Opened", value: analyticsCampaign.open_count, color: "bg-primary/70" },
                    { label: "Clicked", value: analyticsCampaign.click_count, color: "bg-accent" },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center gap-2 flex-1">
                      <div className={`w-3 h-3 rounded-full ${s.color}`} />
                      <div>
                        <div className="font-mono font-bold">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                      {i < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact tabs */}
              <div>
                <div className="flex gap-1 mb-3 flex-wrap">
                  {["all", "sent", "opened", "clicked", "bounced", "unsubscribed"].map(f => {
                    const count = f === "all" ? analyticsContacts.length : analyticsContacts.filter(c => c.status === f).length;
                    return (
                      <button key={f} onClick={() => setAnalyticsFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          analyticsFilter === f ? "bg-foreground text-background" : "bg-accent text-muted-foreground"
                        }`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end mb-2">
                  <button onClick={() => exportContacts(analyticsFilter)}
                    className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 bg-transparent">
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-surface">
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Email</th>
                          <th className="text-left p-3 font-medium">Company</th>
                          <th className="text-center p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Sent</th>
                          <th className="text-left p-3 font-medium">Opened</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analyticsFilter === "all" ? analyticsContacts : analyticsContacts.filter(c => c.status === analyticsFilter))
                          .map(c => (
                            <tr key={c.id} className="border-b border-border">
                              <td className="p-3">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</td>
                              <td className="p-3 text-muted-foreground">{c.email}</td>
                              <td className="p-3 text-muted-foreground">{c.company_name || "—"}</td>
                              <td className="p-3 text-center"><ContactStatusBadge status={c.status} /></td>
                              <td className="p-3 text-muted-foreground">{formatDateTime(c.sent_at)}</td>
                              <td className="p-3 text-muted-foreground">{formatDateTime(c.opened_at)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminCampaignsTab;
