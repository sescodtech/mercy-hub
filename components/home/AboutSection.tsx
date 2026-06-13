import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  title?: string;
  text?: string;
  image?: string;
}

export function AboutSection({ title, text, image }: Props) {
  if (!title && !text) return null;

  return (
    <section className="py-16 sm:py-20" style={{ backgroundColor: "var(--color-card-bg)" }}>
      <div className="container-site">
        <div className={`grid ${image ? "lg:grid-cols-2" : "max-w-3xl mx-auto"} gap-12 lg:gap-16 items-center`}>
          <div className="space-y-6">
            <p className="section-subheading">Our Story</p>
            {title && <h2 className="section-heading">{title}</h2>}
            {text && (
              <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {text}
              </p>
            )}
            <Link href="/about" className="btn-secondary inline-flex gap-2">
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {image && (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={image}
                alt={title ?? "About us"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
