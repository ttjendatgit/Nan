"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { collections } from "@/data/homepageData";
import { getCategories } from "@/lib/api/categories";
import type { ProductCategory } from "@/types/catalog";

// Nan palette gradient fallbacks for category cards without a Cloudinary image
const CARD_GRADIENTS = [
  "from-[#DCEAF7] to-[#F0F6FC]",
  "from-[#F5F2EA] to-[#FAFAF8]",
  "from-[#F0F6FC] to-[#DCEAF7]",
  "from-[#DCEAF7] to-[#F5F2EA]",
  "from-[#FAFAF8] to-[#DCEAF7]",
  "from-[#F5F2EA] to-[#F0F6FC]",
];

export default function ProductTypeSection() {
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
      style={{ background: "#F7FAFF" }}
    >
      {/* Grid dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-40" />

      {/* Subtle glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#DCEAF7]/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[rgba(8,51,125,0.04)] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#081426] md:text-5xl lg:max-w-xl">
              Chọn quạt theo{" "}
              <span className="text-[#08337D]">nhu cầu của bạn.</span>
            </h2>

            <div className="lg:max-w-sm">
              <p className="text-[0.9375rem] leading-7 text-[#4A74A7]">
                Mỗi giải pháp được thiết kế riêng cho một ngữ cảnh cụ thể: từ sự kiện đến thương hiệu, từ số lượng nhỏ đến đại trà.
              </p>
              <div className="mt-5">
                <Link href="/products">
                  <Button variant="secondary" className="border-[rgba(8,51,125,0.22)] bg-white hover:bg-[#DCEAF7]">
                    Xem tất cả
                    <ArrowRight className="ml-2" size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 h-px bg-gradient-to-r from-[rgba(8,51,125,0.14)] via-[rgba(8,51,125,0.08)] to-transparent" />
        </motion.div>

        {/* Loading skeleton */}
        {loading && <SkeletonGrid />}

        {/* Real API category cards */}
        {showRealData && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories!.map((cat, index) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={index}
                gradient={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
              />
            ))}
          </div>
        )}

        {/* Fallback static collection cards */}
        {showFallback && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: index * 0.07 }}
                className="group relative overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.10)] bg-white shadow-[0_2px_16px_rgba(8,51,125,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(8,51,125,0.22)] hover:shadow-[0_12px_44px_rgba(8,51,125,0.13)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.22)] to-transparent" />

                <div className={`relative flex h-52 items-center justify-center bg-gradient-to-br ${item.gradient} overflow-hidden`}>
                  <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(8,51,125,0.06)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-[0_6px_28px_rgba(8,51,125,0.10)]">
                    <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.96),rgba(220,234,247,0.5)_100%)]" />
                    <div className="absolute h-[80%] w-px bg-slate-200/60" />
                    <div className="absolute h-[80%] w-px rotate-30 bg-slate-200/60" />
                    <div className="absolute h-[80%] w-px -rotate-30 bg-slate-200/60" />
                    <div className="absolute h-[80%] w-px rotate-60 bg-slate-200/60" />
                    <div className="absolute h-[80%] w-px -rotate-60 bg-slate-200/60" />
                    <div className={`relative z-10 h-12 w-12 rounded-full ${item.accentColor} shadow-md`} />
                    <div className="absolute -bottom-11 left-1/2 h-16 w-4 -translate-x-1/2 rounded-full bg-slate-300 shadow-md" />
                  </div>
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,51,125,0.13)] bg-white/90 px-3 py-1 backdrop-blur">
                    <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#ECCA3E]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#08337D]">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-xl font-semibold text-[#081426]">{item.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#4A74A7]">{item.description}</p>
                  <Link href="/products">
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#08337D] transition-all duration-200 group-hover:gap-2.5">
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
  gradient,
}: {
  category: ProductCategory;
  index: number;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay: index * 0.07 }}
    >
      <Link
        href={`/products?categoryId=${category.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.10)] bg-white shadow-[0_2px_16px_rgba(8,51,125,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(8,51,125,0.22)] hover:shadow-[0_12px_44px_rgba(8,51,125,0.13)]"
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.22)] to-transparent" />

        {/* Visual area */}
        <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${gradient}`}>
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <>
              {/* Dot texture fallback */}
              <div className="absolute inset-0 flex items-center justify-center opacity-100">
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(8,51,125,0.06)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />
                {/* Fan mockup fallback */}
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-[0_6px_28px_rgba(8,51,125,0.10)]">
                  <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.96),rgba(220,234,247,0.5)_100%)]" />
                  <div className="absolute h-[80%] w-px bg-slate-200/60" />
                  <div className="absolute h-[80%] w-px rotate-30 bg-slate-200/60" />
                  <div className="absolute h-[80%] w-px -rotate-30 bg-slate-200/60" />
                  <div className="absolute h-[80%] w-px rotate-60 bg-slate-200/60" />
                  <div className="absolute h-[80%] w-px -rotate-60 bg-slate-200/60" />
                  <div className="relative z-10 h-12 w-12 rounded-full bg-[#DCEAF7] shadow-md" />
                  <div className="absolute -bottom-11 left-1/2 h-16 w-4 -translate-x-1/2 rounded-full bg-slate-300 shadow-md" />
                </div>
              </div>
            </>
          )}

          {/* Category badge */}
          <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,51,125,0.13)] bg-white/90 px-3 py-1 backdrop-blur">
            <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#ECCA3E]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#08337D]">
              Bộ sưu tập
            </span>
          </div>
        </div>

        {/* Card content */}
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-serif text-xl font-semibold text-[#081426]">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4A74A7]">
              {category.description}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[#4A74A7]">
              Khám phá bộ sưu tập quạt giấy theo nhu cầu của bạn.
            </p>
          )}
          <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#08337D] transition-all duration-200 group-hover:gap-2.5">
            Khám phá
            <ArrowRight size={12} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.08)] bg-white"
        >
          <div className="h-52 bg-[#DCEAF7]/40" />
          <div className="p-6 space-y-3">
            <div className="h-5 w-2/3 rounded bg-[#DCEAF7]/60" />
            <div className="h-4 w-full rounded bg-[#DCEAF7]/40" />
            <div className="h-4 w-4/5 rounded bg-[#DCEAF7]/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
