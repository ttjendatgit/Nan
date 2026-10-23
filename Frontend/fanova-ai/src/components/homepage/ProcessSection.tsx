"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowRight } from "lucide-react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import Button from "@/components/ui/Button";
import IndexMarker from "@/components/ui/IndexMarker";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { processSteps } from "@/data/homepageData";
import { useHydrated } from "@/lib/useHydrated";
import { ProcessFrameStack, STEP_FRAMES } from "./ProcessFrames";

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
      <Section tone="indigo" id="process" material="quiet" atmosphere={{ x: "70%", y: "60%" }} className="pt-12 md:pt-16">
        {/* R10.2: no chapter rule after UseCase; the two indigo sections run on as one surface. */}
        <Reveal className="mb-12 md:mb-14">
          <SectionTitle
            tone="indigo"
            title="Từ ý tưởng đến chiếc quạt hoàn thiện."
            description="Quy trình được thiết kế để bạn có thể yêu cầu báo giá, tư vấn thiết kế và nhận hàng mà không cần hiểu kỹ thuật in ấn."
          />
          <div className="mt-8">
            <Button type="button" tone="indigo" onClick={() => setQuoteOpen(true)}>
              Gửi yêu cầu báo giá
              <ArrowRight className="ml-2" size={14} />
            </Button>
          </div>
        </Reveal>

        {/* R10.2: left, the steps as a quiet vertical index; right, ONE large object, the fan being
            built stage by stage (skeleton → leaf → artwork → print → fold → finished). Below
            1024px the same object sits sticky above the list (on the indigo, so the steps pass
            under it), instead of a small box beside every step. */}
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* The object. Decorative: every stage is also told in the step text. */}
          <aside
            aria-hidden="true"
            className="sticky top-[var(--nav-height,64px)] z-10 -mx-6 bg-indigo px-6 pb-3 pt-2 lg:order-2 lg:top-[calc(var(--nav-height,64px)+8vh)] lg:col-span-5 lg:col-start-8 lg:mx-0 lg:bg-transparent lg:p-0"
          >
            <div className="mx-auto w-full max-w-[min(100%,calc(24vh*4/3))] lg:max-w-[min(100%,calc(48vh*4/3))]">
              <ProcessFrameStack activeFrame={activeFrame} reduce={Boolean(reduce)} />
            </div>
          </aside>

          <div ref={listRef} className="relative mt-6 border-t border-line-on-indigo lg:order-1 lg:col-span-6 lg:mt-0">
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
                <li
                  key={item.step}
                  ref={(el) => {
                    stepRefs.current[index] = el;
                  }}
                  data-state={stepState(index, storyStep)}
                  className="group relative border-b border-line-on-indigo"
                >
                  {/* Step tick on the rail (md+): short when waiting or done, long when active */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-[2.6rem] hidden h-px w-5 origin-left scale-x-[0.45] bg-bamboo transition-[scale,background-color] duration-(--dur-state) ease-(--ease-nan-state) group-data-[state=active]:scale-x-100 group-data-[state=upcoming]:bg-line-on-indigo motion-reduce:transition-none md:block lg:top-[2.6rem]"
                  />
                  {/* Mobile marker (below md, no rail): a bamboo segment on the row's top rule */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-px left-0 h-px w-10 origin-left bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-state) group-data-[state=upcoming]:scale-x-0 motion-reduce:transition-none md:hidden"
                  />

                  <div className="py-6 md:pl-10 lg:py-8">
                    <h3 className="flex items-baseline gap-4 font-serif text-xl font-medium leading-snug transition-colors duration-(--dur-state) ease-(--ease-nan-state) group-data-[state=completed]:text-on-indigo-muted group-data-[state=upcoming]:text-on-indigo-muted motion-reduce:transition-none md:text-[1.375rem]">
                      <IndexMarker tone="indigo" size="sm" number={item.step} className="w-7 shrink-0" />
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-lg pl-11 text-[0.9375rem] leading-7 text-on-indigo-muted">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* Outside the Section: the CTA sits inside a transformed motion.div, which would become the
          containing block of the fixed modal. */}
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
