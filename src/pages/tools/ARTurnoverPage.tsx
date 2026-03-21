import { useState } from "react";
import { Link } from "react-router-dom";
import CTASection from "../../components/CTASection";
import Footer from "../../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const ARTurnoverPage = ({ onOpenAuth }: Props) => {
  const [salesInput, setSales] = useState("");
  const [begin, setBegin] = useState("");
  const [end, setEnd] = useState("");

  const sales = parseFloat(salesInput);
  const beginVal = parseFloat(begin) || 0;
  const endVal = parseFloat(end) || 0;
  const avgAR = (beginVal + endVal) / 2 || endVal;
  const ratio = sales && avgAR ? sales / avgAR : null;
  const dso = ratio ? 365 / ratio : null;

  const note = ratio
    ? ratio > 12 ? "Excellent collection efficiency."
    : ratio > 8 ? "Good ratio — room for minor improvement."
    : ratio > 4 ? "Average. Automated reminders could improve this."
    : "Low ratio. Consider reviewing your reminder process."
    : "";

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <Link to="/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">← All tools</Link>
          <div className="max-w-[760px]">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Free Tool</span>
            <h1 className="font-display text-4xl font-bold mt-2 mb-4">AR Turnover Calculator</h1>
            <p className="text-muted-foreground text-lg mb-10">Calculate your Accounts Receivable Turnover ratio — a key indicator of how efficiently your business collects revenue.</p>
            <div className="bg-surface border border-border rounded-lg p-8 max-w-[560px]">
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Net Credit Sales ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 500000" value={salesInput} onChange={(e) => setSales(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Beginning AR Balance ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 40000" value={begin} onChange={(e) => setBegin(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Ending AR Balance ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 60000" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              {ratio !== null && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-5 mt-5">
                  <div className="font-display text-4xl font-extrabold text-primary">{ratio.toFixed(2)}×</div>
                  <div className="text-sm text-muted-foreground mt-1">AR Turnover Ratio</div>
                  {dso && <div className="text-xs text-muted-foreground mt-2">Implied DSO: {dso.toFixed(1)} days</div>}
                  <div className="text-xs text-muted-foreground mt-1">{note}</div>
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

export default ARTurnoverPage;
