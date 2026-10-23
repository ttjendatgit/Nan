"use client";

// R6 SM03 "Bàn mẫu xoè": the six materials are six sample strips pinned at one point. When the deck
// reaches the reading area it separates, fans out like a fan, and settles on Giấy Couche; choosing
// a strip raises it and shows its name and use in the detail panel. Below 768px there is no deck:
// the materials read as the pages of a sample book, always fully visible.
//
// R10.2: tactile, not technical. The R10.1 print-table marks (guide arcs, fold axis, registration
// marks) and the labelled strip/macro placeholders are gone. Each strip now *is* its material:
// smooth coated paper, fibrous art paper, matte and gloss lamination, a foil band, a wooden handle
// (FINISHES below). When the A3 photographs exist they can return inside the panel. R10.4: the
// marketing tags (Popular, Premium...) and the print-table arc/marks are gone. R10.5: the panel
// beside the deck is a list of all six materials (name, surface, "Phù hợp"), the chosen one open,
// so the section informs without being operated; the prepress block below is a photo + checks
// composition instead of a heading over an empty half.

import { useRef, useState, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import AssetSlot from "@/components/ui/AssetSlot";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { materials, prepress } from "@/data/homepageData";
import { prepressPhoto } from "@/data/homepageAssets";
import {
  CLIP_FROM,
  DUR_SIGNATURE,
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

/** The surface of each sample strip, in `materials` order. Flat tokens and one sheen; no metallic
 *  gradient on paper (DECISIONS §1), so the foil is a solid bamboo band. */
const FINISHES: { className?: string; style?: CSSProperties; band?: boolean }[] = [
  { className: "bg-paper-raised" }, // Giấy Couche: smooth, bright, coated
  { className: "nan-material nan-material-paper bg-[#efe6d6]", style: { "--nan-fibre-opacity": 0.4 } as CSSProperties }, // Giấy mỹ thuật: fibre
  { className: "bg-[#ebe5db]" }, // Cán mờ: soft, matte
  {
    className: "bg-paper-raised",
    style: { backgroundImage: "linear-gradient(115deg, transparent 34%, rgb(255 255 255 / 0.9) 46%, transparent 58%)" },
  }, // Cán bóng: one gloss sheen
  { className: "bg-paper-raised", band: true }, // Ép kim: a foil band
  {
    className: "bg-bamboo",
    style: { backgroundImage: "repeating-linear-gradient(90deg, transparent 0 7px, rgb(115 95 62 / 0.14) 7px 8px)" },
  }, // Tay cầm: wood grain
];

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
  // False until the reader first changes the strip: the first raise waits for the fan to settle.
  const [touched, setTouched] = useState(false);

  function select(i: number) {
    if (i === selected) return;
    setTouched(true);
    setSelected(i);
  }

  const firstOpen = !touched;

  return (
    <Section tone="paper" id="materials" material="tactile" atmosphere={{ x: "30%", y: "40%" }} className="overflow-x-clip pb-16 pt-8 md:pb-20 md:pt-12 lg:pb-[calc(72px+4rem)]">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={reduce ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.65 }}
        className="mb-10 md:mb-12"
      >
        <SectionTitle
          tone="paper"
          title="Cảm giác cao cấp bắt đầu từ chất liệu."
          description="Một chiếc quạt đẹp không chỉ nằm ở thiết kế. Chất liệu, bề mặt hoàn thiện và hiệu ứng sau in quyết định cảm giác thật khi cầm trên tay."
        />
      </motion.div>

      {/* ── Sample deck + the material list (768px and up) ── */}
      <div className="hidden md:grid md:grid-cols-12 md:items-center md:gap-8 lg:gap-12">
        {/* The deck: six strips around one pin. A pointer shortcut to the list beside it (the list is
            the accessible control), so the strips are hidden from assistive tech and skip Tab. */}
        <div
          ref={deckRef}
          aria-hidden="true"
          className="relative mx-auto h-[360px] w-full max-w-[460px] md:col-span-6 xl:h-[440px] xl:max-w-[560px]"
        >
          {materials.map((m, i) => {
            const isSelected = selected === i;
            return (
              <motion.button
                key={m.name}
                type="button"
                tabIndex={-1}
                onClick={() => select(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") select(i);
                }}
                className={`sample-strip absolute bottom-0 left-1/2 -ml-10 aspect-[1/4] w-20 cursor-pointer overflow-hidden rounded-[3px] outline-none ring-1 ring-line-on-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_1px_1px_rgb(115_95_62/0.16),0_12px_20px_-12px_rgb(115_95_62/0.42)] xl:-ml-[50px] xl:w-[100px] ${
                  FINISHES[i].className ?? ""
                } ${isSelected ? "z-10" : ""}`}
                style={{ ...FINISHES[i].style, "--angle": `${STRIP_ANGLES[i]}deg`, "--i": i } as CSSProperties}
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
                {FINISHES[i].band && (
                  <span className="pointer-events-none absolute inset-x-0 top-[38%] h-4 bg-bamboo" />
                )}
                <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 font-serif text-sm text-ink [writing-mode:vertical-rl]">
                  {m.name}
                </span>
              </motion.button>
            );
          })}
          {/* The pin all strips turn around */}
          <span className="pointer-events-none absolute bottom-[9px] left-1/2 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-bamboo-deep ring-2 ring-paper" />
        </div>

        {/* The list: every material, name → surface → when to choose it. The chosen one is open and
            raised in the deck; the others show what they are for, so the section can be read without
            operating anything. Native buttons with aria-expanded (Tab / Enter / Space). */}
        <ul className="border-t border-line-on-paper md:col-span-6 lg:col-span-5 lg:col-start-8">
          {materials.map((m, i) => {
            const isSelected = selected === i;
            const detailId = `material-detail-${i}`;
            return (
              <li key={m.name} className="relative border-b border-line-on-paper">
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-px left-0 h-px w-10 origin-left bg-navy transition-[scale] duration-(--dur-state) ease-(--ease-nan-state) motion-reduce:transition-none ${
                    isSelected ? "scale-x-100" : "scale-x-0"
                  }`}
                />
                <button
                  type="button"
                  aria-expanded={isSelected}
                  aria-controls={detailId}
                  onClick={() => select(i)}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") select(i);
                  }}
                  className="block w-full rounded-sm py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <span className="flex items-baseline justify-between gap-4">
                    <span
                      className={`font-serif text-[1.375rem] font-medium leading-snug transition-colors duration-(--dur-state) motion-reduce:transition-none ${
                        isSelected ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {m.name}
                    </span>
                  </span>
                  <span id={detailId} className="block">
                    {isSelected && (
                      <span className="mt-1 block text-[0.9375rem] leading-7 text-ink">{m.surface}</span>
                    )}
                    <span className="mt-0.5 block text-sm leading-6 text-ink-muted">
                      <span className="font-medium text-bamboo-deep">Phù hợp: </span>
                      {m.bestFor}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
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
              className="grid grid-cols-[24px_1fr] gap-4 py-4"
            >
              <span
                aria-hidden="true"
                className={`relative block h-full min-h-14 overflow-hidden rounded-[2px] ring-1 ring-line-on-paper ${FINISHES[i].className ?? ""}`}
                style={FINISHES[i].style}
              >
                {FINISHES[i].band && <span className="absolute inset-x-0 top-[38%] h-2 bg-bamboo" />}
              </span>
              <div>
                <h3 className="font-serif text-xl font-medium">{m.name}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-7 text-ink">{m.surface}</p>
                <p className="mt-0.5 text-sm leading-6 text-ink-muted">
                  <span className="font-medium text-bamboo-deep">Phù hợp: </span>
                  {m.bestFor}
                </p>
              </div>
            </motion.div>
          </motion.li>
        ))}
      </ul>

      {/* ── Prepress: the photograph on the left, what is checked on the right (R10.5). One composition
          instead of a heading over an empty half. The checks are the four the site already states
          (DECISIONS §3 had them as one sentence; R10.5 lists them, unnumbered: not a sequence). ── */}
      <div className="mt-16 grid gap-8 border-t border-line-on-paper pt-12 md:mt-20 md:grid-cols-12 md:items-center md:gap-8 md:pt-16 lg:gap-12">
        <figure className="-mx-6 md:col-span-6 md:mx-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
            <AssetSlot asset={prepressPhoto} tone="paper" fill sizes="(min-width: 768px) 46vw, 100vw" />
          </div>
        </figure>
        <div className="md:col-span-6 lg:col-span-5 lg:col-start-8">
          <h3 className="font-serif text-[1.75rem] font-medium leading-tight md:text-[2rem]">
            {prepress.title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h3>
          <p className="mt-4 text-[0.9375rem] leading-7 text-ink-muted">{prepress.lead}</p>
          <ul className="mt-3 border-t border-line-on-paper">
            {prepress.checks.map((c) => (
              <li key={c} className="border-b border-line-on-paper py-3 text-[0.9375rem] leading-6 text-ink">
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.9375rem] leading-7 text-ink-muted">{prepress.approval}</p>
        </div>
      </div>
    </Section>
  );
}
