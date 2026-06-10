"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { processSteps } from "@/data/homepageData";

export default function ProcessSection() {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-[#0D131F] px-6 py-20 md:py-28"
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-lines opacity-70" />

      {/* Glow accents */}
      <div className="absolute left-0 top-24 h-80 w-80 rounded-full bg-[#2A5A84]/12 blur-3xl" />
      <div className="absolute bottom-24 right-0 h-80 w-80 rounded-full bg-[#539AD3]/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-28 lg:h-fit"
          >
            <div className="mb-5 inline-flex rounded-full border border-[#2F3542] bg-[#151C28] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
              How It Works
            </div>

            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#FBFBFF] md:text-6xl">
              Từ ý tưởng{" "}
              <span className="block bg-linear-to-r from-[#9ECBFB] via-[#C6E2FF] to-[#539AD3] bg-clip-text text-transparent">
                đến chiếc quạt thật.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#8D9197]">
              Quy trình được thiết kế để khách hàng không cần hiểu kỹ thuật in
              vẫn có thể tạo mẫu, xem trước và gửi yêu cầu báo giá dễ dàng.
            </p>

            <div className="mt-8">
              <Button>
                Bắt đầu thiết kế
                <ArrowRight className="ml-2" size={15} />
              </Button>
            </div>
          </motion.div>

          <div className="space-y-4">
            {processSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.06 }}
                className="group rounded-3xl border border-[#2F3542] bg-[#151C28] p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#539AD3]/35 hover:bg-[#19202C] hover:shadow-2xl hover:shadow-black/30 md:p-7"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#2F3542] bg-[#0D131F] font-mono text-sm font-bold text-[#539AD3] shadow-lg shadow-black/20">
                    {item.step}
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-semibold text-[#FBFBFF]">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8D9197] md:text-sm md:leading-7">
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight
                    className="ml-auto hidden text-[#2F3542] transition group-hover:translate-x-1 group-hover:text-[#539AD3] md:block"
                    size={20}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
