import { useState } from "react";
import Footer from "../components/Footer";

const DashboardPage = () => {
  const [activeView, setActiveView] = useState("overview");

  const sidebarLinks = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "invoices", label: "Invoices", icon: "📄" },
    { id: "timeline", label: "Timeline", icon: "🕐" },
    { id: "sequences", label: "Sequences", icon: "🔔" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "activity", label: "Activity Feed", icon: "⚡" },
    { id: "audit", label: "Audit Log", icon: "🔒" },
  ];

  const invoices = [
    { id: "INV-001", client: "Acme Corp", amount: "$2,500", issued: "Jan 20", due: "Feb 20", status: "paid", reminders: 2 },
    { id: "INV-002", client: "TechStart Inc", amount: "$4,200", issued: "Feb 8", due: "Mar 10", status: "pending", reminders: 1 },
    { id: "INV-003", client: "Delta Services", amount: "$1,850", issued: "Jan 10", due: "Feb 10", status: "overdue", reminders: 3 },
    { id: "INV-004", client: "Global Ltd", amount: "$6,700", issued: "Feb 28", due: "Mar 30", status: "pending", reminders: 0 },
    { id: "INV-005", client: "Nimbus Digital", amount: "$3,100", issued: "Jan 15", due: "Feb 15", status: "paid", reminders: 1 },
    { id: "INV-006", client: "Brightside Co", amount: "$900", issued: "Feb 20", due: "Mar 20", status: "pending", reminders: 0 },
    { id: "INV-007", client: "Apex Consulting", amount: "$12,000", issued: "Feb 1", due: "Mar 1", status: "overdue", reminders: 4 },
  ];

  const statusColors: Record<string, string> = {
    paid: "bg-primary/15 text-primary",
    pending: "bg-accent/15 text-accent",
    overdue: "bg-destructive/15 text-destructive",
  };

  const activityFeed = [
    { type: "sms", text: "SMS reminder sent to Acme Corp for INV-003", time: "2 minutes ago", icon: "📱" },
    { type: "paid", text: "Invoice #INV-005 marked as paid ($3,100.00)", time: "1 hour ago", icon: "💰" },
    { type: "sync", text: "3 invoices synced from Xero", time: "3 hours ago", icon: "🔄" },
    { type: "email", text: "Email reminder opened by Delta Services", time: "5 hours ago", icon: "📧" },
    { type: "sms", text: "SMS reminder sent to Apex Consulting for INV-007", time: "6 hours ago", icon: "📱" },
    { type: "paid", text: "Invoice #INV-001 marked as paid ($2,500.00)", time: "8 hours ago", icon: "💰" },
    { type: "email", text: "Email reminder bounced for Brightside Co", time: "12 hours ago", icon: "❌" },
    { type: "sync", text: "5 invoices synced from Xero", time: "1 day ago", icon: "🔄" },
    { type: "sequence", text: "Reminder sequence triggered for INV-004", time: "1 day ago", icon: "⚡" },
    { type: "email", text: "Email reminder sent to Global Ltd for INV-004", time: "1 day ago", icon: "📧" },
  ];

  const auditLog = [
    { action: "Reminder sent", detail: "SMS to Acme Corp — INV-003", user: "System", time: "Mar 7, 2026 09:32", level: "info" },
    { action: "Invoice paid", detail: "INV-005 — $3,100.00 recorded from Xero", user: "Xero Sync", time: "Mar 7, 2026 08:14", level: "success" },
    { action: "Sequence modified", detail: "Standard — Net 30: Step 3 message edited", user: "admin@company.com", time: "Mar 6, 2026 16:45", level: "info" },
    { action: "Xero sync completed", detail: "3 new invoices, 2 updated", user: "System", time: "Mar 6, 2026 14:00", level: "info" },
    { action: "Email bounced", detail: "Reminder to Brightside Co — invalid email", user: "System", time: "Mar 6, 2026 11:22", level: "warning" },
    { action: "User login", detail: "Logged in from 192.168.1.x", user: "admin@company.com", time: "Mar 6, 2026 09:00", level: "info" },
    { action: "Plan upgraded", detail: "Free → Paid ($29/mo)", user: "admin@company.com", time: "Mar 5, 2026 15:30", level: "success" },
    { action: "Xero connected", detail: "OAuth token granted for tenant", user: "admin@company.com", time: "Mar 5, 2026 15:28", level: "success" },
    { action: "Account created", detail: "New account registered", user: "admin@company.com", time: "Mar 5, 2026 15:25", level: "info" },
  ];

  const levelColors: Record<string, string> = {
    info: "bg-primary/10 text-primary",
    success: "bg-primary/15 text-primary",
    warning: "bg-accent/15 text-accent",
  };

  const timelineEvents = [
    { date: "Mar 7", events: [
      { time: "09:32", type: "sms", text: "SMS sent to Acme Corp", invoice: "INV-003", color: "bg-accent" },
      { time: "08:14", type: "paid", text: "Invoice paid — $3,100", invoice: "INV-005", color: "bg-primary" },
    ]},
    { date: "Mar 6", events: [
      { time: "14:00", type: "sync", text: "3 invoices synced from Xero", invoice: "", color: "bg-muted-foreground" },
      { time: "11:22", type: "bounce", text: "Email bounced — invalid address", invoice: "INV-006", color: "bg-destructive" },
      { time: "09:15", type: "email", text: "Email reminder sent", invoice: "INV-004", color: "bg-primary" },
    ]},
    { date: "Mar 5", events: [
      { time: "16:00", type: "paid", text: "Invoice paid — $2,500", invoice: "INV-001", color: "bg-primary" },
      { time: "12:30", type: "sms", text: "SMS sent to Delta Services", invoice: "INV-003", color: "bg-accent" },
      { time: "10:00", type: "email", text: "Email reminder sent", invoice: "INV-003", color: "bg-primary" },
      { time: "09:00", type: "sync", text: "5 invoices synced from Xero", invoice: "", color: "bg-muted-foreground" },
    ]},
    { date: "Mar 4", events: [
      { time: "14:30", type: "sequence", text: "Sequence triggered — overdue", invoice: "INV-007", color: "bg-accent" },
      { time: "11:00", type: "email", text: "Email reminder sent", invoice: "INV-002", color: "bg-primary" },
    ]},
  ];

  return (
    <div className="min-h-screen pt-16 sm:pt-20 bg-[radial-gradient(circle_at_top_left,rgba(0,212,168,0.05),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_22%),hsl(var(--background))]">
      <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 text-center text-xs sm:text-sm text-accent font-medium">
        🔍 You are viewing a demo with sample data. <a href="/auth" className="underline font-bold">Sign up</a> to see your real invoices.
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-[1440px] grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden xl:block bg-sidebar-background border-r border-sidebar-border p-6 relative shadow-[12px_0_32px_rgba(0,0,0,0.22)]">
          <div className="font-display font-extrabold text-xl flex items-center gap-3 mb-8">
            <div className="w-5 h-5 bg-primary rounded-md shadow-[0_0_18px_rgba(0,212,168,0.35)]" />
            <div>
              <div>PayNudge</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">AI Collections Demo</div>
            </div>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/10 px-4 py-3 mb-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Demo mode</div>
            <div className="mt-2 text-sm font-semibold text-foreground">Customer dashboard, redesigned to match the Control Centre.</div>
          </div>
          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <button key={link.id} onClick={() => setActiveView(link.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeView === link.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"}`}>
                <span>{link.icon}</span> {link.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-1.5 justify-center text-[11px] text-muted-foreground bg-background/50 px-3 py-1.5 rounded border border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Xero connected
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="p-4 sm:p-6 lg:p-10 bg-background">
          {/* Mobile nav */}
          <div className="flex gap-2 mb-6 lg:hidden overflow-x-auto pb-2">
            {sidebarLinks.map((link) => (
              <button key={link.id} onClick={() => setActiveView(link.id)} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeView === link.id ? "bg-primary/10 text-primary" : "text-muted-foreground bg-surface"}`}>
                {link.icon} {link.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeView === "overview" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">Collections cockpit</h1>
                  <p className="text-sm text-muted-foreground mt-1 hidden sm:block">A lighter customer-facing sibling of your internal Control Centre.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-primary font-mono bg-primary/10 px-3 py-1.5 rounded border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Live data from Xero
                  </div>
                  <button className="px-5 py-2.5 rounded-md font-bold text-sm bg-primary text-primary-foreground">+ Sync Xero</button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)] mb-8">
                <div className="rounded-2xl border border-primary/15 bg-surface px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-primary">AI collections layer</div>
                      <h2 className="mt-3 font-display text-2xl font-bold">Track invoices, cash at risk, and reminder performance from one view.</h2>
                      <p className="mt-3 max-w-[58ch] text-sm text-muted-foreground">This dashboard now shares the same visual language as the PayNudge Control Centre, so the customer product feels like part of one premium system.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Target mode</div>
                      <div className="mt-2 font-display text-xl font-semibold text-primary">Recover cash faster</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Invoices Synced", value: "47", icon: "📄" },
                  { label: "Outstanding", value: "$48,250", icon: "💰", amber: true },
                  { label: "Recovered", value: "$124,800", icon: "📈", teal: true },
                  { label: "Pending", value: "$31,400", icon: "⏳" },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{s.icon}</span>
                      <div className="text-xs text-muted-foreground tracking-wider uppercase">{s.label}</div>
                    </div>
                    <div className={`font-mono text-2xl font-bold ${s.teal ? "text-primary" : s.amber ? "text-accent" : ""}`}>{s.value}</div>
                  </div>
                ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                  <h3 className="font-display font-bold mb-1">Not Triggered</h3>
                  <div className="font-mono text-3xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground mt-1">Invoices not yet in a reminder sequence</div>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
                  <h3 className="font-display font-bold mb-1">Reminders Sent</h3>
                  <div className="font-mono text-3xl font-bold text-primary">234</div>
                  <div className="text-xs text-muted-foreground mt-1">Total reminders sent this month</div>
                </div>
              </div>
              {/* Collection rate chart */}
              <div className="bg-surface border border-border rounded-md p-5 mb-8">
                <h3 className="font-display font-bold mb-4">Collection Rate</h3>
                <div className="text-xs text-muted-foreground mb-3">Outstanding vs Recovered</div>
                <div className="flex items-end gap-[3px] h-[120px]">
                  {[38, 62, 50, 76, 66, 90, 72, 94, 82, 98, 85, 96].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent) / 0.6)" }} />
                  ))}
                </div>
              </div>
              {/* Recent Activity */}
              <div className="bg-surface border border-border rounded-md">
                <div className="flex justify-between items-center p-5 border-b border-border">
                  <h3 className="font-display font-bold">Recent Activity</h3>
                  <button onClick={() => setActiveView("activity")} className="text-sm text-primary font-medium">View All</button>
                </div>
                <div className="divide-y divide-border">
                  {activityFeed.slice(0, 4).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 text-sm">
                      <span>{a.icon}</span>
                      <div className="flex-1 text-foreground">{a.text}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* INVOICES */}
          {activeView === "invoices" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-3xl font-bold">Invoices</h1>
                <button className="px-5 py-2.5 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover">Export CSV</button>
              </div>
              <div className="bg-surface border border-border rounded-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-4 font-medium">Invoice</th>
                      <th className="text-left p-4 font-medium">Client</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Issued</th>
                      <th className="text-left p-4 font-medium">Due</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Reminders</th>
                    </tr></thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border hover:bg-primary/[0.02]">
                          <td className="p-4 font-mono">{inv.id}</td>
                          <td className="p-4">{inv.client}</td>
                          <td className="p-4">{inv.amount}</td>
                          <td className="p-4">{inv.issued}</td>
                          <td className="p-4">{inv.due}</td>
                          <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded font-bold uppercase ${statusColors[inv.status]}`}>{inv.status}</span></td>
                          <td className="p-4 font-mono text-muted-foreground">{inv.reminders} sent</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TIMELINE */}
          {activeView === "timeline" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold">Invoice Timeline</h1>
                  <p className="text-sm text-muted-foreground mt-1">Chronological view of all invoice events</p>
                </div>
              </div>
              <div className="space-y-8">
                {timelineEvents.map((day, di) => (
                  <div key={di}>
                    <div className="font-mono text-xs text-primary uppercase tracking-wider mb-3 font-bold">{day.date}</div>
                    <div className="relative pl-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border" />
                      {day.events.map((ev, ei) => (
                        <div key={ei} className="relative mb-4 last:mb-0">
                          <div className={`absolute left-[-18px] top-2 w-4 h-4 rounded-full ${ev.color} border-2 border-background`} />
                          <div className="bg-surface border border-border rounded-md p-4 ml-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-mono text-xs text-muted-foreground">{ev.time}</span>
                              {ev.invoice && <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">{ev.invoice}</span>}
                              <span className="text-sm">{ev.text}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SEQUENCES */}
          {activeView === "sequences" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-3xl font-bold">Reminder Sequences</h1>
                <button className="px-5 py-2.5 rounded-md font-bold text-sm bg-primary text-primary-foreground">+ New Sequence</button>
              </div>
              <div className="bg-surface border border-border rounded-md mb-6">
                <div className="p-5 border-b border-border"><h3 className="font-display font-bold">Active Sequences (2)</h3></div>
                {[
                  { name: "Standard — Net 30", clients: 35, steps: 4 },
                  { name: "Gentle — Long-term Clients", clients: 12, steps: 3 },
                ].map((s, i) => (
                  <div key={i} className="p-5 border-b border-border flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="font-bold mb-1">{s.name}</div>
                      <div className="text-[13px] text-muted-foreground">{s.clients} clients · {s.steps} steps</div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-[11px] px-2.5 py-1 rounded bg-primary/15 text-primary font-bold uppercase">Active</span>
                      <button className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-surface-hover">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-surface border border-border rounded-md p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-display font-bold">Standard — Net 30</h3>
                  <span className="text-[11px] px-2.5 py-1 rounded bg-primary/15 text-primary font-bold uppercase">Active</span>
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-9 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-border" />
                  {[
                    { day: "Day 0", name: "Friendly Nudge", msg: "\"Hi, just a friendly reminder…\"", channels: ["email"], active: true },
                    { day: "Day 3", name: "Gentle Follow-up", msg: "\"Hope you're having a good week…\"", channels: ["email"], active: false },
                    { day: "Day 7", name: "Firm Reminder", msg: "\"This invoice is now overdue…\"", channels: ["email", "sms"], active: false },
                    { day: "Day 14", name: "Final Notice", msg: "\"Final notice before we escalate…\"", channels: ["email", "sms"], active: false },
                  ].map((item, i) => (
                    <div key={i} className="relative mb-6 pl-8 group cursor-pointer">
                      <div className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center text-[10px] ${item.active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                        {item.active && "✓"}
                      </div>
                      <div className={`bg-background p-4 rounded-sm border flex justify-between items-center flex-wrap gap-3 ${item.active ? "border-primary" : "border-border"}`}>
                        <div>
                          <strong className="block mb-1 text-[15px]">{item.day}: {item.name}</strong>
                          <span className="text-[13px] text-muted-foreground">{item.msg}</span>
                        </div>
                        <div className="flex gap-2">
                          {item.channels.includes("email") && <span className="text-[11px] px-2.5 py-1 rounded bg-primary/15 text-primary font-bold uppercase">Email</span>}
                          {item.channels.includes("sms") && <span className="text-[11px] px-2.5 py-1 rounded bg-accent/15 text-accent font-bold uppercase">SMS</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ANALYTICS */}
          {activeView === "analytics" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="font-display text-3xl font-bold">Analytics</h1>
                <button className="px-5 py-2.5 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover">Export Report</button>
              </div>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)] mb-8">
                <div className="rounded-2xl border border-primary/15 bg-surface px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-primary">AI collections layer</div>
                      <h2 className="mt-3 font-display text-2xl font-bold">Track invoices, cash at risk, and reminder performance from one view.</h2>
                      <p className="mt-3 max-w-[58ch] text-sm text-muted-foreground">This dashboard now shares the same visual language as the PayNudge Control Centre, so the customer product feels like part of one premium system.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-4 py-3 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Target mode</div>
                      <div className="mt-2 font-display text-xl font-semibold text-primary">Recover cash faster</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Collection Rate", value: "94%", change: "↑ 6% from last month", teal: true },
                    { label: "Email Open Rate", value: "42%", change: "↑ vs 20% industry avg" },
                    { label: "SMS Open Rate", value: "98%", change: "↑ Industry-leading", teal: true },
                    { label: "Reminders Sent", value: "284", change: "This month" },
                  ].map((s, i) => (
                    <div key={i} className="bg-surface border border-border rounded-md p-5">
                      <div className="text-xs text-muted-foreground mb-2 tracking-wider uppercase">{s.label}</div>
                      <div className={`font-mono text-2xl font-bold mb-1 ${s.teal ? "text-primary" : ""}`}>{s.value}</div>
                      <div className="text-xs text-primary">{s.change}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-surface border border-border rounded-md">
                <div className="p-5 border-b border-border"><h3 className="font-display font-bold">Payment Timeline (Days to Pay After Reminder)</h3></div>
                <div className="p-8">
                  <div className="flex items-end gap-2 h-40 mb-3">
                    {[
                      { label: "Day 0", pct: 65 },
                      { label: "Day 1", pct: 45 },
                      { label: "Day 2", pct: 30 },
                      { label: "Day 3", pct: 25 },
                      { label: "Day 5", pct: 18 },
                      { label: "Day 7", pct: 12 },
                      { label: "Day 10", pct: 8 },
                      { label: "Day 14", pct: 5 },
                      { label: "Day 21", pct: 3 },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{bar.pct}%</span>
                        <div className="w-full bg-primary rounded-t-sm" style={{ height: `${bar.pct * 2}px`, opacity: 0.3 + bar.pct / 120 }} />
                        <span className="text-[10px] text-muted-foreground">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ACTIVITY FEED */}
          {activeView === "activity" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold">Activity Feed</h1>
                  <p className="text-sm text-muted-foreground mt-1">Real-time log of all reminder and invoice activity</p>
                </div>
              </div>
              <div className="bg-surface border border-border rounded-md">
                <div className="divide-y divide-border">
                  {activityFeed.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-5">
                      <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm text-foreground">{a.text}</div>
                        <div className="text-xs text-muted-foreground mt-1">{a.time}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                        a.type === "paid" ? "bg-primary/15 text-primary" :
                        a.type === "sms" ? "bg-accent/15 text-accent" :
                        a.type === "email" ? "bg-primary/10 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>{a.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AUDIT LOG */}
          {activeView === "audit" && (
            <>
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold">Audit Log</h1>
                  <p className="text-sm text-muted-foreground mt-1">Complete record of all system and user actions</p>
                </div>
                <button className="px-5 py-2.5 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover">Export Log</button>
              </div>
              <div className="bg-surface border border-border rounded-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-4 font-medium">Action</th>
                      <th className="text-left p-4 font-medium">Detail</th>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Timestamp</th>
                      <th className="text-left p-4 font-medium">Level</th>
                    </tr></thead>
                    <tbody>
                      {auditLog.map((log, i) => (
                        <tr key={i} className="border-b border-border hover:bg-primary/[0.02]">
                          <td className="p-4 font-bold">{log.action}</td>
                          <td className="p-4 text-muted-foreground">{log.detail}</td>
                          <td className="p-4 font-mono text-xs">{log.user}</td>
                          <td className="p-4 font-mono text-xs text-muted-foreground">{log.time}</td>
                          <td className="p-4"><span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase ${levelColors[log.level]}`}>{log.level}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
