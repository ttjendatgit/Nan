"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import IndexMarker from "@/components/ui/IndexMarker";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { processSteps } from "@/data/homepageData";

export default function ProcessSection() {
  const reduce = useReducedMotion();
  return (
    <Section tone="indigo" id="process">
      {/* Chapter break: follows UseCase on the same indigo surface */}
      <Rule tone="indigo" className="-mt-20 mb-20 md:-mt-28 md:mb-28" />

      {/* Section header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14"
      >
        <SectionTitle
          tone="indigo"
          titleClassName="leading-tight tracking-tight lg:max-w-xl"
          descriptionClassName="max-w-lg text-[0.9375rem] leading-7 md:text-[0.9375rem]"
          title={
            <>
              Từ ý tưởng đến{" "}
              <span className="text-bamboo">chiếc quạt hoàn thiện.</span>
            </>
          }
          description="Quy trình được thiết kế để bạn có thể yêu cầu báo giá, tư vấn thiết kế và nhận hàng mà không cần hiểu kỹ thuật in ấn."
        />
        <div className="mt-7">
          <a href="#quote">
            <Button tone="indigo">
              Gửi yêu cầu báo giá
              <ArrowRight className="ml-2" size={14} />
            </Button>
          </a>
        </div>
      </motion.div>

      {/* Process steps — numbered structural list, not stacked cards. The one homepage block
          that keeps numbering (DECISIONS.md), via IndexMarker. */}
      <div className="border-t border-line-on-indigo">
        {processSteps.map((item, index) => (
          <motion.div
            key={item.step}
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.72, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative border-b border-line-on-indigo"
          >
            {/* Left connector accent: draws in after the row appears,
                communicating sequential step progression. */}
            {!reduce && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-bamboo/50 md:block"
                style={{ originY: 0 }}
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
              <div className="shrink-0 md:w-16">
                <IndexMarker tone="indigo" number={item.step} />
              </div>

              {/* Divider */}
              <div className="hidden h-12 w-px bg-line-on-indigo md:block" />

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-on-indigo-muted">
                  {item.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
