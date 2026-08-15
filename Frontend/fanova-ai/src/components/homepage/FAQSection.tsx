"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { faqItems } from "@/data/homepageData";
import EditorialGrid from "./EditorialGrid";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F1F0EA" }}
    >
      <EditorialGrid />

      <div className="relative mx-auto max-w-3xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-12"
        >
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#0F1320] md:text-4xl">
            Câu hỏi thường gặp
          </h2>
        </motion.div>

        {/* FAQ rows — clean dividers, no card-per-question */}
        <div className="border-t border-[rgba(15,19,32,0.14)]">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.05 }}
                className="border-b border-[rgba(15,19,32,0.14)]"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[0.9375rem] font-semibold text-[#0F1320] md:text-base">
                    {item.q}
                  </span>
                  <span className="shrink-0 text-[#192B88]">
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
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
                      <p className="max-w-xl pb-5 text-sm leading-7 text-[rgba(15,19,32,0.62)]">
                        {item.a}
                      </p>
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
          <p className="text-sm text-[rgba(15,19,32,0.50)]">
            Vẫn còn thắc mắc?{" "}
            <a
              href="#quote"
              className="font-semibold text-[#192B88] underline underline-offset-2 hover:text-[#0F1320]"
            >
              Liên hệ tư vấn miễn phí
            </a>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
