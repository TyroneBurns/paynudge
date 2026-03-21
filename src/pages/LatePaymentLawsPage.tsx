import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface Props { onOpenAuth: (mode: "signup") => void; }

const laws = [
  { country: "🇬🇧 United Kingdom", legislation: "Late Payment of Commercial Debts Act 1998", rate: "8% above Bank of England base rate", period: "30 days (public sector), 60 days (commercial)", notes: "Compensation charges also apply: £40-£100 depending on debt size." },
  { country: "🇦🇺 Australia", legislation: "PPSA / individual state legislation", rate: "Courts assess based on actual loss", period: "30 days (standard commercial)", notes: "Small claims court available for invoices under $20k in most states." },
  { country: "🇺🇸 United States", legislation: "Varies by state — no federal law", rate: "Contractual or state statutory rate (typically 1.5%/mo)", period: "30 days unless otherwise agreed", notes: "Best practice is to specify terms in your contract and invoice clearly." },
  { country: "🇪🇺 European Union", legislation: "EU Late Payment Directive 2011/7/EU", rate: "ECB reference rate + 8%", period: "30 days (public authority), 60 days (commercial)", notes: "Minimum €40 compensation flat fee also applies per invoice." },
  { country: "🇨🇦 Canada", legislation: "Interest Act (federal) + provincial laws", rate: "Contractual — Interest Act limits some rates", period: "30 days (standard commercial practice)", notes: "Government invoices subject to separate Prompt Payment legislation in some provinces." },
  { country: "🇳🇿 New Zealand", legislation: "Interest on Money Claims Act 2016", rate: "10% per annum (current prescribed rate)", period: "30 days (standard commercial)", notes: "Claimable as a debt in the Disputes Tribunal for amounts under NZ$30,000." },
];

const LatePaymentLawsPage = ({ onOpenAuth }: Props) => (
  <div>
    <section className="pt-28 pb-20">
      <div className="container-main">
        <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Resource</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-2 mb-4">Late Payment Laws by Country</h1>
        <p className="text-muted-foreground text-lg max-w-[680px] mb-8">A reference guide to statutory late payment rights for small businesses. Know what you're entitled to before you chase.</p>

        <div className="bg-primary/5 border-l-[3px] border-primary px-5 py-4 rounded-r-md mb-10">
          <p className="text-sm text-muted-foreground"><strong className="text-foreground">Disclaimer:</strong> This information is for general reference only and does not constitute legal advice. Laws change. Consult a qualified professional in your jurisdiction for advice on your specific situation.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b-2 border-primary">Country</th>
                <th className="text-left p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b-2 border-primary">Legislation</th>
                <th className="text-left p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b-2 border-primary">Statutory Interest Rate</th>
                <th className="text-left p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b-2 border-primary">Standard Payment Period</th>
                <th className="text-left p-3 bg-secondary font-mono text-[10px] text-muted-foreground uppercase tracking-wider border-b-2 border-primary">Key Notes</th>
              </tr>
            </thead>
            <tbody>
              {laws.map((l, i) => (
                <tr key={i} className="border-b border-border hover:bg-primary/[0.02]">
                  <td className="p-3 font-bold">{l.country}</td>
                  <td className="p-3">{l.legislation}</td>
                  <td className="p-3 text-primary font-mono text-xs">{l.rate}</td>
                  <td className="p-3">{l.period}</td>
                  <td className="p-3 text-muted-foreground">{l.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: "📋", title: "Always specify your terms", desc: "State your payment terms clearly on every invoice and in your contract. \"Net 30\" is much harder to dispute than \"payment due soon\"." },
            { icon: "⏰", title: "Start the clock early", desc: "Statutory interest often begins accruing from the due date. Sending reminders early means less time overdue and less awkward at 90 days." },
            { icon: "📱", title: "Automate your reminders", desc: "The best way to enforce your rights is to avoid needing them. Automated reminders mean fewer invoices ever become overdue." },
          ].map((item, i) => (
            <div key={i} className="bg-surface p-6 rounded-md border border-border">
              <span className="text-3xl block mb-3">{item.icon}</span>
              <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    <CTASection headline="Start collecting in the next 30 seconds." subtitle="Free plan available. No credit card needed. Connects to Xero instantly." onOpenAuth={onOpenAuth} />
    <Footer />
  </div>
);

export default LatePaymentLawsPage;
