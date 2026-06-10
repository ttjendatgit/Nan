"use client";

import { motion } from "motion/react";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080E1A]">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-lines" />

      {/* Hero image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/vietnam-fan-hero.png')" }}
      />

      {/* Controlled dark overlays — sharp, not foggy */}
      <div className="absolute inset-0 bg-[#080E1A]/35" />
      <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-[#080E1A]/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-[#080E1A] to-transparent" />
      <div className="absolute inset-y-0 left-0 w-56 bg-linear-to-r from-[#080E1A]/50 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-56 bg-linear-to-l from-[#080E1A]/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-5xl"
        >
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#2F3542] bg-[#151C28]/75 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#539AD3] backdrop-blur-sm"
          >
            Vietnamese Heritage Fan Design
          </motion.div>

          <h1 className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-[#FBFBFF] drop-shadow-2xl md:text-7xl lg:text-[5.25rem]">
            Di sản trong từng nếp quạt.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base font-normal leading-7 text-[#C3C7CD] md:text-lg">
            Thiết kế quạt giấy cá nhân hóa, kết hợp tinh thần thủ công Việt
            Nam với trải nghiệm công nghệ hiện đại.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button>Khám phá bộ sưu tập</Button>
            <Button variant="secondary">Bắt đầu thiết kế</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
