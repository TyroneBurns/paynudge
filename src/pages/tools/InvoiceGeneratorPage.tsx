import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer";

interface LineItem { desc: string; qty: number; rate: number; }

const InvoiceGeneratorPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const due30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [from, setFrom] = useState("");
  const [fromAddr, setFromAddr] = useState("");
  const [to, setTo] = useState("");
  const [toAddr, setToAddr] = useState("");
  const [invNum, setInvNum] = useState("INV-001");
  const [invDate, setInvDate] = useState(today);
  const [dueDate, setDueDate] = useState(due30);
  const [currency, setCurrency] = useState("$");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ desc: "", qty: 1, rate: 0 }]);

  const addLine = () => setLines([...lines, { desc: "", qty: 1, rate: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, j) => j !== i));
  const updateLine = (i: number, field: keyof LineItem, val: string | number) => {
    const updated = [...lines];
    (updated[i] as any)[field] = val;
    setLines(updated);
  };

  const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const fmtDate = (d: string) => { if (!d) return "—"; const p = d.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; };

  const inputClass = "w-full bg-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm";
  const labelClass = "block text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-2";

  return (
    <div>
      <section className="pt-28 pb-20">
        <div className="container-main">
          <Link to="/tools" className="inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all mb-7">← All tools</Link>
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest block">Free Tool</span>
          <h1 className="font-display text-4xl font-bold mt-2 mb-2">Invoice Generator</h1>
          <p className="text-muted-foreground mb-10">Create a professional invoice in seconds. Fill in the details, preview, and print or save as PDF.</p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
            {/* Form */}
            <div className="bg-surface border border-border rounded-lg p-7">
              <h3 className="font-display text-lg font-bold mb-5">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={labelClass}>Your Business Name</label><input className={inputClass} placeholder="Acme Consulting Ltd" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                <div className="col-span-2"><label className={labelClass}>Your Business Address</label><input className={inputClass} placeholder="123 Main St, London" value={fromAddr} onChange={(e) => setFromAddr(e.target.value)} /></div>
                <div className="col-span-2"><label className={labelClass}>Bill To (Client Name)</label><input className={inputClass} placeholder="Client Business Ltd" value={to} onChange={(e) => setTo(e.target.value)} /></div>
                <div className="col-span-2"><label className={labelClass}>Client Address</label><input className={inputClass} placeholder="456 Client Rd" value={toAddr} onChange={(e) => setToAddr(e.target.value)} /></div>
                <div><label className={labelClass}>Invoice Number</label><input className={inputClass} value={invNum} onChange={(e) => setInvNum(e.target.value)} /></div>
                <div><label className={labelClass}>Invoice Date</label><input className={inputClass} type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} /></div>
                <div><label className={labelClass}>Due Date</label><input className={inputClass} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                <div><label className={labelClass}>Currency</label>
                  <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="$">USD ($)</option><option value="£">GBP (£)</option><option value="€">EUR (€)</option><option value="A$">AUD (A$)</option><option value="NZ$">NZD (NZ$)</option>
                  </select>
                </div>
              </div>
              <div className="mt-5">
                <label className={labelClass}>Line Items</label>
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2 items-center">
                    <input className={inputClass} placeholder="Description" value={line.desc} onChange={(e) => updateLine(i, "desc", e.target.value)} />
                    <input className={inputClass} type="number" placeholder="Qty" value={line.qty || ""} onChange={(e) => updateLine(i, "qty", parseFloat(e.target.value) || 0)} />
                    <input className={inputClass} type="number" placeholder="Rate" value={line.rate || ""} onChange={(e) => updateLine(i, "rate", parseFloat(e.target.value) || 0)} />
                    <button onClick={() => removeLine(i)} className="bg-border text-muted-foreground rounded px-2 py-2 text-sm hover:bg-destructive/20 transition-colors">✕</button>
                  </div>
                ))}
                <button onClick={addLine} className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-all">+ Add line item</button>
              </div>
              <div className="mt-5">
                <label className={labelClass}>Notes (optional)</label>
                <input className={inputClass} placeholder="Thank you for your business!" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            {/* Preview */}
            <div>
              <div className="bg-white text-gray-900 rounded-lg p-9 shadow-[0_8px_32px_rgba(0,0,0,.3)]" style={{ fontSize: "13px", lineHeight: 1.6 }}>
                <div className="flex justify-between mb-8">
                  <div>
                    <div className="text-xl font-extrabold text-gray-900">{from || "Your Business Name"}</div>
                    <div className="text-[11px] text-gray-500 mt-1 whitespace-pre-line">{fromAddr || "Your Address"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-gray-900">INVOICE</div>
                    <div className="font-mono text-sm text-gray-500 mt-1">{invNum}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-7">
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Bill To</div>
                    <div className="font-bold">{to || "Client Name"}</div>
                    <div className="text-[11px] text-gray-500">{toAddr || "Client Address"}</div>
                  </div>
                  <div className="text-right text-[11px] text-gray-500">
                    <div>Date: {fmtDate(invDate)}</div>
                    <div>Due: {fmtDate(dueDate)}</div>
                  </div>
                </div>
                <table className="w-full border-collapse mb-5">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 text-[10px] uppercase tracking-wider">Description</th>
                      <th className="p-2 text-[10px] uppercase text-center">Qty</th>
                      <th className="p-2 text-[10px] uppercase text-center">Rate</th>
                      <th className="p-2 text-[10px] uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.filter(l => l.desc).map((l, i) => (
                      <tr key={i} className="border-b border-gray-200" style={{ background: i % 2 ? "#fafafa" : "white" }}>
                        <td className="p-2 text-xs">{l.desc}</td>
                        <td className="p-2 text-xs text-center">{l.qty}</td>
                        <td className="p-2 text-xs text-center">{currency}{l.rate.toFixed(2)}</td>
                        <td className="p-2 text-xs text-right">{currency}{(l.qty * l.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                    {lines.filter(l => l.desc).length === 0 && (
                      <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-xs">Add line items above</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="min-w-[200px]">
                    <div className="flex justify-between p-2 text-xs"><span>Subtotal</span><span>{currency}{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-2.5 bg-gray-900 text-white font-bold rounded text-xs"><span>Total Due</span><span>{currency}{subtotal.toFixed(2)}</span></div>
                  </div>
                </div>
                {notes && <div className="mt-6 pt-4 border-t border-gray-200 text-[11px] text-gray-500">{notes}</div>}
              </div>
              <button onClick={() => window.print()} className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all">
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default InvoiceGeneratorPage;
