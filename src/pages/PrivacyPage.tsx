import Footer from "../components/Footer";

const sections = [
  { t: "1. What We Collect", b: "We collect information you provide directly to us, such as when you create an account, connect your Xero account via OAuth, or contact us for support. This includes your name, email address, business name, and invoice data pulled from your connected Xero account. We also collect usage data including log data, device information, and analytics about how you use PayNudge." },
  { t: "2. How We Use Your Information", b: "We use the information we collect to provide, maintain, and improve PayNudge. Specifically, we use it to: process your invoice reminders, sync with your Xero account, send you service-related notifications, respond to support requests, and improve our product. We do not sell your personal data to third parties." },
  { t: "3. Data Storage and Security", b: "Your data is stored on servers located in the United Kingdom and/or European Union. We use industry-standard encryption (AES-256 at rest, TLS 1.3 in transit) to protect your information. Xero credentials are never stored by PayNudge — we use Xero's official OAuth 2.0 integration only." },
  { t: "4. Third-Party Services", b: "PayNudge integrates with Xero (accounting), our SMS gateway provider (for sending text message reminders), and Stripe (for payment processing). These third parties have their own privacy policies. We encourage you to review them." },
  { t: "5. Data Retention", b: "We retain your data for as long as your account is active. If you cancel your account, you can request data deletion within 30 days. Invoice reminder logs are retained for 12 months for compliance purposes." },
  { t: "6. Your Rights", b: "Depending on your location, you may have rights under GDPR, UK GDPR, or similar laws, including: the right to access, correct, or delete your personal data; the right to data portability; and the right to object to certain processing. Contact us at privacy@paynudge.co to exercise any of these rights." },
  { t: "7. Cookies", b: "PayNudge uses essential cookies required for the service to function, and optional analytics cookies to understand how the product is used. You can manage cookie preferences through your browser settings." },
  { t: "8. Contact", b: "For privacy-related questions or to exercise your rights, please contact us at privacy@paynudge.co or write to: PayNudge Ltd, Privacy Team, London, United Kingdom." },
];

const PrivacyPage = () => (
  <div>
    <section className="pt-28 pb-20">
      <div className="container-main">
        <div className="max-w-[720px] mx-auto">
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Legal</span>
          <h1 className="font-display text-4xl font-bold mt-2 mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: March 1, 2026</p>
          {sections.map((s, i) => (
            <div key={i} className="mb-7">
              <h3 className="font-display text-lg font-bold mb-3">{s.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default PrivacyPage;
