import Footer from "../components/Footer";

const sections = [
  { t: "1. Acceptance of Terms", b: "By creating an account or using PayNudge, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service." },
  { t: "2. Description of Service", b: "PayNudge is a subscription software service that provides automated invoice reminder functionality, integrating with third-party accounting software including Xero. The service includes email and SMS reminder delivery, a collections dashboard, and related features as described on our website." },
  { t: "3. Account Registration", b: "You must register for an account to use PayNudge. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for maintaining the security of your account credentials." },
  { t: "4. Acceptable Use", b: "You agree to use PayNudge only for lawful purposes and in accordance with these terms. You must not use the service to send spam, harass individuals, or send reminders to people who have not consented to receive communications from your business. SMS reminders must comply with applicable telecommunications regulations." },
  { t: "5. Subscription and Billing", b: "Paid plans are billed monthly or annually in advance. You can cancel at any time. Cancellation takes effect at the end of your current billing period. We do not provide refunds for partial periods. Prices may change with 30 days' notice." },
  { t: "6. Xero Integration", b: "PayNudge accesses your Xero account data via the official Xero API under the permissions you grant during the OAuth connection process. You can revoke this access from your Xero account settings at any time. PayNudge is not affiliated with or endorsed by Xero." },
  { t: "7. Limitation of Liability", b: "PayNudge provides the service \"as is\" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim." },
  { t: "8. Termination", b: "We may suspend or terminate your account if you violate these terms. You may terminate your account at any time by cancelling your subscription and deleting your account from settings." },
  { t: "9. Governing Law", b: "These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales." },
  { t: "10. Contact", b: "For questions about these terms, contact us at legal@paynudge.co." },
];

const TermsPage = () => (
  <div>
    <section className="pt-28 pb-20">
      <div className="container-main">
        <div className="max-w-[720px] mx-auto">
          <span className="text-[11px] font-mono text-primary uppercase tracking-widest">Legal</span>
          <h1 className="font-display text-4xl font-bold mt-2 mb-4">Terms of Service</h1>
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

export default TermsPage;
