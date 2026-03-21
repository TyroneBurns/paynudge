import { Link } from "react-router-dom";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface ToolsPageProps {
  onOpenAuth: (mode: "signup") => void;
}

const tools = [
  { icon: "🧮", title: "DSO Calculator", desc: "Calculate your Days Sales Outstanding to understand how long it takes to collect payment.", path: "/tools/dso-calculator" },
  { icon: "📅", title: "Net 30 Calculator", desc: "Work out the exact due date for any Net 30, 14, 60, or custom payment term invoice.", path: "/tools/net-30-calculator" },
  { icon: "💸", title: "Late Payment Interest", desc: "Calculate the total interest owed on a late invoice based on your jurisdiction's statutory rate.", path: "/tools/late-payment-interest-calculator" },
  { icon: "📊", title: "AR Turnover Calculator", desc: "Calculate your Accounts Receivable Turnover ratio to measure collection efficiency.", path: "/tools/ar-turnover-calculator" },
  { icon: "🗓️", title: "Payment Terms Calculator", desc: "Convert between different payment terms and calculate exact due dates for your invoices.", path: "/tools/payment-terms-calculator" },
  { icon: "📄", title: "Invoice Generator", desc: "Create and download a professional invoice in seconds — no account required.", path: "/tools/invoice-generator" },
];

const ToolsPage = ({ onOpenAuth }: ToolsPageProps) => (
  <div>
    <div className="bg-surface border-b border-border py-16 text-center pt-24">
      <div className="container-main">
        <h1 className="font-display text-5xl font-bold mb-4">Free Tools for Getting Paid Faster</h1>
        <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">Calculators and generators to help freelancers and small businesses manage invoices and cash flow.</p>
      </div>
    </div>
    <section className="section-padding">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, i) => (
            <Link key={i} to={tool.path} className="bg-surface p-8 rounded-md border border-border hover:-translate-y-1 hover:border-primary hover:shadow-[0_0_32px_rgba(0,212,168,0.1)] transition-all group block">
              <span className="text-4xl block mb-4">{tool.icon}</span>
              <h3 className="font-display text-xl font-bold mb-3 group-hover:text-primary transition-colors">{tool.title}</h3>
              <p className="text-muted-foreground text-[15px] mb-4">{tool.desc}</p>
              <span className="text-xs text-primary font-semibold">Use calculator →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
    <CTASection headline="Automate your reminders while you crunch the numbers." subtitle="PayNudge handles the follow-up. Free plan available." onOpenAuth={onOpenAuth} />
    <Footer />
  </div>
);

export default ToolsPage;
