import { differenceInDays, format, parseISO } from "date-fns";

export interface InvoiceWithReminders {
  id: string;
  status: string;
  due_date: string | null;
  reminders?: { id: string; sent_at: string; method: string; status: string }[];
  [key: string]: any;
}

export interface DerivedStatus {
  label: string;
  colorClass: string;
}

export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function deriveInvoiceStatus(inv: InvoiceWithReminders): DerivedStatus {
  const reminderCount = inv.reminders?.length || 0;

  if (inv.status === "paid") {
    return { label: "Paid ✓", colorClass: "bg-primary/15 text-primary" };
  }
  if (inv.status === "voided") {
    return { label: "Voided", colorClass: "bg-muted text-muted-foreground" };
  }
  if (inv.status === "draft") {
    return { label: "Draft", colorClass: "bg-muted text-muted-foreground" };
  }
  if (inv.status === "overdue") {
    if (reminderCount > 0) {
      return {
        label: `Overdue · ${reminderCount} reminder${reminderCount > 1 ? "s" : ""} sent`,
        colorClass: "bg-destructive/15 text-destructive",
      };
    }
    return {
      label: "Overdue · No reminders yet",
      colorClass: "bg-amber-500/15 text-amber-600",
    };
  }

  // "sent" in Xero means issued / awaiting payment (not yet due)
  const daysUntilDue = inv.due_date
    ? differenceInDays(parseISO(inv.due_date), new Date())
    : null;

  const dueLabel = daysUntilDue !== null && daysUntilDue >= 0
    ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`
    : daysUntilDue !== null
      ? "Due today"
      : "Sent";

  if (reminderCount > 0) {
    return {
      label: `${dueLabel} · Reminder scheduled`,
      colorClass: "bg-amber-500/15 text-amber-600",
    };
  }
  return {
    label: dueLabel,
    colorClass: "bg-blue-500/15 text-blue-600",
  };
}
