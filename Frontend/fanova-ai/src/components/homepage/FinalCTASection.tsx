"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { finalCta } from "@/data/homepageData";

export default function FinalCTASection() {
  return (
    <section id="quote" className="bg-[#151C28] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-[#2F3542] px-8 py-20 text-center text-[#FBFBFF] shadow-2xl shadow-black/40 md:px-12"
          style={{
            background:
              "linear-gradient(135deg, #080E1A 0%, #0D131F 40%, rgba(42,90,132,0.25) 100%)",
          }}
        >
          {/* Grid */}
          <div className="absolute inset-0 bg-grid-lines opacity-50" />

          {/* Glow */}
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#2A5A84]/25 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#539AD3]/12 blur-3xl" />

          {/* Thin accent line top */}
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#539AD3]/50 to-transparent" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#2F3542] bg-[#151C28]/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#539AD3] backdrop-blur">
              <Sparkles size={13} />
              {finalCta.badge}
            </div>

            <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              {finalCta.title}
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#8D9197]">
              {finalCta.description}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button>
                {finalCta.primaryButton}
                <ArrowRight className="ml-2" size={15} />
              </Button>

              <Button variant="secondary">
                {finalCta.secondaryButton}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
