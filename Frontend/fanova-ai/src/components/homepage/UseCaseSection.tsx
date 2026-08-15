"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCases } from "@/data/homepageData";

export default function UseCaseSection() {
  const reduce = useReducedMotion();
  return (
    <section
      id="applications"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "linear-gradient(180deg, #081426 0%, #0A1B38 100%)" }}
    >
      {/* Grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-[#08337D]/15 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#114F99]/10 blur-[60px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-10 md:mb-14"
        >
          <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-white md:text-5xl lg:max-w-xl">
            Nan phù hợp với{" "}
            <span className="text-[#DCEAF7]">nhiều ngữ cảnh khác nhau.</span>
          </h2>
          <p className="mt-5 max-w-lg text-[0.9375rem] leading-7 text-[rgba(220,234,247,0.50)]">
            Từ sự kiện nhỏ đến chiến dịch thương hiệu lớn, Nan cung cấp giải pháp
            quạt phù hợp với từng mục đích và ngân sách.
          </p>
        </motion.div>
      </div>

      {/* Use cases as a horizontal editorial strip -- browse by scrolling,
          not another centered heading + 3 equal cards row */}
      <div className="relative mx-auto max-w-7xl">
        <div
          role="group"
          aria-label="Ứng dụng của Nan theo ngữ cảnh, cuộn ngang để xem thêm"
          tabIndex={0}
          className="-mx-6 flex snap-x snap-proximity gap-5 overflow-x-auto px-6 pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-[#ECCA3E]/50 [&::-webkit-scrollbar]:hidden"
        >
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.id}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="w-[260px] shrink-0 snap-start border-t border-[rgba(220,234,247,0.14)] pt-6 sm:w-[300px]"
            >
              <span className="font-mono text-[11px] font-semibold text-[rgba(236,202,62,0.55)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-serif text-lg font-semibold text-white">
                {useCase.title}
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-[rgba(220,234,247,0.50)]">
                {useCase.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {useCase.examples.map((ex) => (
                  <span
                    key={ex}
                    className="rounded-full border border-[rgba(220,234,247,0.10)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[rgba(220,234,247,0.32)]"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
