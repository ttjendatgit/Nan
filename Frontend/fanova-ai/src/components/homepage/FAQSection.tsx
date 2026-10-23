"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
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
  // Generic quote inquiry (no productId), same modal as Process / FinalCTA.
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
    {/* R10.2: the quiet last information before the CTA. Two columns on the page grid: the heading
        and the one way out ("Vẫn còn thắc mắc?") on the left, the accordion on the right. No
        chapter rule, no cards, no shadows; one hairline between questions. */}
    <Section tone="indigo" className="pb-20 pt-20 md:pb-24 md:pt-28" material="quiet" atmosphere={{ x: "22%", y: "30%" }}>
      <div className="lg:grid lg:grid-cols-12 lg:gap-12">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={reduce ? { opacity: 1 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.5 }}
        className="mb-10 lg:col-span-4 lg:mb-0"
      >
        <div className="lg:sticky lg:top-[calc(var(--nav-height,64px)+3rem)]">
          <SectionTitle tone="indigo" title="Câu hỏi thường gặp" />
          <p className="mt-6 hidden text-[0.9375rem] leading-7 text-on-indigo-muted lg:block">
            Vẫn còn thắc mắc? Ghi câu hỏi vào phần ghi chú khi{" "}
            <FaqContact onClick={() => setQuoteOpen(true)} />.
          </p>
        </div>
      </motion.div>

      <div className="lg:col-span-7 lg:col-start-6">
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
                className="group flex w-full items-center justify-between gap-6 rounded-sm py-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-on-indigo focus-visible:ring-offset-4 focus-visible:ring-offset-indigo md:py-7"
              >
                <span className="text-[0.9375rem] font-medium leading-7 transition-colors duration-(--dur-ui) group-hover:text-bamboo motion-reduce:transition-none md:text-[1.0625rem]">{item.q}</span>
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
                    <p className="max-w-xl pb-7 pr-10 text-[0.9375rem] leading-7 text-on-indigo-muted">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Below 1024px the way out follows the questions */}
      <p className="mt-10 text-[0.9375rem] leading-7 text-on-indigo-muted lg:hidden">
        Vẫn còn thắc mắc? Ghi câu hỏi vào phần ghi chú khi <FaqContact onClick={() => setQuoteOpen(true)} />.
      </p>
      </div>
      </div>
    </Section>

    {/* Outside the Section so the fixed modal is not trapped in its stacking context */}
    <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}

/** Opens the general quote modal; same label as every quote CTA on the page (one label per
 *  intent). after: a 44px-tall tap area. */
function FaqContact({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative font-medium text-bamboo underline decoration-bamboo/50 underline-offset-4 after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-on-indigo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-indigo"
    >
      gửi yêu cầu báo giá
    </button>
  );
}
