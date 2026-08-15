"use client";

import { motion, useReducedMotion } from "motion/react";
import { solutionSection } from "@/data/homepageData";

export default function SolutionSection() {
  const reduce = useReducedMotion();
  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "linear-gradient(180deg, #0A1B38 0%, #081426 100%)" }}
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
      <div className="pointer-events-none absolute left-1/3 top-0 h-72 w-72 rounded-full bg-[#08337D]/15 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-[#114F99]/08 blur-[60px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Left — headline holds its ground while the list unfolds beside it */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-white md:text-5xl">
              {solutionSection.headline}
            </h2>
          </motion.div>

          {/* Right — pillars as a numbered editorial list, not an icon grid */}
          <div className="border-t border-[rgba(220,234,247,0.10)]">
            {solutionSection.pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.68,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex gap-6 border-b border-[rgba(220,234,247,0.10)] py-8"
              >
                <span className="font-serif text-2xl font-semibold leading-none text-[rgba(236,202,62,0.55)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-2.5 max-w-md text-sm leading-6 text-[rgba(220,234,247,0.50)]">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
