"use client";

// R6 SM01 "Mở nếp", second half: one bamboo rib drops from the Hero fan's pivot onto the photo. The
// rib is scrubbed by scroll; the photo and the two headline lines open once, when they reach the
// reading line. Nothing else in the section moves.
//
// R10.2: an editorial introduction with one strong visual moment. The R10/R10.1 geometry (three
// NanField layers of ribs and arcs) is gone; the rib is the only thread left from the Hero. The
// photo is the real catalogue paper fan (brandPhoto), half the grid wide and bleeding off the right
// edge, and it opens downwards from the edge the rib lands on. R10.3: a quiet fan field from the
// same pivot and a soft light on the photograph give the indigo depth.
//
// R10.6: the rib continues the Hero's hinge. The Hero's fan pivot stands on the word space between
// the headline's two halves (published by HeroSection as --hero-hinge-x, a viewport x). The rib
// drops on that same vertical from the Hero's rail (between the copy and the actions, where the
// frame is empty), crosses the Hero's lower edge and ends in this section's top padding, above the
// headline (lg+, where the Hero's headline is one line). x is converted to the inner container
// with its 1.5rem + max(0, (100cqw − 80rem) / 2) offset (the section is the size container; cqw is
// its content box, already inside the 1.5rem padding). Below
// 1024px the Hero is a stacked cover with the actions under the headline, so there is no rib.

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
  const photoOpen = useInView(photoRef, { once: true, margin: "0px 0px -30% 0px" }) || Boolean(reduce);
  const headRef = useRef<HTMLHeadingElement>(null);
  const headOpen = useInView(headRef, { once: true, margin: "0px 0px -30% 0px" }) || Boolean(reduce);

  return (
    <Section
      tone="indigo"
      id="about"
      className="overflow-x-clip py-20 [container-type:inline-size] md:py-28"
      material="quiet"
      seam="var(--nan-dark)"
      atmosphere={{ x: "74%", y: "52%" }}
    >
      {/* The rib. Owned by this section and drawn up over the Hero's lower part (z above the Hero
          content), so the Hero itself is untouched. */}
      <motion.div
        ref={ribRef}
        aria-hidden="true"
        className="pointer-events-none absolute z-20 hidden w-px origin-top bg-bamboo/70 lg:block lg:left-[calc(var(--hero-hinge-x,47vw)-1.5rem-max(0px,(100cqw-80rem)/2))] lg:top-[calc(-112px-5.25rem)] lg:h-[calc(5.25rem+48px)]"
        style={{ scaleY: ribDraw }}
      />

      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Headline + body */}
        <div className="lg:col-span-6 lg:pt-4">
          <h2 ref={headRef} className="font-serif font-medium tracking-tight">
            <span className={LINE_MASK}>
              <motion.span
                className="block text-[2.5rem] leading-[1.08] md:text-[3.25rem] lg:text-[3.75rem]"
                initial={{ y: "115%" }}
                animate={{ y: headOpen ? "0%" : "115%" }}
                transition={reduce ? INSTANT : { duration: 0.8, ease: EASE_NAN }}
              >
                {brandStatement.headlineA}
              </motion.span>
            </span>
            <span className={`${LINE_MASK} mt-4`}>
              <motion.span
                className="block max-w-[34rem] text-[1.5rem] leading-[1.25] text-on-indigo-muted md:text-[1.75rem] lg:text-[2rem]"
                initial={{ y: "115%" }}
                animate={{ y: headOpen ? "0%" : "115%" }}
                transition={reduce ? INSTANT : { duration: 0.8, delay: 0.12, ease: EASE_NAN }}
              >
                {brandStatement.headlineB}
              </motion.span>
            </span>
          </h2>
          <motion.p
            className="mt-10 max-w-md text-[0.9375rem] leading-7 text-on-indigo-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: headOpen ? 1 : 0 }}
            transition={reduce ? INSTANT : { duration: 0.6, delay: 0.5 }}
          >
            {brandStatement.body}
          </motion.p>
        </div>

        {/* The photo: above the headline below 1024px (the rib comes straight down onto it);
            from 1024px half the grid, one beat lower, bleeding off the right edge. It opens
            downwards from its top edge, where the rib lands. */}
        {/* photoRef is on this never-clipped wrapper, so useInView sees it (DECISIONS §10) */}
        <div
          ref={photoRef}
          className="order-first -mx-6 md:mx-0 lg:order-none lg:col-span-6 lg:mr-[calc(-1*max(1.5rem,(100vw-80rem)/2))] lg:mt-24"
        >
          <motion.div
            className="overflow-hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: photoOpen ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
            transition={reduce ? INSTANT : { duration: DUR_SIGNATURE, ease: EASE_NAN }}
          >
            <motion.div
              initial={{ scale: 1.06 }}
              animate={{ scale: photoOpen ? 1 : 1.06 }}
              transition={reduce ? INSTANT : { duration: DUR_SIGNATURE * 1.4, ease: EASE_NAN }}
            >
              <AssetSlot asset={brandPhoto} sizes="(min-width: 1024px) 50vw, 100vw" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
