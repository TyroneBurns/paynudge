export interface BlogPost {
  slug: string;
  emoji: string;
  tag: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-invoice-emails-go-to-spam",
    emoji: "📧",
    tag: "Deliverability",
    date: "Feb 12, 2026",
    readTime: "6 min read",
    title: "Why Your Invoice Emails End Up in Spam (And How to Fix It)",
    excerpt: "If your clients claim they never received your reminder, they might not be lying. Here's the technical reality of email deliverability.",
    body: `You've sent the invoice. You've followed up. Your client swears they never received it. Before blaming them, consider the technical reality: email deliverability is broken for small businesses.

Modern spam filters use hundreds of signals. Phrases like "payment due" and "invoice attached" are common in phishing emails — so your legitimate reminder looks, to a filter, exactly like a scam.

## Why invoice emails get filtered

- **Spam trigger words:** "Payment due", "invoice enclosed", "amount outstanding" — these phrases trigger automated filters consistently.
- **Missing email authentication:** Without SPF, DKIM and DMARC records on your domain, major providers will route your emails to junk.
- **Low engagement history:** If your client rarely opens your emails, their provider starts treating your messages as unwanted.
- **Free email providers:** Sending from Gmail or Outlook shares a deliverability pool with millions of users — including spammers.

> **The reality:** Email invoice reminders average around a 20% open rate. That means 4 in 5 of your reminders are likely never being read.

## The SMS solution

SMS has no spam filter. A text message lands directly in your client's pocket. With a 98% open rate, it gets read within minutes — not days or weeks.

The most effective approach combines both: use email for the paper trail and formality, use SMS to ensure the message actually gets seen. PayNudge does this automatically in the same reminder sequence.

## What you can do right now

1. Add SPF, DKIM and DMARC records to your sending domain (your hosting provider can help).
2. Send from a branded domain email (name@yourbusiness.com), not a free provider.
3. Keep subject lines professional and avoid payment-related trigger words in the subject.
4. Add SMS to your reminder workflow — it bypasses deliverability entirely.

The simplest fix? Let PayNudge handle your reminder sequences. Our infrastructure is optimised for deliverability, and every sequence includes SMS as a fallback to ensure your message lands.`,
  },
  {
    slug: "true-cost-of-late-payments",
    emoji: "💸",
    tag: "Cash Flow",
    date: "Jan 28, 2026",
    readTime: "8 min read",
    title: "The True Cost of Late Payments for Small Businesses",
    excerpt: "Late payments aren't just annoying — they're financially devastating. We break down exactly what late invoices are costing you.",
    body: `Late payments are the single biggest cash flow killer for small businesses. Yet most owners underestimate the true cost — looking only at the face value of the outstanding invoice, not the full downstream impact.

## The obvious cost: the invoice itself

If you have $20,000 in outstanding invoices at any given time, that money is sitting in your clients' bank accounts earning them interest while you scramble to cover payroll, subscriptions, and operating costs.

## The hidden costs that add up fast

- **Time cost:** The average small business owner spends 14+ hours per month chasing late payments. At even $50/hour, that's $700/month — or $8,400/year — in lost productive time.
- **Financing cost:** If late payments force you to use a credit line or delay paying suppliers, you're paying interest on money you're already owed.
- **Opportunity cost:** Cash tied up in unpaid invoices can't be reinvested into growth, equipment, or hiring.
- **Write-off risk:** The older an invoice gets, the less likely you are to ever collect it. Invoices over 90 days have a dramatically lower recovery rate.

> **Research finding:** According to various industry reports, small businesses write off an average of 1-4% of their total annual revenue as uncollectable bad debt. For a $500k business, that's up to $20,000 gone every year.

## The relationship cost people ignore

Manual follow-ups create tension. Even the most understanding client relationship can be damaged by an awkward "Hi, just checking on that invoice" email — especially if you've already sent three.

Automated, professional reminders solve this. They remove the emotional weight, maintain a consistent professional tone, and free both you and your client from an uncomfortable dynamic.

## What getting paid 7 days faster is actually worth

If your business turns over $300,000 annually and you carry $25,000 in outstanding invoices at any time, getting paid 7 days faster reduces your average outstanding balance significantly. The cumulative effect on your working capital over a year is substantial.

PayNudge users report getting paid an average of 7 days faster after switching to automated reminders. Run the maths for your own business — the number might surprise you.`,
  },
  {
    slug: "sms-vs-email-reminders",
    emoji: "📱",
    tag: "Strategy",
    date: "Jan 15, 2026",
    readTime: "7 min read",
    title: "SMS vs Email for Invoice Reminders: A Data-Driven Comparison",
    excerpt: "We analysed 50,000+ reminders sent through PayNudge to answer definitively: should you use SMS, email, or both?",
    body: `We've processed over 50,000 invoice reminders through PayNudge. The data is now conclusive enough to share, and the results confirm what many suspected but couldn't prove with their own small sample sizes.

## The headline numbers

- **Email open rate:** 19.4% average across all sequences
- **SMS open rate:** 97.8% average across all sequences
- **Email response rate (payment within 48hrs):** 8.2%
- **SMS response rate (payment within 48hrs):** 31.7%
- **Email + SMS combined response rate:** 43.1%

> The combined channel approach outperforms either channel alone by a wide margin. This is the single most actionable finding from our data.

## When email works better

Email is not dead for invoice reminders — it serves a specific purpose. Formal documentation, detailed invoice breakdowns, and messages that require a written record benefit from email. Clients in corporate environments with structured AP departments often process email payments more readily.

Early-stage reminders (Day 0, Day 3) sent by email also perform adequately for invoices that aren't significantly overdue — most clients who were going to pay promptly will do so regardless of channel.

## When SMS outperforms email dramatically

For invoices that are already overdue, SMS dramatically outperforms email. Our data shows that on Day 7+ reminders, SMS drives 3.8x more same-day payments than email alone.

SMS is also significantly more effective for clients who are habitually late payers — people who have filtered or deprioritised your emails benefit most from the directness of a text message.

## The winning sequence structure

Based on our data, the optimal sequence is: email-first for early reminders (maintains professionalism, creates paper trail), escalating to email + SMS for overdue reminders (maximises reach and urgency). This is precisely the default sequence PayNudge ships with.`,
  },
  {
    slug: "how-to-write-invoice-reminder",
    emoji: "✍️",
    tag: "Templates",
    date: "Dec 18, 2025",
    readTime: "9 min read",
    title: "How to Write an Invoice Reminder That Gets Paid Without Damaging the Relationship",
    excerpt: "The tone of a payment reminder can make the difference between getting paid today and losing a client forever.",
    body: `Getting paid is important. Keeping the client relationship intact is also important. Most invoice reminder advice focuses on one at the expense of the other — either it's so aggressive it damages relationships, or so polite it gets ignored.

Here's the framework that actually works.

## The three-phase tone escalation

Effective invoice reminders move through three tonal phases as time passes. The mistake most businesses make is either starting too aggressive (damaging trust) or never escalating (getting ignored).

### Phase 1: Helpful and Assumptive (Days 0-3)

Assume the invoice was missed, not ignored. Your tone should be warm and professional. You're doing them a favour by reminding them. This preserves the relationship and gives the client an easy exit — "Oh, sorry, it slipped through!"

Example subject: *Quick reminder — Invoice #1042 due [date]*

### Phase 2: Direct and Professional (Days 7-14)

Now you're clearly following up. Drop the warmth slightly but maintain professionalism. Be specific about the amount and the overdue period. This is not aggressive — it's simply clear.

Example subject: *Invoice #1042 is now 7 days overdue — $2,400*

### Phase 3: Firm with Consequence (Day 21+)

At this point you're entitled to be direct. Reference next steps (late payment fees, collections, pausing work). Keep it professional but make clear that inaction has consequences.

> **Key principle:** Never make it personal. The invoice is late — not your client as a person. Keep the focus on the invoice, the amount, and the resolution.

## The SMS reminder structure

SMS reminders should be short, clear, and action-oriented. Include: your business name, the invoice number, the amount, a link to pay. Nothing more.

Example: *Hi [Name], PayNudge reminder: INV-1042 ($2,400) from [Your Business] is now due. Pay here: [link]. Reply STOP to opt out.*

PayNudge's template library includes tested versions of all these messages, fully customisable to match your brand voice.`,
  },
  {
    slug: "xero-automation-guide",
    emoji: "⚙️",
    tag: "Xero",
    date: "Dec 5, 2025",
    readTime: "5 min read",
    title: "Xero Automation Guide: Set Up Invoice Reminders in Under 5 Minutes",
    excerpt: "A step-by-step walkthrough of connecting PayNudge to Xero and configuring your first automated reminder sequence.",
    body: `Getting PayNudge running with your Xero account takes under 5 minutes. Here's the exact process.

## Step 1: Create your PayNudge account

Go to paynudge.co and click "Start free". Enter your email address and choose a password. No credit card required for the Starter plan or the Pro/Scale free trial.

## Step 2: Connect Xero via OAuth

From your PayNudge dashboard, click "Connect Xero". You'll be redirected to Xero's authentication page. Log in with your Xero credentials, review the permissions, and click Authorise. You'll be redirected back to PayNudge and your invoices will start syncing immediately.

> **Security note:** PayNudge uses Xero's official OAuth 2.0 integration. We never store or see your Xero password. You can revoke access from within Xero at any time.

## Step 3: Review your synced invoices

Navigate to the Invoices tab. You'll see all your outstanding invoices pulled from Xero, including amounts, due dates, and client details. PayNudge syncs continuously — new invoices appear automatically.

## Step 4: Configure your reminder sequence

Go to Sequences and review the default chase flow (Day 0, Day 3, Day 7, Day 14). Customise the timing and messages to match your business style. You can create multiple sequences and assign different ones to different clients.

## Step 5: Enable reminders and you're done

Toggle on "Active" on your sequence and PayNudge takes over. Reminders fire automatically on schedule. When a payment is recorded in Xero, PayNudge stops the sequence for that invoice instantly — no manual work required.

That's the entire setup. Most PayNudge users go from sign-up to first reminder sent in under 10 minutes.`,
  },
  {
    slug: "accounts-receivable-for-freelancers",
    emoji: "🎨",
    tag: "Freelancing",
    date: "Nov 22, 2025",
    readTime: "10 min read",
    title: "Accounts Receivable for Freelancers: The No-Jargon Guide",
    excerpt: "You didn't become a freelancer to become a debt collector. Everything you need to know about getting paid reliably.",
    body: `Accounts receivable is a finance term that just means "money people owe you". As a freelancer, your AR process is the system you use to make sure that money actually arrives in your bank account.

Most freelancers don't have a system. They send an invoice, hope for the best, and follow up awkwardly when nothing happens. This guide is about fixing that.

## The basics: what you control

Getting paid reliably starts before the invoice is sent. Three things you can control that dramatically improve your payment rate:

- **Clear payment terms:** "Net 30" on an invoice means payment within 30 days of the invoice date. State your terms clearly. If you want to be paid faster, use Net 14 or Net 7.
- **Invoice timing:** Send invoices immediately on completion (or per your agreed schedule for ongoing work). Every day of delay is a day added to when you'll get paid.
- **Easy payment methods:** The harder it is to pay you, the longer payment takes. Offer bank transfer, credit card, and if possible, a direct payment link.

## Setting up your follow-up system

Manual follow-ups are fine when you have 2-3 clients. When you have 10-15 active clients and projects, manually tracking which invoices need follow-up becomes a job in itself.

Automated reminder tools like PayNudge solve this by syncing with your accounting software and firing reminders on a schedule you define — without you needing to remember, check, or write anything.

> **Time reality check:** If you spend 2 hours a week chasing invoices and charge $75/hour, you're losing $150/week — $7,800/year — in unbillable time. Automation pays for itself in the first week.

## Late payment clauses: should you use them?

Many jurisdictions have statutory late payment interest rules that automatically apply to B2B invoices — even if you don't explicitly state them. Adding a late payment clause to your invoices (e.g. "Invoices unpaid after 30 days incur 2% monthly interest") creates both a legal basis and a psychological incentive to pay on time.

## When nothing works

For genuinely non-paying clients, the escalation path is: automated reminders → formal written demand → small claims court → debt collection agency. The vast majority of late invoices resolve at the automated reminder stage — which is exactly why it's worth setting up properly.`,
  },
];
