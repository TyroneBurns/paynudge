import { useState } from "react";
import { Link } from "react-router-dom";
import CTASection from "../../components/CTASection";
import Footer from "../../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const Net30CalculatorPage = ({ onOpenAuth }: Props) => {
  const today = new Date().toISOString().split("T")[0];
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [term, setTerm] = useState("30");

  const calcDue = () => {
    if (!invoiceDate) return null;
    const inv = new Date(invoiceDate);
    const due = new Date(inv);
    due.setDate(due.getDate() + parseInt(term));
    return due;
  };

  const due = calcDue();
  const diff = due ? Math.round((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <Link to="/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">← All tools</Link>
          <div className="max-w-[760px]">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Free Tool</span>
            <h1 className="font-display text-4xl font-bold mt-2 mb-4">Net 30 Calculator</h1>
            <p className="text-muted-foreground text-lg mb-10">Calculate the exact due date for any payment term invoice.</p>
            <div className="bg-surface border border-border rounded-lg p-8 max-w-[560px]">
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Invoice Date</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Terms</label>
                <select className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" value={term} onChange={(e) => setTerm(e.target.value)}>
                  <option value="7">Net 7 (7 days)</option>
                  <option value="14">Net 14 (14 days)</option>
                  <option value="21">Net 21 (21 days)</option>
                  <option value="30">Net 30 (30 days)</option>
                  <option value="45">Net 45 (45 days)</option>
                  <option value="60">Net 60 (60 days)</option>
                  <option value="90">Net 90 (90 days)</option>
                </select>
              </div>
              {due && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-5 mt-5">
                  <div className="font-display text-3xl font-extrabold text-primary">
                    {due.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Invoice due date</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {diff !== null && (diff > 0 ? `Due in ${diff} days.` : diff === 0 ? "Due today!" : `Overdue by ${Math.abs(diff)} days.`)}
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

export default Net30CalculatorPage;
