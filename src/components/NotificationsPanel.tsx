import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import {
  Bell, FileText, Mail, Info, Check, Filter, Inbox,
  ArrowRight, CreditCard, RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "reminder" | "invoice" | "system";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

type FilterType = "all" | "reminder" | "invoice" | "system";

const STORAGE_KEY = "paynudge_notif_last_seen";

const getLastSeen = (userId: string): string => {
  try {
    return localStorage.getItem(`${STORAGE_KEY}_${userId}`) || new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
};

const setLastSeen = (userId: string, timestamp: string) => {
  try { localStorage.setItem(`${STORAGE_KEY}_${userId}`, timestamp); } catch {}
};

const ICON_MAP: Record<ActivityItem["type"], React.ReactNode> = {
  reminder: <Mail className="w-4 h-4 text-primary" />,
  invoice: <FileText className="w-4 h-4 text-primary" />,
  system: <Info className="w-4 h-4 text-muted-foreground" />,
};

const FILTER_TABS: { key: FilterType; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: Inbox },
  { key: "reminder", label: "Reminders", icon: Mail },
  { key: "invoice", label: "Invoices", icon: CreditCard },
  { key: "system", label: "System", icon: RefreshCw },
];

const NotificationsPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenTs, setLastSeenTs] = useState<string>(new Date(0).toISOString());
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (user) setLastSeenTs(getLastSeen(user.id));
  }, [user]);

  const computeUnread = useCallback(
    (items: ActivityItem[]) => {
      if (!user) return 0;
      const seen = getLastSeen(user.id);
      return items.filter((i) => new Date(i.timestamp) > new Date(seen)).length;
    },
    [user]
  );

  const fetchActivity = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const items: ActivityItem[] = [];

      if (org) {
        const [{ data: reminders }, { data: invoices }] = await Promise.all([
          supabase
            .from("reminders")
            .select("id, method, status, sent_at, reminder_number, invoice_id, invoices(invoice_number, amount, currency, clients(name))")
            .order("sent_at", { ascending: false })
            .limit(15),
          supabase
            .from("invoices")
            .select("id, invoice_number, status, amount, currency, updated_at, clients(name)")
            .eq("organisation_id", org.id)
            .order("updated_at", { ascending: false })
            .limit(15),
        ]);

        if (reminders) {
          for (const r of reminders) {
            const inv = r.invoices as any;
            const clientName = inv?.clients?.name || "Unknown";
            const invNum = inv?.invoice_number || "—";
            items.push({
              id: r.id,
              type: "reminder",
              title: `Reminder ${r.status === "sent" ? "sent" : r.status}`,
              description: `${r.method.toUpperCase()} reminder #${r.reminder_number} to ${clientName} for invoice ${invNum}`,
              timestamp: r.sent_at,
              link: "/invoices",
            });
          }
        }

        if (invoices) {
          for (const inv of invoices) {
            const clientName = (inv.clients as any)?.name || "Unknown";
            const statusLabel =
              inv.status === "paid" ? "marked as paid" : inv.status === "overdue" ? "is now overdue" : `status: ${inv.status}`;
            items.push({
              id: `inv-${inv.id}`,
              type: "invoice",
              title: `Invoice ${inv.invoice_number || "—"} ${statusLabel}`,
              description: `${formatCurrency(Number(inv.amount), inv.currency)} — ${clientName}`,
              timestamp: inv.updated_at,
              link: "/invoices",
            });
          }
        }
      }

      const { data: auditEntries } = await supabase
        .from("audit_log")
        .select("id, action, detail, level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (auditEntries) {
        for (const entry of auditEntries) {
          items.push({
            id: `audit-${entry.id}`,
            type: "system",
            title: entry.action,
            description: entry.detail || "",
            timestamp: entry.created_at,
            link: entry.action.toLowerCase().includes("xero") ? "/integrations" : undefined,
          });
        }
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const sorted = items.slice(0, 30);
      setActivities(sorted);
      setUnreadCount(computeUnread(sorted));
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchActivity();
    } else if (user && activities.length > 0) {
      const latest = activities[0]?.timestamp;
      if (latest) {
        setLastSeen(user.id, latest);
        setLastSeenTs(latest);
        setUnreadCount(0);
      }
    }
  };

  const markAllRead = () => {
    if (user && activities.length > 0) {
      const latest = activities[0]?.timestamp;
      if (latest) {
        setLastSeen(user.id, latest);
        setLastSeenTs(latest);
        setUnreadCount(0);
      }
    }
  };

  useEffect(() => {
    if (user) fetchActivity();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reminders" }, () => fetchActivity())
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => fetchActivity())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_log" }, () => fetchActivity())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const lastSeenDate = new Date(lastSeenTs);
  const filtered = filter === "all" ? activities : activities.filter((a) => a.type === filter);
  const filterCounts = {
    all: activities.length,
    reminder: activities.filter((a) => a.type === "reminder").length,
    invoice: activities.filter((a) => a.type === "invoice").length,
    system: activities.filter((a) => a.type === "system").length,
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground bg-transparent relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-[420px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display font-bold text-lg">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-primary hover:text-primary/80 bg-transparent transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-foreground text-background"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {filterCounts[tab.key] > 0 && (
                  <span className="text-[10px] opacity-70">({filterCounts[tab.key]})</span>
                )}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
              Loading activity...
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {filter === "all" ? "No activity yet" : `No ${filter} activity`}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {filter === "all"
                  ? "Activity from reminders, invoices and sync events will appear here"
                  : `${filter.charAt(0).toUpperCase() + filter.slice(1)} events will show up here`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const isUnread = new Date(item.timestamp) > lastSeenDate;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.link) {
                        setOpen(false);
                        navigate(item.link);
                      }
                    }}
                    className={`px-5 py-3.5 transition-colors ${
                      item.link ? "cursor-pointer hover:bg-accent/60" : "cursor-default"
                    } ${isUnread ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center relative">
                        {ICON_MAP[item.type]}
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      {item.link && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {activities.length > 0 && (
          <div className="px-5 py-3 border-t border-border text-center">
            <button
              onClick={() => { setOpen(false); navigate("/dashboard"); }}
              className="text-xs font-medium text-primary hover:text-primary/80 bg-transparent transition-colors"
            >
              View full activity feed →
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsPanel;
