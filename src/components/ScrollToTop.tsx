import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const getVisitorId = (): string => {
  const key = "pn_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [pathname]);

  // Track page view on route change
  useEffect(() => {
    // Skip admin/dashboard routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/settings") || pathname.startsWith("/invoices") || pathname.startsWith("/reminder-flow") || pathname.startsWith("/integrations")) return;

    const timer = setTimeout(async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        if (!projectId) return;
        await fetch(`https://${projectId}.supabase.co/functions/v1/track-visit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitor_id: getVisitorId(),
            path: pathname + search,
            referrer: document.referrer || null,
          }),
        });
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
