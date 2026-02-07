# Brand Deal OS

The all-in-one platform for creators to track brand deals, manage contracts, send invoices, and get paid on time.

## Features

### Pipeline & Deals
- Drag-and-drop Kanban pipeline (Lead, Negotiating, Signed, Delivered, Paid)
- Full deal detail view with inline editing
- Deliverable tracking with status, platform, and content type
- Deal archiving and search
- Free tier limit (3 active deals) with upgrade prompt

### AI Contract Extraction
- Upload PDF contracts to any deal
- Claude AI extracts payment terms, deliverables, usage rights, exclusivity, and more
- Side-by-side review interface with confidence scoring
- Auto-populate deal fields and create deliverables from extraction
- Credit-based: 50/month (Pro), unlimited (Elite)

### Invoicing
- Create invoices with line items tied to specific deals
- Auto-generated invoice numbers
- Track status: draft, sent, paid, overdue
- Mark as paid with payment recording

### Email Inbox
- Unique forwarding address per user
- Postmark inbound webhook parses brand emails
- Two-panel inbox UI with email preview
- Quick deal creation from emails

### Money Dashboard
- Revenue overview with summary cards
- Monthly revenue area chart (recharts)
- Outstanding invoices tracker
- Recent payments history

### Automated Reminders
- Cron-based reminder processing (every 15 min)
- Stale lead detection (7 days in Lead, 14 days in Negotiating)
- Daily/weekly email digest with action items
- Per-category notification preferences

### Subscription Billing
- Stripe integration with Pro ($19/mo) and Elite ($39/mo) plans
- 14-day free trial, annual billing option (20% savings)
- Stripe Customer Portal for billing management
- Webhook-driven subscription lifecycle
- Feature gating based on tier

### Additional
- Onboarding wizard for new users
- Mobile-responsive sidebar and layout
- Real-time notification system
- Global search (deals, brands, contacts)
- Keyboard shortcuts (Ctrl+K search, Ctrl+N new deal)
- Landing page with pricing section
- Zod form validation with inline errors
- Confirmation dialogs for destructive actions
- Custom 404 and error pages
- Loading skeletons for all dashboard pages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + tailwindcss-animate |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Anthropic Claude API (@anthropic-ai/sdk) |
| Payments | Stripe (checkout, portal, webhooks) |
| Email | Postmark (transactional + inbound) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Forms | Zod + react-hook-form |
| Icons | Lucide React |
| Fonts | DM Sans (display) + Plus Jakarta Sans (body) |

## Environment Variables

Create a `.env.local` file with the following:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (AI Contract Extraction)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ELITE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ELITE_ANNUAL_PRICE_ID=price_...

# Postmark (Email)
POSTMARK_SERVER_TOKEN=your-token

# Cron Security
CRON_SECRET=a-random-secret-string

# App
NEXT_PUBLIC_APP_URL=https://branddealos.com
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment (Vercel)

1. **Connect repo** — Import your GitHub repository in the Vercel dashboard.

2. **Add environment variables** — Copy all variables from `.env.local` into the Vercel project settings under Environment Variables.

3. **Set up Supabase** — Create a project at [supabase.com](https://supabase.com), run the `BrandDealOS_Supabase_SQL.sql` file in the SQL Editor, and enable Google OAuth in Authentication > Providers (optional).

4. **Set up Stripe webhook** — Create a webhook endpoint in the Stripe Dashboard pointing to `https://your-domain.com/api/stripe/webhook`. Listen for events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

5. **Set up Postmark inbound** — Configure an inbound server in Postmark pointing to `https://your-domain.com/api/email/inbound`.

6. **Cron jobs** — Vercel Cron is configured automatically via `vercel.json`:
   - `/api/cron/process-reminders` — every 15 minutes
   - `/api/cron/stale-leads` — daily at 7:00 UTC
   - `/api/cron/send-digest` — daily at 13:00 UTC (8 AM ET)

7. **Deploy** — Push to `main` and Vercel deploys automatically.

## Project Structure

```
app/
  (dashboard)/        # Authenticated dashboard routes
    pipeline/         # Kanban pipeline
    deals/[id]/       # Deal detail
    money/            # Money dashboard
    invoices/         # Invoice list + creation
    inbox/            # Email inbox
    settings/         # User settings + billing
    calendar/         # Calendar view
    brands/           # Brand management
    contacts/         # Contact management
    onboarding/       # New user wizard
  api/
    stripe/           # Checkout, portal, webhook
    contracts/        # AI extraction
    email/            # Inbound webhook
    cron/             # Scheduled jobs
  auth/               # Login, signup, callback
components/
  layout/             # Shell, sidebar, topbar, panels, shortcuts
  deals/              # Deal detail, new deal form, contract review
  pipeline/           # Kanban board, deal limit banner
  money/              # Money dashboard
  invoices/           # Invoice list client
  inbox/              # Email inbox client
  billing/            # Pricing modal
  notifications/      # Notification dropdown
  onboarding/         # Onboarding wizard
  ui/                 # Toaster, confirm dialog
lib/
  supabase/           # Client, server, admin Supabase clients
  stripe.ts           # Stripe client + price config
  email.ts            # Postmark email utility
  feature-gates.ts    # Tier-based feature gating
  validations.ts      # Zod schemas
  utils.ts            # Shared utilities
hooks/
  use-keyboard-shortcuts.ts
types/
  index.ts            # TypeScript types matching DB schema
```
