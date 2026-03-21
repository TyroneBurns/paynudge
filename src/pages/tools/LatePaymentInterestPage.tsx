import { useState } from "react";
import { Link } from "react-router-dom";
import CTASection from "../../components/CTASection";
import Footer from "../../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const LatePaymentInterestPage = ({ onOpenAuth }: Props) => {
  const [amt, setAmt] = useState("");
  const [overdueDays, setOverdueDays] = useState("");
  const [rateOption, setRateOption] = useState("8");
  const [customRate, setCustomRate] = useState("");

  const amount = parseFloat(amt);
  const days = parseFloat(overdueDays);
  const rate = rateOption === "custom" ? parseFloat(customRate) : parseFloat(rateOption);
  const interest = amount && days && rate ? amount * (rate / 100) * (days / 365) : null;

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <Link to="/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">← All tools</Link>
          <div className="max-w-[760px]">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Free Tool</span>
            <h1 className="font-display text-4xl font-bold mt-2 mb-4">Late Payment Interest Calculator</h1>
            <p className="text-muted-foreground text-lg mb-10">Calculate the interest owed on an overdue invoice based on statutory or custom interest rates.</p>
            <div className="bg-surface border border-border rounded-lg p-8 max-w-[560px]">
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Invoice Amount ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 5000" value={amt} onChange={(e) => setAmt(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Days Overdue</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 30" value={overdueDays} onChange={(e) => setOverdueDays(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Annual Interest Rate (%)</label>
                <select className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" value={rateOption} onChange={(e) => setRateOption(e.target.value)}>
                  <option value="8">8% — UK Statutory (Late Payment Act)</option>
                  <option value="6">6% — EU Directive reference rate + 8%</option>
                  <option value="5">5% — Australia PPSR rate</option>
                  <option value="custom">Custom rate</option>
                </select>
              </div>
              {rateOption === "custom" && (
                <div className="mb-5">
                  <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Custom Rate (%)</label>
                  <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 12" value={customRate} onChange={(e) => setCustomRate(e.target.value)} />
                </div>
              )}
              {interest !== null && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-5 mt-5">
                  <div className="font-display text-4xl font-extrabold text-primary">${interest.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Interest owed on overdue invoice</div>
                  <div className="text-xs text-muted-foreground mt-3">
                    Invoice: ${amount.toFixed(2)} · {days} days overdue · {rate}% annual rate<br />
                    Daily interest: ${(amount * (rate / 100) / 365).toFixed(4)} · Total with interest: ${(amount + interest).toFixed(2)}
                  </div>
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

export default LatePaymentInterestPage;
