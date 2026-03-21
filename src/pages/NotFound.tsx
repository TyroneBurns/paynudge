import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="w-12 h-12 bg-primary rounded-xl mx-auto mb-6" />
        <h1 className="font-display text-6xl md:text-8xl font-extrabold text-primary mb-4">404</h1>
        <p className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">This page doesn't exist</p>
        <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
          The page you're looking for may have been moved or removed. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-8 py-3.5 rounded-md font-bold bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(0,212,168,0.4)] hover:-translate-y-0.5 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
