# Starehe Booking Management System

A Next.js (App Router, JavaScript) app that digitizes booking of projectors,
school buses and computer laboratories, with a full club-function approval
workflow. Built for Antigravity IDE.

## What's built so far (Phase 1)

- Full project scaffold — every folder from the spec (`app/`, `components/`,
  `lib/`, `hooks/`, `utils/`, `services/`, `context/`, `database/`, `emails/`,
  `pdf/`, `middleware/`).
- Complete Supabase schema — every table (`users`, `teachers`, `club_patrons`,
  `resources`, `bookings`, `master_lists`, `master_list_students`,
  `requisitions`, `approvals`, `signatures`, `notifications`,
  `inventory_logs`, `returns`, `emails`), triggers for auto-generated booking
  numbers, and Row Level Security policies. See `database/schema.sql`.
- Design system — navy/white/gray light theme, no gradients, in
  `tailwind.config.js` + `app/globals.css`, plus a reusable UI kit
  (`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Card`, `StatCard`,
  `StatusBadge`).
- Landing page with the Club Patron Yes/No gate.
- **Teacher Booking flow** (no login): form + validation + API route
  (`app/api/bookings/teacher/route.js`) that finds an available resource,
  creates the booking, updates inventory, and logs it.
- **Club Patron auth**: signup, login, middleware route protection for
  `/patron`, `/approvals`, `/admin`.
- **Club Patron Dashboard**: live stat cards (total/pending/approved/rejected,
  resource availability) and an upcoming-events list, pulled from Supabase.
- **Book Resource page**: the three-day validation rule (blocks submission
  with a red alert if the function is <3 days away), resource picker,
  API route that also seeds the 5-stage approval chain (SM1→SM2→SM3→SM4→
  Welfare Head) for every new club function.

## Phase 2 — done

- **Master List page** (`app/patron/(dashboard)/master-list/page.js`) — header
  fields, a full Handsontable spreadsheet (add rows, delete rows, copy/paste,
  undo/redo, dropdown attendance column), reserved signature blocks for all
  5 approvers, Save Draft / Continue. Backed by
  `app/api/master-list/route.js` (header upsert) and
  `app/api/master-list/students/route.js` (bulk row save).
- **Requisition Form page** (`app/patron/(dashboard)/requisition/page.js`) —
  all 8 checkboxes, conditional "Other" description, requirements textarea,
  estimated students, departure/return time, special notes, Welfare Head
  signature block. Backed by `app/api/requisition/route.js`. Submitting
  fires a `pending_approval` notification to SM1 to kick off the chain.
- Flow is now fully connected: Book Resource → Master List → Requisition →
  My Bookings, with `bookingId` threaded through the URL at every step.

## Not yet built (Phase 3+ — tell me which to build next)

- Approval workflow pages for SM1–SM4 and Welfare Head, with signature pad
- PDF generation (cover page, master list, requisition, signatures)
- Email sending on approval (Nodemailer + template)
- WhatsApp share button
- My Bookings (search/filter/sort), Notifications, Inventory, Profile pages
- Admin dashboard (users, clubs, resources, reports with charts, returns, logs)
- Resource return flow

I built this in a scaffolded, working core first rather than guessing at
every screen at once — that's the part most likely to have subtle bugs if
rushed. Tell me "continue" (or name a specific module, e.g. "build the
Master List spreadsheet next") and I'll keep going in the same architecture.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com, then in the SQL
   Editor run the entire contents of `database/schema.sql`.

3. **Copy environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from
     Supabase → Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, the **service_role** secret
     (server-only, never expose to the browser).
   - SMTP settings for email (Phase 2).

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Architecture notes

- `lib/supabase/client.js` — browser client (Client Components).
- `lib/supabase/server.js` — server client that reads the auth cookie
  (Server Components, Route Handlers).
- `lib/supabase/admin.js` — service-role client for privileged writes
  (teacher bookings, which have no logged-in user). Server-only, never
  import this into a `'use client'` file.
- `middleware.js` — protects `/patron`, `/approvals`, `/admin` by role.
- `utils/validation.js` — every Zod schema, plus `validateThreeDayRule()`
  used by both the client (instant red alert) and the API route (so the
  rule can't be bypassed by calling the API directly).
- Route groups `app/patron/(auth)` and `app/patron/(dashboard)` — the auth
  pages (signup/login) intentionally have no sidebar; the dashboard pages
  share `(dashboard)/layout.js`, which renders the sidebar.
