import { Link } from "react-router-dom";

interface CTASectionProps {
  headline: string;
  subtitle: string;
  onOpenAuth: (mode: "signup") => void;
}

const CTASection = ({ headline, subtitle, onOpenAuth }: CTASectionProps) => (
  <section className="section-padding bg-surface border-t border-border text-center">
    <div className="container-main max-w-[600px]">
      <h2 className="font-display text-4xl md:text-[42px] font-bold mb-4">{headline}</h2>
      <p className="text-muted-foreground text-lg mb-8">{subtitle}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">
          Create free account
        </button>
        <Link to="/pricing" className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold border border-border text-foreground hover:bg-surface-hover transition-all">
          Compare plans
        </Link>
      </div>
      <div className="flex justify-center gap-6 text-sm text-muted-foreground flex-wrap">
        <span>✓ No credit card required</span>
        <span>✓ Free tier available</span>
        <span>✓ Cancel any time</span>
      </div>
    </div>
  </section>
);

export default CTASection;
