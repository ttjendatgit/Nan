"use client";

// CMS: all text content, stats, and the background image slot are sourced from finalCta.
// Future: when finalCta.backgroundImage.src is set by admin upload, render
// the image as a low-opacity overlay behind the gradient card.

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { finalCta } from "@/data/homepageData";

export default function FinalCTASection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="quote"
      className="relative overflow-hidden px-6 py-24"
      style={{ background: "#0F1320" }}
    >
      {/* Ambient glow -- one restrained source, not a stack */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#192B88]/12 blur-[80px]" />

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Top divider line */}
        <div className="mb-20 h-px bg-gradient-to-r from-transparent via-[rgba(241,240,234,0.12)] to-transparent" />

        {/* Panel: fades and lifts as a unit */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-[rgba(220,234,247,0.10)] px-8 py-20 text-center md:px-16"
          style={{
            background: "#192B88",
            boxShadow:
              "0 32px 100px rgba(8,20,38,0.55), inset 0 1px 0 rgba(241,240,234,0.10), inset 0 -70px 110px rgba(15,19,32,0.45)",
          }}
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

          {/* Inner grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Accent lines */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(241,240,234,0.25)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(241,240,234,0.15)] to-transparent" />

          <div className="relative z-10 mx-auto max-w-3xl">

            {/* Badge — reveals first */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/6 px-4 py-2"
            >
              <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#B6A17B]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/65">
                {finalCta.badge}
              </span>
            </motion.div>

            {/* Title — CMS: finalCta.title */}
            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-white md:text-5xl lg:text-6xl"
            >
              {finalCta.title}
            </motion.h2>

            {/* Description — CMS: finalCta.description */}
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.52 }}
              className="mx-auto mt-6 max-w-xl text-base leading-8 text-[rgba(241,240,234,0.60)]"
            >
              {finalCta.description}
            </motion.p>

            {/* Stats row — CMS: finalCta.stats */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.64, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 mb-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-y border-[rgba(255,255,255,0.08)] py-8"
            >
              {finalCta.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-serif text-2xl font-semibold text-white">{stat.num}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(241,240,234,0.45)]">
                    {stat.label}
                  </div>
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
                <Button className="bg-[#F1F0EA] text-[#0F1320] hover:bg-white shadow-lg shadow-black/22">
                  {finalCta.primaryButton}
                  <ArrowRight className="ml-2" size={15} />
                </Button>
              </Link>

              <Link href="/products">
                <Button
                  variant="secondary"
                  className="border-white/25 text-white/80 hover:border-white/50 hover:text-white hover:bg-white/10"
                >
                  {finalCta.secondaryButton}
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
