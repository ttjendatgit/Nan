"use client";

import { useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import Card from "@/components/ui/Card";
import MetaLine from "@/components/ui/MetaLine";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { useCases } from "@/data/homepageData";

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

  return (
    <Section tone="indigo" id="applications">
      {/* Section header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65 }}
        className="mb-10 md:mb-14"
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

      {/* Use cases as a horizontal editorial strip -- browse by scrolling,
          not another centered heading + 3 equal cards row */}
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
        className={`-mx-6 flex gap-5 overflow-x-auto px-6 pb-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-bamboo/50 [&::-webkit-scrollbar]:hidden ${
          isDragging ? "cursor-grabbing select-none snap-none" : "cursor-grab snap-x snap-proximity"
        }`}
      >
        {useCases.map((useCase, index) => (
          <motion.div
            key={useCase.id}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="w-[260px] shrink-0 snap-start sm:w-[300px]"
          >
            {/* Unnumbered: the contexts are not a sequence (DECISIONS.md). Examples are a
                MetaLine instead of bordered mono chips. */}
            <Card tone="indigo" className="h-full p-6">
              <h3 className="font-serif text-lg font-semibold">{useCase.title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-on-indigo-muted">{useCase.description}</p>
              <MetaLine tone="indigo" items={useCase.examples} className="mt-4 text-sm" />
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
