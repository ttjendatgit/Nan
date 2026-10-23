"use client";

// R7a: Problem → transformation → Solution, told by one fan (DECISIONS.md §10).
//
// The section keeps the R6.2 editorial spread (two pages, a spine, problem and answer on the same
// row from 1024px) and adds a protagonist: a fan sitting on the spine, its centre rib on the fold.
// One scroll progress for the whole section (`story`, 0..1) drives everything, so the parts move as
// cause and effect instead of as separate entrances:
//   0.00–0.15  intro: both page heads as before; the fan arrives nearly shut and plain.
//   0.15–0.37  problem: the three problems open out of the spine one by one; the fan starts to open.
//   0.34–0.52  transition: the fan opens and the custom artwork begins to sweep across its leaf
//              from the problem page to the solution page.
//   0.48–0.70  transformation (the section's hero moment): the fan is fully open by 0.52 and the
//              artwork complete by 0.56, while the solution headline is on screen and the first
//              answers are already opening; the problems step back to the muted text colour (a
//              token, never lowered opacity). Fan and answers overlap on purpose: the fan opening
//              is what resolves each problem.
//   0.70–0.86  solution: the fan holds; the last answers complete.
//   0.86–1.00  resolution: everything holds still.
// Scrolling back runs it backwards. Below 1024px the same story reads top to bottom: problems, the
// fan, then the solution. Reduced motion: the story sits at 1 from the first frame after hydration.
//
// R10.2: the fan is the central object, not a figure in the gutter. From 1024px the spread is three
// columns: the problems on the left (set against the fan), the fan in the middle at up to 580px
// (was 260-320px), the answers on the right. The spine line is gone; the fan is the fold.

import { useEffect, useRef, type CSSProperties } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { problemSection, solutionSection } from "@/data/homepageData";
import { EASE_NAN, INSTANT } from "@/lib/motionTokens";
import ProblemSolutionFan, { FAN_PIVOT_ORIGIN, FAN_RATIO } from "./ProblemSolutionFan";

/** problemSection.points[i] ↔ solutionSection.pillars[j]. The pillar left over closes the spread. */
const PAIRS: [number, number][] = [
  [0, 0], // design that ignores the brand ↔ design for its context
  [1, 1], // material wrong for the use ↔ material chosen for its purpose
  [2, 3], // opaque ordering ↔ a quote before production
];
const CLOSING_PILLAR = 2; // flexible production

/** Story windows (fractions of the section's scroll). */
const PROBLEM_WINDOWS: [number, number][] = [
  [0.15, 0.25],
  [0.21, 0.31],
  [0.27, 0.37],
];
// The first answer is fully open by 0.57, inside the hero moment, while the fan is open.
const ANSWER_WINDOWS: [number, number][] = [
  [0.48, 0.57],
  [0.56, 0.66],
  [0.64, 0.74],
  [0.72, 0.84], // closing pillar
];
const PROBLEMS_STEP_BACK: [number, number] = [0.46, 0.58];
/** The solution headline opens out of the spine during the transition, so it is already on the
 *  page when the fan reaches full (tied to the story, not to its own viewport trigger). */
const SOLUTION_HEAD_WINDOW: [number, number] = [0.3, 0.44];
/** Fan: opening keyframes (fully open at 0.52) and the artwork sweep (complete at 0.56). */
const FAN_OPEN_AT = [0, 0.15, 0.34, 0.52];
const FAN_SWEEP: [number, number] = [0.34, 0.56];
const FAN_SETTLE: [number, number] = [0.15, 0.52];

/** Overdamped: the story trails the scroll a touch, with no overshoot. */
const STORY_SPRING = { stiffness: 120, damping: 30, restDelta: 0.0005 };

/** Text colours as literal values so Motion can blend them (mirror of the --color-* tokens). */
const ON_INDIGO = "#f4efe6"; // --color-on-indigo
const ON_INDIGO_MUTED = "#b9b2a6"; // --color-on-indigo-muted

/** From 1024px each grid row holds one problem and its answer, either side of the fan. */
const ROW_START = ["lg:row-start-2", "lg:row-start-3", "lg:row-start-4", "lg:row-start-5"];

/** Page-head measure. */
const HEAD_MEASURE = "max-w-[28rem]";

