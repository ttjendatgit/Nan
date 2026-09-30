"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { faqItems } from "@/data/homepageData";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section tone="indigo" innerClassName="max-w-3xl">
      {/* Chapter break: follows Process on the same indigo surface */}
      <Rule tone="indigo" className="-mt-20 mb-20 md:-mt-28 md:mb-28" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="mb-12"
      >
        <SectionTitle
          tone="indigo"
          titleClassName="text-3xl leading-tight tracking-tight md:text-4xl"
          title="Câu hỏi thường gặp"
        />
      </motion.div>

      {/* FAQ rows — clean dividers, no card-per-question */}
      <div className="border-t border-line-on-indigo">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          const answerId = `faq-answer-${index}`;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
              className="border-b border-line-on-indigo"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={answerId}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[0.9375rem] font-semibold md:text-base">{item.q}</span>
                <span className="shrink-0 text-bamboo">
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    id={answerId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <p className="max-w-xl pb-5 text-sm leading-7 text-on-indigo-muted">{item.a}</p>
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
        <p className="text-sm text-on-indigo-muted">
          Vẫn còn thắc mắc?{" "}
          <a
            href="#quote"
            className="font-semibold text-bamboo underline underline-offset-2 hover:text-on-indigo"
          >
            Liên hệ tư vấn miễn phí
          </a>
        </p>
      </motion.div>
    </Section>
  );
}
