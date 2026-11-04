# Supabase setup for SÅGÊ Digital

This guide prepares the portfolio for a future private admin dashboard.
The public website already works **without** Supabase by using local published data.

## What this stage does

- Defines database types for `projects` and `services`
- Provides repositories that can read from Supabase
- Falls back to local published content when Supabase is not configured
- Ships an SQL migration with Row Level Security so drafts stay private

Public content works without auth. Stage 9.1 adds administrator sign-in and RLS write policies; the full content dashboard arrives later.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose an organization, project name, database password, and region.
4. Wait until the project finishes provisioning.

## 2. Get your public credentials

In the Supabase dashboard:

1. Open **Project Settings** → **API**.
2. Copy:
   - **Project URL**
   - **Publishable** key (`sb_publishable_...`), or the legacy **anon public** JWT if your project still shows it

Never put a **secret** (`sb_secret_...`) or **service_role** key in this Vite frontend.
Those keys bypass Row Level Security and must stay on a secure server only.

The app accepts `sb_publishable_...` or a legacy anon JWT, refuses secret/service-role keys,
and falls back to local published data when configuration is missing or unsafe.

## 3. Configure `.env.local`

In the project root, create `.env.local` (do not commit it):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

Restart the Vite dev server after saving env changes.

If these values are missing or empty, the site keeps using local fallback data automatically.

## 4. Apply the SQL migration

1. Open Supabase → **SQL Editor**.
2. Paste and run the contents of:

`supabase/migrations/20260330120000_create_projects_and_services.sql`

That migration creates:

- `services` table
- `projects` table
- useful indexes
- `updated_at` triggers
- RLS policies that allow **SELECT** only for `status = 'published'`

It intentionally does **not** allow public insert/update/delete.

The migration also:
- enables **and forces** Row Level Security on both tables
- grants `anon` / `authenticated` **SELECT only**
- revokes INSERT / UPDATE / DELETE privileges for those roles

## 5. How local fallback works

Public UI components call:

- `src/services/projectService.ts`
- `src/services/serviceService.ts`

Those services ask a repository for data:

1. If Supabase env vars are set → try Supabase
2. If Supabase is missing or a read fails → use:
   - `src/data/publishedProjects.ts` (SÅGÊ Study Planner only)
   - `src/data/publishedServices.ts` (current legitimate services)

So the website still builds and runs on a laptop with no Supabase credentials.

## 6. Public content rules

- Public pages must only show `status = 'published'`
- Draft / unpublished rows must never appear on the website
- Repository queries always request published rows
- **RLS is the real security boundary** — do not rely on frontend filtering alone

## 7. Portfolio media storage (Stage 9.5)

Apply this migration manually (SQL editor or CLI) after admin content policies:

`supabase/migrations/20260401120000_portfolio_media_storage.sql`

It creates:

- Public bucket `portfolio-media` (5 MB limit; JPEG / PNG / WebP / GIF)
- Public read policy for portfolio visitors
- Admin-only INSERT / UPDATE / DELETE via `public.is_admin()`

Uploads from the admin Media Library are stored under `library/`.
Project forms save the resulting public HTTPS URLs into `cover_image` and
`gallery_images` (existing columns — no table schema change).

In Supabase Dashboard → **Storage**, confirm the `portfolio-media` bucket is
listed and marked public after applying the migration.

## 8. Administrator authentication (Stage 9.1)

Routes:

- `/admin/login` — email/password sign-in (no public registration)
- `/admin` — protected entry shell for authenticated administrators

Authorization uses **only** the server-managed claim:

`auth.users.raw_app_meta_data.role = 'admin'` → JWT `app_metadata.role === 'admin'`

Never rely on `user_metadata` or client-only flags for admin privileges.

### Apply the admin RLS migration

After the base schema migration, run:

`supabase/migrations/20260331120000_admin_content_policies.sql`

