import { useState } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FeedbackModal = ({ open, onClose }: Props) => {
  const [tab, setTab] = useState<"feedback" | "support">("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    const { error: fnError } = await supabase.functions.invoke("send-feedback", {
      body: { tab, message },
    });

    setSending(false);

    if (fnError) {
      setError("Failed to send. Please try again.");
    } else {
      setSent(true);
      setMessage("");
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="font-display text-lg font-bold">Feedback & Support</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground bg-transparent">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 mb-4">
          <button
            onClick={() => setTab("feedback")}
            className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-colors ${
              tab === "feedback"
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Feedback
          </button>
          <button
            onClick={() => setTab("support")}
            className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-colors ${
              tab === "support"
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Support
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2">
          <p className="text-sm text-muted-foreground mb-3">
            {tab === "feedback"
              ? "Share your thoughts, suggestions, or feature requests."
              : "Describe the issue you're facing and we'll get back to you."}
          </p>

          {sent ? (
            <div className="h-32 flex items-center justify-center text-sm font-medium text-primary">
              ✓ {tab === "feedback" ? "Thanks for your feedback!" : "Support request sent!"}
            </div>
          ) : (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={tab === "feedback" ? "What would you like to share with us?" : "Describe your issue..."}
              className="w-full h-32 p-3 border border-border rounded-lg bg-surface text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          )}

          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="flex justify-end gap-3 px-6 py-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border text-foreground hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="px-5 py-2.5 rounded-md text-sm font-bold bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
