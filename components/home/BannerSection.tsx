"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, Quote } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

// ─── Banner Section ──────────────────────────────────────────
export function BannerSection() {
  return (
    <section className="py-20 bg-cream">
      <div className="container-site">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Large banner */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden h-80 lg:h-auto lg:min-h-[480px] bg-neutral-800"
          >
            <Image
              src="https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80"
              alt="Premium Bedding"
              fill
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ebony/80 to-transparent flex items-center">
              <div className="p-10">
                <span className="text-xs tracking-[0.25em] uppercase text-brand-300 font-medium block mb-3">
                  Limited Offer
                </span>
                <h3 className="font-display text-4xl font-semibold text-white mb-3 leading-tight">
                  Up to 40%<br />Off Bedding
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-xs">
                  Transform your bedroom into a sanctuary with our premium Egyptian cotton collection.
                </p>
                <Link href="/shop?category=bedding&filter=sale" className="btn-primary">
                  Shop Sale <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Two small banners */}
          <div className="flex flex-col gap-6">
            {[
              {
                title: "Kitchen Essentials",
                subtitle: "New Arrivals",
                image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
                href: "/shop?category=kitchenware&filter=new",
              },
              {
                title: "Bath & Wellness",
                subtitle: "Luxury Self-Care",
                image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
                href: "/shop?category=bath-body",
              },
            ].map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl overflow-hidden h-[190px] bg-neutral-800 group"
              >
                <Image src={b.image} alt={b.title} fill className="object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                  <div className="p-8">
                    <p className="text-xs tracking-[0.2em] uppercase text-brand-300 mb-1">{b.subtitle}</p>
                    <h4 className="font-display text-2xl text-white font-semibold mb-3">{b.title}</h4>
                    <Link href={b.href} className="text-white/70 text-sm hover:text-brand-300 flex items-center gap-1 transition-colors">
                      Shop Now <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Best Sellers (client placeholder — real data via API) ───
export function BestSellers() {
  // In production this calls /api/products?filter=bestseller
  // For now, renders with mock UI — replace with real data via useQuery
  return (
    <section className="py-20 bg-neutral-950">
      <div className="container-site">
        <div className="text-center mb-12">
          <span className="text-xs tracking-[0.2em] uppercase text-brand-400 font-medium block mb-3">
            Customer Favourites
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white mb-4">
            Best Sellers
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            The products our customers love most — tried, tested, and trusted.
          </p>
        </div>
        <div className="text-center">
          <Link href="/shop?filter=bestseller" className="btn-primary">
            View Best Sellers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────
const testimonials = [
  {
    name: "Adaeze Okonkwo",
    location: "Lagos, Nigeria",
    rating: 5,
    text: "The bedding set I ordered is absolutely divine. The quality surpassed my expectations — soft, breathable, and the perfect weight. My sleep has genuinely improved.",
    product: "Premium Cotton Duvet Set",
  },
  {
    name: "Chidi Nwosu",
    location: "Abuja, Nigeria",
    rating: 5,
    text: "Fast delivery, beautiful packaging, and the products are exactly as described. Mercy Home has become my go-to for home essentials. Highly recommend!",
    product: "Kitchen Essentials Bundle",
  },
  {
    name: "Fatima Al-Hassan",
    location: "Kano, Nigeria",
    rating: 5,
    text: "I love how every piece feels intentionally curated. The quality is premium without being out of reach. My home has genuinely transformed.",
    product: "Home Decor Collection",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-site">
        <div className="text-center mb-12">
          <span className="section-tag">Reviews</span>
          <h2 className="section-heading mb-3">What Our Customers Say</h2>
          <p className="section-subheading mx-auto text-center">
            Real experiences from real people who love their Mercy Home products.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-cream rounded-2xl p-8 relative"
            >
              <Quote className="absolute top-6 right-8 w-8 h-8 text-brand-100" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-brand-500 fill-brand-500" />
                ))}
              </div>
              <p className="text-neutral-700 leading-relaxed mb-6 text-sm">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="border-t border-neutral-200 pt-4">
                <p className="font-semibold text-neutral-900 text-sm">{t.name}</p>
                <p className="text-xs text-neutral-400">{t.location}</p>
                <p className="text-xs text-brand-600 mt-1 font-medium">Purchased: {t.product}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter ──────────────────────────────────────────────
export function NewsletterSection() {
  return (
    <section className="py-20 bg-brand-600">
      <div className="container-site">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs tracking-[0.25em] uppercase text-brand-200 font-medium block mb-3">
            Stay Connected
          </span>
          <h2 className="font-display text-4xl font-semibold text-white mb-4">
            Get 10% Off Your First Order
          </h2>
          <p className="text-brand-100 mb-8">
            Subscribe to our newsletter for exclusive deals, new arrivals, and home styling tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 rounded-sm bg-white/15 border border-white/30 px-5 py-3.5 text-white placeholder-white/50 outline-none focus:border-white transition-colors"
            />
            <button type="submit" className="bg-white text-brand-700 font-medium px-6 py-3.5 rounded-sm hover:bg-brand-50 transition-colors flex-shrink-0">
              Subscribe
            </button>
          </form>
          <p className="text-xs text-brand-200 mt-4">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
