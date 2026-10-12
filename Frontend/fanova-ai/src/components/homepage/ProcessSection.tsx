"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowRight } from "lucide-react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import Button from "@/components/ui/Button";
import IndexMarker from "@/components/ui/IndexMarker";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { processSteps } from "@/data/homepageData";
import { INSTANT } from "@/lib/motionTokens";
import { useHydrated } from "@/lib/useHydrated";
import { FRAMES, FrameLayer, ProcessFrameStack, STEP_FRAMES } from "./ProcessFrames";

type StepState = "neutral" | "upcoming" | "active" | "completed";

/** Where the reader's eye is taken to be. The rail fills down to this line, and the step it
 *  crosses is the active one, so the rail tip and the emphasised step never disagree. */
const READING_LINE = "60%";

function stepState(index: number, activeStep: number | null): StepState {
  if (activeStep === null) return "neutral";
  if (index === activeStep) return "active";
  return index < activeStep ? "completed" : "upcoming";
}

export default function ProcessSection() {
  const reduce = useReducedMotion();
  // General quote inquiry (no product): opens the same modal as FinalCTA directly, instead of
  // scrolling to #quote first.
  const [quoteOpen, setQuoteOpen] = useState(false);

  // ── Scroll story: rail progress → active step ──
  // The reading line's position through the step list, 0 (list top) to 1 (list bottom). Native
  // scroll only: nothing is pinned, locked or re-timed.
  const listRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  // Each step's top as a fraction of the list height, measured on mount and whenever the list
  // resizes, so the scroll handler only compares numbers and never reads layout.
  const stepStarts = useRef<number[]>([]);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: [`start ${READING_LINE}`, `end ${READING_LINE}`],
  });
  const railFill = useMotionValue(0);
  // -1 = the reading line hasn't reached step 01 yet. Only changes when the line crosses into
  // another step, so scrolling re-renders this section at most once per step boundary.
  const [activeStep, setActiveStep] = useState(-1);
  // R6 SM02: the production frame the design has reached (-1..5). Step 04 holds two frames, the
  // print and the fold, split at the middle of the step.
  const [activeFrame, setActiveFrame] = useState(-1);
  // false on the server and during hydration, true after: the story's state only applies once
  // hydrated, so the server HTML and the first client render match.
  const hydrated = useHydrated();

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const height = list.offsetHeight || 1;
      stepStarts.current = stepRefs.current.map((li) => (li ? li.offsetTop / height : 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (reduce) return;
    railFill.set(progress);
    const starts = stepStarts.current;
    let next = -1;
    if (progress > 0) {
      starts.forEach((start, i) => {
        if (progress >= start) next = i;
      });
    }
    setActiveStep(next);
    let frame = next < 0 ? -1 : STEP_FRAMES[next][0];
    if (next === 3 && progress >= (starts[3] + (starts[4] ?? 1)) / 2) frame = STEP_FRAMES[3][1];
    setActiveFrame(frame);
  });

  // Reduced motion: no scroll story. The rail sits drawn in full and every step stays in full.
  useEffect(() => {
    railFill.set(reduce ? 1 : scrollYProgress.get());
  }, [reduce, railFill, scrollYProgress]);

  // null = every step in full: the server render, hydration, reduced motion (and the no-JS page).
  const storyStep = reduce || !hydrated ? null : activeStep;
  return (
    <>
      <Section tone="indigo" id="process">
        {/* Chapter break: follows UseCase on the same indigo surface */}
        <Rule tone="indigo" className="-mt-20 mb-20 md:-mt-28 md:mb-28" />

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          animate={reduce ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true }}
          transition={reduce ? INSTANT : { duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
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
            <Button type="button" tone="indigo" onClick={() => setQuoteOpen(true)}>
              Gửi yêu cầu báo giá
              <ArrowRight className="ml-2" size={14} />
            </Button>
          </div>
        </motion.div>

        {/* Process steps — numbered structural list, not stacked cards. The one homepage block
            that keeps numbering (DECISIONS.md), via IndexMarker. A hairline rail on the left fills
            with scroll; the step the reading line crosses is active (full title, long tick), the
            ones before it completed and the ones after it waiting: muted title, never faded
            (DECISIONS.md: no lowered text opacity). */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
        <div ref={listRef} className="relative border-t border-line-on-indigo lg:col-span-7">
          {/* Rail (md+): a quiet track and its bamboo fill, scaled from the top by scroll */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-line-on-indigo md:block"
          />
          <motion.div
            aria-hidden="true"
            data-rail-fill
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-px origin-top bg-bamboo md:block"
            style={{ scaleY: railFill }}
          />

          <ol>
            {processSteps.map((item, index) => (
              <motion.li
                key={item.step}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                data-state={stepState(index, storyStep)}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                animate={reduce ? { opacity: 1, y: 0 } : undefined}
                viewport={{ once: true }}
                transition={reduce ? INSTANT : { duration: 0.72, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group relative border-b border-line-on-indigo"
              >
                {/* Step tick on the rail (md+): short when waiting or done, long when active */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-1/2 hidden h-px w-5 origin-left scale-x-[0.45] bg-bamboo transition-[scale,background-color] duration-(--dur-state) ease-(--ease-nan-state) group-data-[state=active]:scale-x-100 group-data-[state=upcoming]:bg-line-on-indigo motion-reduce:transition-none md:block"
                />
                {/* Mobile marker (below md, no rail): a bamboo segment on the row's top rule,
                    drawn once the reading line reaches the step */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-px left-0 h-px w-10 origin-left bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-state) group-data-[state=upcoming]:scale-x-0 motion-reduce:transition-none md:hidden"
                />

                <div className="flex flex-col gap-5 py-7 pl-0 md:flex-row md:items-center md:py-8 md:pl-8 lg:py-14">
                  {/* Step number */}
                  <div className="shrink-0 md:w-16">
                    <IndexMarker tone="indigo" number={item.step} />
                  </div>

                  {/* Divider */}
                  <div className="hidden h-12 w-px bg-line-on-indigo md:block" />

                  {/* Content */}
                  <div className="flex-1">
                    {/* Below 1024px each step carries its own production frame(s), opening with
                        the same gesture as in the sticky frame when the step becomes active */}
                    <div aria-hidden="true" className="mb-6 grid max-w-sm gap-3 lg:hidden">
                      {STEP_FRAMES[index].map((f) => (
                        <FrameLayer
                          key={FRAMES[f].asset.id}
                          asset={FRAMES[f].asset}
                          kind={FRAMES[f].kind}
                          shown={Boolean(reduce) || activeFrame >= f}
                          reduce={Boolean(reduce)}
                          className="relative w-full overflow-hidden"
                          style={{ aspectRatio: FRAMES[f].asset.ratio }}
                          sizes="(max-width: 1023px) 384px, 1px"
                        />
                      ))}
                    </div>
                    <h3 className="font-serif text-xl font-semibold transition-colors duration-(--dur-state) ease-(--ease-nan-state) group-data-[state=completed]:text-on-indigo-muted group-data-[state=upcoming]:text-on-indigo-muted motion-reduce:transition-none">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-on-indigo-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* R6 SM02: the sticky production frame (1024px and up). Decorative: every stage is also
            told in the step text. */}
        <aside aria-hidden="true" className="hidden lg:col-span-5 lg:block">
          <ProcessFrameStack activeFrame={activeFrame} reduce={Boolean(reduce)} />
        </aside>
        </div>
      </Section>

      {/* Outside the Section: the CTA sits inside a transformed motion.div, which would become the
          containing block of the fixed modal. */}
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