This keeps public published SELECT policies and adds admin SELECT/INSERT/UPDATE/DELETE policies gated by `public.is_admin()`.

### Provision the first administrator (manual)

1. In Supabase → **Authentication** → **Users**, create a user with email + password
   (or invite the owner; there is no public signup route in the app).
2. Open that user → **App Metadata** (raw `app_metadata`) and set:

```json
{ "role": "admin" }
```

3. Save. Have the user sign out/in (or wait for token refresh) so the JWT includes the claim.
4. Sign in at `/admin/login`.

Alternatively, with the **service role** key on a secure machine only (never in Vite):

```sql
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'OWNER_EMAIL_HERE';
```

Disable public sign-ups in Supabase Auth settings if they are enabled.

## 9. Contact inquiries (Stage 9.6)

Apply this migration manually (SQL editor or CLI) after admin content policies:

`supabase/migrations/20260402120000_create_inquiries.sql`

It creates:

- Table `public.inquiries` with status enum (`new` | `read` | `replied` | `archived`)
- Length / format CHECK constraints for name, email, phone, subject, message
- Indexes on `(status, created_at)` and `created_at`
- RLS **FORCE** enabled
- Originally allowed public `INSERT` with `status = 'new'` (Stage 9.6)
- **Stage 10.3** revokes direct public INSERT; intake is the `submit-inquiry` Edge Function
- **Admins** (`public.is_admin()`): `SELECT` / `UPDATE` / `DELETE`
- No public `SELECT` / `UPDATE` / `DELETE`

The public contact form maps **service → subject** and **details → message**, then
calls the Edge Function. Admins manage the inbox at `/admin/inquiries`.

### Spam / abuse protection (no paid services)

Already in place:

- Database CHECK constraints (required fields + length limits + email format)
- Client + service-layer validation (never rely on the client alone)
- Submit button + in-flight guard against duplicate clicks
- Hidden honeypot field (`website`) — filled bots get a fake success and no DB write
- Basic text sanitization (trim, null-byte strip, max length)

**Rate limiting** is not available from the Vite client alone without weakening security. Practical options that need extra infrastructure (choose later if spam appears):

1. **Supabase Edge Function** in front of inserts (recommended) — validate + per-IP / per-email throttle, then insert with the service role only inside the function.
2. **CDN / reverse-proxy rate limits** (Cloudflare, Vercel, etc.) on the contact path or the Supabase REST origin.
3. **Postgres trigger + log table** for soft throttling (more complex; still needs a trusted write path for accurate client IP).

Do not put the service-role key in the frontend. Do not introduce paid captcha vendors without explicit approval.

## 10. Website settings (Stage 9.7)

Apply this migration manually (SQL editor or CLI) after admin content policies:

`supabase/migrations/20260403120000_create_site_settings.sql`

It creates:

- Singleton table `public.site_settings` (`id = 'default'` only)
- Public-facing business, social, hero, footer and contact preference fields
- Seeded defaults matching the current live portfolio copy
- RLS **FORCE** enabled
- **Public** (`anon` + `authenticated`): `SELECT` only
- **Admins** (`public.is_admin()`): `INSERT` / `UPDATE` / `DELETE`
- No private admin secrets in this table

Manage values at `/admin/settings`. The public site loads settings once via
`SiteSettingsProvider` and falls back to `src/config/siteDefaults.ts` when
Supabase is unavailable or the row is missing — so content never blanks out.

Contact form delivery messages stay in `src/config/contact.ts` (not editable
here).

## 11. Auth & RLS hardening (Stage 10.2)

Apply this migration manually after the Stage 9 migrations:

`supabase/migrations/20260404120000_auth_rls_hardening.sql`

It reasserts (does not weaken):

- `public.is_admin()` reads **only** `auth.jwt() -> app_metadata -> role`
- Empty `search_path` on `is_admin()`; execute granted to `authenticated` only
- Table privileges: anon cannot write projects/services/settings; anon cannot read inquiries
- Content / inquiries / site_settings RLS policies
- `portfolio-media` Storage policies (public read; admin write via `is_admin()`)

