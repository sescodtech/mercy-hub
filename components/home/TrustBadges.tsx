import * as LucideIcons from "lucide-react";

interface Badge {
  _id?: string;
  icon: string;
  title: string;
  text: string;
  active: boolean;
}

interface Props {
  badges?: Badge[];
}

const FALLBACK_BADGES: Badge[] = [
  { icon: "Truck",       title: "Free Delivery",  text: "On orders over ₦100,000",   active: true },
  { icon: "ShieldCheck", title: "Secure Payment", text: "100% protected payments",   active: true },
  { icon: "Headphones",  title: "24/7 Support",   text: "Dedicated support team",    active: true },
];

export function TrustBadges({ badges = [] }: Props) {
  const active = (badges.length > 0 ? badges : FALLBACK_BADGES).filter((b) => b.active);
  if (active.length === 0) return null;

  return (
    <section
      className="border-y"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card-bg)" }}
    >
      <div className="container-site px-4 sm:px-6">
        {/*
         * Grid layout:
         * - 1 col on mobile (stacked, full-width cards)
         * - 2 cols on sm (360–767px)
         * - auto-fit up to 4 cols on md+ based on badge count
         */}
        {/* Responsive grid: 1 col mobile → 2 cols sm → auto-fit on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 divide-y sm:divide-y-0 divide-neutral-100">
          {active.map((badge, i) => {
            const Icon = (LucideIcons as any)[badge.icon] ?? LucideIcons.Star;
            return (
              <div
                key={badge._id ?? i}
                className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 trust-badge"
              >
                {/* Icon bubble */}
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-brand-primary) 12%, transparent)",
                  }}
                >
                  <Icon
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    style={{ color: "var(--color-brand-primary)" }}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {badge.title}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {badge.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
