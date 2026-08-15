"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { collections } from "@/data/homepageData";
import { getCategories } from "@/lib/api/categories";
import type { ProductCategory } from "@/types/catalog";
import EditorialGrid from "./EditorialGrid";

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
    <section
      id="products"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F1F0EA" }}
    >
      <EditorialGrid />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#0F1320] md:text-5xl lg:max-w-xl">
              Chọn quạt theo{" "}
              <span className="text-[#192B88]">nhu cầu của bạn.</span>
            </h2>

            <div className="lg:max-w-sm">
              <p className="text-[0.9375rem] leading-7 text-[rgba(15,19,32,0.62)]">
                Mỗi giải pháp được thiết kế riêng cho một ngữ cảnh cụ thể: từ sự kiện đến thương hiệu, từ số lượng nhỏ đến đại trà.
              </p>
              <div className="mt-5">
                <Link href="/products">
                  <Button variant="secondary">
                    Xem tất cả
                    <ArrowRight className="ml-2" size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 h-px bg-[rgba(15,19,32,0.12)]" />
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
                className="group relative flex flex-col overflow-hidden rounded-lg border border-[rgba(15,19,32,0.12)] bg-[#F1F0EA] transition-colors duration-300 hover:border-[#192B88]/45"
              >
                <div className="relative flex h-52 items-center justify-center overflow-hidden bg-[#E7E4D8]">
                  <FanMockupFallback />
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(15,19,32,0.14)] bg-[#F1F0EA]/92 px-3 py-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#192B88]">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col border-t border-[rgba(15,19,32,0.10)] p-6">
                  <h3 className="font-serif text-xl font-semibold text-[#0F1320]">{item.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[rgba(15,19,32,0.62)]">{item.description}</p>
                  <Link href="/products">
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#192B88] transition-all duration-200 group-hover:gap-2.5">
                      {item.cta}
                      <ArrowRight size={12} />
                    </span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
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
      <Link
        href={`/products?categoryId=${category.id}`}
        className="group relative flex flex-col overflow-hidden rounded-lg border border-[rgba(15,19,32,0.12)] bg-[#F1F0EA] transition-colors duration-300 hover:border-[#192B88]/45"
      >
        {/* Visual area */}
        <div className="relative h-52 overflow-hidden bg-[#E7E4D8]">
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
        <div className="flex flex-1 flex-col border-t border-[rgba(15,19,32,0.10)] p-6">
          <h3 className="font-serif text-xl font-semibold text-[#0F1320]">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[rgba(15,19,32,0.62)]">
              {category.description}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgba(15,19,32,0.62)]">
              Khám phá bộ sưu tập quạt giấy theo nhu cầu của bạn.
            </p>
          )}
          <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#192B88] transition-all duration-200 group-hover:gap-2.5">
            Khám phá
            <ArrowRight size={12} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Fan mockup fallback (shown when a category/collection has no image) ─────

function FanMockupFallback() {
  return (
    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[#F1F0EA] shadow-[0_6px_28px_rgba(15,19,32,0.10)]">
      <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.7),rgba(169,171,165,0.2)_100%)]" />
      <div className="absolute h-[80%] w-px bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px rotate-30 bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px -rotate-30 bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px rotate-60 bg-[rgba(15,19,32,0.18)]" />
      <div className="absolute h-[80%] w-px -rotate-60 bg-[rgba(15,19,32,0.18)]" />
      <div className="relative z-10 h-12 w-12 rounded-full bg-[#192B88]/20 shadow-md" />
      <div className="absolute -bottom-11 left-1/2 h-16 w-4 -translate-x-1/2 rounded-full bg-[#A9ABA5] shadow-md" />
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-[rgba(15,19,32,0.10)] bg-[#F1F0EA]"
        >
          <div className="h-52 bg-[#E7E4D8]" />
          <div className="space-y-3 border-t border-[rgba(15,19,32,0.10)] p-6">
            <div className="h-5 w-2/3 rounded bg-[#E7E4D8]" />
            <div className="h-4 w-full rounded bg-[#E7E4D8]" />
            <div className="h-4 w-4/5 rounded bg-[#E7E4D8]" />
          </div>
        </div>
      ))}
    </div>
  );
}
