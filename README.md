# ENDLESS — Idea Marketplace

> **Ideas have no limits.**

ENDLESS is an idea marketplace where creators can share original ideas and companies can discover, connect, evaluate, and acquire ideas that match their needs.

The platform is designed to make the journey from **idea → connection → agreement → value → build** simple and transparent.

## What is ENDLESS?

Many good ideas never move beyond the person who thought of them.

ENDLESS creates a space where people can:

- Share original ideas
- Discover ideas from different categories and industries
- Connect directly with creators
- Discuss ideas before making an offer
- Purchase ideas based on available rights
- Manage purchased ideas and licenses
- Track offers and transactions

Companies can explore ideas, communicate with creators, and find concepts that could fit their products, services, or business goals.

## Core Features

### Explore Ideas

Discover ideas through categories, industries, problems, keywords, idea stage, price, purchase type, most viewed, and recently added listings.

### Publish an Idea

Creators can submit basic information, the problem, general concept, target users, opportunity, asking price, purchase type, rights information, and supporting details.

### Protected Idea Details

Creators can keep sensitive implementation details protected. Public visitors see a teaser, while detailed information can be made available through approved access or an agreed purchase.

### Chat and Offers

Buyers can communicate directly with creators before purchasing or making an offer. Offers support acceptance, decline, and negotiation workflows.

### Rights and Licensing

Ideas can be offered with different rights depending on the creator's agreement:

- Full Ownership
- Exclusive License
- Non-exclusive License
- Transferable Rights

### Transfer and Resale

Purchased ideas may be transferred or resold only when the original agreement and rights allow it.

### Dashboards

Creator dashboards cover overview, ideas, offers, messages, transactions, and activity. Company dashboards cover overview, saved ideas, purchased ideas, active licenses, offers, messages, and transactions.

## Main Pages

```text
/
├── Explore Ideas
├── Idea Details
├── Submit an Idea
├── Creators
├── Creator Profile
├── For Companies
├── How It Works
├── Messages
├── Offers
├── Saved Ideas
├── Purchased Ideas
├── Licenses
├── Transfer / Resale
├── Transactions
├── Settings
├── Login
└── Sign Up
```

## Run Locally

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run build
npm run lint
```

## Authentication Setup

ENDLESS uses Supabase Auth for real email/password sessions. Copy `.env.example` to `.env.local` and add your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Then run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates the protected `profiles` table, marketplace `ideas` and `idea_purchases` tables, row-level security policies, the atomic `purchase_idea` function, and a trigger that creates a profile when a user registers.

Marketplace idea rows should use slugs matching the frontend listing ids (for example, `inventory-assistant`). Purchases must go through `purchase_idea`; it locks the idea row, verifies the current status, records the authenticated buyer and timestamp, and changes the idea to `sold` in the same transaction.

Supabase email confirmation controls whether signup creates an authenticated session immediately. Password reset links return to `/login`.

Do not commit `.env.local` or service-role keys. Only the publishable Supabase key belongs in the Vite client environment.

The official ENDLESS icon asset is used from `public/favicon.svg` for the favicon and shared brand surfaces.
