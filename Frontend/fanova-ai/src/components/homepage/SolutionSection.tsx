"use client";

import { motion, useReducedMotion } from "motion/react";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { solutionSection } from "@/data/homepageData";

export default function SolutionSection() {
  const reduce = useReducedMotion();
  return (
    <Section tone="indigo">
      {/* Chapter break: follows Problem on the same indigo surface */}
      <Rule tone="indigo" className="-mt-20 mb-20 md:-mt-28 md:mb-28" />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Left — headline holds its ground while the list unfolds beside it */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="lg:sticky lg:top-32 lg:self-start"
        >
          <SectionTitle tone="indigo" title={solutionSection.headline} titleClassName="tracking-tight" />
        </motion.div>

        {/* Right — pillars as an editorial list, not an icon grid. Unnumbered: the pillars are
            not a sequence (DECISIONS.md: numbering only for Process and option groups). */}
        <div className="border-t border-line-on-indigo">
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
              className="border-b border-line-on-indigo py-8"
            >
              <h3 className="font-serif text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-2.5 max-w-md text-sm leading-6 text-on-indigo-muted">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
