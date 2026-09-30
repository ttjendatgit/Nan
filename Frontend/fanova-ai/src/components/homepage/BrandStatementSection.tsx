"use client";

import { motion, useReducedMotion } from "motion/react";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { brandStatement } from "@/data/homepageData";

export default function BrandStatementSection() {
  const reduce = useReducedMotion();
  return (
    <Section tone="indigo" id="about" className="py-24 md:py-36" innerClassName="max-w-5xl">
      {/* Bamboo accent rule — earned by the quality of what follows */}
      <motion.div
        initial={reduce ? false : { scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0 }}
        className="mb-10 h-px w-14 bg-bamboo/55"
      />

      {/* Each line keeps its own staggered reveal, so the lines are motion spans inside the
          shared title/description rather than separate paragraphs. */}
      <SectionTitle
        tone="indigo"
        className="max-w-none"
        titleClassName="text-3xl leading-[1.22] tracking-tight md:text-4xl lg:text-[2.75rem]"
        descriptionClassName="mt-9 max-w-md text-[0.9375rem] leading-7 md:text-[0.9375rem]"
        title={
          <>
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {brandStatement.headlineA}
            </motion.span>
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 block text-on-indigo-muted"
            >
              {brandStatement.headlineB}
            </motion.span>
          </>
        }
        description={
          <motion.span
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.46 }}
            className="block"
          >
            {brandStatement.body}
          </motion.span>
        }
      />
    </Section>
  );
}