function ProblemRow({ story, text, window, color, row }: {
  story: MotionValue<number>;
  text: string;
  window: [number, number];
  color: MotionValue<string>;
  row: string;
}) {
  const reveal = useTransform(story, window, [0, 1]);
  return (
    // Opens out of the spine from 1024px (its right edge), from the left edge below that
    <motion.div
      className={`wipe-x relative z-10 border-t border-line-on-indigo py-5 [--from:0%] lg:col-start-1 lg:py-6 lg:pr-10 lg:text-right lg:[--from:100%] ${row}`}
      style={{ "--reveal": reveal } as CSSProperties}
    >
      <motion.p
        className="max-w-[26rem] text-base leading-7 lg:ml-auto lg:max-w-[18rem] xl:max-w-[20rem]"
        style={{ color }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

function AnswerRow({ story, pillar, window, className }: {
  story: MotionValue<number>;
  pillar: (typeof solutionSection.pillars)[number];
  window: [number, number];
  className: string;
}) {
  const reveal = useTransform(story, window, [0, 1]);
  return (
    // Opens out of the spine (its left edge), hairline included
    <motion.div
      className={`wipe-x relative z-10 lg:col-start-3 lg:pl-10 ${className}`}
      style={{ "--reveal": reveal } as CSSProperties}
    >
      <div className="max-w-[30rem] lg:max-w-[20rem]">
        <h3 className="font-serif text-xl font-medium leading-snug">{pillar.title}</h3>
        <p className="mt-2 text-[0.9375rem] leading-7 text-on-indigo-muted">{pillar.description}</p>
      </div>
    </motion.div>
  );
}

export default function ProblemSolutionSection() {
  const reduce = useReducedMotion();

  // ── The story ──
  // Two readings of the same scroll, one per layout:
  //  · from 1024px the story follows the "story frame": an invisible box over the page heads and the
  //    first two rows, i.e. the solution headline, the first answers and the fan. Its centre goes
  //    from 110.8% of the viewport to 30.8%: at story 0.6 it sits at 62.8%, and it only travels 16%
  //    of the viewport across 0.5–0.7, so through the whole hero moment the headline stays below
  //    the navbar and the fan above the fold, down to a 1024×768 screen;
  //  · below 1024px the story reads top to bottom (problems, fan, solution), so it follows the
  //    whole grid's passage from 85% to 60% of the viewport.
  // Which one applies is decided outside render (a media query listener), never in the markup.
  const gridRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: gridProgress } = useScroll({ target: gridRef, offset: ["start 0.85", "end 0.6"] });
  const { scrollYProgress: frameProgress } = useScroll({ target: frameRef, offset: ["center 1.108", "center 0.308"] });
  const story = useSpring(0, STORY_SPRING);
  const desktop = useRef(false);
  const measured = useRef(false);
  const follow = (source: "grid" | "frame", p: number) => {
    if (reduce || (source === "frame") !== desktop.current) return;
    // The first reading (load or reload mid-page) lands at once instead of springing up from 0.
    if (!measured.current) {
      measured.current = true;
      story.jump(p);
    } else story.set(p);
  };
  useMotionValueEvent(gridProgress, "change", (p) => follow("grid", p));
  useMotionValueEvent(frameProgress, "change", (p) => follow("frame", p));
  useEffect(() => {
    if (reduce) {
      story.jump(1);
      return;
    }
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      desktop.current = mql.matches;
      story.jump((mql.matches ? frameProgress : gridProgress).get());
    };
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, [reduce, story, frameProgress, gridProgress]);

  // ── The fan ──
  const fanOpen = useTransform(story, FAN_OPEN_AT, [0.03, 0.06, 0.3, 1]);
  const fanSweep = useTransform(story, FAN_SWEEP, [0, 1]);
  const fanScale = useTransform(story, FAN_SETTLE, [0.82, 1]);
  const fanRotate = useTransform(story, FAN_SETTLE, [-3, 0]);
  const fanY = useTransform(story, FAN_SETTLE, [16, 0]);
  const fanOpacity = useTransform(story, [0, 0.12], [0, 1]);
  // ── The problems step back once the fan has done its work ──
  const problemColor = useTransform(story, PROBLEMS_STEP_BACK, [ON_INDIGO, ON_INDIGO_MUTED]);
  const solutionHeadReveal = useTransform(story, SOLUTION_HEAD_WINDOW, [0, 1]);

  return (
    <Section tone="indigo" className="overflow-x-clip pb-16 pt-20 md:pb-20 md:pt-24" material="quiet" atmosphere={{ x: "50%", y: "62%" }}>
      {/* DOM order is the mobile story: problem head, problems, fan, solution head, answers. From
          1024px every item is placed on the two-page grid explicitly. */}
      <div
        ref={gridRef}
        className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,clamp(300px,calc(100vw-760px),440px))_minmax(0,1fr)]"
      >

        {/* Left page head */}
        <motion.div
          className="relative z-10 pb-8 lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:pb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          animate={reduce ? { opacity: 1 } : undefined}
          viewport={{ once: true }}
          transition={reduce ? INSTANT : { duration: 0.7, ease: EASE_NAN }}
        >
          <SectionTitle
            tone="indigo"
            className={HEAD_MEASURE}
            titleClassName="lg:text-[2.5rem] lg:leading-[1.12]"
            descriptionClassName="mt-5 max-w-[26rem] text-[0.9375rem] leading-7 md:text-[0.9375rem]"
            title={problemSection.headline}
            description={problemSection.body}
          />
        </motion.div>

        {/* Problems */}
        {PAIRS.map(([p], i) => (
          <ProblemRow
            key={`problem-${p}`}
            story={story}
            text={problemSection.points[p]}
            window={PROBLEM_WINDOWS[i]}
            color={problemColor}
            row={ROW_START[i]}
          />
        ))}

        {/* The story frame (1024px and up): heads + the first two rows, the area that must be on
            screen at the hero moment. Invisible; only measured. */}
        <div
          ref={frameRef}
          aria-hidden="true"
          data-story-frame
          className="pointer-events-none hidden lg:col-span-3 lg:col-start-1 lg:row-start-1 lg:row-end-4 lg:block"
        />

        {/* The fan: centred on the spine across the first two rows from 1024px, so it sits right
            under the solution headline and between the first problems and answers (flex, not a
            transform, so its measured position is its real one). Under the text layer, in the
            gutter only. Below 1024px: between the problems and the solution. */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative my-10 lg:col-start-2 lg:row-start-2 lg:row-end-6 lg:my-0 lg:flex lg:items-center lg:justify-center"
        >
          <div className="relative mx-auto w-full max-w-[380px] lg:mx-0 lg:max-w-none">
            <motion.div
              style={{
                aspectRatio: FAN_RATIO,
                scale: fanScale,
                rotate: fanRotate,
                y: fanY,
                opacity: fanOpacity,
                originX: FAN_PIVOT_ORIGIN.x,
                originY: FAN_PIVOT_ORIGIN.y,
              }}
            >
              <ProblemSolutionFan open={fanOpen} sweep={fanSweep} className="block h-full w-full" />
            </motion.div>
          </div>
        </div>

        {/* Right page head: opens out of the spine (its left edge) during the transition */}
        <motion.div
          className="wipe-x relative z-10 pb-8 lg:col-start-2 lg:col-end-4 lg:row-start-1 lg:pb-12"
          style={{ "--reveal": solutionHeadReveal } as CSSProperties}
        >
          <SectionTitle
            tone="indigo"
            className={`lg:ml-auto ${HEAD_MEASURE}`}
            title={solutionSection.headline}
            titleClassName="lg:text-[2.5rem] lg:leading-[1.12]"
          />
        </motion.div>

        {/* Answers, in the order of their problems, then the closing pillar */}
        {PAIRS.map(([, s], i) => (
          <AnswerRow
            key={`answer-${s}`}
            story={story}
            pillar={solutionSection.pillars[s]}
            window={ANSWER_WINDOWS[i]}
            className={`border-t border-line-on-indigo py-6 ${ROW_START[i]}`}
          />
        ))}
        <AnswerRow
          story={story}
          pillar={solutionSection.pillars[CLOSING_PILLAR]}
          window={ANSWER_WINDOWS[3]}
          className={`border-y border-line-on-indigo py-6 ${ROW_START[3]}`}
        />
      </div>
    </Section>
  );
}
