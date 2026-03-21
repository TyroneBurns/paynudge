import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, AlertCircle, ShieldX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const GmailCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [errorState, setErrorState] = useState<"denied" | "missing" | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorState("denied");
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      window.location.href = `${SUPABASE_URL}/functions/v1/gmail-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } else {
      setErrorState("missing");
    }
  }, [searchParams]);

  if (errorState) {
    const isDenied = errorState === "denied";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          {isDenied ? (
            <ShieldX className="w-10 h-10 text-muted-foreground" />
          ) : (
            <AlertCircle className="w-10 h-10 text-destructive" />
          )}
          <h1 className="text-lg font-semibold text-foreground">
            {isDenied ? "Gmail access denied" : "Gmail connection failed"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDenied
              ? "You declined access to Gmail. No worries — reminders will still send from hello@paynudge.co. You can connect Gmail anytime."
              : "Something went wrong during the Gmail authorisation. Please try connecting again."}
          </p>
          <Link to="/integrations" className="text-sm font-medium text-primary hover:underline">
            ← Back to Integrations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Connecting your Gmail account…</p>
      </div>
    </div>
  );
};

export default GmailCallbackPage;
