"use client";

// CMS: collections array is sourced from the central data file.
// Future: replace the static import with an API fetch so admin can add,
// remove, or reorder collection cards from the dashboard without redeploying.
// Each collection.image slot is ready to receive a CDN URL from the media manager.

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { collections } from "@/data/homepageData";

export default function ProductTypeSection() {
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
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#08337D]">
            01 / Bộ sưu tập
          </p>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#081426] md:text-5xl lg:max-w-xl">
              Chọn quạt theo{" "}
              <span className="text-[#08337D]">nhu cầu của bạn.</span>
            </h2>

            <div className="lg:max-w-sm">
              <p className="text-[0.9375rem] leading-7 text-[#4A74A7]">
                Mỗi giải pháp được thiết kế riêng cho một ngữ cảnh cụ thể — từ sự kiện đến thương hiệu, từ số lượng nhỏ đến đại trà.
              </p>
              <div className="mt-5">
                <Button variant="secondary" className="border-[rgba(8,51,125,0.22)] bg-white hover:bg-[#DCEAF7]">
                  Xem tất cả
                  <ArrowRight className="ml-2" size={14} />
                </Button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 h-px bg-gradient-to-r from-[rgba(8,51,125,0.14)] via-[rgba(8,51,125,0.08)] to-transparent" />
        </motion.div>

        {/* Solution grid — CMS: sourced from collections[] */}
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
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.22)] to-transparent" />

              {/* Visual area */}
              <div className={`relative flex h-52 items-center justify-center bg-gradient-to-br ${item.gradient} overflow-hidden`}>
                {/*
                  CMS: when item.image.src is set, replace the fan mockup below with:
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                */}

                {/* Dot texture (shown while no photo is uploaded) */}
                <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(8,51,125,0.06)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />

                {/* Fan mockup — fallback visual until CMS image is uploaded */}
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

                {/* Badge — CMS: item.badge */}
                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,51,125,0.13)] bg-white/90 px-3 py-1 backdrop-blur">
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#ECCA3E]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#08337D]">
                    {item.badge}
                  </span>
                </div>
              </div>

              {/* Card content — CMS: item.name / item.description / item.cta */}
              <div className="p-6">
                <h3 className="font-serif text-xl font-semibold text-[#081426]">
                  {item.name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#4A74A7]">
                  {item.description}
                </p>
                <button className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#08337D] transition-all duration-200 group-hover:gap-2.5">
                  {item.cta}
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
