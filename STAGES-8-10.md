# Mercy Hub — Stages 8–10 Upgrade

## Stage 8 — SEO, Analytics & Content
- Dynamic database-backed sitemap for active products and published blog posts.
- Next.js robots metadata route with private/admin/API exclusions.
- Organization and WebSite structured data.
- Product structured data with offer and valid aggregate rating data when available.
- Google Analytics 4 is opt-in through `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Existing page/product metadata is preserved and strengthened.

## Stage 9 — Performance, Health Checks & Monitoring
- Added `/api/health` with MongoDB ping, response time, timestamp and deployment version.
- Health endpoint returns HTTP 503 when the database is unavailable.
- API health responses are never cached.
- Existing MongoDB connection caching remains in place.
- Image optimization and compression remain enabled.
- Use an external uptime monitor to request `/api/health` periodically; this is more reliable than assuming serverless functions stay permanently warm.

## Stage 10 — Testing, Backup, Hardening & Production Launch
- Production TypeScript errors are no longer ignored by Next.js.
- Removed the stale Vercel sitemap rewrite because `app/sitemap.ts` is the canonical sitemap implementation.
- Added `verify:production` preflight script.
- Added `verify` script: type-check → lint → production build.
- Added MongoDB backup script using MongoDB Database Tools (`mongodump`).
- Added environment template with security/payment/analytics variables.
- Existing security headers remain enabled.

### Verification status
Run in a clean environment:

```bash
npm ci
npm run verify:production
npm run verify
```

For a real database backup:

```bash
npm run backup:mongodb
```

The backup command requires MongoDB Database Tools (`mongodump`) on the machine executing it.
