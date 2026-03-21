import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckSquare, LayoutDashboard, FileText, GitBranch,
  Plug, Settings as SettingsIcon, Zap, MessageCircle, X, Menu, Bell,
  CreditCard, LogOut
} from "lucide-react";
import FeedbackModal from "./FeedbackModal";
import NotificationsPanel from "./NotificationsPanel";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from "./ui/dropdown-menu";

const NAV_ITEMS = [
  { to: "/onboarding", label: "Onboarding", icon: CheckSquare },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/reminder-flow", label: "Reminder Flow", icon: GitBranch },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut, profile, loading, subscription } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => setSidebarOpen(false), [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (profile?.email?.[0] || "U").toUpperCase();

  const currentLabel = NAV_ITEMS.find((i) => i.to === location.pathname)?.label || "PayNudge";
  const pageMeta: Record<string, string> = {
    Onboarding: "Get connected and ready to collect faster.",
    Dashboard: "AI collections command layer for your customer-facing ops.",
    Invoices: "Track every invoice, status, and recovery path.",
    "Reminder Flow": "Control how PayNudge escalates reminders.",
    Integrations: "Connect the systems that power live collections.",
    Settings: "Manage account, billing, and preferences.",
  };

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_left,rgba(0,212,168,0.06),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_24%),hsl(var(--background))]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[998] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[999] w-[292px] xl:w-[312px] bg-sidebar-background border-r border-sidebar-border flex flex-col transform transition-transform lg:transform-none shadow-[12px_0_32px_rgba(0,0,0,0.25)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Header */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="font-display font-extrabold text-xl flex items-center gap-3">
              <div className="w-5 h-5 bg-primary rounded-md shadow-[0_0_18px_rgba(0,212,168,0.35)]" />
              <div>
                <div>PayNudge</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-primary">Customer Control Layer</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground bg-transparent">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-5 rounded-xl border border-primary/15 bg-primary/10 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">AI collections status</div>
            <div className="mt-2 text-sm font-semibold text-foreground">Live operator cockpit</div>
            <div className="mt-1 text-xs text-muted-foreground">Track invoices, recover cash, and keep your team aligned without jumping between tools.</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Workspace</div>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/12 text-foreground border border-primary/20 shadow-[0_0_18px_rgba(0,212,168,0.08)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}

          {!subscription?.subscribed && (
            <Link
              to="/pricing"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              <Zap className="w-[18px] h-[18px]" />
              Upgrade
            </Link>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
          <div className="rounded-xl border border-sidebar-border bg-background/40 px-3 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground">Account</div>
            <div className="mt-2 text-sm font-semibold text-foreground">{profile?.full_name || profile?.email || 'User'}</div>
            <div className="mt-1 text-xs text-muted-foreground">{subscription?.subscribed ? 'Paid plan active' : 'Free workspace'}</div>
          </div>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors w-full bg-transparent"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            Feedback & Support
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl px-5 py-3 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground bg-transparent">
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg capitalize">{currentLabel}</h2>
                  {subscription?.subscribed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">Paid</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Free</span>
                  )}
                </div>
                <p className="mt-0.5 hidden truncate text-xs text-muted-foreground md:block">{pageMeta[currentLabel] || 'Manage your collections workflow from one workspace.'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
            <NotificationsPanel />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-[1000]">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{profile?.full_name || "User"}</p>
                      {subscription?.subscribed ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">Paid</span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Free</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email || user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings?tab=billing")} className="cursor-pointer">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="cursor-pointer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Feedback & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-transparent px-4 py-5 sm:px-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
};

export default AppLayout;
