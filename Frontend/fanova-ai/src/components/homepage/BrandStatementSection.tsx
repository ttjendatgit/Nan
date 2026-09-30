"use client";

import { motion, useReducedMotion } from "motion/react";
import { brandStatement } from "@/data/homepageData";

export default function BrandStatementSection() {
  const reduce = useReducedMotion();
  return (
    <section
      id="about"
      className="relative overflow-hidden px-6 py-24 md:py-36"
      style={{ background: "#0F1320" }}
    >
      <div className="relative mx-auto max-w-5xl">
        {/* Gold accent rule — earned by the quality of what follows */}
        <motion.div
          initial={reduce ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 0 }}
          className="mb-10 h-px w-14 bg-[#B6A17B]/55"
        />

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl font-semibold leading-[1.22] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
        >
          {brandStatement.headlineA}
        </motion.p>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 font-serif text-3xl font-semibold leading-[1.22] tracking-tight text-[#DCEAF7]/80 md:text-4xl lg:text-[2.75rem]"
        >
          {brandStatement.headlineB}
        </motion.p>

        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.46 }}
          className="mt-9 max-w-md text-[0.9375rem] leading-7 text-[rgba(220,234,247,0.45)]"
        >
          {brandStatement.body}
        </motion.p>
      </div>
    </section>
  );
}
