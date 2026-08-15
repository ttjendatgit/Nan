"use client";

import { motion, useReducedMotion } from "motion/react";
import { problemSection } from "@/data/homepageData";

export default function ProblemSection() {
  const reduce = useReducedMotion();
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
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-[#081426] md:text-5xl">
              {problemSection.headline}
            </h2>
            <p className="mt-6 max-w-md text-[0.9375rem] leading-7 text-[#4A74A7]">
              {problemSection.body}
            </p>
          </motion.div>

          {/* Right — pain points as a quiet divided list, not boxed cards */}
          <div className="border-t border-[rgba(8,51,125,0.08)]">
            {problemSection.points.map((point, index) => (
              <motion.div
                key={point}
                initial={reduce ? false : { opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex items-baseline gap-5 border-b border-[rgba(8,51,125,0.08)] py-5"
              >
                <span className="font-mono text-[11px] font-semibold text-[rgba(8,51,125,0.35)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-6 text-[#2D4A6E]">{point}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
