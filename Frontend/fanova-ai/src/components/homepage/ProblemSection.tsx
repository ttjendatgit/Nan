"use client";

import { motion, useReducedMotion } from "motion/react";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { problemSection } from "@/data/homepageData";

export default function ProblemSection() {
  const reduce = useReducedMotion();
  return (
    <Section tone="indigo">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

        {/* Left — problem headline */}
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <SectionTitle
            tone="indigo"
            titleClassName="tracking-tight"
            descriptionClassName="mt-6 max-w-md text-[0.9375rem] leading-7 md:text-[0.9375rem]"
            title={problemSection.headline}
            description={problemSection.body}
          />
        </motion.div>

        {/* Right — pain points as a quiet divided list, not boxed cards. Unnumbered: the points
            are not a sequence (DECISIONS.md). */}
        <div className="border-t border-line-on-indigo">
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
              className="border-b border-line-on-indigo py-5"
            >
              <p className="text-sm leading-6">{point}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </Section>
  );
}
