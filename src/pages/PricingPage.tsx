import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Shield, Zap, Clock, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface PricingPageProps {
  onOpenAuth: (mode: "signup") => void;
}

const AVATAR_COLORS = [
  "bg-[hsl(210,80%,65%)]",   // blue
  "bg-[hsl(270,60%,65%)]",   // purple
  "bg-[hsl(160,60%,55%)]",   // green
  "bg-[hsl(40,80%,60%)]",    // amber
  "bg-[hsl(330,65%,60%)]",   // pink
];
const AVATAR_LETTERS = ["A", "S", "M", "J", "R"];

const PricingPage = ({ onOpenAuth }: PricingPageProps) => {
  const [billingCycle] = useState<"monthly">("monthly");
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handlePaidPlanClick = async () => {
    if (!user) {
      onOpenAuth("signup");
      return;
    }
    // Already subscribed
    if (subscription?.subscribed) {
      navigate("/settings");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_1T8J512NdAO1MGU1UCTSlmt2" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    }
    setCheckoutLoading(false);
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      desc: "Get started and see the magic. No credit card needed.",
      features: [
        "5 invoices per month",
        "Email reminders",
        "SMS reminders included",
        "Xero integration",
        "Gmail integration",
        "1 default reminder flow",
        "Dashboard & analytics",
      ],
      offFeatures: ["Custom reminder flows", "CSV data export", "Priority support"],
      cta: "Get started free",
      featured: false,
    },
    {
      name: "Paid",
      price: 29,
      desc: "For businesses serious about getting paid on time.",
      features: [
        "Everything in Free, plus:",
        "200 invoices per month",
        "Up to 6 reminder flows",
        "Up to 10 steps per flow",
        "Custom email templates",
        "Custom SMS templates",
        "Template variables",
        "Real-time Xero webhooks",
        "CSV data export",
        "Audit log",
        "Priority support",
      ],
      offFeatures: [],
      cta: subscription?.subscribed ? "Current Plan" : "Get Paid plan",
      featured: true,
    },
  ];

  const comparisonRows = [
    { feature: "Monthly invoice limit", free: "5", paid: "200" },
    { feature: "Email reminders", free: true, paid: true },
    { feature: "SMS reminders (included)", free: true, paid: true },
    { feature: "Scheduled reminders", free: true, paid: true },
    { feature: "Default reminder flow", free: true, paid: true },
    { feature: "Custom reminder flows", free: false, paid: "Up to 5 extra" },
    { feature: "Steps per flow", free: "Up to 10", paid: "Up to 10" },
    { feature: "Custom email templates", free: false, paid: true },
    { feature: "Custom SMS templates", free: false, paid: true },
    { feature: "Template variables", free: false, paid: true },
    { feature: "Xero sync", free: true, paid: true },
    { feature: "Real-time Xero webhooks", free: false, paid: true },
    { feature: "Gmail integration", free: true, paid: true },
    { feature: "Dashboard metrics & charts", free: true, paid: true },
    { feature: "Invoice timeline view", free: true, paid: true },
    { feature: "Activity feed", free: true, paid: true },
    { feature: "Audit log", free: false, paid: true },
    { feature: "CSV data export", free: false, paid: true },
    { feature: "Email support", free: true, paid: true },
    { feature: "Priority support", free: false, paid: true },
  ];

  const faqs: [string, string][] = [
    ["How does PayNudge work?", "Connect your Xero account, set up a reminder flow (or use our default), and PayNudge automatically sends SMS & email reminders when invoices become overdue. When an invoice is marked as paid in Xero, reminders stop automatically."],
    ["Is PayNudge really free?", "Yes. The Free plan gives you 5 invoices per month with full SMS and email reminders — no credit card required, no time limit."],
    ["Are SMS reminders included or do they cost extra?", "SMS reminders are included on every plan at no extra cost. We believe SMS is essential for getting paid, so we don't charge separately for it."],
    ["What happens when an invoice is paid?", "When Xero marks an invoice as paid, PayNudge automatically stops all reminders for that invoice. No manual action needed."],
    ["Can I customize the reminder messages?", "On the Paid plan, you can fully customize every email and SMS template with template variables like client name, amount, and due date. The Free plan uses our tested default templates."],
    ["What's the difference between Free and Paid?", "Free gives you 5 invoices/month with 1 default flow. Paid unlocks 200 invoices, up to 6 custom flows, custom templates, CSV export, audit log, and priority support."],
    ["Is my data secure?", "Absolutely. We connect via Xero OAuth 2.0 — we never store or see your Xero password. All data is encrypted at rest and in transit."],
    ["Can I cancel anytime?", "Yes. There are no contracts or commitments. You can cancel your Paid plan at any time and keep using the Free plan."],
    ["What integrations do you support?", "PayNudge integrates with Xero for invoicing and Gmail for email delivery. More integrations are on the roadmap."],
    ["Do I need Xero to use PayNudge?", "Currently, yes. PayNudge is built specifically for Xero users. QuickBooks support is coming soon."],
    ["Which countries does PayNudge support?", "PayNudge works with Xero in any country where Xero is available — including the US, UK, Australia, New Zealand, Canada, Ireland, and across Europe. Your invoices display in whatever currency Xero uses, and reminders are sent in English."],
  ];

  const renderComparisonCell = (value: boolean | string) => {
    if (value === true) return <Check className="w-4 h-4 text-primary mx-auto" />;
    if (value === false) return <X className="w-4 h-4 text-border mx-auto" />;
    return <span>{value}</span>;
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-surface border-b border-border py-14 md:py-20 text-center pt-28">
        <div className="container-main">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" /> SMS + Email included on every plan
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Simple pricing. No surprises.</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-[560px] mx-auto leading-relaxed">
            Start free with 5 invoices a month. Upgrade when you're ready. No hidden costs, no per-SMS fees.
          </p>
          <p className="text-xs text-muted-foreground mt-3">Prices shown in USD. All major currencies supported including GBP, EUR, AUD, CAD and more.</p>
          {/* Social proof avatars */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex">
              {AVATAR_LETTERS.map((l, i) => (
                <div key={i} className={`w-[30px] h-[30px] rounded-full border-2 border-background ${AVATAR_COLORS[i]} flex items-center justify-center text-[11px] font-extrabold text-background -ml-2 first:ml-0`}>{l}</div>
              ))}
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Loved by small businesses</span>
          </div>
        </div>
      </div>

      <section className="section-padding">
        <div className="container-main">
          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[780px] mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-background p-8 rounded-xl border-2 transition-all hover:-translate-y-1 relative ${plan.featured ? "border-primary shadow-[0_0_40px_rgba(0,212,168,0.12)]" : "border-border hover:border-primary/40"}`}>
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-5 py-1 rounded-full whitespace-nowrap font-display">
                    Most Popular
                  </div>
                )}
                <div className="text-xs text-primary font-bold uppercase tracking-wider mb-2">{plan.name}</div>
                <div className="font-display text-4xl md:text-5xl font-extrabold mb-1">
                  ${plan.price}<span className="text-base text-muted-foreground font-normal">/month</span>
                </div>
                <div className="text-sm text-muted-foreground mb-6 pb-6 border-b border-border">{plan.desc}</div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.offFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground/60">
                      <X className="w-4 h-4 text-border flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={plan.featured ? handlePaidPlanClick : () => onOpenAuth("signup")}
                  disabled={plan.featured && checkoutLoading}
                  className={`w-full py-3.5 rounded-lg font-bold text-sm transition-all ${plan.featured ? "bg-primary text-primary-foreground hover:shadow-[0_0_24px_rgba(0,212,168,0.4)] hover:-translate-y-0.5" : "border border-border text-foreground hover:bg-surface hover:border-primary/40"}`}
                >
                  {plan.featured && checkoutLoading ? "Loading…" : plan.cta}
                </button>
                {!plan.featured && (
                  <p className="text-[11px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" /> No credit card required
                  </p>
                )}
                {plan.featured && (
                  <p className="text-[11px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Cancel anytime · No contracts
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Upgrade snapshot */}
          <div className="max-w-[780px] mx-auto mt-8">
            <div className="bg-surface border border-border rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex-1">
                <div className="font-display font-bold text-lg mb-1">Free → Paid upgrade</div>
                <div className="text-sm text-muted-foreground">Here's what changes when you upgrade:</div>
              </div>
              <div className="flex gap-8 text-center">
                <div>
                  <div className="font-mono font-bold text-sm text-primary">5 → 200</div>
                  <div className="text-[11px] text-muted-foreground">Invoices/mo</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-primary">1 → 6</div>
                  <div className="text-[11px] text-muted-foreground">Reminder flows</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-primary">✓</div>
                  <div className="text-[11px] text-muted-foreground">Priority support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-[780px] mx-auto mt-12 bg-surface border border-border rounded-xl p-8 md:p-10">
            <div className="flex flex-col items-center text-center">
              <p className="font-display text-lg md:text-xl italic text-foreground/90 max-w-[480px] mb-6 leading-relaxed">
                "I ran a property business and spent hours every week chasing late invoices. I built PayNudge so no small business owner has to do the same."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[hsl(160,60%,55%)] rounded-full flex items-center justify-center font-display font-extrabold text-lg text-background">T</div>
                <div className="text-left">
                  <div className="font-bold text-sm">Tyrone Burns</div>
                  <div className="text-xs text-muted-foreground">Founder, PayNudge</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="max-w-[780px] mx-auto mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Shield, label: "Bank-level encryption" },
              { icon: Zap, label: "2-minute setup" },
              { icon: Clock, label: "Cancel anytime" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center gap-2 text-center">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Full comparison table */}
          <div className="mt-20">
            <h3 className="font-display text-2xl font-bold text-center mb-2">Everything you need to get paid faster</h3>
            <p className="text-muted-foreground text-center text-sm mb-8">Compare plans side by side</p>
            <div className="overflow-x-auto max-w-[780px] mx-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Feature</th>
                    <th className="p-3 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-wider w-24">Free</th>
                    <th className="p-3 text-center font-mono text-[10px] text-primary uppercase tracking-wider w-28">Paid · $29/mo</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((r, i) => (
                    <tr key={i} className="border-b border-border hover:bg-primary/[0.02] transition-colors">
                      <td className="p-3 text-left text-[13px]">{r.feature}</td>
                      <td className="p-3 text-center text-[13px]">{renderComparisonCell(r.free)}</td>
                      <td className="p-3 text-center text-[13px]">{renderComparisonCell(r.paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-[640px] mx-auto mt-20">
            <h3 className="font-display text-2xl font-bold text-center mb-8">Frequently asked questions</h3>
            {faqs.map(([q, a], i) => (
              <details key={i} className="group border-b border-border py-4">
                <summary className="font-bold font-display text-[15px] cursor-pointer list-none flex justify-between items-center gap-3">
                  {q}
                  <span className="text-primary text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="text-sm text-muted-foreground leading-relaxed mt-3">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTASection headline="Ready to stop chasing invoices?" subtitle="Start with the Free plan today. No credit card required." onOpenAuth={onOpenAuth} />
      <Footer />
    </div>
  );
};

export default PricingPage;
