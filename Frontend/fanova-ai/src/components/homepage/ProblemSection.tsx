"use client";

import { motion } from "motion/react";
import { problemSection } from "@/data/homepageData";

export default function ProblemSection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F7FAFF" }}
    >
      {/* Dot texture */}
      <div className="absolute inset-0 bg-grid-dots opacity-40" />

      {/* Soft glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#DCEAF7]/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left — problem headline */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-[#081426] md:text-5xl">
              {problemSection.headline}
            </h2>
            <p className="mt-6 max-w-md text-[0.9375rem] leading-7 text-[#4A74A7]">
              {problemSection.body}
            </p>
          </motion.div>

          {/* Right — pain point cards */}
          <div className="space-y-3.5">
            {problemSection.points.map((point, index) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.62,
                  delay: index * 0.09,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.08)] bg-white p-5 shadow-[0_2px_14px_rgba(8,51,125,0.04)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.14)] to-transparent" />
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(8,51,125,0.06)]">
                    <div className="h-2 w-2 rounded-full bg-[rgba(8,51,125,0.22)]" />
                  </div>
                  <p className="text-sm leading-6 text-[#2D4A6E]">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
