"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { heroConfig } from "@/data/homepageData";

/** The two Hero actions: one button (opens the quote form) and one quiet link (to /products). */
export default function Actions({ onQuote, className = "" }: { onQuote: () => void; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-7 gap-y-3 ${className}`}>
      <Button type="button" tone="indigo" className="whitespace-nowrap" onClick={onQuote}>
        {heroConfig.primaryCta}
      </Button>
      <Link
        href="/products"
        className="group inline-flex items-center gap-2 whitespace-nowrap border-b border-on-indigo/40 pb-1 text-[0.9375rem] font-medium text-on-indigo transition-colors hover:border-on-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-indigo focus-visible:ring-offset-2 focus-visible:ring-offset-indigo"
      >
        {heroConfig.secondaryCta}
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}
