"use client";

import { motion } from "motion/react";
import { Palette, Layers, Package, FileText } from "lucide-react";
import { solutionSection } from "@/data/homepageData";

type LucideIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
}>;

const ICONS: Record<string, LucideIconComponent> = {
  Palette,
  Layers,
  Package,
  FileText,
};

export default function SolutionSection() {
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

        {/* Section headline */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-white md:text-5xl lg:max-w-lg">
            {solutionSection.headline}
          </h2>
        </motion.div>

        {/* 2x2 pillar grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {solutionSection.pillars.map((pillar, index) => {
            const Icon = ICONS[pillar.icon];
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.68,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative overflow-hidden rounded-2xl border border-[rgba(220,234,247,0.08)] bg-[rgba(255,255,255,0.03)] p-7 transition-colors duration-300 hover:bg-[rgba(255,255,255,0.05)]"
              >
                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(220,234,247,0.14)] to-transparent" />

                {/* Icon */}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(220,234,247,0.10)] bg-[rgba(220,234,247,0.07)]">
                  {Icon && (
                    <Icon
                      size={17}
                      className="text-[#DCEAF7]"
                      strokeWidth={1.5}
                    />
                  )}
                </div>

                <h3 className="font-serif text-xl font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[rgba(220,234,247,0.50)]">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
