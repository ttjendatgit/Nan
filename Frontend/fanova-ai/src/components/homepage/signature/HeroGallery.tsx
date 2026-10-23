"use client";

// R20 exploration B (lab only, /dev/hero-lab?v=b): "Gallery wall". The fan hangs on a lit ivory
// wall like a work in an exhibition; the headline is set as wall lettering under its left wing and
// the personalisation is the work's wall label beside the handle. Kept for comparison with the
// chosen direction (HeroSignature); not mounted on the homepage.

import Link from "next/link";
import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { heroConfig } from "@/data/homepageData";
import SignatureFan from "./SignatureFan";
import { useImprint } from "./useImprint";
import "./gallery.css";

export default function HeroGallery() {
  const im = useImprint();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const id = useId();
  return (
    <>
      <section className="gal" data-phase={im.phase} aria-labelledby={`${id}-h1`}>
        <div aria-hidden="true" className="gal-wall" />
        <SignatureFan className="gal-fan" word={im.word} foldRef={im.fold} reprinted={im.reprinted} />
        <div className="gal-text">
          <h1 id={`${id}-h1`} className="gal-h1 font-serif">
            Dấu ấn riêng <span className="gal-h1-b">trong từng nếp quạt.</span>
          </h1>
          <div className="gal-actions">
            <Button type="button" tone="paper" onClick={() => setQuoteOpen(true)}>
              {heroConfig.primaryCta}
            </Button>
            <Link href="/products" className="gal-link">
              {heroConfig.secondaryCta} →
            </Link>
          </div>
        </div>
        <form className="gal-label" onSubmit={im.onSubmit}>
          <p className="gal-label-title font-serif">Quạt Nan, chữ in theo yêu cầu</p>
          <label htmlFor={`${id}-w`} className="gal-label-k">
            Chữ in lên quạt
          </label>
          <div className="gal-row">
            <input id={`${id}-w`} {...im.inputProps} placeholder="Tên của bạn" className="gal-input font-serif" />
            <button type="submit" className="gal-print">
              In thử
            </button>
          </div>
          <p className="gal-hint">
            {im.custom ? "Bản xem trước. Yêu cầu báo giá sẽ kèm chữ này." : `${im.used}/${im.max} ký tự`}
          </p>
        </form>
        <p className="sr-only" aria-live="polite">
          {im.announce}
        </p>
      </section>
      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} initialMessage={im.quoteNote} />
    </>
  );
}
