# Brand Deal OS

The operating system for creator brand partnerships. Track deals, manage contracts, send invoices, and never miss a payment.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `BrandDealOS_Supabase_SQL.sql`
3. Enable **Google OAuth** in Authentication > Providers (optional)

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase project URL and anon key (found in Settings > API).

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  auth/              # Login, Signup, OAuth callback
  (dashboard)/       # Protected routes (requires auth)
    pipeline/        # Kanban board (main view)
    deals/
      new/           # Create deal
      [id]/          # Deal detail page
    brands/          # Brand management
    contacts/        # Contact management
    invoices/        # Invoice list + creation
    calendar/        # Deadline calendar view
    settings/        # Profile & preferences
components/
  layout/            # Sidebar, TopBar
  pipeline/          # Kanban board components
  deals/             # Deal detail components
  invoices/          # Invoice components
  ui/                # Shared UI components
lib/
  supabase/          # Supabase client (browser, server, middleware)
  utils.ts           # Helpers, formatters, constants
types/
  index.ts           # TypeScript types matching DB schema
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI**: Custom components + Lucide icons
- **State**: React Server Components + client-side state

## Phase 1 MVP Features

- [x] User auth (email/password + Google OAuth)
- [x] Pipeline Kanban board (5 stages, drag-and-drop)
- [x] Create deals manually with brand + contact
- [x] Deal detail page (overview, deliverables, files, invoices)
- [x] Mark deliverables complete with status tracking
- [x] File upload for contracts and briefs
- [x] Invoice creation with line items
- [x] Brand and contact management (CRM-lite)
- [x] Calendar view with deadline tracking
- [x] Settings page with profile management
