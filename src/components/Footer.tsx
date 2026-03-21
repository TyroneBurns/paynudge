import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border py-14 bg-background">
    <div className="container-main">
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-10">
        <div>
          <Link to="/" className="font-display font-extrabold text-xl flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-primary rounded-md inline-block" />
            PayNudge
          </Link>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-[230px]">
            Automated invoice reminders via SMS & email that actually get read — and get you paid faster.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Product</h4>
          <ul className="space-y-2">
            <li><Link to="/features" className="text-xs text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="text-xs text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
            <li><Link to="/about" className="text-xs text-muted-foreground hover:text-primary transition-colors">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Solutions</h4>
          <ul className="space-y-2">
            <li><Link to="/invoice-reminder-software" className="text-xs text-muted-foreground hover:text-primary transition-colors">Invoice Reminders</Link></li>
            <li><Link to="/xero-invoice-reminders" className="text-xs text-muted-foreground hover:text-primary transition-colors">Xero Reminders</Link></li>
            <li><Link to="/sms-invoice-reminders" className="text-xs text-muted-foreground hover:text-primary transition-colors">SMS Reminders</Link></li>
            <li><Link to="/compare/paynudge-vs-paidnice" className="text-xs text-muted-foreground hover:text-primary transition-colors">vs Paidnice</Link></li>
            <li><Link to="/compare/paynudge-vs-xero-reminders" className="text-xs text-muted-foreground hover:text-primary transition-colors">vs Xero Built-in</Link></li>
            <li><Link to="/compare/paynudge-vs-chaser" className="text-xs text-muted-foreground hover:text-primary transition-colors">vs Chaser</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-4">Resources</h4>
          <ul className="space-y-2">
            <li><Link to="/blog" className="text-xs text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
            <li><Link to="/tools" className="text-xs text-muted-foreground hover:text-primary transition-colors">Free Tools</Link></li>
            <li><Link to="/late-payment-laws" className="text-xs text-muted-foreground hover:text-primary transition-colors">Late Payment Laws</Link></li>
            <li><Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border pt-5 flex justify-between items-center text-[11px] text-muted-foreground flex-wrap gap-4">
        <span>© 2026 PayNudge. All rights reserved.</span>
        <div className="flex gap-5">
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <a href="mailto:hello@paynudge.co" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
