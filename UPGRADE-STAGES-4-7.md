# Mercy Hub — Upgrade Stages 4–7

This upgrade builds on the existing Next.js + MongoDB e-commerce application without replacing the database or rewriting the working storefront.

## Stage 4 — Payment, Cart, Checkout & Orders
- Order totals are rebuilt on the server from authoritative MongoDB product prices.
- Browser-supplied item prices, subtotal, shipping cost and total are no longer trusted.
- Product inventory is reserved atomically during order creation to prevent overselling under concurrent checkout.
- Reserved stock is restored if order creation fails.
- Reserved stock is restored when an unpaid order is cancelled or payment fails.
- Paystack initialization now accepts only an order ID and derives the amount from the order on the server.
- Flutterwave initialization follows the same server-authoritative pattern.
- Paystack verification checks currency and exact paid amount against the order.
- Paystack webhook signature is required when processing webhooks.
- Paystack webhook checks payment amount/currency before confirming an order.
- Order status updates are validated and the previous `$push`/`$set` update bug is removed.
- Checkout now sends variant/color identifiers rather than trusting client prices.

## Stage 5 — Products, Inventory & Digital Services
- Product-level inventory reservation is protected against concurrent purchases.
- Digital order indexes were strengthened for user history, status reporting and provider lookups.
- Digital Paystack references are unique to prevent reuse.
- Digital service purchase validates that the service is enabled.
- Digital purchase validates calculated cost/customer price before dispatch.
- Existing provider dispatch/retry/admin diagnostic functionality is preserved.

## Stage 6 — Admin Dashboard, Reports & Controls
- Admin analytics now includes pending payment count.
- Admin analytics now includes low-stock product count.
- Average order value is based on paid orders rather than all orders.
- Dashboard stat cards now surface pending payments and low-stock risk.
- Existing revenue, order, category, product, recent-order and low-stock reporting remains intact.

## Stage 7 — UI/UX, Branding & Responsiveness
- Existing admin-controlled brand colours are now used more consistently across application components.
- Primary/accent theme tokens replace many hard-coded brand colours.
- Theme-derived soft colour tokens are added so transparency variants remain dynamic when an admin changes the brand colour.
- Checkout spacing is improved for small screens.
- Global focus-visible styling improves keyboard accessibility.
- Global container width and image handling are tightened for responsive layouts.
- Existing responsive layout architecture is preserved rather than replaced.

## Verification
- All TypeScript/TSX source files were syntax-transpiled successfully with the available TypeScript compiler.
- A full `npm ci` / production type-check could not be completed in this environment because dependency installation timed out and the supplied working tree does not contain a complete `node_modules` installation.
- No claim is made that a production build has passed until dependencies are installed successfully and `npm run type-check`, `npm run lint`, and `npm run build` are run in a complete environment.

## Important deployment environment
Ensure these are configured in Vercel/production where applicable:
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `FLUTTERWAVE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`
- existing MongoDB, Auth, Cloudinary and email variables from the project

Do not deploy with a missing Paystack webhook secret.
