"use client";

// CMS: all text content, stats, and the background image slot are sourced from finalCta.
// Future: when finalCta.backgroundImage.src is set by admin upload, render
// the image as a low-opacity overlay behind the gradient card.

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { finalCta } from "@/data/homepageData";

export default function FinalCTASection() {
  return (
    <section
      id="quote"
      className="relative overflow-hidden px-6 py-24"
      style={{ background: "linear-gradient(180deg, #0A1B38 0%, #081426 100%)" }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#08337D]/20 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#114F99]/15 blur-[60px]" />

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
        <div className="mb-20 h-px bg-gradient-to-r from-transparent via-[rgba(220,234,247,0.15)] to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-[rgba(220,234,247,0.10)] px-8 py-20 text-center shadow-[0_32px_100px_rgba(8,20,38,0.55)] md:px-16"
          style={{
            background:
              "linear-gradient(145deg, #0D1E36 0%, #142A44 35%, #08337D 72%, #114F99 100%)",
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

          {/* Corner glows */}
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#4A74A7]/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#DCEAF7]/10 blur-3xl" />

          {/* Accent lines */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(220,234,247,0.30)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(236,202,62,0.18)] to-transparent" />

          <div className="relative z-10 mx-auto max-w-3xl">
            {/* Badge — CMS: finalCta.badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/6 px-4 py-2">
              <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#ECCA3E]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/65">
                {finalCta.badge}
              </span>
            </div>

            {/* Title — CMS: finalCta.title */}
            <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-white md:text-5xl lg:text-6xl">
              {finalCta.title}
            </h2>

            {/* Description — CMS: finalCta.description */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[rgba(232,242,252,0.60)]">
              {finalCta.description}
            </p>

            {/* Stats row — CMS: finalCta.stats */}
            <div className="mt-10 mb-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-y border-[rgba(255,255,255,0.08)] py-8">
              {finalCta.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-serif text-2xl font-semibold text-white">{stat.num}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(220,234,247,0.45)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs — primary goes to /products to browse and submit quote */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/products">
                <Button className="bg-[#FFFFFF] text-[#08337D] hover:bg-[#DCEAF7] shadow-lg shadow-black/22">
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
