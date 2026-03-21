import { useState } from "react";
import { Link } from "react-router-dom";
import CTASection from "../../components/CTASection";
import Footer from "../../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const DSOCalculatorPage = ({ onOpenAuth }: Props) => {
  const [ar, setAr] = useState("");
  const [sales, setSales] = useState("");
  const [days, setDays] = useState("365");

  const arVal = parseFloat(ar);
  const salesVal = parseFloat(sales);
  const daysVal = parseFloat(days);
  const dso = arVal && salesVal ? (arVal / salesVal) * daysVal : null;

  const note = dso !== null
    ? dso < 30 ? "Excellent! Your collections are very fast."
    : dso < 45 ? "Good. Slightly above ideal — worth monitoring."
    : dso < 60 ? "Average. There is room to improve with automated reminders."
    : "High DSO. Automated reminders could significantly reduce this."
    : "";

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <Link to="/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">← All tools</Link>
          <div className="max-w-[760px]">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Free Tool</span>
            <h1 className="font-display text-4xl font-bold mt-2 mb-4">DSO Calculator</h1>
            <p className="text-muted-foreground text-lg mb-10">Calculate your Days Sales Outstanding — the average number of days it takes your business to collect payment after a sale.</p>
            <div className="bg-surface border border-border rounded-lg p-8 max-w-[560px]">
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Accounts Receivable ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 50000" value={ar} onChange={(e) => setAr(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Credit Sales over period ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 300000" value={sales} onChange={(e) => setSales(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Number of days in period</label>
                <select className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" value={days} onChange={(e) => setDays(e.target.value)}>
                  <option value="365">Full year (365 days)</option>
                  <option value="90">Quarter (90 days)</option>
                  <option value="30">Month (30 days)</option>
                </select>
              </div>
              {dso !== null && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-5 mt-5">
                  <div className="font-display text-4xl font-extrabold text-primary">{dso.toFixed(1)} days</div>
                  <div className="text-sm text-muted-foreground mt-1">Days Sales Outstanding (DSO)</div>
                  <div className="text-xs text-muted-foreground mt-2">{note}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <CTASection headline="Automate your collections while you crunch the numbers." subtitle="PayNudge handles the follow-up. Free plan available." onOpenAuth={onOpenAuth} />
      <Footer />
    </div>
  );
};

export default DSOCalculatorPage;
