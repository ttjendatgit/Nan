"use client";

// Homepage Hero (R19), "The unfolding atelier". The frame is built like a page of a sample book
// lying open on a dark atelier stage: a sheet of warm ivory paper covers the left of the frame and
// runs along its foot, and its edge is folded back on a slant, so the paper opens an irregular
// window onto the navy stage. The complete Nan fan stands in that window, its handle resting on
// the paper's lower band, its shadow falling on the paper. Everything else is printed on the sheet:
// the headline and the brand line on the upper leaf; on the band beneath the fan, the line where the
// visitor writes the word the fan will carry, and the actions.
//
// Sequence. A (idle): the finished scene, fan printed NAN. B (writing): focusing the line lifts
// the fan a little toward the visitor and brightens the paper's folded edge. C (reveal): when the
// visitor pauses (or presses "In lên quạt"), the fan folds shut along its own opening path, is
// reprinted with their word, and opens again; the band states that this is a preview, and the
// quote request carries the word. Reduced motion: the same steps without the fold.
//
// Desktop: one L-shaped sheet. Phones/tablets: an upper leaf and a lower band with the window
// between them (two sheets, same fold language). SilkFan alone: no WebGL contexts.

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import FanObject from "../hero-r18/FanObject";
import { IMPRINT_DEFAULT, IMPRINT_MAX, cleanDraft, countGraphemes, toImprint } from "./imprint";
import "./atelier.css";

type Phase = "idle" | "writing" | "printing" | "revealed";

