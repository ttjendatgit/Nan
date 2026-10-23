"use client";

// Homepage Hero (R18, "Dấu ấn của bạn"). The Hero is a working proof of what Nan does: it prints a
// customer's words on a fan. The fan (SilkFan alone, no extra WebGL) arrives printed with NAN. One
// line invites the visitor to try their own name or brand; when they stop typing, the fan folds
// shut along its own opening path, is reprinted in gold foil with their word, and opens again.
// The primary action then carries that word into the quote form's note, so the experiment becomes
// the brief.
//
// Desktop: the fan stands large on the right in a soft pool of light; the words and the field on
// the left. Phones and tablets: the fan first, then the words and the field beneath it, recomposed
// rather than scaled. The fan's handle is where the next section's bamboo rib starts
// (--hero-hinge-x).
//
// Accessibility: one h1; the field is labelled and described; each reprint is announced in a
// polite live region; nothing depends on hover. Reduced motion: no fold, the fan is reprinted
// open. Kept as the R18 rollback for HeroAtelier (app/page.tsx).

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import FanObject from "./hero-r18/FanObject";
import Actions from "./hero-r18/Actions";
import "./hero-imprint.css";

const MAX = 12;
const DEFAULT_WORD = "NAN";

function normalise(v: string): string {
  return v.replace(/\s+/g, " ").trim().toUpperCase();
}

export default function HeroImprint() {
  const fanRef = useRef<HTMLDivElement>(null);
  const fold = useRef(0);
  const [draft, setDraft] = useState("");
  const [word, setWord] = useState(DEFAULT_WORD);
  const [announce, setAnnounce] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const fieldId = useId();
  const hintId = useId();

  /* Reprint: fold shut (≈ 0.5 s), swap the print, let SilkFan open again with the new word. */
  const reprint = useCallback(
    (next: string) => {
      if (next === word) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finish = () => {
        fold.current = 0;
        setWord(next);
        setAnnounce(`Quạt đã in: ${next}`);
      };
      if (reduce) return finish();
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 520);
        fold.current = p * p * (3 - 2 * p);
        if (p < 1) requestAnimationFrame(step);
        else finish();
      };
      requestAnimationFrame(step);
    },
    [word],
  );

  /* Debounced: reprint once the visitor pauses. */
  useEffect(() => {
    const id = window.setTimeout(() => reprint(normalise(draft) || DEFAULT_WORD), 900);
    return () => window.clearTimeout(id);
  }, [draft, reprint]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    reprint(normalise(draft) || DEFAULT_WORD);
  };

  /* BrandStatement's bamboo rib drops at --hero-hinge-x: here, from the fan's handle. */
  useEffect(() => {
    const el = fanRef.current;
    if (!el) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--hero-hinge-x", `${el.getBoundingClientRect().left + el.offsetWidth / 2}px`);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      root.style.removeProperty("--hero-hinge-x");
    };
  }, []);

  const custom = word !== DEFAULT_WORD;

  return (
    <>
      <section className="himp relative isolate overflow-hidden">
        <div aria-hidden="true" className="himp-light absolute inset-0" />
        <div ref={fanRef} className="himp-fan-anchor absolute" aria-hidden="true">
          <FanObject className="himp-fan" text={word} foldRef={fold} />
        </div>

        <div className="himp-copy absolute z-20">
          <h1 className="himp-h1 hero-rise font-serif font-medium tracking-tight text-on-indigo" style={{ "--rise-delay": "0.2s" } as CSSProperties}>
            Di sản trong <span className="whitespace-nowrap">từng nếp quạt.</span>
          </h1>
          <p className="himp-lead hero-rise text-on-indigo-muted" style={{ "--rise-delay": "0.35s" } as CSSProperties}>
            {heroConfig.subheadline}
          </p>

          <form onSubmit={onSubmit} className="himp-try hero-rise" style={{ "--rise-delay": "0.5s" } as CSSProperties}>
            <label htmlFor={fieldId} className="block text-[0.875rem] text-on-indigo">
              Thử in tên của bạn lên quạt
            </label>
            <input
              id={fieldId}
              value={draft}
              maxLength={MAX}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={hintId}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tên thương hiệu, sự kiện…"
              className="himp-input mt-2 w-full border-0 border-b border-on-indigo/45 bg-transparent pb-2 font-serif text-on-indigo outline-none transition-colors placeholder:text-on-indigo/35 focus:border-on-indigo focus-visible:outline-none"
            />
            <p id={hintId} className="mt-2 text-[0.75rem] text-on-indigo-muted">
              Tối đa {MAX} ký tự. Quạt sẽ gấp lại và in chữ của bạn.
            </p>
          </form>

          <Actions className="himp-actions hero-rise" onQuote={() => setQuoteOpen(true)} />
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </section>

      <QuoteRequestModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        initialMessage={custom ? `Chữ muốn in trên quạt: ${word}` : undefined}
      />
    </>
  );
}
