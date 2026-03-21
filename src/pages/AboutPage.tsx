import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

interface AboutPageProps {
  onOpenAuth: (mode: "signup") => void;
}

const AboutPage = ({ onOpenAuth }: AboutPageProps) => (
  <div>
    <div className="bg-surface border-b border-border py-16 text-center pt-24">
      <div className="container-main">
        <h1 className="font-display text-5xl font-bold mb-4">Built by people who got tired of chasing invoices</h1>
        <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">We built PayNudge because we lived the problem first-hand.</p>
      </div>
    </div>
    <section className="section-padding">
      <div className="container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-display text-3xl font-bold mb-6">Our story</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">PayNudge started because our founder spent three years running a small consulting firm — and three years spending far too many Friday afternoons writing awkward "just following up on that invoice" emails to clients they genuinely liked.</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">The tools that existed were either expensive enterprise software, overly complex to configure, or didn't connect properly to Xero. So we built our own. Then freelancer friends asked to use it. Then their friends. And here we are.</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">Today, PayNudge helps hundreds of small business owners, freelancers, and independent professionals get paid faster — without the emotional weight of manual follow-ups.</p>
            <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all">
              Try PayNudge free →
            </button>
          </div>
          <div className="bg-surface border border-primary/20 rounded-lg p-8 shadow-[0_0_32px_rgba(0,212,168,0.1)]">
            <h3 className="font-display text-xl font-bold mb-5 text-primary">By the numbers</h3>
            {[
              { n: "500+", l: "Active users" },
              { n: "$12M+", l: "In invoices reminded" },
              { n: "7 days", l: "Average payment acceleration" },
              { n: "98%", l: "SMS open rate" },
              { n: "20 hrs", l: "Average hours saved per month" },
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">{stat.l}</span>
                <span className="font-display font-extrabold text-xl text-primary">{stat.n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Values</span>
          <h3 className="font-display text-2xl font-bold mt-2 mb-8">What we believe</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "⚡", title: "Speed over perfection", desc: "Ship fast, learn, iterate. The best tool is the one people are actually using." },
            { icon: "🤝", title: "Small business first", desc: "We build for the solo trader, the two-person agency. Not the Fortune 500." },
            { icon: "🔍", title: "Radical transparency", desc: "No hidden fees. No dark patterns. We tell you exactly what you're paying for." },
            { icon: "🛡️", title: "Your data is yours", desc: "We don't sell it or mine it. Your client list belongs to you alone." },
            { icon: "📏", title: "Simple by design", desc: "We'd rather do ten things brilliantly than fifty things adequately." },
            { icon: "💬", title: "Real support", desc: "Real humans, real answers. No bots, no auto-replies, no ticket queues." },
          ].map((v, i) => (
            <div key={i} className="bg-surface p-6 rounded-md border border-border hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all">
              <span className="text-3xl block mb-3">{v.icon}</span>
              <h3 className="font-display text-lg font-bold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest">The team</span>
          <h3 className="font-display text-2xl font-bold mt-2 mb-8">The people behind PayNudge</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { initials: "T", name: "Tyrone Burns", role: "Co-founder & CEO", color: "bg-primary" },
            { initials: "A", name: "Ayesha K.", role: "Co-founder & CTO", color: "bg-[#a78bfa]" },
            { initials: "T", name: "Tom B.", role: "Head of Product", color: "bg-accent" },
            { initials: "L", name: "Lena P.", role: "Head of Growth", color: "bg-[#60a5fa]" },
          ].map((m, i) => (
            <div key={i} className="bg-surface border border-border rounded-md p-6 text-center">
              <div className={`w-16 h-16 rounded-full ${m.color} mx-auto mb-3 flex items-center justify-center font-display font-extrabold text-xl text-primary-foreground`}>{m.initials}</div>
              <div className="font-bold font-display">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.role}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-surface border border-border rounded-lg p-10 text-center">
          <h3 className="font-display text-2xl font-bold mb-3">Want to join us?</h3>
          <p className="text-muted-foreground text-sm max-w-[440px] mx-auto mb-5">If you care deeply about small business and love building useful product, we'd love to hear from you.</p>
          <a href="mailto:hello@paynudge.co" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] transition-all">Get in touch →</a>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default AboutPage;
