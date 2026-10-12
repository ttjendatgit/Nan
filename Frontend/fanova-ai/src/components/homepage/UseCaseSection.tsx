"use client";

// R6 UseCase: fans in real spaces. Material was close-up and controlled; this is wide and real. The
// native horizontal rail stays (mouse drag + native swipe). From 1024px the first, largest photo
// lies across the paper/indigo edge like a print laid over the table's edge, and scrolling down
// nudges the whole rail 8vw → 0 sideways until the section is centred (scroll cause, sideways
// effect), then stops. Photos open from the right edge as they come into the rail's view.
// Below 1024px: no overlap, no drift; 82vw photos with snap. Assets: useCasePhotos (A4).

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import AssetSlot from "@/components/ui/AssetSlot";
import MetaLine from "@/components/ui/MetaLine";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { useCases } from "@/data/homepageData";
import { useCasePhotos } from "@/data/homepageAssets";
import { CLIP_FROM, DUR_WIPE, EASE_NAN_STATE, INSTANT, wipeVariants } from "@/lib/motionTokens";

/** Photo widths from 1024px: the first is the large one; portraits and landscapes alternate. */
function photoWidth(i: number) {
  if (i === 0) return "lg:w-[min(40vw,560px)]";
  return useCasePhotos[i].ratio === "4 / 5" ? "lg:w-[min(28vw,400px)]" : "lg:w-[min(34vw,480px)]";
}

export default function UseCaseSection() {
  const reduce = useReducedMotion();

  // Mouse drag-to-scroll for the card rail. Only mouse pointers are handled: touch and pen keep
  // the browser's native swipe scrolling, which already works.
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0 || !railRef.current) return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startScrollLeft: railRef.current.scrollLeft };
    // Keep receiving moves even if the cursor leaves the rail mid-drag.
    railRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== e.pointerId || !railRef.current) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    railRef.current.scrollLeft = state.startScrollLeft - (e.clientX - state.startX);
  }

  function endDrag(e: PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== e.pointerId) return;
    if (railRef.current?.hasPointerCapture(e.pointerId)) {
      railRef.current.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
    setIsDragging(false);
  }

  // ── Drift: 0 when the rail's top enters the viewport, 1 when the rail is centred ──
  // Fed to CSS as --drift; only the lg: classes below turn it into movement.
  const { scrollYProgress } = useScroll({ target: railRef, offset: ["start end", "center center"] });
  const drift = useMotionValue(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!reduce) drift.set(p);
  });
  useEffect(() => {
    drift.set(reduce ? 1 : scrollYProgress.get());
  }, [reduce, drift, scrollYProgress]);

  return (
    <Section tone="indigo" id="applications">
      <div className="flex flex-col">
        {/* Section header: first in reading order; below the rail from 1024px */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          animate={reduce ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true }}
          transition={reduce ? INSTANT : { duration: 0.65 }}
          className="mb-10 md:mb-14 lg:order-2 lg:mb-0 lg:mt-16"
        >
          <SectionTitle
            tone="indigo"
            titleClassName="tracking-tight lg:max-w-xl"
            descriptionClassName="max-w-lg text-[0.9375rem] leading-7 md:text-[0.9375rem]"
            title={
              <>
                Nan phù hợp với{" "}
                <span className="text-bamboo">nhiều ngữ cảnh khác nhau.</span>
              </>
            }
            description="Từ sự kiện nhỏ đến chiến dịch thương hiệu lớn, Nan cung cấp giải pháp quạt phù hợp với từng mục đích và ngân sách."
          />
        </motion.div>

        {/* The rail. From 1024px it is pulled 80px up across the paper/indigo edge (the section's
            own 112px top padding + 80px), so the first, tallest photo overlaps Material. */}
        {/* While dragging, snapping is switched off (it would fight each scrollLeft update and
            jitter) and text selection is disabled; proximity snapping resumes on release. */}
        <div
          ref={railRef}
          role="group"
          aria-label="Ứng dụng của Nan theo ngữ cảnh, cuộn ngang để xem thêm"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          className={`-mx-6 scroll-px-6 overflow-x-auto px-6 pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-bamboo/50 lg:order-1 lg:-mt-[192px] [&::-webkit-scrollbar]:hidden ${
            isDragging ? "cursor-grabbing select-none snap-none" : "cursor-grab snap-x snap-proximity"
          }`}
        >
          <motion.ul
            className="flex items-end gap-5 lg:translate-x-[calc((1-var(--drift))*8vw)] lg:gap-8"
            style={{ "--drift": drift } as CSSProperties}
          >
            {useCases.map((useCase, i) => (
              <motion.li
                key={useCase.id}
                className={`w-[82vw] shrink-0 snap-start md:w-[60vw] ${photoWidth(i)}`}
                initial="hidden"
                whileInView="shown"
                animate={reduce ? "shown" : undefined}
                viewport={{ once: true, amount: 0.3 }}
              >
                {/* Unnumbered: the contexts are not a sequence (DECISIONS.md). */}
                <motion.figure
                  variants={wipeVariants(CLIP_FROM.right)}
                  transition={reduce ? INSTANT : { duration: DUR_WIPE, ease: EASE_NAN_STATE }}
                >
                  <div className="overflow-hidden">
                    {/* The first photo also settles from a slightly wider crop as the rail drifts in */}
                    <div className={i === 0 ? "lg:[scale:calc(1+(1-var(--drift))*0.06)]" : undefined}>
                      <AssetSlot asset={useCasePhotos[i]} sizes="(min-width: 1024px) 40vw, 82vw" />
                    </div>
                  </div>
                  <figcaption className="mt-4">
                    <h3 className="font-serif text-lg font-semibold">{useCase.title}</h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-6 text-on-indigo-muted">{useCase.description}</p>
                    <MetaLine tone="indigo" items={useCase.examples} className="mt-2 text-sm" />
                  </figcaption>
                </motion.figure>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </Section>
  );
}
