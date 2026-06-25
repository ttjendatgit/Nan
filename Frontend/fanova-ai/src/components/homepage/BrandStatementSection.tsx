"use client";

import { motion } from "motion/react";
import { brandStatement } from "@/data/homepageData";

export default function BrandStatementSection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24 md:py-36"
      style={{ background: "linear-gradient(180deg, #081426 0%, #0A1B38 100%)" }}
    >
      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient center glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[12%] top-1/2 h-[55%] w-[42%] -translate-y-1/2 rounded-full bg-[#08337D]/10 blur-[90px]"
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Gold accent rule — earned by the quality of what follows */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 0 }}
          className="mb-10 h-px w-14 bg-[#ECCA3E]/55"
        />

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl font-semibold leading-[1.22] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
        >
          {brandStatement.headlineA}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.82, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-serif text-3xl font-semibold leading-[1.22] tracking-tight text-[#DCEAF7]/80 md:text-4xl lg:text-[2.75rem]"
        >
          {brandStatement.headlineB}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.42 }}
          className="mt-9 max-w-md text-[0.9375rem] leading-7 text-[rgba(220,234,247,0.45)]"
        >
          {brandStatement.body}
        </motion.p>
      </div>
    </section>
  );
}
