import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";
import xeroLogo from "@/assets/xero-logo.png";
import gmailLogo from "@/assets/gmail-logo.png";

interface HomePageProps {
  onOpenAuth: (mode: "signup" | "login") => void;
}

const CYCLING_CURRENCIES = ["$2,400", "£1,850", "€2,100", "A$3,200"];

function useCyclingCurrency() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % CYCLING_CURRENCIES.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return { value: CYCLING_CURRENCIES[idx], visible };
}

function useCounter(target: number, prefix = "", duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let cur = 0;
          const step = target / 80;
          const interval = setInterval(() => {
            cur = Math.min(cur + step, target);
            setValue(Math.floor(cur));
            if (cur >= target) clearInterval(interval);
          }, duration / 80);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { ref, display: prefix + value.toLocaleString() };
}

const COUNTRY_FLAGS = [
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇮🇪", name: "Ireland" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇸🇬", name: "Singapore" },
];

const DashboardMockup = () => {
  const synced = useCounter(47, "");
  const outstanding = useCounter(48250, "$");
  const recovered = useCounter(124800, "$");

  const [activities, setActivities] = useState([
    { highlight: "SMS sent", rest: "to Acme Corp", time: "2m ago" },
    { highlight: "INV-008", rest: "marked paid ($650)", time: "1h ago" },
    { highlight: "3 invoices", rest: "pulled from Xero", time: "3h ago" },
  ]);

  useEffect(() => {
    const items = [
      { highlight: "SMS sent", rest: "to TechFlow Ltd" },
      { highlight: "INV-112", rest: "paid ($3,200)" },
      { highlight: "5 invoices", rest: "synced from Xero" },
      { highlight: "Email opened", rest: "by Globex Corp" },
      { highlight: "Reminder sequence", rest: "triggered" },
      { highlight: "INV-098", rest: "paid ($890)" },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      const item = items[idx % items.length]; idx++;
      setActivities((prev) => [{ ...item, time: "just now" }, ...prev.slice(0, 3)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface border border-primary/25 rounded-xl overflow-hidden shadow-[0_0_32px_rgba(0,212,168,0.14),0_32px_80px_rgba(0,0,0,0.55)] animate-float">
      <div className="bg-secondary px-4 py-2.5 flex items-center gap-2 border-b border-border">
        <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
        <div className="w-[11px] h-[11px] rounded-full bg-[#ffbd2e]" />
        <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
        <div className="flex-1 bg-background rounded px-3 py-1 font-mono text-[10px] text-muted-foreground">paynudge.co/dashboard</div>
      </div>
      <div className="flex border-b border-border bg-surface">
        {["Overview", "Invoices", "Sequences", "Settings"].map((tab, i) => (
          <div key={tab} className={`px-3.5 py-2.5 font-mono text-[11px] border-b-2 cursor-pointer transition-all ${i === 0 ? "text-primary border-primary" : "text-muted-foreground border-transparent"}`}>{tab}</div>
        ))}
      </div>
      <div className="p-3.5">
        <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2.5">Collections · Live</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-background border border-border rounded-md p-2.5">
            <div ref={synced.ref} className="font-mono text-[15px] font-semibold">{synced.display}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">Synced</div>
          </div>
          <div className="bg-background border border-border rounded-md p-2.5">
            <div ref={outstanding.ref} className="font-mono text-[15px] font-semibold text-accent">{outstanding.display}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">Outstanding</div>
          </div>
          <div className="bg-background border border-border rounded-md p-2.5">
            <div ref={recovered.ref} className="font-mono text-[15px] font-semibold text-primary">{recovered.display}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">Recovered</div>
          </div>
        </div>
        <div className="h-[52px] flex items-end gap-[3px] mb-3">
          {[38, 62, 50, 76, 66, 90, 72, 94, 82, 98, 85, 96].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent) / 0.6)" }} />
          ))}
        </div>
        <div id="dashFeed">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border text-[10px]">
              <div className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${a.rest.includes("paid") ? "bg-accent" : "bg-primary"}`} />
              <div className="flex-1 text-foreground">{a.highlight} {a.rest}</div>
              <div className="text-muted-foreground">{a.time}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-border flex items-center gap-2">
          <span className="font-mono text-[9px] text-muted-foreground">✕ Xero sync active</span>
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
};

const SEQ_STEPS = [
  { day: "Day 0", name: "Friendly Reminder", channels: ["Email"] },
  { day: "Day 3", name: "Follow-up", channels: ["Email"] },
  { day: "Day 7", name: "Firm Reminder", channels: ["Email", "SMS"] },
  { day: "Day 14", name: "Final Notice", channels: ["Email", "SMS"] },
];

const HomePage = ({ onOpenAuth }: HomePageProps) => {
  const cycling = useCyclingCurrency();

  return (
    <div>
      {/* HERO */}
      <header className="pt-28 sm:pt-36 md:pt-40 pb-16 md:pb-24 overflow-hidden relative">
        <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(0,212,168,0.055)_0%,transparent_65%)] pointer-events-none" />
        <div className="container-main grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="animate-fade-up">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest block mb-4">AI collections for Xero</span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-[1.05]">
              Turn overdue invoices into
              <span className="block text-primary">AI-driven collections.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-[620px]">
              PayNudge is your AI collections assistant for Xero. It prioritises overdue accounts, triggers the right reminder at the right time, and gives your team a live command layer to recover cash without awkward chasing.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="inline-flex items-center px-2.5 py-1 rounded font-mono text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">✓ AI-driven reminder timing</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded font-mono text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">✓ Xero sync + Gmail delivery</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded font-mono text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">✓ Operator-grade control centre</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button onClick={() => onOpenAuth("signup")} className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_8px_28px_rgba(0,212,168,0.32)] hover:-translate-y-0.5 transition-all">
                Start with PayNudge AI
              </button>
              <a href="#how-it-works" className="inline-flex items-center justify-center px-7 py-3.5 rounded-md font-bold border border-border text-foreground hover:border-primary hover:text-primary transition-all">
                See the AI flow
              </a>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex">
                {[
                  { l: "A", bg: "bg-[hsl(210,80%,65%)]" },
                  { l: "S", bg: "bg-[hsl(270,60%,65%)]" },
                  { l: "M", bg: "bg-[hsl(160,60%,55%)]" },
                  { l: "J", bg: "bg-[hsl(40,80%,60%)]" },
                  { l: "R", bg: "bg-[hsl(330,65%,60%)]" },
                ].map((a, i) => (
                  <div key={i} className={`w-[30px] h-[30px] rounded-full border-2 border-background ${a.bg} flex items-center justify-center text-[11px] font-extrabold text-background -ml-2 first:ml-0`}>{a.l}</div>
                ))}
              </div>
              <span className="text-accent text-xs tracking-wider">★★★★★</span>
              <span className="text-xs text-muted-foreground">Loved by small businesses</span>
            </div>
          </div>
          <div className="animate-fade-up hidden md:block" style={{ animationDelay: "0.2s" }}>
            <DashboardMockup />
          </div>
        </div>
      </header>

      {/* COUNTRY FLAGS STRIP */}
      <div className="border-y border-border py-4">
        <div className="container-main flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
          {COUNTRY_FLAGS.map((c, i) => (
            <span key={c.name} className="text-sm text-muted-foreground">
              {i > 0 && <span className="mr-3">·</span>}
              {c.flag} {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* AI ENGINE SECTION */}
      <section className="section-padding border-b border-border bg-gradient-to-b from-background to-surface/70">
        <div className="container-main">
          <div className="text-center mb-10 md:mb-14">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Why the AI layer matters</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-[42px] font-bold mt-3 mb-4">Not just reminders. An AI collections engine built for small businesses.</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-[760px] mx-auto">PayNudge sits between your invoices and your cashflow. It watches what is due, decides who to chase next, escalates when risk is rising, and keeps every follow-up visible inside one live dashboard.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "AI prioritises who to chase first",
                desc: "Focus your team on the invoices most likely to slip. PayNudge helps surface risk, value, and urgency instead of leaving everything buried in a spreadsheet.",
                badge: "Risk-led prioritisation",
              },
              {
                title: "AI adapts the reminder flow",
                desc: "Email, SMS, and escalation steps work together in one sequence. The result feels more like an automated collections operator than a basic reminder tool.",
                badge: "Tone + timing control",
              },
              {
                title: "AI stays visible to the operator",
                desc: "You still get full control. Review what is happening, see invoice status live, and intervene when needed from the same product family as your internal Control Centre.",
                badge: "AI + human control",
              },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-6 md:p-7 shadow-[0_12px_34px_rgba(0,0,0,0.24)] hover:-translate-y-1 transition-all">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary mb-4">{item.badge}</div>
                <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS BADGE */}
      <div className="border-b border-border bg-surface py-8">
        <div className="container-main flex flex-col sm:flex-row items-center justify-center gap-6">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Integrates seamlessly with:</span>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 bg-background border border-border rounded-md px-5 py-3">
              <img src={xeroLogo} alt="Xero logo" className="w-7 h-7 object-contain" />
              <span className="font-bold text-sm">Xero</span>
            </div>
            <div className="flex items-center gap-2.5 bg-background border border-border rounded-md px-5 py-3">
              <img src={gmailLogo} alt="Gmail logo" className="w-7 h-7 object-contain" />
              <span className="font-bold text-sm">Gmail</span>
            </div>
          </div>
        </div>
      </div>

      {/* PROBLEM SECTION */}
      <section className="section-padding">
        <div className="container-main grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="animate-fade-up">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">The Problem</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-3 mb-5">Most teams do not need more invoicing software. They need an AI layer that gets invoices paid.</h2>
            <p className="text-muted-foreground mb-4">Manual follow-ups waste time, destroy momentum, and force founders into awkward collections work.</p>
            <p className="font-semibold text-foreground"><span className="text-primary">PayNudge</span> turns that into a repeatable AI-led collections workflow across email, SMS, and operator review.</p>
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center gap-3.5 p-3.5 bg-destructive/5 rounded-md border border-destructive/20">
                <span className="text-lg">📧</span>
                <div><div className="text-[11px] text-muted-foreground mb-0.5">Email open rate</div><div className="font-bold text-destructive font-mono text-sm">~20% — often buried in spam</div></div>
              </div>
              <div className="flex items-center gap-3.5 p-3.5 bg-primary/5 rounded-md border border-primary/20">
                <span className="text-lg">📱</span>
                <div><div className="text-[11px] text-muted-foreground mb-0.5">SMS open rate</div><div className="font-bold text-primary font-mono text-sm">98% — read within 3 minutes</div></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3.5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {[
              { icon: "⏰", title: "Hours wasted on manual follow-ups", desc: "The average small business owner spends 14+ hours per month chasing overdue invoices. That's nearly two full working days every month." },
              { icon: "💸", title: "Cash flow suffers silently", desc: "Late payments directly impact your ability to pay suppliers, take on new work, and grow. It has a measurable financial cost." },
              { icon: "😬", title: "Client relationships get awkward", desc: "Asking for money you're owed feels uncomfortable. Automated, professional reminders handle follow-up so you never have to." },
            ].map((item, i) => (
              <div key={i} className="bg-surface border border-border rounded-md p-5 flex gap-3.5 items-start hover:-translate-y-1 transition-all">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div><div className="font-bold font-display text-sm mb-1">{item.title}</div><div className="text-xs text-muted-foreground">{item.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <section id="how-it-works" className="section-padding bg-surface">
        <div className="container-main">
          <div className="text-center mb-10 md:mb-14">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">How it works</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-[42px] font-bold mt-3 mb-4">Connect Xero once. Let the AI collections workflow do the chasing.</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-[760px] mx-auto">PayNudge watches due dates, runs the reminder logic, and keeps your operator in control from a live dashboard. The whole system is built to feel more like a collections cockpit than a simple reminder app.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-14">
            {[
              { n: 1, icon: "🔗", title: "Connect Xero", desc: "Link your Xero account in one click. Invoices sync automatically and stay up to date." },
              { n: 2, icon: "🧠", title: "Let AI Prioritise", desc: "PayNudge decides which invoices need attention first, when to escalate, and where email or SMS should take the lead." },
              { n: 3, icon: "💰", title: "Recover Cash Faster", desc: "The system follows up automatically, stops when paid, and keeps everything visible to your team." },
            ].map((step) => (
              <div key={step.n} className="bg-background border border-border rounded-md p-8 relative pt-10 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all">
                <div className="absolute -top-4 left-6 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-display font-extrabold text-sm">{step.n}</div>
                <span className="text-3xl block mb-3">{step.icon}</span>
                <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Reminder Flow Builder */}
          <div className="bg-background border border-primary/20 rounded-xl p-5 md:p-8 max-w-[720px] mx-auto shadow-[0_0_32px_rgba(0,212,168,0.14)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-display font-bold text-lg">Reminder Flow Builder</div>
                <div className="text-xs text-muted-foreground">Default Chase Sequence</div>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground bg-surface px-3 py-1.5 rounded border border-border">paynudge.co/reminder-flow</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SEQ_STEPS.map((s, i) => (
                <div key={i} className="relative">
                  <div className="bg-surface border border-border rounded-lg p-4 hover:border-primary/50 transition-all">
                    <div className="font-mono text-primary text-xs font-bold mb-2">{s.day}</div>
                    <div className="font-display font-bold text-sm mb-3">{s.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.channels.map((c) => (
                        <span key={c} className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${c === "SMS" ? "bg-accent/15 text-accent border border-accent/20" : "bg-primary/10 text-primary border border-primary/20"}`}>{c}</span>
                      ))}
                    </div>
                  </div>
                  {i < 3 && <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-[2px] bg-border" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-10 md:mb-14">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Features</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-[42px] font-bold mt-3 mb-4">Everything you need to run AI-led collections</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-[680px] mx-auto">From Xero sync and Gmail delivery to operator dashboards and reminder intelligence, PayNudge is built to shorten the path from invoice sent to cash collected.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "📱", title: "SMS with 98% Open Rate", desc: "Most invoice reminders go to email where they're buried in spam. PayNudge sends SMS reminders that get read within minutes, not days.", badge: "98% open rate vs 20% for email" },
              { icon: "🔄", title: "Real-time Xero Sync", desc: "Invoices sync automatically from Xero. When a payment is recorded, PayNudge stops reminders instantly. No manual work required.", badge: "Real-time two-way sync" },
              { icon: "🧠", title: "AI Collections Logic", desc: "Run a smarter chase flow with AI-assisted timing, message sequencing, and escalation rules across email and SMS.", badge: "AI-led prioritisation" },
              { icon: "👤", title: "Separate Chase Email", desc: "Send reminders to a different contact than the invoice recipient. Perfect for B2B businesses dealing with accounts payable." },
              { icon: "📊", title: "Email Delivery Status", desc: "See when reminders are delivered, opened, or bounced at a glance. Full visibility into every touchpoint." },
              { icon: "📈", title: "Dashboard Analytics", desc: "Real-time charts, aging breakdowns, and collection metrics. Know your cash position at a glance every morning." },
              { icon: "📥", title: "CSV Data Export", desc: "Export your invoice and reminder data for easy reporting. Your data is always yours, always accessible." },
              { icon: "📧", title: "Gmail Integration", desc: "Send email reminders through your Gmail account for better deliverability and a professional sender address." },
              { icon: "🔒", title: "Bank-grade Security", desc: "All data encrypted at rest and in transit. OAuth 2.0 with Xero. Your accounting credentials are never stored." },
            ].map((f, i) => (
              <div key={i} className="bg-surface border border-border border-l-[3px] border-l-primary rounded-md p-6 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all">
                <span className="text-xl block mb-2.5">{f.icon}</span>
                <div className="font-display text-[15px] font-bold mb-2">{f.title}</div>
                <div className="text-[13px] text-muted-foreground leading-relaxed mb-2">{f.desc}</div>
                {f.badge && <span className="inline-flex items-center px-2.5 py-1 rounded font-mono text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">{f.badge}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CYCLING CURRENCY SHOWCASE */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <section className="bg-surface py-12 text-center">
        <div className="container-main">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-3">Multi-currency support</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-muted-foreground text-lg">Invoices worth</span>
            <span className={`font-display text-3xl font-extrabold text-primary transition-opacity duration-300 min-w-[140px] inline-block ${cycling.visible ? "opacity-100" : "opacity-0"}`}>
              {cycling.value}
            </span>
            <span className="text-muted-foreground text-lg">and counting</span>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL HERO */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <section className="bg-surface border-t border-b border-border py-20 text-center relative overflow-hidden">
        <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 font-display text-[100px] md:text-[200px] font-extrabold text-primary/[0.03] leading-none pointer-events-none select-none whitespace-nowrap">"</div>
        <div className="container-main relative">
          <div className="text-[11px] font-mono text-primary uppercase tracking-widest mb-6">Customer story</div>
          <p className="font-display text-xl sm:text-2xl md:text-3xl font-semibold italic max-w-[700px] mx-auto mb-6 leading-relaxed">"PayNudge cut our average payment time from 45 days to just 12. It practically runs itself."</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 bg-[hsl(270,60%,65%)] rounded-full flex items-center justify-center font-display font-extrabold text-lg text-background">S</div>
            <div className="text-left"><div className="font-bold text-[15px]">Sarah Mitchell</div><div className="text-xs text-muted-foreground">CFO · Brightly Studio</div></div>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-7 mt-10 md:mt-14 max-w-[680px] mx-auto">
            {[{ s: "98%", l: "SMS open rate" }, { s: "7 days", l: "Faster payment on average" }, { s: "20 hrs", l: "Saved monthly per user" }].map((x, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary">{x.s}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Reviews</span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-[42px] font-bold mt-3 mb-4">Real results from real people</h2>
            <p className="text-muted-foreground text-base md:text-lg">Small business owners who stopped chasing and started collecting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { i: "M", n: "Marcus T.", r: "Freelance Developer", c: "bg-[hsl(160,60%,55%)]", t: "Set it up on Sunday. Had three overdue invoices paid by Tuesday morning. I was genuinely shocked by how fast it worked." },
              { i: "S", n: "Sarah L.", r: "Design Agency Owner", c: "bg-[hsl(270,60%,65%)]", t: "The SMS reminders are game-changing. My clients actually read them. Chasing payments used to feel like a part-time job — it doesn't anymore." },
              { i: "R", n: "Raj P.", r: "Accountant", c: "bg-[hsl(40,80%,60%)]", t: "I recommend PayNudge to all my clients now. The Xero integration is seamless and setup takes minutes. It simply works." },
              { i: "A", n: "Alice W.", r: "Photographer", c: "bg-[hsl(210,80%,65%)]", t: "Getting paid late was killing my cash flow. PayNudge sorted it completely. I'm now down to near-zero late invoices every month." },
              { i: "D", n: "Dan H.", r: "Contractor", c: "bg-[hsl(160,60%,55%)]", t: "I was skeptical about SMS reminders but the open rate data is real. My clients respond to texts in a way they never responded to emails." },
              { i: "N", n: "Nina K.", r: "Marketing Consultant", c: "bg-[hsl(330,65%,60%)]", t: "Best $29 I spend each month, no contest. It has paid for itself dozens of times over in recovered invoices I would have written off." },
            ].map((t, idx) => (
              <div key={idx} className="bg-surface border border-border rounded-md p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-[34px] h-[34px] rounded-full ${t.c} flex items-center justify-center font-extrabold text-primary-foreground font-display text-sm flex-shrink-0`}>{t.i}</div>
                  <div><div className="font-bold text-[13px]">{t.n}</div><div className="text-[11px] text-muted-foreground">{t.r}</div></div>
                  <div className="ml-auto text-accent text-[11px]">★★★★★</div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">"{t.t}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <CTASection headline="Ready to let AI handle the chasing?" subtitle="Create your account, connect Xero, and launch your AI collections workflow in minutes." onOpenAuth={onOpenAuth} />
      <Footer />
    </div>
  );
};

export default HomePage;
