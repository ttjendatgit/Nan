"use client";

// CMS: all text content, stats, and the background image slot are sourced from finalCta.
// Future: when finalCta.backgroundImage.src is set by admin upload, render
// the image as a low-opacity overlay behind the panel.

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import MetaLine from "@/components/ui/MetaLine";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import { finalCta } from "@/data/homepageData";

export default function FinalCTASection() {
  const reduce = useReducedMotion();

  return (
    <Section tone="indigo" id="quote" className="py-24 md:py-24" innerClassName="z-10">
      {/* Chapter break: follows FAQ on the same indigo surface (same place as the old divider) */}
      <Rule tone="indigo" className="mb-20" />

      {/* Panel: fades and lifts as a unit. Navy on indigo is a recorded exception
          (DECISIONS.md): the closing call to action is the page's one navy moment. No shadow,
          glow or gradient. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 30, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-line-on-indigo bg-navy px-8 py-20 text-center md:px-16"
      >
        {/*
          CMS: when finalCta.backgroundImage.src is set, render the admin-uploaded
          background image as an overlay:
          <img
            src={finalCta.backgroundImage.src}
            alt={finalCta.backgroundImage.alt}
            className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
          />
        */}

        <div className="relative z-10 mx-auto max-w-3xl">

          {/* Badge line — reveals first */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <MetaLine tone="indigo" items={[finalCta.badge]} className="text-lg" />
          </motion.div>

          {/* Title — CMS: finalCta.title */}
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight md:text-5xl lg:text-6xl"
          >
            {finalCta.title}
          </motion.h2>

          {/* Description — CMS: finalCta.description */}
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.52 }}
            className="mx-auto mt-6 max-w-xl text-base leading-8 text-on-indigo-muted"
          >
            {finalCta.description}
          </motion.p>

          {/* Stats row — CMS: finalCta.stats */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.64, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 mb-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-y border-line-on-indigo py-8"
          >
            {finalCta.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-2xl font-semibold">{stat.num}</div>
                <div className="mt-1 text-xs text-on-indigo-muted">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTAs — appear last */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/products">
              <Button tone="indigo">
                {finalCta.primaryButton}
                <ArrowRight className="ml-2" size={15} />
              </Button>
            </Link>

            <Link href="/products">
              <Button tone="indigo" variant="secondary">
                {finalCta.secondaryButton}
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </Section>
  );
}
