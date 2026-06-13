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
  { icon: "Truck",       title: "Free Delivery",   text: "On orders over ₦50,000", active: true },
  { icon: "ShieldCheck", title: "Secure Payment",  text: "100% protected payments", active: true },
  { icon: "RotateCcw",   title: "Easy Returns",    text: "30-day return policy", active: true },
  { icon: "Headphones",  title: "24/7 Support",    text: "Dedicated support team", active: true },
];

export function TrustBadges({ badges = [] }: Props) {
  const active = (badges.length > 0 ? badges : FALLBACK_BADGES).filter((b) => b.active);
  if (active.length === 0) return null;

  return (
    <section
      className="border-y"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card-bg)" }}
    >
      <div className="container-site">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(active.length, 4)}, 1fr)`,
          }}
        >
          {active.map((badge, i) => {
            const Icon = (LucideIcons as any)[badge.icon] ?? LucideIcons.Star;
            return (
              <div
                key={badge._id ?? i}
                className="flex items-center gap-4 px-6 py-5 trust-badge"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 12%, transparent)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--color-brand-primary)" }} />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {badge.title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
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
