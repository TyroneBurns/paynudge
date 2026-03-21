import { useParams } from "react-router-dom";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const INDUSTRIES: Record<string, { name: string; icon: string; painPoints: string[] }> = {
  "invoice-reminder-software": { name: "Small Businesses", icon: "💼", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "xero-invoice-reminders": { name: "Xero Users", icon: "✕", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "sms-invoice-reminders": { name: "SMS Reminders", icon: "📱", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "freelancers": { name: "Freelancers", icon: "🎨", painPoints: ["Clients who \"forgot\"", "Project scope creep without payment", "Awkward follow-up conversations"] },
  "contractors": { name: "Contractors", icon: "🔧", painPoints: ["Retention withheld beyond agreed terms", "Stage payment disputes", "Sub-contractor cash flow pressure"] },
  "agencies": { name: "Agencies", icon: "🏢", painPoints: ["Multiple client billing cycles", "Retainer renewal reminders", "Project milestone payment tracking"] },
  "consultants": { name: "Consultants", icon: "💡", painPoints: ["Hourly vs project billing disputes", "Corporate AP department delays", "Multi-stakeholder invoice approval"] },
  "trades": { name: "Trades & Tradies", icon: "⚒️", painPoints: ["30-60 day payment delays on materials", "Residential vs commercial terms", "Stage payment reminders for builds"] },
  "photographers": { name: "Photographers", icon: "📸", painPoints: ["Deposit and balance collection", "Usage licensing renewals", "Post-delivery payment delays"] },
  "web-developers": { name: "Web Developers", icon: "💻", painPoints: ["Feature creep without payment", "Hosting/maintenance renewal collection", "Scope sign-off before final payment"] },
  "graphic-designers": { name: "Graphic Designers", icon: "🎭", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "accountants": { name: "Accountants", icon: "📊", painPoints: ["Monthly fee collection for clients", "Bulk client invoice reminders", "Compliance work payment on delivery"] },
  "lawyers": { name: "Lawyers", icon: "⚖️", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "construction": { name: "Construction", icon: "🏗️", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "marketing-agencies": { name: "Marketing Agencies", icon: "📣", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "cleaning-business": { name: "Cleaning Businesses", icon: "🧹", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "landscaping": { name: "Landscapers", icon: "🌿", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
  "personal-trainers": { name: "Personal Trainers", icon: "💪", painPoints: ["Late payment affecting cash flow", "Manual follow-up taking too much time", "Inconsistent reminder processes"] },
};

const benefits = [
  "Connect your Xero account in one click — invoices sync instantly and stay current automatically.",
  "Set up automated reminder sequences: email on day 1, SMS + email on day 7, firm notice on day 14.",
  "When Xero records a payment, your reminders stop instantly. Zero manual work required.",
  "98% of SMS reminders are read within 3 minutes — your clients actually see your follow-ups.",
  "Dashboard analytics show your collection rate, outstanding aging, and reminder effectiveness.",
];

const IndustryPage = ({ onOpenAuth }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const industry = INDUSTRIES[slug || ""] || INDUSTRIES["invoice-reminder-software"];

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <div className="max-w-[820px]">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Invoice Reminders for {industry.name}</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 mb-5">Stop chasing payments. Start collecting — automatically.</h1>
            <p className="text-lg text-muted-foreground mb-8">PayNudge helps {industry.name.toLowerCase()} get paid faster with automated SMS and email reminders that connect directly to Xero.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">Start free today →</button>
              <a href="/pricing" className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold border border-border text-foreground hover:bg-surface-hover transition-all">View pricing</a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-start mt-16">
            <div>
              <h2 className="font-display text-3xl font-bold mb-5">The {industry.name} payment problem</h2>
              <p className="text-muted-foreground mb-5">Late payments are especially painful for {industry.name.toLowerCase()}. Every overdue invoice affects your cash flow, your ability to take on new work, and frankly, your mental load.</p>
              <div className="flex flex-col gap-3">
                {industry.painPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-surface border border-border rounded-md">
                    <span className="text-destructive flex-shrink-0">✕</span>
                    <span className="text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold mb-5">How PayNudge helps</h2>
              <div className="flex flex-col gap-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-md">
                    <span className="text-primary font-bold flex-shrink-0">✓</span>
                    <span className="text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 bg-surface border-t border-b border-border rounded-lg p-10 text-center">
            <p className="font-display text-2xl font-bold italic max-w-[700px] mx-auto mb-6 leading-relaxed">"PayNudge saves me roughly 20 hours a month. I set it up once and it just runs."</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center font-display font-extrabold text-lg text-primary-foreground">L</div>
              <div><div className="font-bold text-sm">Laura Chen</div><div className="text-xs text-muted-foreground">Founder · Nimbus Digital</div></div>
            </div>
          </div>
        </div>
      </section>
      <CTASection headline="Start collecting in the next 30 seconds." subtitle="Free plan available. No credit card needed. Connects to Xero instantly." onOpenAuth={onOpenAuth} />
      <Footer />
    </div>
  );
};

export default IndustryPage;
