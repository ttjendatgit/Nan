"use client";

// R6 SM03 "Bàn mẫu xoè": the six materials are six sample strips pinned at one point. When the deck
// reaches the reading area it separates, fans out like a fan, and settles on Giấy Couche; choosing
// a strip raises it and opens its macro photo in the detail panel. Below 768px there is no deck:
// the materials read as the pages of a sample book, always fully visible.
// Assets: materialStrips (A3b) and materialMacros (A3a) in data/homepageAssets.ts.

import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import AssetSlot from "@/components/ui/AssetSlot";
import MetaLine from "@/components/ui/MetaLine";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { materials } from "@/data/homepageData";
import { materialMacros, materialStrips } from "@/data/homepageAssets";
import {
  CLIP_FROM,
  CLIP_OPEN,
  DUR_SIGNATURE,
  DUR_STATE,
  DUR_UI,
  DUR_WIPE,
  EASE_NAN,
  EASE_NAN_STATE,
  EASE_NAN_UI,
  INSTANT,
  PLEAT,
  wipeVariants,
} from "@/lib/motionTokens";

/** Fanned angle of each strip at full spread (globals.css .sample-strip scales it to ±30° below 1280px). */
const STRIP_ANGLES = [-37.5, -22.5, -7.5, 7.5, 22.5, 37.5];
/** Fanning starts from the two middle strips and moves outwards, one pleat at a time. */
const pleatFromCentre = (i: number) => Math.floor(Math.abs(i - (STRIP_ANGLES.length - 1) / 2));
/** The deck separates, then fans; the panel opens on Couche once the fan has settled. */
const SEPARATE = 0.2;
const SETTLED = 0.9;

const PRINT_CHECK =
  "File thiết kế được kiểm tra kích thước, độ phân giải, vùng an toàn, bleed và màu sắc trước khi chuyển sang sản xuất: kiểm tra trước in, tối ưu màu sắc, canh vùng an toàn, rồi mới sẵn sàng sản xuất.";

