import { useState } from "react";
import { Link } from "react-router-dom";
import CTASection from "../../components/CTASection";
import Footer from "../../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const PaymentTermsPage = ({ onOpenAuth }: Props) => {
  const today = new Date().toISOString().split("T")[0];
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("30");
  const [calculated, setCalculated] = useState(false);

  const calcDue = () => {
    if (!invoiceDate) return null;
    const d = new Date(invoiceDate);
    if (terms === "eom") {
      return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
    const due = new Date(d);
    due.setDate(due.getDate() + parseInt(terms));
    return due;
  };

  const handleCalc = () => setCalculated(true);
  const due = calcDue();
  const diff = due ? Math.round((due.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const amt = parseFloat(amount);

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <Link to="/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">← All tools</Link>
          <div className="max-w-[760px]">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Free Tool</span>
            <h1 className="font-display text-4xl font-bold mt-2 mb-4">Payment Terms Calculator</h1>
            <p className="text-muted-foreground text-lg mb-10">Convert between different payment terms and calculate due dates for your invoices.</p>
            <div className="bg-surface border border-border rounded-lg p-8 max-w-[560px]">
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Invoice Date</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Invoice Amount ($)</label>
                <input className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" type="number" placeholder="e.g. 2500" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Terms</label>
                <select className="w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors" value={terms} onChange={(e) => setTerms(e.target.value)}>
                  <option value="7">Due on receipt / Net 7</option>
                  <option value="14">Net 14</option>
                  <option value="30">Net 30</option>
                  <option value="45">Net 45</option>
                  <option value="60">Net 60</option>
                  <option value="90">Net 90</option>
                  <option value="eom">End of month</option>
                </select>
              </div>
              <button onClick={handleCalc} className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all">Calculate</button>
              {calculated && due && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-5 mt-5">
                  <div className="font-display text-3xl font-extrabold text-primary">
                    {due.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Due date</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {diff !== null && (diff > 0 ? `Due in ${diff} days.` : diff === 0 ? "Due today." : `Overdue by ${Math.abs(diff)} days.`)}
                    {amt ? <><br />Amount due: ${amt.toLocaleString()}</> : null}
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

export default PaymentTermsPage;
