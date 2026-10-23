"use client";

// R10.3 UseCase: "one fan, many worlds". An editorial spread, not photo + list.
//
// Desktop (lg+): one tall photograph is the anchor. It crosses the paper/indigo edge from below
// (a print laid over the edge of the table) and bleeds off the left of the page. The heading and
// an indexed list of contexts sit on the right. A second, smaller photograph, matted in the
// section's own indigo, overlaps the anchor's lower-right corner with a caption: two scales of
// the same object. Behind the spread, one faint fan field radiates from the gutter between them.
//
// Interaction (R10.4: only what helps reading): the context under the reading line or the pointer
// gets a longer accent line and full-ink title. When a context has its own production photograph
// (useCaseScenes[...].photo, null today) the anchor cross-fades to it. The R10.3 re-framing and
// field rotation are gone, and the contexts are unnumbered (they are not a sequence). All text is
// always visible, so this adds no tab stops.
//
// Mobile (< lg): heading, the anchor full-bleed, context 01, the second photograph set to the
// right with its caption, then contexts 02 and 03.
//
// Frames own their aspect ratios; photographs fill them (object-cover), so production photos of
// any shape replace the interim catalogue shots through homepageAssets.ts alone.

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import AssetSlot from "@/components/ui/AssetSlot";
import MetaLine from "@/components/ui/MetaLine";
import NanField from "@/components/ui/NanField";
import Reveal from "@/components/ui/Reveal";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { useCases } from "@/data/homepageData";
import { useCaseDetail, useCaseFeature, useCaseScenes, type AssetDef } from "@/data/homepageAssets";
import { DUR_SIGNATURE, EASE_NAN, INSTANT } from "@/lib/motionTokens";

/** The three worlds this section tells (the brief's contexts; homepageData keeps the full list). */
const CONTEXTS = useCases.slice(0, 3);

/** A photograph that opens upwards from its bottom edge once, when it reaches the reading area. */
function Opening({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  // The wrapper is observed (never fully clipped); the clip follows it through variants
  // (DECISIONS §10: whileInView does not fire on an element its own clip-path hides completely).
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      animate={reduce ? "shown" : undefined}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
    >
      <motion.div
        className="relative h-full w-full overflow-hidden"
        variants={{ hidden: { clipPath: "inset(100% 0 0 0)" }, shown: { clipPath: "inset(0% 0 0 0)" } }}
        transition={reduce ? INSTANT : { duration: DUR_SIGNATURE * 1.1, ease: EASE_NAN }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** The anchor photograph: the active context's own photo when it has one, else the feature photo. */
function Anchor({ active, sizes }: { active: number; sizes: string }) {
  const reduce = useReducedMotion();
  const scene = useCaseScenes[CONTEXTS[active]?.id];
  const photo: AssetDef = scene?.photo ?? useCaseFeature;
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={photo.src || photo.id}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduce ? INSTANT : { duration: 0.7, ease: EASE_NAN }}
      >
        <AssetSlot asset={photo} fill sizes={sizes} />
      </motion.div>
    </AnimatePresence>
  );
}

/** The second photograph with its caption. */
function Detail({ className, frameClassName }: { className?: string; frameClassName?: string }) {
  return (
    <figure className={className}>
      <Opening className={`relative aspect-[4/3] w-full ${frameClassName ?? ""}`}>
        <AssetSlot asset={useCaseDetail} fill sizes="(min-width: 1024px) 26vw, 72vw" />
      </Opening>
      {useCaseDetail.caption && (
        <figcaption className="mt-3 font-serif text-[0.9375rem] italic leading-6 text-on-indigo-muted">
          {useCaseDetail.caption}
        </figcaption>
      )}
    </figure>
  );
}

function Context({
  index,
  active,
  onPoint,
}: {
  index: number;
  active: boolean;
  onPoint: () => void;
}) {
  const useCase = CONTEXTS[index];
  return (
    <div
      data-active={active || undefined}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onPoint();
      }}
      className="group relative border-t border-line-on-indigo pb-7 pt-6"
    >
      {/* Accent line on the top rule: lengthens on the active context */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-px left-0 h-px w-10 origin-left bg-bamboo/50 transition-[width,background-color] duration-(--dur-state) ease-(--ease-nan-state) group-data-active:w-28 group-data-active:bg-bamboo motion-reduce:transition-none"
      />
      <div>
        <div>
          <h3 className="font-serif text-[1.5rem] font-medium leading-snug text-on-indigo md:text-[1.625rem]">
            {useCase.title}
          </h3>
          <p className="mt-2 max-w-sm text-[0.9375rem] leading-7 text-on-indigo-muted">{useCase.description}</p>
          <MetaLine tone="indigo" items={useCase.examples} className="mt-2 text-sm" />
        </div>
      </div>
    </div>
  );
}

