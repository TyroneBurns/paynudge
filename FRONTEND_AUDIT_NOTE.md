# Front-end audit update

This patch focuses on two things:

1. Stronger AI-led positioning on the landing page
2. Making the customer-facing dashboard feel like the same product family as the backend Control Centre

## Files changed
- src/pages/HomePage.tsx
- src/components/Navbar.tsx
- src/components/AppLayout.tsx
- src/pages/DashboardPage.tsx
- src/pages/LiveDashboardPage.tsx
- src/index.css

## What changed
- Hero positioning shifted from generic reminders to AI collections for Xero
- Added a dedicated AI engine section to the landing page
- Reframed features and CTA copy around AI-driven collections, operator visibility, and control
- Updated navbar branding to reinforce the AI collections message
- Restyled the customer app shell to feel closer to the Control Centre
- Increased desktop density and premium panel treatment in the dashboard experience
- Improved the demo dashboard to better match the product family
- Added reusable premium panel utility styles

## Validation
- npm install
- npm run build

Build passed locally after the changes.
