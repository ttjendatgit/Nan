"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { processSteps } from "@/data/homepageData";

export default function ProcessSection() {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-[#FFFFFF] px-6 py-20 md:py-28"
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-lines opacity-45" />

      {/* Glows */}
      <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-[#DCEAF7]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 right-0 h-72 w-72 rounded-full bg-[#DCEAF7]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#081426] md:text-5xl lg:max-w-xl">
            Từ ý tưởng đến{" "}
            <span className="text-[#08337D]">chiếc quạt hoàn thiện.</span>
          </h2>
          <p className="mt-5 max-w-lg text-[0.9375rem] leading-7 text-[#4A74A7]">
            Quy trình được thiết kế để bạn có thể yêu cầu báo giá, tư vấn thiết kế
            và nhận hàng mà không cần hiểu kỹ thuật in ấn.
          </p>
          <div className="mt-7">
            <a href="#quote">
              <Button>
                Gửi yêu cầu báo giá
                <ArrowRight className="ml-2" size={14} />
              </Button>
            </a>
          </div>

          <div className="mt-10 h-px bg-gradient-to-r from-[rgba(8,51,125,0.14)] via-[rgba(8,51,125,0.08)] to-transparent" />
        </motion.div>

        {/* Process steps */}
        <div className="space-y-3">
          {processSteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: index * 0.07 }}
              className="group relative overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.09)] bg-[#FFFFFF] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(8,51,125,0.20)] hover:bg-[#F7FAFF] hover:shadow-[0_8px_32px_rgba(8,51,125,0.10)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.18)] to-transparent" />

              <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:p-7">
                {/* Step number */}
                <div className="flex shrink-0 flex-row items-center gap-4 md:flex-col md:items-start md:gap-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[rgba(8,51,125,0.35)]">
                    Step
                  </span>
                  <span className="font-mono text-[1.75rem] font-bold leading-none text-[#08337D] md:text-[2rem]">
                    {item.step}
                  </span>
                </div>

                {/* Divider */}
                <div className="hidden h-12 w-px bg-[rgba(8,51,125,0.12)] md:block" />

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-semibold text-[#081426]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4A74A7]">
                    {item.description}
                  </p>
                </div>

                <ArrowRight
                  className="hidden shrink-0 text-[rgba(8,51,125,0.16)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#08337D] md:block"
                  size={18}
                />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
