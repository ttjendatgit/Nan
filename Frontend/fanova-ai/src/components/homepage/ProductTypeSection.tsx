"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetaLine from "@/components/ui/MetaLine";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { collections } from "@/data/homepageData";
import { getCategories } from "@/lib/api/categories";
import type { ProductCategory } from "@/types/catalog";

export default function ProductTypeSection() {
  const reduce = useReducedMotion();
  const [categories, setCategories] = useState<ProductCategory[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories({ pageSize: 8, activeOnly: true })
      .then((res) => {
        setCategories(res.items.length > 0 ? res.items : null);
      })
      .catch(() => setCategories(null))
      .finally(() => setLoading(false));
  }, []);

  const showRealData = !loading && categories !== null && categories.length > 0;
  const showFallback = !loading && !showRealData;

  return (
    <Section tone="paper" id="products">

      {/* Section header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="mb-14"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            tone="paper"
            className="lg:max-w-xl"
            titleClassName="leading-tight tracking-tight"
            title={
              <>
                Chọn quạt theo{" "}
                <span className="text-navy">nhu cầu của bạn.</span>
              </>
            }
          />

          <div className="lg:max-w-sm">
            <p className="text-[0.9375rem] leading-7 text-ink-muted">
              Mỗi giải pháp được thiết kế riêng cho một ngữ cảnh cụ thể: từ sự kiện đến thương hiệu, từ số lượng nhỏ đến đại trà.
            </p>
            <div className="mt-5">
              <Link href="/products">
                <Button tone="paper" variant="secondary">
                  Xem tất cả
                  <ArrowRight className="ml-2" size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Rule tone="paper" className="mt-10" />
      </motion.div>

      {/* Loading skeleton */}
      {loading && <SkeletonGrid />}

      {/* Real API category cards */}
      {showRealData && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories!.map((cat, index) => (
            <CategoryCard key={cat.id} category={cat} index={index} />
          ))}
        </div>
      )}

      {/* Fallback static collection cards */}
      {showFallback && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((item, index) => (
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.07 }}
            >
              <Card tone="paper" as="article" className="group flex h-full flex-col overflow-hidden">
                <div className="relative flex h-52 items-center justify-center overflow-hidden bg-paper-deep">
                  <FanMockupFallback />
                </div>

                <div className="flex flex-1 flex-col border-t border-line-on-paper p-6">
                  <h3 className="font-serif text-xl font-semibold">{item.name}</h3>
                  {/* Former image-corner chip, now a meta line under the name (DECISIONS.md) */}
                  <MetaLine tone="paper" items={[item.badge]} className="mt-1 text-sm" />
                  <p className="mt-3 text-sm leading-6 text-ink-muted">{item.description}</p>
                  <Link href="/products">
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-navy transition-all duration-200 group-hover:gap-2.5">
                      {item.cta}
                      <ArrowRight size={12} />
                    </span>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

    </Section>
  );
}

// ─── Category card (real API data) ───────────────────────────────────────────

function CategoryCard({
  category,
  index,
}: {
  category: ProductCategory;
  index: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay: index * 0.07 }}
    >
      <Link href={`/products?categoryId=${category.id}`} className="group block h-full rounded-lg">
        {/* A real link, so it keeps a hover state: a navy edge, never a shadow or glow */}
        <Card
          tone="paper"
          className="flex h-full flex-col overflow-hidden transition-colors duration-300 group-hover:border-navy/45"
        >
          {/* Visual area */}
          <div className="relative h-52 overflow-hidden bg-paper-deep">
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <FanMockupFallback />
            )}
          </div>

          {/* Card content */}
          <div className="flex flex-1 flex-col border-t border-line-on-paper p-6">
            <h3 className="font-serif text-xl font-semibold">{category.name}</h3>
            {category.description ? (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-muted">
                {category.description}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Khám phá bộ sưu tập quạt giấy theo nhu cầu của bạn.
              </p>
            )}
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-navy transition-all duration-200 group-hover:gap-2.5">
              Khám phá
              <ArrowRight size={12} />
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ─── Fan mockup fallback (shown when a category/collection has no image) ─────
// A product illustration, not UI chrome: its own shading stays as drawn.

function FanMockupFallback() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-paper shadow-[0_6px_28px_rgba(15,19,32,0.10)]">
      <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.7),rgba(169,171,165,0.2)_100%)]" />
      <div className="absolute h-[80%] w-px bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px rotate-30 bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px -rotate-30 bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px rotate-60 bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px -rotate-60 bg-[rgba(15,19,32,0.18)]" />
      <div className="relative z-10 h-12 w-12 rounded-full bg-navy/20 shadow-md" />
      <div className="absolute -bottom-11 left-1/2 h-16 w-4 -translate-x-1/2 rounded-full bg-[#A9ABA5] shadow-md" />
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} tone="paper" className="animate-pulse overflow-hidden">
          <div className="h-52 bg-paper-deep" />
          <div className="space-y-3 border-t border-line-on-paper p-6">
            <div className="h-5 w-2/3 rounded bg-paper-deep" />
            <div className="h-4 w-full rounded bg-paper-deep" />
            <div className="h-4 w-4/5 rounded bg-paper-deep" />
          </div>
        </Card>
      ))}
    </div>
  );
}
