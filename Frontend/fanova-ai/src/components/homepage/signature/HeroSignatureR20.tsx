"use client";

// R20 Hero "Nan Signature", kept as the rollback for R20.1 (HeroSignature). Lab: ?v=r20. One object in one light: the Nan fan, large and tilted a
// few degrees, lit from the upper left in a dark indigo room, casting its shadow on the wall behind.
// The composition reads along the fan's own geometry. The headline steps down beside the fan's left
// shoulder (each line shorter, as the arc draws in). A paper name tag hangs from the rivet on a fine
// cord, under the right wing. The tag is where the visitor writes the word the fan will carry; the
// quote request sits beneath it.
//
// Sequence. Arrival: the fan unfolds (SilkFan's own opening) while the copy rises. At rest: the
// sheen drifts across the folds. Writing: when the visitor pauses (or presses "In thử"), the fan
// folds shut, is reprinted with their word, and opens again; the tag states it is a preview, and
// the quote request carries the word. Reduced motion: the same steps, no fold, no drift.
//
// Desktop (landscape ≥ 1024): a composed frame, every element placed from the fan's pivot
// (--px, --py) and size (--fw). Tablets and phones: a vertical sequence with its own proportions;
// the cord drops straight from the handle to the tag. No WebGL contexts.

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import SignatureFan from "./SignatureFan";
import { useImprint } from "./useImprint";
import "./signature-r20.css";

const rise = (s: number) => ({ "--rise-delay": `${s}s` }) as CSSProperties;

export default function HeroSignatureR20() {
  const im = useImprint();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const id = useId();

  /* BrandStatement's bamboo rib drops at --hero-hinge-x: from the fan's rivet. */
  useEffect(() => {
    const pivot = frameRef.current?.querySelector<HTMLElement>("[data-fan-pivot]");
    if (!pivot) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty("--hero-hinge-x", `${pivot.getBoundingClientRect().left}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frameRef.current!);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--hero-hinge-x");
    };
  }, []);

  const printing = im.phase === "printing";

  return (
    <>
      <section ref={frameRef} className="s20" data-phase={im.phase} aria-labelledby={`${id}-h1`}>
        <div aria-hidden="true" className="s20-room" />

        <div className="s20-frame">
          <div className="s20-title">
            <h1 id={`${id}-h1`} className="s20-h1 font-serif hero-rise" style={rise(0.2)}>
              <span className="s20-h1-l1">Dấu ấn riêng</span> <span className="s20-h1-l2">trong từng</span>{" "}
              <em className="s20-h1-l3">nếp quạt.</em>
            </h1>
            <p className="s20-lede hero-rise" style={rise(0.4)}>
              {heroConfig.subheadline}
            </p>
            {/* desktop: the catalogue link stays with the copy, the quote request with the tag */}
            <Link href="/products" className="s20-link s20-link-desk group hero-rise" style={rise(0.55)}>
              {heroConfig.secondaryCta}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          <SignatureFan className="s20-fan" word={im.word} foldRef={im.fold} reprinted={im.reprinted} />

          <div className="s20-commission hero-rise" style={rise(0.9)}>
            {/* the cord: from the rivet to the tag's eyelet */}
            <svg aria-hidden="true" className="s20-cord" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path className="s20-cord-desk" d="M0 0 C 8 70, 55 100, 100 100" />
              <path className="s20-cord-port" d="M0 0 L 0 100" />
            </svg>

            <form className="s20-tag" onSubmit={im.onSubmit} aria-busy={printing}>
              <span aria-hidden="true" className="s20-eyelet" />
              <div className="s20-tag-head">
                <label htmlFor={`${id}-word`} className="s20-tag-label">
                  Chữ in lên quạt<span className="sr-only">, tối đa {im.max} ký tự</span>
                </label>
                <span className="s20-tag-count" aria-hidden="true">
                  {im.used}/{im.max}
                </span>
              </div>
              <div className="s20-tag-row">
                <input
                  id={`${id}-word`}
                  {...im.inputProps}
                  aria-describedby={`${id}-hint`}
                  placeholder="Tên của bạn"
                  className="s20-input font-serif"
                  style={{ "--chars": im.used } as CSSProperties}
                />
                <button type="submit" className="s20-print" disabled={printing}>
                  {printing ? "Đang in" : "In thử"}
                </button>
              </div>
              <div id={`${id}-hint`} className="s20-tag-hint">
                {im.custom && !printing ? (
                  <>
                    <span>Bản xem trước. Báo giá sẽ kèm chữ này.</span>
                    <button type="button" onClick={im.onReset} className="s20-reset">
                      Về chữ NAN
                    </button>
                  </>
                ) : printing ? (
                  <span>Quạt đang gấp lại để in chữ của bạn.</span>
                ) : (
                  <span>Viết tên, thương hiệu hay một dịp đáng nhớ.</span>
                )}
              </div>
            </form>

            <div className="s20-actions">
              <Button type="button" tone="indigo" className="whitespace-nowrap" onClick={() => setQuoteOpen(true)}>
                {heroConfig.primaryCta}
              </Button>
              <Link href="/products" className="s20-link s20-link-port group">
                {heroConfig.secondaryCta}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {im.announce}
        </p>
      </section>

      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} initialMessage={im.quoteNote} />
    </>
  );
}
