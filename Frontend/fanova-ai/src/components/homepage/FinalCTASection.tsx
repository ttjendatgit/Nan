"use client";

// R10.2 "The fan returns". The closing section is the Hero's own deep field (--nan-dark) and the
// Hero's own silk fan, come back large and cropped by the lower-right edge, as if it has followed
// the reader down the page. No panel, no rays, no geometry: the strongest visual of the site and
// one CTA. The R6/R10.1 navy panel (DECISIONS §1 exception) and its vector fan are gone. R10.3: a
// soft light behind the fan, the subliminal fibre and the fan's own faint ray halo. R10.4: the
// unverified "48h xem mockup" line is gone; the description says what happens next.
//
// ENTER: the field eases in from the FAQ's indigo (seam). BUILD: when the section reaches the
// reading line the fan is mounted and plays its own opening (SilkFan's built-in choreography, the
// same one as the Hero; static under reduced motion). PEAK: the headline rises out of its line
// mask, then the description and the CTA. The CTA is usable from the first frame.
//
// The fan is decorative (aria-hidden) and client-only (it builds its SVG in an effect), so it is
// loaded with next/dynamic, ssr: false, and only once the section is near.

import dynamic from "next/dynamic";
import { useRef, useState, useSyncExternalStore } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { finalCta } from "@/data/homepageData";
import { EASE_NAN, INSTANT } from "@/lib/motionTokens";

const SilkFan = dynamic(() => import("./silk-fan/SilkFan"), { ssr: false, loading: () => null });

/** PEAK starts this long after the fan begins to open. */
const PEAK = 0.5;

const LG_QUERY = "(min-width: 1024px)";
function subscribeToLg(onChange: () => void): () => void {
  const mql = window.matchMedia(LG_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export default function FinalCTASection() {
  const reduce = useReducedMotion();
  // General quote inquiry (no product): same modal + form as the product detail page.
  const [quoteOpen, setQuoteOpen] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  // Mount the fan a little before it is seen, so its opening plays in view.
  const near = useInView(sectionRef, { once: true, margin: "0px 0px 10% 0px" });
  const built = useInView(sectionRef, { once: true, margin: "0px 0px -35% 0px" }) || Boolean(reduce);
  const peak = (delay: number) => (reduce ? INSTANT : { duration: 0.7, delay: PEAK + delay, ease: EASE_NAN });

  // Only one fan is ever mounted (each SilkFan runs its own animation loop): the one for this
  // breakpoint. null on the server and during hydration, so neither renders there.
  const isLg = useSyncExternalStore(subscribeToLg, () => window.matchMedia(LG_QUERY).matches, () => null);

  const fan = (
    // R10.3: the fan's own ray halo returns (the R10.3 rays: 25, long/short, faint), drawn from its
    // real pivot: the page's one radial language, closing the page as it opened it.
    <SilkFan text="NAN" tiltTarget={0} className="h-full w-full" />
  );

  return (
    <>
      <Section
        tone="indigo"
        id="quote"
        seam="var(--color-indigo)"
        material="quiet"
        atmosphere={{ x: "76%", y: "78%" }}
        className="overflow-hidden bg-[var(--nan-dark)] pb-0 pt-0 md:pb-0 md:pt-0"
        innerClassName="z-10"
      >
        <div ref={sectionRef} className="relative lg:flex lg:min-h-[min(40rem,90svh)] lg:items-center">
          {/* The fan, below 1024px: cropped across the top, above the copy */}
          <div aria-hidden="true" className="pointer-events-none relative -mx-6 mt-12 h-[min(46vw,260px)] overflow-hidden lg:hidden">
            <div className="absolute left-1/2 top-0 aspect-[1132/648] w-[112vw] max-w-[640px] -translate-x-1/2">
              {near && isLg === false && fan}
            </div>
          </div>

          {/* The fan, 1024px and up: much larger than the copy, rising from the lower-right edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-[10vw] bottom-[-12%] hidden aspect-[1132/648] w-[min(62vw,900px)] lg:block xl:-right-[6vw]"
          >
            {near && isLg === true && fan}
          </div>

          <div className="relative pb-20 pt-8 lg:max-w-[30rem] lg:py-28">
            <h2 className="font-serif text-[2.5rem] font-medium leading-[1.1] tracking-tight md:text-[3rem] lg:text-[3.5rem]">
              <span className="block overflow-hidden pb-[0.08em] pt-[0.14em]">
                <motion.span
                  className="block"
                  initial={{ y: "115%" }}
                  animate={{ y: built ? "0%" : "115%" }}
                  transition={reduce ? INSTANT : { duration: 0.8, delay: PEAK, ease: EASE_NAN }}
                >
                  {finalCta.title}
                </motion.span>
              </span>
            </h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: built ? 1 : 0 }}
              transition={peak(0.3)}
              className="mt-6 max-w-md text-base leading-8 text-on-indigo-muted"
            >
              {finalCta.description}
            </motion.p>

            {/* One CTA. Never waits for the fan; usable from the first frame. */}
            <div className="mt-10">
              <Button type="button" tone="indigo" onClick={() => setQuoteOpen(true)}>
                {finalCta.primaryButton}
                <ArrowRight className="ml-2" size={15} />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Outside the Section so the fixed modal is not trapped in its z-10 stacking context
          (it must sit above the fixed Navbar, as on the product page). */}
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