export default function UseCaseSection() {
  const [active, setActive] = useState(0);

  // The context the reader has reached: the reading line crossing the list picks it.
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 45%"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (p <= 0 || p >= 1) return;
    const next = Math.min(CONTEXTS.length - 1, Math.floor(p * CONTEXTS.length));
    if (next !== active) setActive(next);
  });

  return (
    <Section
      tone="indigo"
      id="applications"
      material="quiet"
      atmosphere={{ x: "34%", y: "48%" }}
      className="overflow-x-clip pb-20 pt-16 md:pb-28 md:pt-24"
    >
      <div className="relative lg:grid lg:grid-cols-12 lg:gap-12">
        {/* The fan field: radiates from the gutter between the anchor and the copy, up and to the
            right behind the copy; turns a few degrees with the active context (lg+). */}
        <NanField
          className="hidden lg:block"
          x="calc(50% - 24px)"
          y="96%"
          radius="min(820px, 62vw)"
          from={-8}
          to={86}
          ribs={13}
          arcs={[0.58, 0.84, 1]}
          inner={0.22}
          opacity={0.13}
        />

        {/* Heading: first in reading order; the right column from lg */}
        <Reveal className="relative mb-10 md:mb-14 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mb-12 lg:pt-4">
          <SectionTitle
            tone="indigo"
            title="Nan phù hợp với nhiều ngữ cảnh khác nhau."
            description="Cùng một chiếc quạt, mỗi ngữ cảnh cần kiểu dáng, chất liệu và cách hoàn thiện khác nhau."
          />
        </Reveal>

        {/* The anchor: crosses the paper edge (lg) and bleeds off the left of the page. From lg the
            second photograph, matted in indigo, overlaps its lower-right corner. */}
        <div className="relative -mx-6 md:mx-0 lg:col-span-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:-mt-[calc(6rem+72px)] lg:mb-36 lg:ml-[calc(-1*max(1.5rem,(100vw-80rem)/2))]">
          <Opening className="relative aspect-[4/5] md:aspect-[3/2] lg:aspect-[4/5]">
            <Anchor active={active} sizes="(min-width: 1024px) 52vw, 100vw" />
          </Opening>
          <Detail
            className="absolute -bottom-36 -right-[16%] hidden w-[46%] lg:block"
            frameClassName="outline-[10px] outline-indigo outline-solid"
          />
        </div>

        {/* Contexts. Below lg the second photograph sits between 01 and 02. */}
        <div ref={listRef} className="relative mt-12 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:mt-0">
          {CONTEXTS.map((c, i) => (
            <div key={c.id}>
              <Reveal delay={i * 0.06}>
                <Context index={i} active={i === active} onPoint={() => setActive(i)} />
              </Reveal>
              {i === 0 && <Detail className="mb-10 ml-auto mt-2 w-[72%] md:w-[52%] lg:hidden" />}
            </div>
          ))}
        </div>

      </div>
    </Section>
  );
}
