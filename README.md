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
 
