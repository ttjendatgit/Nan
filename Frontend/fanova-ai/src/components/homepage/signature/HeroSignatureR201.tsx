"use client";

// R20.1 Hero "The Signature Object" (3D fan, headline parted by the handle), kept in the lab for
// comparison and further work on the 3D fan (?v=r201). The homepage runs HeroSignature (R20.2). One fan, one light, one axis.
//
// The fan stands open on the frame's vertical axis, lit from the upper left, casting its shadow on
// the wall behind (a real 3D object, see FanStage / fan3d/FanScene; the SVG fan is the fallback).
// Everything else is set from the fan's own geometry. On desktop the headline runs along the
// horizon under the fan's wings and is parted by its handle: "Dấu ấn riêng" left of the handle,
// "trong từng nếp quạt." right of it. Directly beneath the handle, on the same axis, is the writing
// line: the visitor writes a word and the fan folds, is reprinted, and opens with it. The
// supporting line and the actions flank the writing line, under each half of the headline. On
// phones and tablets the scene is a column on the same axis: headline, fan, writing line, actions.
//
// Sequence. Arrival: the room light comes up and the fan unfolds. Writing: when the visitor pauses
// (or presses "In thử"), the fan folds shut, is reprinted with their word and opens again; the line
// says it is a preview and offers the way back to NAN; the quote request carries the word. Reduced
// motion: the same steps, no fold, no light ramp, no pointer response.
// Rollback: HeroSignatureR20 (R20), atelier/HeroAtelier (R19).

import Link from "next/link";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import FanStage from "./FanStage";
import { useImprint } from "./useImprint";
import "./signature-r201.css";

const rise = (s: number) => ({ "--rise-delay": `${s}s` }) as CSSProperties;

export default function HeroSignatureR201() {
  const im = useImprint();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const id = useId();

  /* BrandStatement's bamboo rib drops at --hero-hinge-x: from the tip of the fan's front guard,
     clear of the copy (the axis itself carries the writing line). */
  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>(".s201-stage");
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
      <section ref={sectionRef} className="s201" data-phase={im.phase} aria-labelledby={`${id}-h1`}>
        <div aria-hidden="true" className="s201-room" />

        <div className="s201-frame">
          <FanStage engine="gl" ns="s201" sectionRef={sectionRef} word={im.word} phase={im.phase} foldRef={im.fold} reprinted={im.reprinted} />

          <h1 id={`${id}-h1`} className="s201-h1 font-serif hero-rise" style={rise(0.25)}>
            <span className="s201-h1-a">Dấu ấn riêng</span> <span className="s201-h1-b">trong từng nếp quạt.</span>
          </h1>

          <div className="s201-row">
            <p className="s201-lede hero-rise" style={rise(0.45)}>
              {heroConfig.subheadline}
            </p>

            <form className="s201-write hero-rise" style={rise(0.6)} onSubmit={im.onSubmit} aria-busy={printing}>
              <label htmlFor={`${id}-word`} className="s201-write-label">
                Thử chữ của bạn trên quạt<span className="sr-only">, tối đa {im.max} ký tự</span>
              </label>
              <div className="s201-write-line">
                <input
                  id={`${id}-word`}
                  {...im.inputProps}
                  aria-describedby={`${id}-hint`}
                  placeholder="Tên của bạn"
                  className="s201-input font-serif"
                  style={{ "--chars": im.used } as CSSProperties}
                />
                <button type="submit" className="s201-print" disabled={printing}>
                  {printing ? "Đang in" : "In thử"}
                </button>
              </div>
              <p id={`${id}-hint`} className="s201-write-hint">
                {printing ? (
                  "Quạt đang gấp lại để in chữ của bạn."
                ) : im.custom ? (
                  <>
                    Bản xem trước, báo giá sẽ kèm chữ này.{" "}
                    <button type="button" onClick={im.onReset} className="s201-reset">
                      Về chữ NAN
                    </button>
                  </>
                ) : (
                  `${im.used}/${im.max} ký tự`
                )}
              </p>
            </form>

            <div className="s201-actions hero-rise" style={rise(0.75)}>
              <Button type="button" tone="indigo" className="whitespace-nowrap" onClick={() => setQuoteOpen(true)}>
                {heroConfig.primaryCta}
              </Button>
              <Link href="/products" className="s201-link">
                {heroConfig.secondaryCta}
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