export default function MaterialSection() {
  // Reduced motion: same start state as the server render (no hydration mismatch); `animate`
  // then lands every element on its final state right after hydration, wherever it is, with an
  // instant transition. Normal motion is untouched (animate stays undefined).
  const reduce = useReducedMotion();

  const deckRef = useRef<HTMLDivElement>(null);
  // The deck fans once, when it reaches ~65% of the viewport.
  const deckInView = useInView(deckRef, { once: true, margin: "0px 0px -35% 0px" });
  const opened = Boolean(reduce) || deckInView;

  const [selected, setSelected] = useState(0);
  // The macro that was showing before the current one stays underneath while the new one opens.
  const [previous, setPrevious] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(i: number) {
    if (i === selected) return;
    setPrevious(selected);
    setSelected(i);
  }

  function onTabKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = materials.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = selected === last ? 0 : selected + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = selected === 0 ? last : selected - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  const firstOpen = previous === null;
  const item = materials[selected];

  return (
    <Section tone="paper" id="materials">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={reduce ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.65 }}
        className="mb-14"
      >
        {/* Title and description sit side by side on desktop, so the description stays a
            sibling here instead of going through SectionTitle's stacked description. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            tone="paper"
            className="lg:max-w-md"
            titleClassName="leading-tight tracking-tight"
            title={
              <>
                Cảm giác cao cấp{" "}
                <span className="text-navy">bắt đầu từ chất liệu.</span>
              </>
            }
          />
          <p className="max-w-sm text-[0.9375rem] leading-7 text-ink-muted">
            Một chiếc quạt đẹp không chỉ nằm ở thiết kế. Chất liệu, bề mặt
            hoàn thiện và hiệu ứng sau in quyết định cảm giác thật khi cầm trên tay.
          </p>
        </div>

        <Rule tone="paper" className="mt-10" />
      </motion.div>

      {/* ── Sample deck + detail panel (768px and up) ── */}
      <div className="hidden md:grid md:grid-cols-1 md:gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
        {/* Deck: six strips around one pin. A tablist; the panel beside it is the tabpanel. */}
        <div
          ref={deckRef}
          role="tablist"
          aria-label="Chất liệu"
          onKeyDown={onTabKeyDown}
          className="relative mx-auto h-[420px] w-full max-w-[560px] lg:col-span-7 xl:h-[520px] xl:max-w-[720px]"
        >
          {materials.map((m, i) => {
            const isSelected = selected === i;
            return (
              <motion.button
                key={m.name}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`material-tab-${i}`}
                aria-selected={isSelected}
                aria-controls="material-panel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(i)}
                onFocus={() => select(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") select(i);
                }}
                className={`sample-strip absolute bottom-0 left-1/2 -ml-12 w-24 cursor-pointer rounded-[3px] bg-paper-raised outline-none ring-1 ring-line-on-paper focus-visible:ring-2 focus-visible:ring-navy xl:-ml-[60px] xl:w-[120px] ${
                  isSelected ? "z-10" : ""
                }`}
                style={{ "--angle": `${STRIP_ANGLES[i]}deg`, "--i": i } as CSSProperties}
                initial={{ "--open": 0, "--lift": 0, "--raise": 0 }}
                animate={
                  {
                    "--open": opened ? 1 : 0,
                    "--lift": opened && !reduce ? [0, 1, 0] : 0,
                    "--raise": opened && isSelected ? 1 : 0,
                  }
                }
                transition={
                  reduce
                    ? INSTANT
                    : {
                        "--open": {
                          duration: DUR_SIGNATURE * 0.78,
                          delay: SEPARATE + pleatFromCentre(i) * PLEAT,
                          ease: EASE_NAN,
                        },
                        "--lift": { duration: SEPARATE * 2.5, times: [0, 0.4, 1], ease: EASE_NAN },
                        // The first raise waits for the fan to settle; later ones answer at once.
                        "--raise": { duration: DUR_UI, delay: firstOpen ? SETTLED : 0, ease: EASE_NAN_UI },
                      }
                }
              >
                <span className="sr-only">{m.name}</span>
                <AssetSlot asset={materialStrips[i]} tone="paper" vertical sizes="120px" />
                {/* Decorative name on the strip; the tab's real name is the sr-only text above */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 font-serif text-sm text-ink [writing-mode:vertical-rl]"
                >
                  {m.name}
                </span>
              </motion.button>
            );
          })}
          {/* The pin all strips turn around */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[9px] left-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-bamboo-deep ring-2 ring-paper"
          />
        </div>

        {/* Detail panel for the chosen strip */}
        <div
          id="material-panel"
          role="tabpanel"
          aria-labelledby={`material-tab-${selected}`}
          className="grid grid-cols-2 items-end gap-8 lg:col-span-5 lg:grid-cols-1 lg:gap-6"
        >
          {/* Macro photo: the new one opens upwards over the previous one */}
          <div className="relative aspect-square w-full bg-paper-deep lg:max-w-[360px]">
            {previous !== null && <AssetSlot asset={materialMacros[previous]} tone="paper" fill sizes="(min-width: 1024px) 40vw, 50vw" />}
            <motion.div
              key={selected}
              className="absolute inset-0"
              initial={{ clipPath: CLIP_FROM.bottom }}
              animate={opened ? { clipPath: CLIP_OPEN } : undefined}
              transition={reduce ? INSTANT : { duration: DUR_STATE, delay: firstOpen ? SETTLED : 0, ease: EASE_NAN_STATE }}
            >
              <AssetSlot asset={materialMacros[selected]} tone="paper" fill sizes="(min-width: 1024px) 40vw, 50vw" />
            </motion.div>
          </div>

          <motion.div
            key={`text-${selected}`}
            initial={{ opacity: 0 }}
            animate={opened ? { opacity: 1 } : undefined}
            transition={reduce ? INSTANT : { duration: DUR_STATE, delay: firstOpen ? SETTLED : 0 }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-3xl font-semibold leading-tight">{item.name}</h3>
              <MetaLine tone="paper" items={[item.tag]} className="shrink-0 text-sm" />
            </div>
            <p className="mt-3 max-w-sm text-sm leading-7 text-ink-muted">{item.description}</p>
          </motion.div>
        </div>
      </div>

      {/* ── Below 768px: the sample book. Every material always visible, no deck to operate. ── */}
      <ul className="border-t border-line-on-paper md:hidden">
        {materials.map((m, i) => (
          <motion.li
            key={m.name}
            initial="hidden"
            whileInView="shown"
            animate={reduce ? "shown" : undefined}
            viewport={{ once: true, amount: 0.4 }}
            className="border-b border-line-on-paper"
          >
            <motion.div
              variants={wipeVariants(CLIP_FROM.left)}
              transition={reduce ? INSTANT : { duration: DUR_WIPE, delay: i * PLEAT, ease: EASE_NAN_STATE }}
              className="grid grid-cols-[96px_1fr] gap-5 py-5"
            >
            <AssetSlot asset={materialMacros[i]} tone="paper" sizes="96px" />
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-xl font-semibold">{m.name}</h3>
                <MetaLine tone="paper" items={[m.tag]} className="shrink-0 text-sm" />
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{m.description}</p>
            </div>
            </motion.div>
          </motion.li>
        ))}
      </ul>

      {/* Print check — one sentence (DECISIONS.md §3), still */}
      <div className="mt-16 border-t border-line-on-paper pt-14">
        <SectionTitle
          tone="paper"
          as="h3"
          className="max-w-2xl"
          titleClassName="text-2xl leading-tight tracking-tight md:text-4xl"
          descriptionClassName="mt-4 text-sm leading-7 md:text-sm"
          title="Thiết kế đẹp trên màn hình. Chuẩn khi in thật."
          description={PRINT_CHECK}
        />
      </div>
    </Section>
  );
}
