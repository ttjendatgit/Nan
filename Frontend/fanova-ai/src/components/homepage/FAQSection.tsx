"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { faqItems } from "@/data/homepageData";
import { DUR_UI, EASE_NAN_UI, INSTANT } from "@/lib/motionTokens";

/** R6: the FAQ is the page's rest. Rows arrive by opacity only, one fine pleat (40ms) apart. */
const ROW_PLEAT = 0.04;

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Reduced motion: same start state as the server render (no hydration mismatch); `animate`
  // lands every row on its final state right after hydration, and instant transitions make the
  // accordion open/close at once. MotionConfig alone would still fade opacity and animate the
  // answer's height.
  const reduce = useReducedMotion();
  // "Liên hệ tư vấn miễn phí": generic quote inquiry (no productId), same modal as Process / FinalCTA.
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
    {/* R6: extra top padding before the chapter rule, a breath after the Process finale. */}
    <Section tone="indigo" className="pt-40 md:pt-56" innerClassName="max-w-3xl">
      {/* Chapter break: follows Process on the same indigo surface */}
      <Rule tone="indigo" className="-mt-20 mb-20 md:-mt-28 md:mb-28" />

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={reduce ? { opacity: 1 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.4 }}
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
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              animate={reduce ? { opacity: 1 } : undefined}
              viewport={{ once: true }}
              transition={reduce ? INSTANT : { duration: 0.4, delay: index * ROW_PLEAT }}
              className="border-b border-line-on-indigo"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={answerId}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[0.9375rem] font-semibold md:text-base">{item.q}</span>
                {/* One icon: the vertical stroke of "+" turns flat to make "−" */}
                <span aria-hidden="true" className="relative h-4 w-4 shrink-0 text-bamboo">
                  <span className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 rounded bg-current" />
                  <span
                    className={`absolute left-1/2 top-0 h-4 w-[1.5px] -translate-x-1/2 rounded bg-current transition-[rotate] duration-(--dur-ui) ease-(--ease-nan-ui) motion-reduce:transition-none ${
                      isOpen ? "rotate-90" : "rotate-0"
                    }`}
                  />
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
                    transition={reduce ? INSTANT : { duration: DUR_UI + 0.04, ease: EASE_NAN_UI }}
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
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={reduce ? { opacity: 1 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.4, delay: 0.2 }}
        className="mt-10 text-center"
      >
        <p className="text-sm text-on-indigo-muted">
          Vẫn còn thắc mắc?{" "}
          {/* after: enlarges the tap area to 44px tall without moving the underline */}
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="relative font-semibold text-bamboo underline underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-on-indigo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-indigo"
          >
            Liên hệ tư vấn miễn phí
          </button>
        </p>
      </motion.div>
    </Section>

    {/* Outside the Section so the fixed modal is not trapped in its stacking context */}
    <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
