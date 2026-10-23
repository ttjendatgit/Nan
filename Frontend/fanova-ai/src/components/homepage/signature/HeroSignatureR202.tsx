"use client";

// R20.2 Hero (one fan on one axis, centred copy above), kept as the rollback for R20.3
// (HeroSignature). Lab: ?v=r202.
//
// The fan is the R20 SilkFan (chosen over the 3D fan on looks; DECISIONS.md §30), upright and as
// large as the frame allows, its handle on the frame's vertical axis. The words sit above it as
// one centred block: the headline, a single supporting line and the two actions. Under the handle,
// on the same axis, is the writing line: the visitor writes a word, the fan folds shut, is
// reprinted with it and opens again. Fan and writing line read as one object; the copy above
// introduces it.
//
// Sequence. Arrival: the copy rises and the fan unfolds (SilkFan's own opening); at rest a slow
// sheen moves over the silk. Writing: when the visitor pauses (or presses "In thử"), the fan folds,
// is reprinted and re-opens; the line says it is a preview and offers the way back to NAN; the
// quote request carries the word. Reduced motion: the same steps, no fold, no sheen drift.
// Lab: ?v=b3d (this Hero with the 3D fan), ?v=r201 (R20.1), ?v=r20 (R20). Rollback: R20
// (HeroSignatureR20) or R19 (atelier/HeroAtelier).

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import FanStage from "./FanStage";
import { useImprint } from "./useImprint";
import "./signature-r202.css";

const rise = (s: number) => ({ "--rise-delay": `${s}s` }) as CSSProperties;

export default function HeroSignatureR202() {
  const engine = "svg";
  const im = useImprint();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const id = useId();

  /* BrandStatement's bamboo rib drops at --hero-hinge-x: from the tip of the fan's front guard,
     clear of the copy (the axis itself carries the writing line). */
  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>(".s202-stage");
    if (!section || !stage) return;
    const root = document.documentElement;
    const measure = () => {
      const b = stage.getBoundingClientRect();
      root.style.setProperty("--hero-hinge-x", `${b.left + b.width * 0.03}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--hero-hinge-x");
    };
  }, []);

  const printing = im.phase === "printing";

  return (
    <>
      <section ref={sectionRef} className="s202" data-phase={im.phase} aria-labelledby={`${id}-h1`}>
        <div aria-hidden="true" className="s202-room" />

        <div className="s202-frame">
          <div className="s202-head">
            <h1 id={`${id}-h1`} className="s202-h1 font-serif hero-rise" style={rise(0.2)}>
              <span className="s202-h1-a">Dấu ấn riêng</span> <span className="s202-h1-b">trong từng nếp quạt.</span>
            </h1>
            <p className="s202-lede hero-rise" style={rise(0.35)}>
              {heroConfig.subheadline}
            </p>
            <div className="s202-actions hero-rise" style={rise(0.5)}>
              <Button type="button" tone="indigo" className="whitespace-nowrap" onClick={() => setQuoteOpen(true)}>
                {heroConfig.primaryCta}
              </Button>
              <Link href="/products" className="s202-link">
                {heroConfig.secondaryCta}
              </Link>
            </div>
          </div>

          <FanStage engine={engine} ns="s202" sectionRef={sectionRef} word={im.word} phase={im.phase} foldRef={im.fold} reprinted={im.reprinted} />

          <form className="s202-write hero-rise" style={rise(0.9)} onSubmit={im.onSubmit} aria-busy={printing}>
            <label htmlFor={`${id}-word`} className="s202-write-label">
              Thử chữ của bạn trên quạt<span className="sr-only">, tối đa {im.max} ký tự</span>
            </label>
            <div className="s202-write-line">
              <input
                id={`${id}-word`}
                {...im.inputProps}
                aria-describedby={`${id}-hint`}
                placeholder="Tên của bạn"
                className="s202-input font-serif"
                style={{ "--chars": im.used } as CSSProperties}
              />
              <button type="submit" className="s202-print" disabled={printing}>
                {printing ? "Đang in" : "In thử"}
              </button>
            </div>
            <p id={`${id}-hint`} className="s202-write-hint">
              {printing ? (
                "Quạt đang gấp lại để in chữ của bạn."
              ) : im.custom ? (
                <>
                  Bản xem trước, báo giá sẽ kèm chữ này.{" "}
                  <button type="button" onClick={im.onReset} className="s202-reset">
                    Về chữ NAN
                  </button>
                </>
              ) : (
                `${im.used}/${im.max} ký tự`
              )}
            </p>
          </form>
        </div>

        <p className="sr-only" aria-live="polite">
          {im.announce}
        </p>
      </section>

      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} initialMessage={im.quoteNote} />
    </>
  );
}
