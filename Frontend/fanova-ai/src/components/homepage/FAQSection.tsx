"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { faqItems } from "@/data/homepageData";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F7FAFF" }}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-dots opacity-40" />

      {/* Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#DCEAF7]/45 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-12 text-center"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#08337D]">
            06 / FAQ
          </p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#081426] md:text-4xl">
            Câu hỏi thường gặp
          </h2>
        </motion.div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isOpen
                    ? "border-[rgba(8,51,125,0.20)] bg-[#FFFFFF] shadow-[0_4px_24px_rgba(8,51,125,0.09)]"
                    : "border-[rgba(8,51,125,0.09)] bg-[#FFFFFF] hover:border-[rgba(8,51,125,0.18)]"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 text-sm font-semibold text-[#081426] md:text-base">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isOpen
                        ? "border-[#08337D] bg-[#DCEAF7] text-[#08337D]"
                        : "border-[rgba(8,51,125,0.14)] text-[rgba(8,51,125,0.45)]"
                    }`}
                  >
                    {isOpen ? <Minus size={13} /> : <Plus size={13} />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="border-t border-[rgba(8,51,125,0.08)] px-6 pb-5 pt-4">
                        <p className="text-sm leading-7 text-[#4A74A7]">{item.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[rgba(8,20,38,0.45)]">
            Vẫn còn thắc mắc?{" "}
            <a
              href="#quote"
              className="font-semibold text-[#08337D] underline underline-offset-2 hover:text-[#114F99]"
            >
              Liên hệ tư vấn miễn phí
            </a>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
