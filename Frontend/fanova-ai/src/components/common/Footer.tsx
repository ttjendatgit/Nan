"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";

// Editorial footer on the indigo-deep surface (DECISIONS.md): EB Garamond for the wordmark and
// column headings, Be Vietnam Pro for body; no mono. Text uses on-indigo / on-indigo-muted
// (16.39:1 / 8.92:1 on indigo-deep).
//
// R10.4: only real things. Every link goes to a route that exists; the placeholder contact details
// (hello@nan.vn, 0900 000 000), the unlinked social names, the legal entries without pages, the
// English slogan and the "collections" that are not catalogue lines are gone. The quote form is the
// contact path until real contact details are provided (then add them under "Liên hệ").

const EXPLORE = [
  { label: "Tất cả sản phẩm", href: "/products" },
  { label: "Ứng dụng", href: "/ung-dung" },
  { label: "Về Nan", href: "/ve-nan" },
];

/** What Nan does (DECISIONS §8): plain statements, not links. */
const SERVICES = ["Tư vấn kiểu quạt và chất liệu", "Hỗ trợ thiết kế và mockup", "Sản xuất và hoàn thiện"];

const LINK =
  "relative inline-block text-on-indigo-muted transition-colors duration-(--dur-state) after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:text-on-indigo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-indigo";

export default function Footer() {
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
      {/* px on the footer, max-w on the inner box: the same content axis as every Section */}
      <footer className="border-t border-line-on-indigo bg-indigo-deep px-6">
        <div className="mx-auto max-w-7xl py-16 md:py-24">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            {/* Brand + what Nan is */}
            <div className="md:col-span-5">
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-[24px] font-medium text-on-indigo">Nan</span>
                <span className="font-serif text-sm italic text-on-indigo-muted">Custom Fan Design</span>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-on-indigo-muted">
                Nan thiết kế và sản xuất quạt cầm tay cá nhân hóa cho thương hiệu, sự kiện, khách sạn,
                resort, nhà hàng và quà tặng doanh nghiệp.
              </p>
            </div>

            {/* Explore: real routes only */}
            <nav aria-label="Khám phá" className="md:col-span-2">
              <h2 className="font-serif text-lg font-medium text-on-indigo">Khám phá</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {EXPLORE.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={LINK}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Services */}
            <div className="md:col-span-2">
              <h2 className="font-serif text-lg font-medium text-on-indigo">Dịch vụ</h2>
              <ul className="mt-5 space-y-3 text-sm text-on-indigo-muted">
                {SERVICES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Contact: the quote form is the real contact path */}
            <div className="md:col-span-3">
              <h2 className="font-serif text-lg font-medium text-on-indigo">Liên hệ</h2>
              <p className="mt-5 text-sm leading-7 text-on-indigo-muted">
                Gửi yêu cầu kèm số lượng và mục đích sử dụng, Nan sẽ liên hệ lại để tư vấn và báo giá.
              </p>
              {/* after: enlarges the tap area to 44px tall without moving the underline */}
              <button
                type="button"
                onClick={() => setQuoteOpen(true)}
                className="group relative mt-6 inline-flex items-center gap-1.5 border-b border-bamboo/40 pb-0.5 text-left text-sm font-medium text-on-indigo transition-[border-color] duration-(--dur-state) ease-(--ease-nan-ui) after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:border-bamboo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-indigo"
              >
                Gửi yêu cầu báo giá
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="shrink-0 text-bamboo transition-[translate] duration-(--dur-state) ease-(--ease-nan-ui) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 border-t border-line-on-indigo pt-7 text-xs text-on-indigo-muted">
            <p>© 2026 Nan.</p>
          </div>
        </div>
      </footer>

      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
