import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Heart, Leaf, Shield } from "lucide-react";

export const metadata: Metadata = { title: "About Us" };

const VALUES = [
  { icon: Award,  title: "Premium Quality",  desc: "Every product is curated for quality, durability, and beauty. We never compromise on what goes into your home." },
  { icon: Heart,  title: "Customer First",   desc: "From fast shipping to easy returns, we put your satisfaction at the center of everything we do." },
  { icon: Leaf,   title: "Sustainability",   desc: "We source from responsible suppliers and are working toward a fully sustainable product range." },
  { icon: Shield, title: "Trust & Safety",   desc: "Secure payments, verified reviews, and transparent policies — because trust is everything." },
];

export default function AboutPage() {
  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80"
          alt="About Mercy Home"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative h-full container-site flex items-center">
          <div className="max-w-xl text-white">
            <span className="text-xs tracking-[0.25em] uppercase text-brand-300 font-medium block mb-4">Our Story</span>
            <h1 className="font-display text-5xl font-semibold leading-tight mb-4">
              Built on a Love for Beautiful Living
            </h1>
            <p className="text-white/70 text-base">
              Mercy Home Essentials was founded with a simple belief: every home deserves to feel like a sanctuary.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container-site">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-tag">The Beginning</span>
              <h2 className="section-heading mb-5">From a Simple Vision to a Growing Brand</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  Mercy Home Essentials started in 2019 in a small apartment in Lagos, Nigeria. Our founder, Ayoola Anuoluwapo Deborah, was frustrated by the lack of affordable, high-quality home goods in the Nigerian market — so she decided to build the solution herself.
                </p>
                <p>
                  What started as a passion project has grown into a brand trusted by thousands of Nigerian households. We curate premium bedding, kitchenware, decor, and bath essentials — all carefully chosen to bring beauty and function to everyday living.
                </p>
                <p>
                  Currently, we only provide shipping within Nigeria. However, global expansion is a key part of our growth plan. We look forward to offering international shipping options soon.
                </p>
              </div>
              <Link href="/shop" className="btn-primary mt-8 inline-flex">
                Shop Our Collection <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
                  alt="Our Products"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-5 shadow-luxury">
                <p className="font-display text-3xl font-semibold text-neutral-900">5,000+</p>
                <p className="text-sm text-neutral-400">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="container-site">
          <div className="text-center mb-12">
            <span className="section-tag">What Drives Us</span>
            <h2 className="section-heading">Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-ebony text-cream">
        <div className="container-site">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { label: "Customers Served", value: "5,000+" },
              { label: "Products",          value: "200+" },
              { label: "Years in Business", value: "5+" },
              { label: "Cities Delivered",  value: "36" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-display text-4xl font-semibold text-white mb-1">{value}</p>
                <p className="text-cream/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-site text-center">
          <h2 className="section-heading mb-4">Ready to Transform Your Home?</h2>
          <p className="section-subheading mx-auto mb-8">
            Browse our curated collection and find pieces that bring joy to your everyday life.
          </p>
          <Link href="/shop" className="btn-primary">
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
