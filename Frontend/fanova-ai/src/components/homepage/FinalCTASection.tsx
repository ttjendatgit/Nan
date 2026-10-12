"use client";

// R6 SM04 "Chiếc quạt cuối cùng mở ra": the closing panel. ENTER: the panel fades in at 75% of the
// viewport, its two buttons usable from that moment. BUILD: at the reading line the finished fan
// (the same design the Process frames ended on) opens from its pivot through the fan mask, the
// third and last "mở nếp" of the page. PEAK: the headline rises out of its line mask, then the
// description and the one real figure ("48h xem mockup"). EXIT: nothing; the footer stays still.
// Navy panel on indigo is the recorded exception (DECISIONS.md §1); R6 takes its radius to 8px
// and drops the stats row (DECISIONS.md §10). CMS: text comes from finalCta; asset: finalFan (A1).

import { useRef, useState, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import AssetSlot from "@/components/ui/AssetSlot";
import Button from "@/components/ui/Button";
import MetaLine from "@/components/ui/MetaLine";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import { finalCta } from "@/data/homepageData";
import { finalFan } from "@/data/homepageAssets";
import { EASE_NAN, FAN_OPEN_DEG, INSTANT } from "@/lib/motionTokens";

/** The one stat kept, as a line of text: the mockup turnaround. */
const MOCKUP_STAT = finalCta.stats.find((s) => s.label.toLowerCase().includes("mockup"));
/** PEAK starts this long after the fan begins to open. */
const PEAK = 0.6;

export default function FinalCTASection() {
  const reduce = useReducedMotion();
  // General quote inquiry (no product): same modal + form as the product detail page.
  const [quoteOpen, setQuoteOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const built = useInView(panelRef, { once: true, margin: "0px 0px -40% 0px" }) || Boolean(reduce);
  const peak = (delay: number) => (reduce ? INSTANT : { duration: 0.6, delay: PEAK + delay });

  return (
    <>
      <Section tone="indigo" id="quote" className="py-24 md:py-24" innerClassName="z-10">
        {/* Chapter break: follows FAQ on the same indigo surface (same place as the old divider) */}
        <Rule tone="indigo" className="mb-20" />

        {/* ENTER: the panel fades in as a unit (opacity only, no lift or scale) */}
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          animate={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true, amount: 0.2 }}
          transition={reduce ? INSTANT : { duration: 0.5 }}
          className="relative overflow-hidden rounded-lg border border-line-on-indigo bg-navy px-6 pb-16 pt-10 text-center md:px-16 md:pt-12"
        >
          {/*
            CMS: when finalCta.backgroundImage.src is set, render the admin-uploaded
            background image as an overlay:
            <img
              src={finalCta.backgroundImage.src}
              alt={finalCta.backgroundImage.alt}
              className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
            />
          */}

          <div className="relative z-10 mx-auto max-w-3xl">
            {/* BUILD: the finished fan opens from its pivot (bottom centre of the cut-out) */}
            <motion.div
              className="fan-mask mx-auto w-full max-w-xl"
              style={{ "--fan-pivot": "50% 96%" } as CSSProperties}
              initial={{ "--fan-open": "0deg" }}
              animate={{ "--fan-open": built ? `${FAN_OPEN_DEG}deg` : "0deg" }}
              transition={reduce ? INSTANT : { duration: 1.1, ease: EASE_NAN }}
            >
              <AssetSlot asset={finalFan} sizes="(min-width: 768px) 576px, 90vw" />
            </motion.div>

            {/* PEAK */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: built ? 1 : 0 }}
              transition={peak(0.3)}
              className="mb-5 mt-10"
            >
              <MetaLine tone="indigo" items={[finalCta.badge]} className="text-lg" />
            </motion.div>

            <h2 className="font-serif text-4xl font-semibold leading-[1.12] tracking-tight md:text-5xl lg:text-6xl">
              <span className="block overflow-hidden pb-[0.08em] pt-[0.14em]">
                <motion.span
                  className="block"
                  initial={{ y: "115%" }}
                  animate={{ y: built ? "0%" : "115%" }}
                  transition={reduce ? INSTANT : { duration: 0.7, delay: PEAK, ease: EASE_NAN }}
                >
                  {finalCta.title}
                </motion.span>
              </span>
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: built ? 1 : 0 }}
              transition={peak(0.3)}
              className="mx-auto mt-6 max-w-xl text-base leading-8 text-on-indigo-muted"
            >
              {finalCta.description}
            </motion.p>

            {MOCKUP_STAT && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: built ? 1 : 0 }}
                transition={peak(0.4)}
                className="mt-3 font-serif text-lg italic text-bamboo"
              >
                {MOCKUP_STAT.num} {MOCKUP_STAT.label.toLowerCase()}
              </motion.p>
            )}

            {/* CTA: never waits for the fan; usable as soon as the panel is */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button type="button" tone="indigo" onClick={() => setQuoteOpen(true)}>
                {finalCta.primaryButton}
                <ArrowRight className="ml-2" size={15} />
              </Button>

              <Button href="/products" tone="indigo" variant="secondary">
                {finalCta.secondaryButton}
              </Button>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* Outside the Section so the fixed modal is not trapped in its z-10 stacking context
          (it must sit above the fixed Navbar, as on the product page). */}
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
