"use client";

// R6 SM01 "Mở nếp", second half: one bamboo rib drops from the Hero fan's pivot and becomes the edge
// the craftsperson photo (A5) opens from. The rib is scrubbed by scroll; the photo and the two
// headline lines open once, when they reach the reading line. Nothing else in the section moves.
//
// The rib and the photo's opening edge sit on the Hero fan's pivot:
//  · from 1024px the pivot is 74% across the Hero container (text 48% + half of the 52% stage) and
//    that container is min(section, 1280px) wide less its 48px side padding, so the pivot is
//    0.24 × (min(100cqw, 1280px) − 96px) right of centre (the section is the size container);
//  · at 768–1023px it is 75% across the content box, which matches this section's;
//  · below 768px the fan sits above the headline, centred.
// Asset: brandPhoto (A5) in data/homepageAssets.ts.

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import AssetSlot from "@/components/ui/AssetSlot";
import Section from "@/components/ui/Section";
import { brandStatement } from "@/data/homepageData";
import { brandPhoto } from "@/data/homepageAssets";
import { DUR_SIGNATURE, EASE_NAN, INSTANT } from "@/lib/motionTokens";

/** Line masks keep room for Vietnamese diacritics above and below the glyphs. */
const LINE_MASK = "block overflow-hidden pt-[0.14em] pb-[0.08em]";

export default function BrandStatementSection() {
  const reduce = useReducedMotion();

  // ── The rib: drawn from the fan pivot down to the photo, scrubbed by scroll ──
  const ribRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ribRef, offset: ["start 65%", "end 70%"] });
  const ribDraw = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!reduce) ribDraw.set(p);
  });
  useEffect(() => {
    ribDraw.set(reduce ? 1 : scrollYProgress.get());
  }, [reduce, ribDraw, scrollYProgress]);

  // ── The photo and the headline open once, at the reading line ──
  const photoRef = useRef<HTMLDivElement>(null);
  const photoOpen = useInView(photoRef, { once: true, margin: "0px 0px -40% 0px" }) || Boolean(reduce);
  const headRef = useRef<HTMLHeadingElement>(null);
  const headOpen = useInView(headRef, { once: true, margin: "0px 0px -40% 0px" }) || Boolean(reduce);

  return (
    <Section tone="indigo" id="about" className="py-24 [container-type:inline-size] md:py-36">
      {/* The rib. Owned by this section and drawn up over the Hero's lower part (z above the Hero
          content), so the Hero itself is untouched. */}
      <motion.div
        ref={ribRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-80px] z-20 h-[80px] w-px origin-top bg-bamboo md:left-3/4 md:top-[calc(-144px-34vh)] md:h-[calc(144px+34vh)] lg:left-[calc(50%+0.24*(min(100cqw,1280px)-96px))] lg:h-[calc(144px+34vh+96px)]"
        style={{ scaleY: ribDraw }}
      />

      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[calc(50%+0.24*(min(100cqw,1280px)-96px))_1fr] lg:gap-0">
        {/* Headline + body */}
        <div className="lg:pr-12">
          <h2 ref={headRef} className="font-serif font-semibold tracking-tight">
            <span className={LINE_MASK}>
              <motion.span
                className="block text-[2.5rem] leading-[1.08] md:text-[3.5rem] lg:text-[4.5rem]"
                initial={{ y: "115%" }}
                animate={{ y: headOpen ? "0%" : "115%" }}
                transition={reduce ? INSTANT : { duration: 0.7, ease: EASE_NAN }}
              >
                {brandStatement.headlineA}
              </motion.span>
            </span>
            <span className={`${LINE_MASK} mt-3`}>
              <motion.span
                className="block text-[1.75rem] leading-[1.18] text-on-indigo-muted md:text-[2.25rem] lg:text-[2.75rem]"
                initial={{ y: "115%" }}
                animate={{ y: headOpen ? "0%" : "115%" }}
                transition={reduce ? INSTANT : { duration: 0.7, delay: 0.14, ease: EASE_NAN }}
              >
                {brandStatement.headlineB}
              </motion.span>
            </span>
          </h2>
          <motion.p
            className="mt-10 max-w-md text-[0.9375rem] leading-7 text-on-indigo-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: headOpen ? 1 : 0 }}
            transition={reduce ? INSTANT : { duration: 0.5, delay: DUR_SIGNATURE }}
          >
            {brandStatement.body}
          </motion.p>
        </div>

        {/* The craftsperson photo, opening from the rib. Above the headline below 1024px, where the
            rib comes straight down onto it; beside it, one beat lower, from 1024px. */}
        <div ref={photoRef} className="order-first md:ml-[33.333%] lg:order-none lg:ml-0 lg:mt-24">
          <motion.div
            className="rib-open"
            initial={{ "--open": 0 }}
            animate={{ "--open": photoOpen ? 1 : 0 }}
            transition={reduce ? INSTANT : { duration: DUR_SIGNATURE, ease: EASE_NAN }}
          >
            <motion.div
              initial={{ scale: 1.04 }}
              animate={{ scale: photoOpen ? 1 : 1.04 }}
              transition={reduce ? INSTANT : { duration: DUR_SIGNATURE, ease: EASE_NAN }}
            >
              <AssetSlot asset={brandPhoto} sizes="(min-width: 1024px) 30vw, (min-width: 768px) 66vw, 100vw" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
