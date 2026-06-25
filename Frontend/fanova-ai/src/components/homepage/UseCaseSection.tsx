"use client";

import { motion } from "motion/react";
import { Sparkles, Sun, Coffee, Briefcase, Megaphone } from "lucide-react";
import { useCases } from "@/data/homepageData";

type LucideIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

const ICONS: Record<string, LucideIconComponent> = {
  Sparkles,
  Sun,
  Coffee,
  Briefcase,
  Megaphone,
};

export default function UseCaseSection() {
  return (
    <section
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
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

        {/* Use case cards — 3-col large, 2-col medium, 1-col mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => {
            const Icon = ICONS[useCase.icon];
            const isLastOdd = index === useCases.length - 1 && useCases.length % 3 !== 0;
            return (
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: index * 0.07 }}
                className={`relative overflow-hidden rounded-2xl border border-[rgba(220,234,247,0.08)] bg-[rgba(255,255,255,0.03)] p-6 transition-colors duration-300 hover:bg-[rgba(255,255,255,0.05)]${isLastOdd ? " sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(220,234,247,0.14)] to-transparent" />

                {/* Icon */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(220,234,247,0.10)] bg-[rgba(220,234,247,0.07)]">
                  {Icon && (
                    <Icon
                      size={17}
                      className="text-[#DCEAF7]"
                      strokeWidth={1.5}
                    />
                  )}
                </div>

                <h3 className="font-serif text-lg font-semibold text-white">
                  {useCase.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-[rgba(220,234,247,0.50)]">
                  {useCase.description}
                </p>

                {/* Context tags */}
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
            );
          })}
        </div>

      </div>
    </section>
  );
}
