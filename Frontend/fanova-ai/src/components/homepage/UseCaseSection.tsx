"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useCases } from "@/data/homepageData";

export default function UseCaseSection() {
  return (
    <section className="relative overflow-hidden bg-[#0D131F] px-6 py-20 md:py-28">
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-lines opacity-70" />

      {/* Glow accents */}
      <div className="absolute left-0 top-20 h-80 w-80 rounded-full bg-[#2A5A84]/12 blur-3xl" />
      <div className="absolute bottom-20 right-0 h-80 w-80 rounded-full bg-[#539AD3]/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex rounded-full border border-[#2F3542] bg-[#151C28] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
            Use Case Gallery
          </div>

          <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#FBFBFF] md:text-6xl">
            Không chỉ là quạt.{" "}
            <span className="block bg-linear-to-r from-[#9ECBFB] via-[#C6E2FF] to-[#539AD3] bg-clip-text text-transparent">
              Đó là một điểm chạm thương hiệu.
            </span>
          </h2>

          <p className="mt-6 text-base leading-8 text-[#8D9197]">
            Mỗi chiếc quạt có thể trở thành một phần của sự kiện, tiệc cưới,
            kỳ nghỉ, nhà hàng hoặc chiến dịch thương hiệu.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2">
          {useCases.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.08 }}
              className="group relative min-h-105 overflow-hidden rounded-3xl border border-[#2F3542] bg-[#151C28] shadow-xl shadow-black/30 transition hover:-translate-y-2 hover:border-[#539AD3]/35 hover:shadow-2xl hover:shadow-black/40"
            >
              {/* Tinted gradient */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${item.gradient}`}
              />

              {/* Glass shimmer */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(198,226,255,0.06),transparent_50%)]" />

              <div className="relative z-10 flex h-full min-h-105 flex-col justify-between p-8">
                <div>
                  <div className="mb-5 inline-flex rounded-full border border-[#2F3542] bg-[#0D131F]/70 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#539AD3] backdrop-blur">
                    {item.tag}
                  </div>

                  <h3 className="max-w-md font-serif text-3xl font-semibold tracking-tight text-[#FBFBFF]">
                    {item.title}
                  </h3>

                  <p className="mt-4 max-w-md text-base font-medium text-[#C3C7CD]">
                    {item.subtitle}
                  </p>

                  <p className="mt-4 max-w-md text-sm leading-6 text-[#8D9197]">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <button className="inline-flex items-center text-xs font-semibold text-[#9ECBFB] transition group-hover:translate-x-1">
                    Khám phá ứng dụng
                    <ArrowRight className="ml-2" size={14} />
                  </button>

                  <motion.div
                    animate={{ rotate: [0, 2, -2, 0] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative hidden h-36 w-36 items-center justify-center rounded-full border border-[#2F3542] bg-[#0D131F]/60 shadow-2xl backdrop-blur md:flex"
                  >
                    <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.12),rgba(21,28,40,0.5)_100%)]" />

                    <div className="absolute h-[80%] w-px bg-[#2F3542]" />
                    <div className="absolute h-[80%] w-px rotate-30 bg-[#2F3542]" />
                    <div className="absolute h-[80%] w-px -rotate-30 bg-[#2F3542]" />
                    <div className="absolute h-[80%] w-px rotate-60 bg-[#2F3542]" />
                    <div className="absolute h-[80%] w-px -rotate-60 bg-[#2F3542]" />

                    <div className="relative z-10 h-14 w-14 rounded-full bg-linear-to-br from-[#2A5A84] to-[#539AD3] shadow-lg shadow-[#539AD3]/30" />
                    <div className="absolute -bottom-12 left-1/2 h-18 w-4 -translate-x-1/2 rounded-full bg-[#242A37] shadow-lg" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
