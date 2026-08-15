"use client";

// CMS: materials array (including image slots) is sourced from the central data file.
// Future: when item.image.src is non-empty (set by admin upload), render the
// actual material texture photo inside the card visual area over the neutral fallback.

import { motion } from "motion/react";
import { materials } from "@/data/homepageData";
import EditorialGrid from "./EditorialGrid";

const PRINT_QUALITY_STEPS = [
  { n: "01", label: "File check", sub: "Kiểm tra trước in" },
  { n: "02", label: "Color care", sub: "Tối ưu màu sắc" },
  { n: "03", label: "Safe margin", sub: "Canh vùng an toàn" },
  { n: "04", label: "Production", sub: "Sẵn sàng sản xuất" },
];

export default function MaterialSection() {
  return (
    <section
      id="materials"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F1F0EA" }}
    >
      <EditorialGrid />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#0F1320] md:text-5xl lg:max-w-md">
              Cảm giác cao cấp{" "}
              <span className="text-[#192B88]">bắt đầu từ chất liệu.</span>
            </h2>
            <p className="max-w-sm text-[0.9375rem] leading-7 text-[rgba(15,19,32,0.62)]">
              Một chiếc quạt đẹp không chỉ nằm ở thiết kế. Chất liệu, bề mặt
              hoàn thiện và hiệu ứng sau in quyết định cảm giác thật khi cầm trên tay.
            </p>
          </div>

          <div className="mt-10 h-px bg-[rgba(15,19,32,0.12)]" />
        </motion.div>

        {/* Material tiles — large tactile surface, clean name, short detail.
            CMS: sourced from materials[] */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.06 }}
              className="group relative overflow-hidden rounded-lg border border-[rgba(15,19,32,0.12)] bg-[#FBFAF6] transition-colors duration-300 hover:border-[#192B88]/40"
            >
              {/* Visual area — large material surface */}
              <div className="relative h-64 overflow-hidden bg-[#E7E4D8]">
                {/*
                  CMS: when item.image.src is set, render the macro texture photo:
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                */}
                <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(rgba(15,19,32,0.09)_0.7px,transparent_0.7px)] [background-size:9px_9px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(15,19,32,0.06)]" />
              </div>

              {/* Text content — CMS: item.name / item.description / item.tag */}
              <div className="border-t border-[rgba(15,19,32,0.10)] p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-xl font-semibold text-[#0F1320]">
                    {item.name}
                  </h3>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-[#192B88]/70">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[rgba(15,19,32,0.62)]">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Print quality — structured numbered grid, not nested cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mt-16 border-t border-[rgba(15,19,32,0.14)] pt-14"
        >
          <div className="max-w-2xl">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#0F1320] md:text-4xl">
              Thiết kế đẹp trên màn hình. Chuẩn khi in thật.
            </h3>
            <p className="mt-4 text-sm leading-7 text-[rgba(15,19,32,0.62)]">
              File thiết kế được kiểm tra kích thước, độ phân giải, vùng an toàn, bleed
              và màu sắc trước khi chuyển sang sản xuất.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 border-t border-[rgba(15,19,32,0.14)] sm:grid-cols-2">
            {PRINT_QUALITY_STEPS.map((step, i) => (
              <div
                key={step.label}
                className={`flex items-baseline gap-4 border-b border-[rgba(15,19,32,0.14)] py-6 ${
                  i % 2 === 0 ? "sm:border-r sm:border-[rgba(15,19,32,0.14)] sm:pr-8" : "sm:pl-8"
                }`}
              >
                <span className="font-mono text-sm font-semibold text-[#192B88]/70">{step.n}</span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.06em] text-[#0F1320]">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-[rgba(15,19,32,0.55)]">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
