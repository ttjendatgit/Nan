import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "#0F1320" }}>
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          {/* Brand + description */}
          <div className="md:col-span-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-serif text-[24px] font-medium text-[#F1F0EA]">Nan</span>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.32em] text-[#A9ABA5]">
                Custom Fan Design
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-[rgba(241,240,234,0.45)]">
              Nền tảng thiết kế và in quạt giấy cá nhân hóa, kết hợp mockup trực quan, AI designer
              và quy trình báo giá minh bạch.
            </p>
            {/* Social row -- plain text links, no icon boxes */}
            <div className="mt-7 flex items-center gap-5">
              {["Instagram", "Facebook", "Zalo"].map((s) => (
                <span
                  key={s}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Bộ sưu tập */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#A9ABA5]">
              Bộ sưu tập
            </h4>
            <div className="mt-5 space-y-3 text-sm text-[rgba(241,240,234,0.42)]">
              {["Wedding Fans", "Resort & Hospitality", "Brand Campaign", "Event & Activation", "Premium Gift"].map((item) => (
                <p key={item} className="cursor-pointer transition hover:text-[#F1F0EA]">{item}</p>
              ))}
            </div>
          </div>

          {/* Dịch vụ */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#A9ABA5]">
              Dịch vụ
            </h4>
            <div className="mt-5 space-y-3 text-sm text-[rgba(241,240,234,0.42)]">
              {["AI Designer", "Xem mockup trực tiếp", "Báo giá nhanh", "Tư vấn thiết kế", "Sản xuất & giao hàng"].map((item) => (
                <p key={item} className="cursor-pointer transition hover:text-[#F1F0EA]">{item}</p>
              ))}
            </div>
          </div>

          {/* Liên hệ */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#A9ABA5]">
              Liên hệ
            </h4>
            <div className="mt-5 space-y-3 text-sm text-[rgba(241,240,234,0.42)]">
              <p>hello@nan.vn</p>
              <p>0900 000 000</p>
            </div>

            {/* CTA -- editorial text + arrow, no card */}
            <a
              href="#quote"
              className="mt-8 inline-flex items-center gap-1.5 border-b border-[#B6A17B]/40 pb-0.5 text-sm font-medium text-[#F1F0EA] transition-all hover:gap-2.5 hover:border-[#B6A17B]"
            >
              Tư vấn thiết kế miễn phí cho đơn hàng đầu tiên
              <ArrowUpRight size={14} strokeWidth={1.5} className="text-[#B6A17B]" />
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-7 md:flex-row md:items-center">
          <p className="font-mono text-[10px] text-[rgba(241,240,234,0.28)]">
            © 2026 Nan. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Điều khoản sử dụng", "Chính sách bảo mật"].map((item) => (
              <span key={item} className="cursor-pointer font-mono text-[10px] text-[rgba(241,240,234,0.28)] transition hover:text-[rgba(241,240,234,0.6)]">
                {item}
              </span>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[rgba(241,240,234,0.24)]">
            Premium Vietnamese fan craft experience.
          </p>
        </div>
      </div>
    </footer>
  );
}
