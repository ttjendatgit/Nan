"use client";

// Homepage Hero (R20.3), "Signature Canvas". The R20 fan is the work; everything else is set from
// its geometry.
//
// Desktop: the fan stands large (≈ 2/3 of the width), right of centre, its rivet low in the frame.
// The headline is set in the hollow above the fan's left wing, right-aligned against a circle
// concentric with the fan's edge (CSS shape-outside), so the end of every line runs parallel to
// the gilt rim; the supporting line follows the same curve. Under the wings, two blocks lean on
// the handle: the inscription (personalisation) left of it, the quote request right of it.
// BrandStatement's bamboo rib drops from the handle through the gap between them.
// Phones and tablets: a left-aligned editorial column: headline, supporting line, the fan almost
// full width, the inscription, the quote request.
//
// The inscription. At rest: "Tên bạn, dấu ấn bạn." and a clear action to write on the fan. Chosen:
// the writing line opens there; when the visitor pauses or presses "In thử", the fan folds shut, is
// reprinted with their word and opens (useImprint); the line confirms the preview, offers the way
// back to NAN and says the quote request will carry the word. An empty "In thử" says what to do.
// Reduced motion: the same steps, no fold, no sheen drift.
// Lab: ?v=b3d (this Hero with the 3D fan). Rollback: HeroSignatureR202 (R20.2), then R20.1/R20.

import Link from "next/link";
import { PenLine } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import FanStage from "./FanStage";
import { useImprint } from "./useImprint";
import "./signature.css";

const rise = (s: number) => ({ "--rise-delay": `${s}s` }) as CSSProperties;

export default function HeroSignature({ engine = "svg" }: { engine?: "svg" | "gl" }) {
  const im = useImprint();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { inputRef } = im;

  /* BrandStatement's bamboo rib drops at --hero-hinge-x: straight down from the fan's handle,
     through the gap between the quote request and the inscription. */
  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>(".sig-stage");
    if (!section || !stage) return;
    const root = document.documentElement;
    const measure = () => {
      const b = stage.getBoundingClientRect();
      root.style.setProperty("--hero-hinge-x", `${b.left + b.width / 2}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--hero-hinge-x");
    };
  }, []);

  /* opening the inscription puts the caret on the line */
  useEffect(() => {
    if (writing) inputRef.current?.focus();
  }, [writing, inputRef]);

  const printing = im.phase === "printing";
  const open = writing || im.custom;
  const closeIfEmpty = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Escape" || im.custom || im.used > 0) return;
    setWriting(false);
    requestAnimationFrame(() => openRef.current?.focus());
  };

  return (
    <>
      <section ref={sectionRef} className="sig" data-phase={im.phase} aria-labelledby={`${id}-h1`}>
        <div aria-hidden="true" className="sig-room" />

        <div className="sig-type">
          {/* the fan's edge, as a float shape the headline and its line wrap against */}
          <span aria-hidden="true" className="sig-contour" />
          <h1 id={`${id}-h1`} className="sig-h1 font-serif hero-rise" style={rise(0.25)}>
            <span>Dấu ấn riêng</span> <span>trong từng</span> <span>nếp quạt.</span>
          </h1>
          <p className="sig-lede hero-rise" style={rise(0.45)}>
            {heroConfig.subheadline}
          </p>
        </div>

        <FanStage engine={engine} sectionRef={sectionRef} word={im.word} phase={im.phase} foldRef={im.fold} reprinted={im.reprinted} />

        <div className="sig-sign hero-rise" style={rise(0.7)} data-open={open || undefined}>
          <p className="sig-sign-title font-serif">Tên bạn, dấu ấn bạn.</p>
          {!open ? (
            <>
              <p className="sig-sign-note">Thử in trực tiếp lên chiếc quạt Nan.</p>
              <button ref={openRef} type="button" className="sig-sign-open" onClick={() => setWriting(true)}>
                <PenLine aria-hidden="true" size={16} strokeWidth={1.75} />
                Viết chữ lên quạt
              </button>
            </>
          ) : (
            <form className="sig-write" onSubmit={im.onSubmit} aria-busy={printing}>
              <label htmlFor={`${id}-word`} className="sr-only">
                Chữ in lên quạt, tối đa {im.max} ký tự
              </label>
              <div className="sig-write-line" data-invalid={im.error ? true : undefined}>
                <input
                  id={`${id}-word`}
                  {...im.inputProps}
                  onKeyDown={closeIfEmpty}
                  aria-describedby={`${id}-hint`}
                  aria-invalid={im.error ? true : undefined}
                  placeholder="Tên, thương hiệu, lời nhắn"
                  className="sig-input font-serif"
                  style={{ "--chars": im.used } as CSSProperties}
                />
                <button type="submit" className="sig-print" disabled={printing}>
                  {printing ? "Đang in" : "In thử"}
                </button>
              </div>
              <p id={`${id}-hint`} className="sig-write-hint" data-tone={im.error ? "error" : printing ? "busy" : im.custom ? "done" : undefined}>
                {im.error ? (
                  im.error
                ) : printing ? (
                  "Quạt đang gấp lại để in chữ của bạn."
                ) : im.custom ? (
                  <>
                    Đã in bản xem trước. Báo giá sẽ kèm chữ này.{" "}
                    <button type="button" onClick={im.onReset} className="sig-reset">
                      Về chữ NAN
                    </button>
                  </>
                ) : (
                  `${im.used}/${im.max} ký tự · Quạt in khi bạn dừng gõ`
                )}
              </p>
            </form>
          )}
        </div>

        <div className="sig-offer hero-rise" style={rise(0.6)}>
          <Button type="button" tone="indigo" className="whitespace-nowrap" onClick={() => setQuoteOpen(true)}>
            {heroConfig.primaryCta}
          </Button>
          <Link href="/products" className="sig-link">
            {heroConfig.secondaryCta}
          </Link>
        </div>

        <p className="sr-only" aria-live="polite">
          {im.error ?? im.announce}
        </p>
      </section>

      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} initialMessage={im.quoteNote} />
    </>
  );
}
