# 🏠 Mercy Home Essentials — Premium eCommerce Platform

A production-ready Next.js 15 eCommerce platform for Mercy Home Essentials.

---

## 🚀 Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Framework   | Next.js 15 (App Router)                  |
| UI          | React 19 + TailwindCSS + Framer Motion   |
| Components  | Shadcn UI + Radix UI                     |
| State       | Zustand (cart, wishlist)                 |
| Data        | TanStack React Query + Axios             |
| Database    | MongoDB + Mongoose                       |
| Auth        | Auth.js v5 (Credentials + Google OAuth) |
| Images      | Cloudinary + next/image                  |
| Payments    | Paystack + Flutterwave                   |
| Email       | Resend                                   |
| Deployment  | Vercel                                   |

---

## 📁 Project Structure

```
mercy-hub/
├── app/
│   ├── (pages)/
│   │   ├── page.tsx              ← Homepage
│   │   ├── shop/                 ← Product catalog
│   │   ├── product/[slug]/       ← Product detail
│   │   ├── cart/                 ← Cart page
│   │   ├── checkout/             ← Checkout + payment
│   │   ├── auth/                 ← Login / Register
│   │   ├── dashboard/            ← User account
│   │   ├── admin/                ← Admin panel
│   │   ├── about/                ← About page
│   │   └── contact/              ← Contact page
│   └── api/
│       ├── products/             ← Product CRUD
│       ├── orders/               ← Order management
│       ├── auth/                 ← NextAuth + register
│       ├── coupons/              ← Coupon validation
│       └── upload/               ← Cloudinary uploads
├── components/
│   ├── layout/                   ← Navbar, Footer, Providers
│   ├── home/                     ← Hero, Categories, Testimonials
│   ├── product/                  ← ProductCard, Skeleton
│   └── cart/                     ← CartDrawer
├── hooks/
│   ├── useCart.ts                ← Zustand cart store
│   └── useWishlist.ts            ← Zustand wishlist store
├── lib/
│   ├── db.ts                     ← MongoDB connection
│   ├── models.ts                 ← All Mongoose models
│   └── auth.ts                   ← Auth.js configuration
├── types/
│   └── index.ts                  ← All TypeScript types
├── utils/
│   └── index.ts                  ← Helpers, formatters
└── scripts/
    └── seed.ts                   ← Database seed script
```

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-org/mercy-hub.git
cd mercy-hub
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
# Fill in all values in .env.local
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 5 categories (Bedding, Kitchenware, Home Decor, Bath & Body, Lighting)
- 8 sample products with variants and attributes
- 3 coupons: `WELCOME10`, `FLAT2000`, `FREESHIP`
- Admin user: `admin@mercyhomeessentials.com` / `Admin@123456`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 💳 Payment Integration

### Paystack
1. Create account at [paystack.com](https://paystack.com)
2. Get test keys from Settings → API Keys
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
   PAYSTACK_SECRET_KEY=sk_test_xxx
   ```

### Flutterwave
1. Create account at [flutterwave.com](https://flutterwave.com)
2. Get test keys from Dashboard
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
   ```

---

## 🖼️ Image Management (Cloudinary)

1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Create an upload preset (Settings → Upload → Upload presets)
3. Set `Signing Mode` to `Unsigned` for client uploads
4. Add credentials to `.env.local`

---

## 🔐 Auth Setup

### Google OAuth (optional)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/api/auth/callback/google` as redirect URI
4. Add to `.env.local`

---

## 🚢 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all `.env.local` values to your Vercel project settings under Environment Variables.

---

## 🧪 Test Credentials

| Role  | Email                              | Password     |
|-------|------------------------------------|--------------|
| Admin | admin@mercyhomeessentials.com      | Admin@123456 |

### Test Payment Cards (Paystack)
- **Visa**: 4084 0840 8408 4081 — Exp: any — CVV: any
- **Mastercard**: 5060 6666 6666 6666 66 — PIN: 1234

### Test Coupons
| Code       | Type         | Value    | Min Order |
|------------|--------------|----------|-----------|
| WELCOME10  | 10% off      | 10%      | ₦5,000    |
| FLAT2000   | Fixed        | ₦2,000   | ₦20,000   |
| FREESHIP   | Free shipping| —        | None      |

---

## 📊 Admin Panel

Visit `/admin` (admin login required):
- **Products**: Create, edit, delete, toggle visibility
- **Orders**: View all orders, update status + tracking
- **Analytics**: Revenue chart, key metrics
- **Coupons**: Create discount codes
- **Banners**: Manage hero and promo banners

---

## 🗺️ Roadmap

- [ ] Email notifications (order confirmation, shipping)
- [ ] Product reviews & ratings UI
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] SMS notifications via Termii
- [ ] Mobile app (React Native)
- [ ] Inventory alerts & low-stock notifications
- [ ] Abandoned cart recovery emails

---

## 📄 License

MIT © 2025 Mercy Home Essentials
