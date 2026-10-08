import { ArrowUpRight } from "lucide-react";

// Editorial footer on the indigo-deep surface (DECISIONS.md): EB Garamond for the wordmark and
// column headings, Be Vietnam Pro for body, EB Garamond italic for the small meta lines; no mono.
// Text uses on-indigo / on-indigo-muted (16.39:1 / 8.92:1 on indigo-deep).
// Only the quote CTA has a real destination; the other entries have no page yet, so they are
// plain text (no pointer cursor or hover) until real routes exist.
export default function Footer() {
  return (
    <footer className="border-t border-line-on-indigo bg-indigo-deep">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          {/* Brand + description */}
          <div className="md:col-span-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-serif text-[24px] font-medium text-on-indigo">Nan</span>
              <span className="font-serif text-sm italic text-on-indigo-muted">Custom Fan Design</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-on-indigo-muted">
              Nền tảng thiết kế và in quạt giấy cá nhân hóa, với tư vấn thiết kế và quy trình báo giá
              minh bạch.
            </p>
            {/* Social row -- plain text, no destinations yet */}
            <div className="mt-7 flex items-center gap-5 text-sm text-on-indigo-muted">
              {["Instagram", "Facebook", "Zalo"].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>

          {/* Bộ sưu tập */}
          <div className="md:col-span-2">
            <h4 className="font-serif text-lg font-semibold text-on-indigo">Bộ sưu tập</h4>
            <div className="mt-5 space-y-3 text-sm text-on-indigo-muted">
              {["Wedding Fans", "Resort & Hospitality", "Brand Campaign", "Event & Activation", "Premium Gift"].map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          {/* Dịch vụ */}
          <div className="md:col-span-2">
            <h4 className="font-serif text-lg font-semibold text-on-indigo">Dịch vụ</h4>
            <div className="mt-5 space-y-3 text-sm text-on-indigo-muted">
              {["Báo giá nhanh", "Tư vấn thiết kế", "Sản xuất & giao hàng"].map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          {/* Liên hệ */}
          <div className="md:col-span-4">
            <h4 className="font-serif text-lg font-semibold text-on-indigo">Liên hệ</h4>
            <div className="mt-5 space-y-3 text-sm text-on-indigo-muted">
              <p>hello@nan.vn</p>
              <p>0900 000 000</p>
            </div>

            {/* CTA -- editorial text + arrow, no card. The after: layer only enlarges the tap area to
                44px tall without moving the underline. */}
            <a
              href="#quote"
              className="relative mt-8 inline-flex items-center gap-1.5 border-b border-bamboo/40 pb-0.5 text-sm font-medium text-on-indigo transition-all after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] hover:gap-2.5 hover:border-bamboo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-indigo"
            >
              Tư vấn thiết kế miễn phí cho đơn hàng đầu tiên
              <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" className="text-bamboo" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-line-on-indigo pt-7 text-xs text-on-indigo-muted md:flex-row md:items-center">
          <p>© 2026 Nan. All rights reserved.</p>
          <div className="flex gap-6">
            {["Điều khoản sử dụng", "Chính sách bảo mật"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="font-serif text-sm italic">Premium Vietnamese fan craft experience.</p>
        </div>
      </div>
    </footer>
  );
}
