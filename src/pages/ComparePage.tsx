import { useParams } from "react-router-dom";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const COMPETITORS: Record<string, string> = {
  "paynudge-vs-paidnice": "Paidnice",
  "paynudge-vs-xero-reminders": "Xero Built-in",
  "paynudge-vs-chaser": "Chaser",
};

const rows = [
  ["Xero integration", "✓ Native real-time sync", "Varies"],
  ["SMS reminders", "✓ 98% open rate", "Limited or none"],
  ["Custom sequences", "✓ Unlimited", "Limited"],
  ["Delivery tracking", "✓ Full visibility", "Partial"],
  ["Free plan", "✓ Always available", "No"],
  ["Setup time", "< 5 minutes", "15–30 minutes"],
  ["CSV export", "✓", "Varies"],
  ["Pricing", "From $0/mo", "Higher"],
];

const ComparePage = ({ onOpenAuth }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const competitor = COMPETITORS[slug || ""] || "Competitor";

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Comparison</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 mb-4">PayNudge vs {competitor}</h1>
          <p className="text-muted-foreground text-lg mb-12">An honest comparison to help you choose the right tool for your business.</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">Feature</th>
                  <th className="p-3 bg-secondary font-mono text-[10px] text-primary uppercase tracking-wider border-b border-border">PayNudge</th>
                  <th className="p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">{competitor}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border hover:bg-primary/[0.02]">
                    <td className="p-3 text-left">{r[0]}</td>
                    <td className="p-3 text-center text-primary">{r[1]}</td>
                    <td className="p-3 text-center text-muted-foreground">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
            <h3 className="font-display text-xl font-bold mb-3">Ready to switch to PayNudge?</h3>
            <p className="text-muted-foreground text-sm max-w-[440px] mx-auto mb-5">Set up takes under 5 minutes. Free plan available. No credit card required to get started.</p>
            <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">Start free today →</button>
          </div>
        </div>
      </section>
      <CTASection headline="Start collecting in the next 30 seconds." subtitle="Free plan available. No credit card needed." onOpenAuth={onOpenAuth} />
      <Footer />
    </div>
  );
};

export default ComparePage;
