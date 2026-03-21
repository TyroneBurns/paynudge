import { Link } from "react-router-dom";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";
import xeroLogo from "@/assets/xero-logo.png";
import gmailLogo from "@/assets/gmail-logo.png";

interface FeaturesPageProps {
  onOpenAuth: (mode: "signup") => void;
}

const FeaturesPage = ({ onOpenAuth }: FeaturesPageProps) => (
  <div>
    <div className="bg-surface border-b border-border py-16 text-center pt-24">
      <div className="container-main">
        <h1 className="font-display text-5xl font-bold mb-4">Powerful Features</h1>
        <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">Everything you need to get paid faster, without the awkward conversations.</p>
      </div>
    </div>

    <section className="section-padding">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "SMS That Gets Opened", desc: "Email reminders have a 20% open rate. SMS hits 98%. PayNudge puts your reminder in your client's pocket.", badge: "98% open rate vs 20% email" },
            { title: "Live Xero Sync", desc: "Connect once and forget. Two-way sync means changes in PayNudge reflect in Xero instantly.", badge: "Real-time two-way sync" },
            { title: "Custom Reminder Sequences", desc: "Design multi-step escalation flows with full control over timing, tone, and channel.", badge: "Unlimited customisation" },
            { title: "Gmail Integration", desc: "Send email reminders through your Gmail account for better deliverability and a professional sender address.", badge: "Included on all plans" },
            { title: "Separate Reminder Recipient", desc: "Send reminders to a different address per client. Perfect for B2B businesses dealing with procurement." },
            { title: "Delivery Intelligence", desc: "See exactly when each reminder was delivered, opened, bounced, or ignored — per invoice, per client." },
            { title: "Collections Dashboard", desc: "Live charts, overdue aging buckets, collection rate metrics, and trend lines." },
            { title: "Invoice Timeline View", desc: "Chronological view of every event for each invoice — reminders sent, emails opened, payments received." },
            { title: "Audit Log", desc: "Complete record of all system and user actions. Know exactly what happened, when, and by whom.", badge: "Paid plan" },
            { title: "CSV Export", desc: "Pull your invoice and reminder history into a spreadsheet whenever you need it. Full data ownership." },
            { title: "Escalation Logic Built In", desc: "Sequences automatically escalate in tone as time passes. Start friendly, end firm." },
            { title: "Template Variables", desc: "Use variables like client name, amount, and due date in your templates for personalised reminders.", badge: "Paid plan" },
            { title: "Business Hours Scheduling", desc: "Set reminders to only send during business hours. Configure different hours for different time zones." },
            { title: "Multi-Currency Support", desc: "PayNudge handles multiple currencies and displays amounts in your client's local currency." },
            { title: "Template Library", desc: "Start with professionally written templates that get results. Customize tone, add your branding." },
          ].map((f, i) => (
            <div key={i} className="bg-surface p-8 rounded-md border border-border border-l-4 border-l-primary hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all">
              <h3 className="font-display text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-[15px] mb-5">{f.desc}</p>
              {f.badge && <span className="inline-block text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded">{f.badge}</span>}
            </div>
          ))}
        </div>

        {/* Integrations section */}
        <div className="text-center mt-20 mb-10">
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Integrations</span>
          <h2 className="font-display text-[42px] font-bold mt-3 mb-4">Integrates seamlessly with</h2>
        </div>
        <div className="flex items-center justify-center gap-6 mb-20">
          <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-8 py-5">
            <img src={xeroLogo} alt="Xero logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="font-bold">Xero</div>
              <div className="text-xs text-muted-foreground">Real-time two-way sync</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-8 py-5">
            <img src={gmailLogo} alt="Gmail logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="font-bold">Gmail</div>
              <div className="text-xs text-muted-foreground">Professional email delivery</div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="text-center mb-16">
          <h2 className="font-display text-[42px] font-bold mb-4">How we compare</h2>
          <p className="text-muted-foreground text-lg">See why PayNudge is the best choice for Xero users.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-bold">Feature</th>
                <th className="text-left p-4 font-bold text-primary">PayNudge</th>
                <th className="text-left p-4 font-bold">Paidnice</th>
                <th className="text-left p-4 font-bold">Xero Built-in</th>
                <th className="text-left p-4 font-bold">Chaser</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["SMS Reminders", "✓ Included on all plans", "✓ Add-on cost", "✗ No", "✗ No"],
                ["Gmail Integration", "✓ Included", "✗ No", "✗ No", "✗ No"],
                ["Xero Integration", "✓ Two-way live", "✓ Two-way", "✓ Native", "✓ Two-way"],
                ["Custom Sequences", "✓ Up to 6 flows", "✓ Limited", "✗ Fixed only", "✓ Yes"],
                ["Audit Log", "✓ Paid plan", "✗ No", "✗ No", "✓ Enterprise"],
                ["Free Plan", "✓ Yes, 5 inv/mo", "✗ No", "✓ Xero required", "✗ No"],
                ["Starting Price", "✓ Free", "$29/month", "Xero only", "$45/month"],
              ].map(([feature, ...vals], i) => (
                <tr key={i} className="border-b border-border hover:bg-primary/[0.02]">
                  <td className="p-4 font-bold text-foreground">{feature}</td>
                  {vals.map((v, j) => (
                    <td key={j} className={`p-4 ${v.startsWith("✓") ? "text-primary" : v.startsWith("✗") ? "text-destructive" : ""}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <CTASection headline="Ready to get paid faster?" subtitle="Join 500+ businesses already using PayNudge." onOpenAuth={onOpenAuth} />
    <Footer />
  </div>
);

export default FeaturesPage;
