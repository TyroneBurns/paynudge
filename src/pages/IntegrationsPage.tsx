import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useSearchParams } from "react-router-dom";
import { Plug, Phone } from "lucide-react";
import { toast } from "sonner";
import xeroLogo from "@/assets/xero-logo.png";
import gmailLogo from "@/assets/gmail-logo.png";

const IntegrationsPage = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [xeroConnected, setXeroConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [connectingXero, setConnectingXero] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: org } = await supabase
        .from("organisations")
        .select("xero_tenant_id, gmail_email")
        .eq("user_id", user.id)
        .single();
      if (org?.xero_tenant_id) setXeroConnected(true);
      if (org?.gmail_email) {
        setGmailConnected(true);
        setGmailEmail(org.gmail_email);
      }
    })();
  }, [user]);

  // Handle query param toasts
  useEffect(() => {
    if (searchParams.get("xero") === "connected") {
      toast.success("Xero connected successfully");
      searchParams.delete("xero");
      setSearchParams(searchParams, { replace: true });
      setXeroConnected(true);
    }
    if (searchParams.get("gmail") === "connected") {
      toast.success("Gmail connected successfully");
      searchParams.delete("gmail");
      setSearchParams(searchParams, { replace: true });
      setGmailConnected(true);
      // Re-fetch to get email
      if (user) {
        supabase.from("organisations").select("gmail_email").eq("user_id", user.id).maybeSingle()
          .then(({ data }) => { if (data?.gmail_email) setGmailEmail(data.gmail_email); });
      }
    }
  }, [searchParams, setSearchParams, user]);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const connectXero = async () => {
    setConnectingXero(true);
    try {
      const { data, error } = await supabase.functions.invoke("xero-auth");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Failed to start Xero connection");
    }
    setConnectingXero(false);
  };

  const disconnectXero = async () => {
    try {
      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (org) {
        await supabase.from("organisations").update({
          xero_tenant_id: null,
          xero_access_token: null,
          xero_refresh_token: null,
          xero_token_expiry: null,
        }).eq("id", org.id);
      }
      setXeroConnected(false);
      toast.success("Xero disconnected");
    } catch {
      toast.error("Failed to disconnect Xero");
    }
  };

  const connectGmail = async () => {
    setConnectingGmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("gmail-auth");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      toast.error("Failed to start Gmail connection");
    }
    setConnectingGmail(false);
  };

  const disconnectGmail = async () => {
    try {
      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (org) {
        await supabase.from("organisations").update({
          gmail_access_token: null,
          gmail_refresh_token: null,
          gmail_token_expiry: null,
          gmail_email: null,
        }).eq("id", org.id);
      }
      setGmailConnected(false);
      setGmailEmail(null);
      toast.success("Gmail disconnected");
    } catch {
      toast.error("Failed to disconnect Gmail");
    }
  };

  const integrations = [
    {
      name: "Xero",
      icon: <img src={xeroLogo} alt="Xero" className="w-10 h-10 object-contain" />,
      iconBg: "bg-blue-50",
      connected: xeroConnected,
      status: xeroConnected ? "Connected" : "Not connected",
      onConnect: connectXero,
      onDisconnect: disconnectXero,
      connecting: connectingXero,
    },
    {
      name: "Gmail",
      icon: <img src={gmailLogo} alt="Gmail" className="w-10 h-10 object-contain" />,
      iconBg: "bg-red-50",
      connected: gmailConnected,
      status: gmailConnected ? (gmailEmail ? `Connected as ${gmailEmail}` : "Connected") : "Not connected",
      onConnect: connectGmail,
      onDisconnect: disconnectGmail,
      connecting: connectingGmail,
      comingSoon: true,
    },
    {
      name: "Twilio SMS",
      icon: <Phone className="w-5 h-5 text-purple-500" />,
      iconBg: "bg-purple-50",
      connected: true,
      status: "System-level configuration",
      note: "SMS sending is managed at the platform level",
      isSystem: true,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-1">Integrations</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage your connected services</p>

      <div className="space-y-6">
        {integrations.map((int) => (
          <div key={int.name} className="border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl ${int.iconBg} flex items-center justify-center`}>
                {int.icon}
              </div>
              {int.comingSoon ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-accent text-accent-foreground">
                  Coming Soon
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
                  int.connected
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${int.connected ? "bg-primary" : "bg-destructive"}`} />
                  {int.connected ? (int.isSystem ? "Operational" : "Connected") : "Disconnected"}
                </span>
              )}
            </div>

            <h3 className="font-display text-xl font-bold mb-3">{int.name}</h3>

            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Status</span>
              <span className="text-foreground">{int.status}</span>
            </div>

            {int.note && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Note</span>
                <span className="text-foreground">{int.note}</span>
              </div>
            )}

            {!int.isSystem && !int.connected && !int.comingSoon && (
              <button
                onClick={int.onConnect}
                disabled={int.connecting}
                className="w-full mt-4 py-3 rounded-md font-bold text-sm bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Plug className="w-4 h-4" />
                {int.connecting ? "Connecting…" : "Connect"}
              </button>
            )}

            {!int.isSystem && int.connected && (
              <button
                onClick={int.onDisconnect}
                className="w-full mt-4 py-3 rounded-md font-bold text-sm border border-border text-foreground hover:bg-surface-hover transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
