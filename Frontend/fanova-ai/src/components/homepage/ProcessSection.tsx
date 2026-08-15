"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { processSteps } from "@/data/homepageData";
import EditorialGrid from "./EditorialGrid";

export default function ProcessSection() {
  const reduce = useReducedMotion();
  return (
    <section
      id="process"
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F1F0EA" }}
    >
      <EditorialGrid />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#0F1320] md:text-5xl lg:max-w-xl">
            Từ ý tưởng đến{" "}
            <span className="text-[#192B88]">chiếc quạt hoàn thiện.</span>
          </h2>
          <p className="mt-5 max-w-lg text-[0.9375rem] leading-7 text-[rgba(15,19,32,0.62)]">
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

          <div className="mt-10 h-px bg-[rgba(15,19,32,0.12)]" />
        </motion.div>

        {/* Process steps — numbered structural list, not stacked cards */}
        <div className="border-t border-[rgba(15,19,32,0.12)]">
          {processSteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.72, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative border-b border-[rgba(15,19,32,0.12)]"
            >
              {/* Left connector accent: draws in after the row appears,
                  communicating sequential step progression. */}
              {!reduce && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 hidden h-full w-px md:block"
                  style={{ originY: 0, background: "rgba(25,43,136,0.35)" }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.9,
                    delay: index * 0.1 + 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )}

              <div className="flex flex-col gap-5 py-7 pl-0 md:flex-row md:items-center md:py-8 md:pl-8">
                {/* Step number */}
                <div className="flex shrink-0 flex-row items-center gap-4 md:w-16 md:flex-col md:items-start md:gap-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[rgba(15,19,32,0.38)]">
                    Step
                  </span>
                  <span className="font-mono text-[1.75rem] font-bold leading-none text-[#192B88] md:text-[2rem]">
                    {item.step}
                  </span>
                </div>

                {/* Divider */}
                <div className="hidden h-12 w-px bg-[rgba(15,19,32,0.14)] md:block" />

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-serif text-xl font-semibold text-[#0F1320]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgba(15,19,32,0.62)]">
                    {item.description}
                  </p>
                </div>

                <ArrowRight
                  className="hidden shrink-0 text-[rgba(15,19,32,0.20)] transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#192B88] md:block"
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
