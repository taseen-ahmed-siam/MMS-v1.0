# Mosque Management System (MMS)

A production-ready full-stack web application for managing a single mosque. It pairs a public-facing website with a secure, role-based admin dashboard for managing finances, members, staff, events, assets, requests, and more.

Built with **Next.js 16** (App Router, TypeScript strict, Tailwind CSS v4), **Supabase** (PostgreSQL, Auth, Storage, Row-Level Security), and a shadcn-style Radix UI component set with a custom emerald/cream Islamic theme.

## Tech Stack

- **Framework**: Next.js 16.3.4 (App Router, Turbopack), TypeScript (strict)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **UI**: Radix UI primitives, Lucide icons, class-variance-authority, tailwind-merge
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts, **Tables**: TanStack Table
- **Backend**: Supabase (PostgreSQL, Auth, Storage), `@supabase/ssr`
- **Notifications**: sonner

## Features

### Public Website
- Homepage with prayer times, countdown to next prayer, upcoming events, and announcement highlights
- Prayer times, Events (with detail pages), Announcements, Khutbah archive, Committee, and Gallery pages
- Donate page (manual payment flow, BDT `৳`) and Contact page
- SEO metadata, sitemap, robots.txt, and web manifest

### Admin Dashboard (`/admin`)
- **Overview**: stats cards, donation vs expense charts, donation-by-fund chart, recent activity, quick actions
- **Finance**: Donations, Funds, Income, Expenses (with approve/reject flow), Reports with CSV export
- **Mosque**: Prayer management (create/copy/delete daily times), Announcements, Events, Khutbah
- **People**: Members, Committee, Staff, Users & Roles/Permissions, Zakat & Charity
- **Operations**: Assets, Maintenance, Documents, Contact Requests
- **Community**: Ramadan
- **System**: Audit Logs, Settings
- Role-based access control (RBAC) with 8 roles and permission strings enforced via Supabase RLS and `has_permission()`

## Getting Started

### Prerequisites
- Node.js 18.18+ (Next.js 16 requirement)
- A Supabase project with the schema applied

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only — never expose) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (defaults to `http://localhost:3000`) |

### Database Setup

Apply the schema, RLS policies, and triggers:

```bash
# via Supabase CLI
supabase db push
# or run supabase/migrations/001_initial_schema.sql in the SQL editor
```

Then seed data (funds, roles, payment methods, etc.) with `supabase/seed.sql`. Create the initial Super Admin user in the Supabase Auth dashboard and promote them by updating their `profiles` row to `role = 'super_admin'` (see comments in `seed.sql`).

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint

## Architecture

```
src/
  app/
    (public)/    # public website routes
    (auth)/      # login, signup, forgot/reset password
    admin/       # admin dashboard routes
    auth/        # auth callback route
  components/
    ui/          # shadcn-style primitives
    forms/       # reusable form components
    admin/       # admin UI (dashboard, data table, dialogs, sidebar)
    public/      # public website components
  lib/
    supabase/    # browser/server/admin clients + proxy helper
    auth/        # session helpers + auth server actions
    actions/     # server actions (public + admin)
    queries/     # data fetching (public + admin)
    permissions/ # RBAC definitions
    validations/ # Zod schemas
    utils/       # formatting, audit, IP helpers
  constants/     # shared constants (statuses, categories, roles, etc.)
  types/         # database & domain types
supabase/
  migrations/    # schema, RLS, triggers
  seed.sql       # seed data
```

## Notes

- Currency is BDT (`৳`); phone validation uses a Bangladeshi regex.
- Donations use a manual-payment flow (no external payment gateway).
- In Next.js 16 `middleware.ts` is renamed to `proxy.ts` (`src/proxy.ts`).