### Manual Dashboard verification (you must check these)

These cannot be verified from the Vite app alone:

1. **Disable public sign-up**
   Authentication → Providers → Email → turn **off** “Enable sign ups” (or equivalent).
   There is no registration UI in this app; leave sign-up disabled in production.

2. **Provision admins manually**
   Authentication → Users → Invite/Create user.
   Open the user → **App Metadata** (not User Metadata) and set:

```json
{ "role": "admin" }
```

   Save, then have the user sign out/in so the JWT refreshes.

3. **Confirm `app_metadata` (not `user_metadata`)**
   Setting `"role": "admin"` only under User Metadata must **not** grant access.
   Only App Metadata is trusted by `is_admin()` and the SPA.

4. **Email confirmation / recovery**
   Choose settings appropriate for a private admin:
   - Prefer inviting known admins over open confirmation flows.
   - Password recovery should be enabled for the admin email you control.
   - Do not expose recovery or invite links publicly.

5. **Production migrations**
   In the production Supabase SQL editor (or CLI linked to prod), confirm all of these have been applied in order:

   - `20260330120000_create_projects_and_services.sql`
   - `20260331120000_admin_content_policies.sql`
   - `20260401120000_portfolio_media_storage.sql`
   - `20260402120000_create_inquiries.sql`
   - `20260403120000_create_site_settings.sql`
   - `20260404120000_auth_rls_hardening.sql`

6. **Storage policy audit**
   Storage → Policies: for `portfolio-media`, ensure there is **no** anon/authenticated INSERT/UPDATE/DELETE policy that omits `is_admin()`. Extra permissive policies from the Dashboard would OR with ours and weaken security — remove them.

7. **Frontend env**
   Vercel / `.env` must use `VITE_SUPABASE_ANON_KEY` / publishable key only — never `service_role` or `sb_secret_`.

## 12. Storage & inquiry intake hardening (Stage 10.3)

Apply these migrations manually after Stage 10.2, in order:

1. `supabase/migrations/20260405120000_storage_inquiry_hardening.sql`
2. `supabase/migrations/20260406120000_inquiry_rate_limit_rpc.sql` (atomic RPC + cleanup)
3. `supabase/migrations/20260407120000_inquiry_throttle_service_role_grants.sql`
   (explicit `service_role` SELECT/INSERT/UPDATE/DELETE on `inquiry_submission_throttle`)

The first migration:

- Restricts `portfolio-media` **writes** to paths under `library/` (admin + `is_admin()` only)
- Reaffirms bucket MIME allow-list (**no SVG**) and 5 MB limit
- **Revokes** anon/authenticated `INSERT` on `inquiries` (closes direct PostgREST spam)
- Adds `inquiry_submission_throttle` (service-role only) for Edge Function rate limits

The second migration:

- Adds `public.consume_inquiry_rate_limit(...)` — **single transactional RPC** that locks
  both IP and email buckets (`SELECT … FOR UPDATE`), denies without mutating either bucket
  when either limit is exhausted, otherwise increments both.
- Adds `public.cleanup_inquiry_submission_throttle(retention_seconds)` for expired rows.
- **EXECUTE** granted only to `service_role` (revoked from `public` / `anon` / `authenticated`).
- Empty `search_path` on both functions.

### Deploy the `submit-inquiry` Edge Function (required for contact form)

Public contact submissions call `supabase.functions.invoke('submit-inquiry')`.
Without the Function + both migrations, the contact form fails closed (safe).

