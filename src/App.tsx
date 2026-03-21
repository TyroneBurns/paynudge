import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "./components/Navbar";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import LiveDashboardPage from "./pages/LiveDashboardPage";
import AdminPage from "./pages/AdminPage";
import AdminAppPage from "./pages/AdminAppPage";
import AuthPage from "./pages/AuthPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import OnboardingPage from "./pages/OnboardingPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import ReminderFlowPage from "./pages/ReminderFlowPage";
import InvoicesPage from "./pages/InvoicesPage";
import ToolsPage from "./pages/ToolsPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";
import LatePaymentLawsPage from "./pages/LatePaymentLawsPage";
import IndustryPage from "./pages/IndustryPage";
import ComparePage from "./pages/ComparePage";
import DSOCalculatorPage from "./pages/tools/DSOCalculatorPage";
import LatePaymentInterestPage from "./pages/tools/LatePaymentInterestPage";
import Net30CalculatorPage from "./pages/tools/Net30CalculatorPage";
import ARTurnoverPage from "./pages/tools/ARTurnoverPage";
import PaymentTermsPage from "./pages/tools/PaymentTermsPage";
import InvoiceGeneratorPage from "./pages/tools/InvoiceGeneratorPage";
import GmailCallbackPage from "./pages/GmailCallbackPage";
import XeroCallbackPage from "./pages/XeroCallbackPage";
import VerifyPage from "./pages/VerifyPage";

const queryClient = new QueryClient();

/** Wrap authenticated app pages in the sidebar layout */
const AppPage = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

/** Marketing page wrapper that provides a working onOpenAuth */
const MarketingPage = ({ Component, ...rest }: { Component: React.ComponentType<any>; [key: string]: any }) => {
  const navigate = useNavigate();
  const handleOpenAuth = () => navigate("/auth");
  return (
    <>
      <Navbar />
      <Component onOpenAuth={handleOpenAuth} {...rest} />
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ─── App pages (sidebar layout) ─── */}
              <Route path="/dashboard" element={<AppPage><LiveDashboardPage /></AppPage>} />
              <Route path="/invoices" element={<AppPage><InvoicesPage /></AppPage>} />
              <Route path="/reminder-flow" element={<AppPage><ReminderFlowPage /></AppPage>} />
              <Route path="/integrations" element={<AppPage><IntegrationsPage /></AppPage>} />
              <Route path="/settings" element={<AppPage><SettingsPage /></AppPage>} />
              <Route path="/onboarding" element={<AppPage><OnboardingPage /></AppPage>} />
              <Route path="/admin" element={<AppPage><AdminPage /></AppPage>} />
              <Route path="/admin-app" element={<AdminAppPage />} />

              {/* ─── Marketing pages (navbar layout) ─── */}
              <Route path="/" element={<MarketingPage Component={HomePage} />} />
              <Route path="/features" element={<MarketingPage Component={FeaturesPage} />} />
              <Route path="/pricing" element={<MarketingPage Component={PricingPage} />} />
              <Route path="/demo" element={<><Navbar /><DashboardPage /></>} />
              <Route path="/auth" element={<><Navbar /><AuthPage /></>} />
              <Route path="/auth/verify" element={<><Navbar /><VerifyPage /></>} />
              <Route path="/auth/gmail/callback" element={<GmailCallbackPage />} />
              <Route path="/auth/xero/callback" element={<XeroCallbackPage />} />
              <Route path="/admin-login" element={<><Navbar /><AdminLoginPage /></>} />
              <Route path="/forgot-password" element={<><Navbar /><ForgotPasswordPage /></>} />
              <Route path="/reset-password" element={<><Navbar /><ResetPasswordPage /></>} />
              <Route path="/tools" element={<MarketingPage Component={ToolsPage} />} />
              <Route path="/tools/dso-calculator" element={<MarketingPage Component={DSOCalculatorPage} />} />
              <Route path="/tools/late-payment-interest-calculator" element={<MarketingPage Component={LatePaymentInterestPage} />} />
              <Route path="/tools/net-30-calculator" element={<MarketingPage Component={Net30CalculatorPage} />} />
              <Route path="/tools/ar-turnover-calculator" element={<MarketingPage Component={ARTurnoverPage} />} />
              <Route path="/tools/payment-terms-calculator" element={<MarketingPage Component={PaymentTermsPage} />} />
              <Route path="/tools/invoice-generator" element={<><Navbar /><InvoiceGeneratorPage /></>} />
              <Route path="/blog" element={<MarketingPage Component={BlogPage} />} />
              <Route path="/blog/:slug" element={<MarketingPage Component={BlogPostPage} />} />
              <Route path="/about" element={<MarketingPage Component={AboutPage} />} />
              <Route path="/privacy" element={<><Navbar /><PrivacyPage /></>} />
              <Route path="/terms" element={<><Navbar /><TermsPage /></>} />
              <Route path="/late-payment-laws" element={<MarketingPage Component={LatePaymentLawsPage} />} />
              <Route path="/invoice-reminder-software" element={<MarketingPage Component={IndustryPage} />} />
              <Route path="/xero-invoice-reminders" element={<MarketingPage Component={IndustryPage} />} />
              <Route path="/sms-invoice-reminders" element={<MarketingPage Component={IndustryPage} />} />
              <Route path="/invoice-reminders/:slug" element={<MarketingPage Component={IndustryPage} />} />
              <Route path="/compare/:slug" element={<MarketingPage Component={ComparePage} />} />
              <Route path="*" element={<><Navbar /><NotFound /></>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
