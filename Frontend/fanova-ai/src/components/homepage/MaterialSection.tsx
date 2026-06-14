"use client";

// CMS: materials array (including image slots) is sourced from the central data file.
// Future: when item.image.src is non-empty (set by admin upload), render the
// actual material texture photo inside the card visual area over the gradient.

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { materials } from "@/data/homepageData";

export default function MaterialSection() {
  return (
    <section
      id="materials"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#EEF5FC" }}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-dots opacity-55" />

      {/* Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#DCEAF7]/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[rgba(8,51,125,0.06)] blur-3xl" />

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
            03 / Chất liệu
          </p>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#081426] md:text-5xl lg:max-w-md">
              Cảm giác cao cấp{" "}
              <span className="text-[#08337D]">bắt đầu từ chất liệu.</span>
            </h2>
            <p className="max-w-sm text-[0.9375rem] leading-7 text-[#4A74A7]">
              Một chiếc quạt đẹp không chỉ nằm ở thiết kế. Chất liệu, bề mặt
              hoàn thiện và hiệu ứng sau in quyết định cảm giác thật khi cầm trên tay.
            </p>
          </div>

          <div className="mt-10 h-px bg-gradient-to-r from-[rgba(8,51,125,0.14)] via-[rgba(8,51,125,0.08)] to-transparent" />
        </motion.div>

        {/* Material cards — CMS: sourced from materials[] */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.10)] bg-[#FFFFFF] shadow-[0_2px_14px_rgba(8,51,125,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(8,51,125,0.22)] hover:shadow-[0_12px_44px_rgba(8,51,125,0.13)]"
            >
              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.28)] to-transparent" />

              {/* Visual area */}
              <div className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${item.gradient}`}>
                {/*
                  CMS: when item.image.src is set, render the texture photo:
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                  />
                */}

                {/* Dot texture overlay (shown while no photo is uploaded) */}
                <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(8,51,125,0.07)_0.7px,transparent_0.7px)] [background-size:9px_9px]" />

                {/* Shine sweep on hover */}
                <div className="absolute -left-10 top-0 h-full w-20 rotate-12 bg-white/25 blur-xl transition-all duration-700 group-hover:left-full" />

                {/* Material sample card — fallback visual until CMS image is uploaded */}
                <div className="relative h-28 w-44 -rotate-6 rounded-2xl border border-[rgba(8,51,125,0.09)] bg-[#FFFFFF]/85 p-3 shadow-[0_4px_20px_rgba(8,51,125,0.08)] backdrop-blur transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-[1.02]">
                  <div className="h-full rounded-xl border border-[rgba(8,51,125,0.06)] bg-[radial-gradient(circle_at_30%_25%,rgba(74,116,167,0.12),rgba(240,246,252,0.7)_100%)]" />
                </div>

                {/* Quality badge — CMS: item.tag */}
                <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[rgba(8,51,125,0.14)] bg-[#FFFFFF]/92 px-2.5 py-1 backdrop-blur">
                  <Sparkles size={9} className="text-[#08337D]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#08337D]">
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Text content — CMS: item.name / item.description */}
              <div className="p-6">
                <h3 className="font-serif text-xl font-semibold text-[#081426]">
                  {item.name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#4A74A7]">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Print quality callout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mt-10 overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.12)] bg-[#FFFFFF] shadow-[0_2px_24px_rgba(8,51,125,0.07)]"
        >
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.25)] to-transparent" />
          <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-[1fr_0.85fr] md:items-center md:p-10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#08337D]">
                Print-ready quality
              </p>
              <h3 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-[#081426] md:text-4xl">
                Thiết kế đẹp trên màn hình. Chuẩn khi in thật.
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#4A74A7]">
                File thiết kế được kiểm tra kích thước, độ phân giải, vùng an toàn, bleed
                và màu sắc trước khi chuyển sang sản xuất.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "File check",  sub: "Kiểm tra trước in" },
                { label: "Color care",  sub: "Tối ưu màu sắc" },
                { label: "Safe margin", sub: "Canh vùng an toàn" },
                { label: "Production",  sub: "Sẵn sàng sản xuất" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-[rgba(8,51,125,0.10)] bg-[#EEF5FC] p-4 transition hover:border-[rgba(8,51,125,0.22)]"
                >
                  <p className="text-sm font-semibold text-[#081426]">{card.label}</p>
                  <p className="mt-1 text-xs text-[#4A74A7]">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