1. Install/link the Supabase CLI to the production project.
2. Set secrets (**never** in Vite / Vercel `VITE_*`):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set INQUIRY_RATE_LIMIT_SECRET="$(openssl rand -hex 32)"
```

`INQUIRY_RATE_LIMIT_SECRET` must be a long random value (Function requires length ≥ 16).
HMAC-SHA256 keys use domain separation (`inquiry-rate:v2:ip:…` / `inquiry-rate:v2:email:…`).
Changing the secret starts fresh rate-limit buckets (old SHA/plain rows become inert and are cleaned up).

3. Deploy:

```bash
supabase functions deploy submit-inquiry
```

4. Confirm Function logs show successful deploys; submit a test enquiry from the site.
5. Confirm anon REST `INSERT` into `inquiries` is denied; admin inbox still lists new rows.

Rate limits (server-side, atomic): **5 / IP / hour**, **3 / email / hour**.
Request bodies over **50 KB** receive HTTP 413.

### Client IP behaviour (documented limitations)

- Prefer `cf-connecting-ip` when present (Cloudflare).
- Else use the first `x-forwarded-for` hop (matches Supabase’s documented Edge example).
- `X-Forwarded-For` can be influenced by clients unless a sanitizing CDN/proxy is in front —
  treat IP limits as **best-effort abuse reduction**, not identity.
- IP rotation trivially bypasses IP buckets; email limits still apply per address.
- When no IP header is available, all such requests share one HMAC bucket for
  `inquiry-rate:v2:ip:missing` (still capped at 5/hour for that shared bucket).

### Throttle cleanup schedule (manual)

Expired throttle rows are not removed automatically unless you schedule cleanup.

If `pg_cron` is enabled on the project:

```sql
select cron.schedule(
  'cleanup-inquiry-throttle',
  '15 * * * *',
  $$select public.cleanup_inquiry_submission_throttle(7200)$$
);
```

`7200` seconds (2 hours) retains active 1-hour windows. The cleanup RPC is
**service_role only** (not callable by anon/authenticated).

Without pg_cron, run `select public.cleanup_inquiry_submission_throttle(7200);`
periodically with the service role / SQL editor.

### Residual Storage note

The bucket remains **public** so portfolio image URLs work without signed cookies.
`SELECT` on `storage.objects` for `portfolio-media` may allow listing; that is accepted for this portfolio.
Writes remain admin-only under `library/`. SVG uploads are rejected in the app and by bucket MIME rules.

## 13. What remains for the admin dashboard

Still to build in a later stage:

- Optional service-icon picker from the media library
- Account / password preferences (Auth-managed; not site_settings)

## Quick checklist

- [ ] Supabase project created
- [ ] URL + publishable/anon key copied
- [ ] `.env.local` configured
- [ ] Base migration SQL applied
- [ ] Admin policies migration applied
- [ ] Portfolio media storage migration applied
- [ ] Inquiries migration applied
- [ ] Site settings migration applied
- [ ] Auth/RLS hardening migration applied
- [ ] Storage/inquiry hardening migration applied
- [ ] Inquiry rate-limit RPC migration applied
- [ ] Inquiry throttle service_role table grants migration applied
- [ ] `submit-inquiry` Edge Function deployed
- [ ] `SUPABASE_SERVICE_ROLE_KEY` + `INQUIRY_RATE_LIMIT_SECRET` set as Function secrets
- [ ] Throttle cleanup scheduled (pg_cron) or run manually
- [ ] First admin user created + `app_metadata.role = admin`
- [ ] Public sign-ups disabled
- [ ] Storage has no permissive write policies beyond admin policies
- [ ] Dev server restarted
- [ ] Published rows appear (or local fallback still works)
- [ ] `/admin/login` works for the admin account only
- [ ] Non-admin account cannot open `/admin`
- [ ] `/admin/media` upload + project image picker work
- [ ] SVG / mismatched MIME uploads are rejected
- [ ] Public contact form creates an inquiry via Edge Function
- [ ] Anon direct INSERT into `inquiries` is denied
- [ ] `/admin/inquiries` lists and updates statuses
- [ ] `/admin/settings` save updates public hero/contact/footer