export default function HeroAtelier() {
  const fold = useRef(0);
  const fanRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [word, setWord] = useState(IMPRINT_DEFAULT);
  /* the word last asked for: the quote note follows it at once, even before the fold finishes */
  const [requested, setRequested] = useState(IMPRINT_DEFAULT);
  const [phase, setPhase] = useState<Phase>("idle");
  const [focused, setFocused] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const fieldId = useId();
  const hintId = useId();

  /* The reprint: fold shut (≈ 0.55 s, the opening path run backwards), swap the print, and let the
     fan open again with the new word (SilkFan's own 2.6 s opening). */
  const reprint = useCallback(
    (next: string) => {
      if (next === word) return;
      setRequested(next);
      const done = () => {
        fold.current = 0;
        setWord(next);
        setPhase(next === IMPRINT_DEFAULT ? "idle" : "revealed");
        setAnnounce(next === IMPRINT_DEFAULT ? "Quạt trở về chữ NAN." : `Bản xem trước: quạt in chữ ${next}.`);
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
      setPhase("printing");
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 550);
        fold.current = p * p * (3 - 2 * p);
        if (p < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    },
    [word],
  );

  /* Reprint once the visitor pauses (never in the middle of an IME composition). */
  useEffect(() => {
    if (composing.current || !draft.trim()) return;
    const id = window.setTimeout(() => reprint(toImprint(draft)), 1100);
    return () => window.clearTimeout(id);
  }, [draft, reprint]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    reprint(toImprint(draft));
  };
  const onReset = () => {
    setDraft("");
    reprint(IMPRINT_DEFAULT);
    inputRef.current?.focus(); // the reset button disappears; keep the visitor on the line
  };

  /* BrandStatement's bamboo rib drops at --hero-hinge-x: from the fan's handle. */
  useEffect(() => {
    const el = fanRef.current;
    if (!el) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--hero-hinge-x", `${el.getBoundingClientRect().left}px`);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      root.style.removeProperty("--hero-hinge-x");
    };
  }, []);

  const custom = word !== IMPRINT_DEFAULT;
  const used = countGraphemes(draft.trim());
  const state = phase === "idle" && focused ? "writing" : phase;

  return (
    <>
      <section className="atl relative isolate overflow-hidden" data-state={state} aria-labelledby={`${fieldId}-h1`}>
        {/* the stage: deep navy with one soft light where the fan stands */}
        <div aria-hidden="true" className="atl-stage absolute inset-0" />

        {/* the paper: one folded sheet (desktop) or a leaf and a band (phones/tablets) */}
        <div aria-hidden="true" className="atl-paper-shade absolute inset-0">
          <div className="atl-paper atl-paper-a nan-material nan-material-paper absolute inset-0" />
          <div className="atl-paper atl-paper-b nan-material nan-material-paper absolute inset-0" />
        </div>
        <div aria-hidden="true" className="atl-flap atl-flap-a absolute inset-0" />
        <div aria-hidden="true" className="atl-flap atl-flap-b absolute inset-0" />
        <div aria-hidden="true" className="atl-flap atl-flap-desk absolute inset-0" />
        <svg aria-hidden="true" className="atl-edge absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline className="atl-edge-desk" points="34,0 41,72 100,79" />
          <polyline className="atl-edge-port" points="100,37 0,43" />
          <polyline className="atl-edge-port" points="0,77 100,72" />
        </svg>

        {/* the object, standing in the window, its handle on the paper */}
        <div ref={fanRef} className="atl-fan-anchor absolute">
          <div aria-hidden="true" className="atl-contact absolute" />
          <div className="atl-fan-lift absolute">
            <FanObject className="atl-fan" text={word} foldRef={fold} />
          </div>
        </div>

        {/* printed on the upper leaf */}
        <div className="atl-title absolute z-20">
          <h1 id={`${fieldId}-h1`} className="atl-h1 hero-rise font-serif font-medium tracking-tight" style={{ "--rise-delay": "0.15s" } as CSSProperties}>
            <span className="block">Di sản trong</span> <span className="atl-h1-step block">từng nếp quạt.</span>
          </h1>
          <p className="atl-lede hero-rise" style={{ "--rise-delay": "0.3s" } as CSSProperties}>
            Từ ý tưởng của bạn, Nan tạo nên chiếc quạt mang dấu ấn riêng.
          </p>
          <p className="atl-offer hero-rise" style={{ "--rise-delay": "0.4s" } as CSSProperties}>
            {heroConfig.subheadline}
          </p>
        </div>

        {/* printed on the band beneath the fan: the writing line */}
        <form onSubmit={onSubmit} className="atl-write hero-rise absolute z-20" style={{ "--rise-delay": "0.55s" } as CSSProperties}>
          <label htmlFor={fieldId} className="atl-write-label block">
            Viết tên của bạn, Nan in thử lên quạt
          </label>
          <div className="atl-write-row flex items-end gap-3">
            <input
              ref={inputRef}
              id={fieldId}
              value={draft}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              aria-describedby={hintId}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onCompositionStart={() => (composing.current = true)}
              onCompositionEnd={(e) => {
                composing.current = false;
                setDraft(cleanDraft(e.currentTarget.value));
              }}
              onChange={(e) => setDraft(composing.current ? e.target.value : cleanDraft(e.target.value))}
              placeholder="Tên thương hiệu, sự kiện…"
              className="atl-input min-w-0 flex-1 bg-transparent font-serif outline-none"
            />
            <button type="submit" className="atl-print shrink-0">
              In lên quạt
            </button>
          </div>
          <div id={hintId} className="atl-write-hint flex flex-wrap items-center gap-x-4 gap-y-1">
            {custom ? (
              <>
                <span>Bản xem trước. Quạt thật được in theo thiết kế bạn duyệt.</span>
                <button type="button" onClick={onReset} className="atl-reset">
                  Về chữ NAN
                </button>
              </>
            ) : (
              <span className="atl-write-hint-count">
                {used}/{IMPRINT_MAX} ký tự
              </span>
            )}
          </div>
        </form>

        <div className="atl-actions hero-rise absolute z-20 flex flex-wrap items-center" style={{ "--rise-delay": "0.7s" } as CSSProperties}>
          <Button type="button" tone="paper" className="whitespace-nowrap" onClick={() => setQuoteOpen(true)}>
            {heroConfig.primaryCta}
          </Button>
          <Link href="/products" className="atl-link group inline-flex items-center gap-2 whitespace-nowrap">
            {heroConfig.secondaryCta}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </section>

      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} initialMessage={requested !== IMPRINT_DEFAULT ? `Chữ muốn in trên quạt: ${requested}` : undefined} />
    </>
  );
}
