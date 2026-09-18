# ENDLESS

## Authentication setup

ENDLESS uses Supabase Auth for real email/password sessions. Copy `.env.example` to `.env.local`, add the Supabase project URL and publishable anon key, then run `supabase/schema.sql` in the Supabase SQL editor. The schema creates the protected `profiles` table and creates a profile record whenever a user registers.

Supabase email confirmation controls whether signup returns an authenticated session immediately. Password reset links return to `/login`.
ENDLESS

ENDLESS is a premium marketplace for discovering, discussing, buying, licensing, and transferring original ideas.

## Run locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run build
npm run lint
```

## Authentication setup

ENDLESS uses Supabase Auth for real email/password sessions. Copy `.env.example` to `.env.local` and add your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Then run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates the protected `profiles` table, row-level security policies, and a trigger that creates a profile when a user registers.

Supabase email confirmation controls whether signup creates an authenticated session immediately. Password reset links return to `/login`.

Do not commit `.env.local` or service-role keys. Only the publishable Supabase key belongs in the Vite client environment.

## Main routes

- `/` — premium ENDLESS introduction
- `/explore` — marketplace and category discovery
- `/idea/:id` — public idea teaser and protected details
- `/submit` — authenticated creator submission flow
- `/creators` and `/creator/:id` — creator discovery and profiles
- `/companies` and `/dashboard/company` — company discovery and workspace
- `/messages` — authenticated marketplace conversations
- `/offers` — authenticated offer management
- `/dashboard/creator` — creator dashboard
- `/dashboard/purchased` — purchased ideas
- `/dashboard/licenses` — license management
- `/transfer` — agreement-aware transfer and resale
- `/saved` — saved ideas
- `/transactions` — transaction history
- `/settings` — authenticated account settings

The app uses the official ENDLESS icon asset from `public/favicon.svg` for the favicon and shared brand surfaces.
