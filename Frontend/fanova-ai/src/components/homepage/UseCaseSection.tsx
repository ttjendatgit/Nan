"use client";

// CMS: comparisonRows, CellValue, and ComparisonRow types are sourced from
// the central data file. Admin can add/remove rows or change true/partial/false
// values via admin/comparison without touching component code.

import { motion } from "motion/react";
import { Check, X, Minus } from "lucide-react";
import Button from "@/components/ui/Button";
import { comparisonRows, type CellValue } from "@/data/homepageData";

function Cell({ value }: { value: CellValue }) {
  if (value === true)
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(220,234,247,0.15)] text-[#DCEAF7]">
        <Check size={14} strokeWidth={2.5} />
      </span>
    );
  if (value === "partial")
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,255,255,0.07)] text-[rgba(220,234,247,0.40)]">
        <Minus size={14} strokeWidth={2} />
      </span>
    );
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-[rgba(220,234,247,0.22)]">
      <X size={13} strokeWidth={2} />
    </span>
  );
}

export default function UseCaseSection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "linear-gradient(180deg, #081426 0%, #0A1B38 100%)" }}
    >
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#08337D]/15 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#114F99]/10 blur-[60px]" />

      <div className="relative mx-auto max-w-5xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14 text-center"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(220,234,247,0.45)]">
            05 / So sánh
          </p>
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#FFFFFF] md:text-5xl">
            Tự thiết kế hay{" "}
            <span className="text-[#DCEAF7]">đặt in truyền thống?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[0.9375rem] leading-7 text-[rgba(220,234,247,0.50)]">
            Nan được xây dựng để loại bỏ những điểm bất tiện của quy trình đặt in truyền thống
            và trao quyền kiểm soát lại cho bạn.
          </p>
        </motion.div>

        {/* Comparison table — CMS: rows sourced from comparisonRows[] */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl border border-[rgba(220,234,247,0.10)]"
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_120px_120px] gap-0 border-b border-[rgba(220,234,247,0.10)]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="px-7 py-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(220,234,247,0.35)]">
                Tính năng
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-[rgba(220,234,247,0.08)] px-4 py-5">
              <span className="font-serif text-base font-semibold text-[#FFFFFF]">Nan</span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[rgba(220,234,247,0.40)]">
                AI Platform
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-l border-[rgba(220,234,247,0.08)] px-4 py-5">
              <span className="font-serif text-base font-semibold text-[rgba(220,234,247,0.55)]">Truyền thống</span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[rgba(220,234,247,0.28)]">
                Print shop
              </span>
            </div>
          </div>

          {/* Data rows */}
          {comparisonRows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_120px_120px] gap-0 border-b border-[rgba(220,234,247,0.06)] transition-colors hover:bg-[rgba(255,255,255,0.025)] ${
                index === comparisonRows.length - 1 ? "border-b-0" : ""
              }`}
            >
              <div className="px-7 py-5">
                <span className="text-sm text-[rgba(220,234,247,0.70)]">{row.feature}</span>
              </div>
              <div className="flex items-center justify-center border-l border-[rgba(220,234,247,0.06)] px-4 py-5">
                <Cell value={row.nan} />
              </div>
              <div className="flex items-center justify-center border-l border-[rgba(220,234,247,0.06)] px-4 py-5">
                <Cell value={row.trad} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Legend + CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-5">
            {[
              { icon: <Check size={11} />, label: "Có" },
              { icon: <Minus size={11} />, label: "Một phần" },
              { icon: <X size={11} />, label: "Không có" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[rgba(220,234,247,0.45)]">{icon}</span>
                <span className="font-mono text-[10px] text-[rgba(220,234,247,0.38)]">{label}</span>
              </div>
            ))}
          </div>
          <Button className="bg-[#FFFFFF] text-[#08337D] hover:bg-[#DCEAF7] shadow-lg shadow-black/20">
            Thử Nan miễn phí
          </Button>
        </motion.div>

      </div>
    </section>
  );
}
