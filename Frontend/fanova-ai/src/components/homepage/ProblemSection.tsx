"use client";

import { motion, useReducedMotion } from "motion/react";
import { problemSection } from "@/data/homepageData";
import EditorialGrid from "./EditorialGrid";

export default function ProblemSection() {
  const reduce = useReducedMotion();
  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F1F0EA" }}
    >
      <EditorialGrid />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left — problem headline */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-[#0F1320] md:text-5xl">
              {problemSection.headline}
            </h2>
            <p className="mt-6 max-w-md text-[0.9375rem] leading-7 text-[rgba(15,19,32,0.62)]">
              {problemSection.body}
            </p>
          </motion.div>

          {/* Right — pain points as a quiet divided list, not boxed cards */}
          <div className="border-t border-[rgba(15,19,32,0.10)]">
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
                className="flex items-baseline gap-5 border-b border-[rgba(15,19,32,0.10)] py-5"
              >
                <span className="font-mono text-[11px] font-semibold text-[#192B88]/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-6 text-[rgba(15,19,32,0.72)]">{point}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
