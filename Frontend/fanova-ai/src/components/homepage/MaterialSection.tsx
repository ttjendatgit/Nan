"use client";

// CMS: materials array (including image slots) is sourced from the central data file.
// Future: when item.image.src is non-empty (set by admin upload), render the
// actual material texture photo inside the card visual area over the neutral fallback.

import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import MetaLine from "@/components/ui/MetaLine";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { materials } from "@/data/homepageData";

const PRINT_QUALITY_STEPS = [
  { n: "01", label: "File check", sub: "Kiểm tra trước in" },
  { n: "02", label: "Color care", sub: "Tối ưu màu sắc" },
  { n: "03", label: "Safe margin", sub: "Canh vùng an toàn" },
  { n: "04", label: "Production", sub: "Sẵn sàng sản xuất" },
];

export default function MaterialSection() {
  return (
    <Section tone="paper" id="materials">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="mb-14"
      >
        {/* Title and description sit side by side on desktop, so the description stays a
            sibling here instead of going through SectionTitle's stacked description. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            tone="paper"
            className="lg:max-w-md"
            titleClassName="leading-tight tracking-tight"
            title={
              <>
                Cảm giác cao cấp{" "}
                <span className="text-navy">bắt đầu từ chất liệu.</span>
              </>
            }
          />
          <p className="max-w-sm text-[0.9375rem] leading-7 text-ink-muted">
            Một chiếc quạt đẹp không chỉ nằm ở thiết kế. Chất liệu, bề mặt
            hoàn thiện và hiệu ứng sau in quyết định cảm giác thật khi cầm trên tay.
          </p>
        </div>

        <Rule tone="paper" className="mt-10" />
      </motion.div>

      {/* Material tiles — editorial catalogue: large material surface, clean name, short detail.
          Not links, so no hover state. CMS: sourced from materials[] */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: index * 0.06 }}
          >
            <Card tone="paper" as="article" className="h-full overflow-hidden">
              {/* Visual area — large material surface */}
              <div className="relative h-64 overflow-hidden bg-paper-deep">
                {/*
                  CMS: when item.image.src is set, render the macro texture photo:
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                */}
              </div>

              {/* Text content — CMS: item.name / item.description / item.tag */}
              <div className="border-t border-line-on-paper p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-xl font-semibold">{item.name}</h3>
                  <MetaLine tone="paper" items={[item.tag]} className="shrink-0 text-sm" />
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{item.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Print quality — structured grid, not nested cards.
          Pending (DECISIONS.md): these four steps become one sentence, and their English labels
          get translated; both are content changes, left for a later pass. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="mt-16 border-t border-line-on-paper pt-14"
      >
        <SectionTitle
          tone="paper"
          as="h3"
          className="max-w-2xl"
          titleClassName="text-2xl leading-tight tracking-tight md:text-4xl"
          descriptionClassName="mt-4 text-sm leading-7 md:text-sm"
          title="Thiết kế đẹp trên màn hình. Chuẩn khi in thật."
          description="File thiết kế được kiểm tra kích thước, độ phân giải, vùng an toàn, bleed và màu sắc trước khi chuyển sang sản xuất."
        />

        <div className="mt-10 grid grid-cols-1 border-t border-line-on-paper sm:grid-cols-2">
          {PRINT_QUALITY_STEPS.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-baseline gap-4 border-b border-line-on-paper py-6 ${
                i % 2 === 0 ? "sm:border-r sm:border-line-on-paper sm:pr-8" : "sm:pl-8"
              }`}
            >
              <span className="font-mono text-sm font-semibold text-navy/70">{step.n}</span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.06em]">{step.label}</p>
                <p className="mt-1 text-xs text-ink-muted">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}
