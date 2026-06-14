export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(180deg, #0A1B38 0%, #081426 100%)" }}>
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(220,234,247,0.18)] to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          {/* Brand + description */}
          <div className="md:col-span-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-serif text-[24px] font-semibold text-[#FFFFFF]">Nan</span>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.32em] text-[#DCEAF7]">
                Custom Fan Design
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-[rgba(232,242,252,0.48)]">
              Nền tảng thiết kế và in quạt giấy cá nhân hóa — kết hợp mockup
              trực quan, AI designer và quy trình báo giá minh bạch.
            </p>
            {/* Social row */}
            <div className="mt-7 flex items-center gap-3">
              {["Instagram", "Facebook", "Zalo"].map((s) => (
                <div
                  key={s}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.10)] text-[rgba(232,242,252,0.36)] transition hover:border-[rgba(255,255,255,0.24)] hover:text-[#DCEAF7] cursor-pointer"
                >
                  <span className="font-mono text-[9px] uppercase">{s[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bộ sưu tập */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(220,234,247,0.55)]">
              Bộ sưu tập
            </h4>
            <div className="mt-5 space-y-3 text-sm text-[rgba(232,242,252,0.38)]">
              {["Wedding Fans", "Resort & Hospitality", "Brand Campaign", "Event & Activation", "Premium Gift"].map((item) => (
                <p key={item} className="cursor-pointer transition hover:text-[#DCEAF7]">{item}</p>
              ))}
            </div>
          </div>

          {/* Dịch vụ */}
          <div className="md:col-span-2">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(220,234,247,0.55)]">
              Dịch vụ
            </h4>
            <div className="mt-5 space-y-3 text-sm text-[rgba(232,242,252,0.38)]">
              {["AI Designer", "Xem mockup trực tiếp", "Báo giá nhanh", "Tư vấn thiết kế", "Sản xuất & giao hàng"].map((item) => (
                <p key={item} className="cursor-pointer transition hover:text-[#DCEAF7]">{item}</p>
              ))}
            </div>
          </div>

          {/* Liên hệ */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(220,234,247,0.55)]">
              Liên hệ
            </h4>
            <div className="mt-5 space-y-3 text-sm text-[rgba(232,242,252,0.38)]">
              <p>hello@nan.vn</p>
              <p>0900 000 000</p>
            </div>

            {/* CTA callout */}
            <div className="mt-8 rounded-2xl border border-[rgba(220,234,247,0.10)] bg-[rgba(255,255,255,0.04)] p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.20em] text-[#DCEAF7]/70">
                Bắt đầu ngay hôm nay
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#FFFFFF]">
                Tư vấn thiết kế miễn phí cho đơn hàng đầu tiên
              </p>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(220,234,247,0.22)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#DCEAF7] transition hover:border-[#DCEAF7] hover:text-white">
                Gửi yêu cầu
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-[rgba(255,255,255,0.07)] pt-7 md:flex-row md:items-center">
          <p className="font-mono text-[10px] text-[rgba(232,242,252,0.26)]">
            © 2026 Nan. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Điều khoản sử dụng", "Chính sách bảo mật"].map((item) => (
              <span key={item} className="cursor-pointer font-mono text-[10px] text-[rgba(232,242,252,0.26)] transition hover:text-[rgba(232,242,252,0.55)]">
                {item}
              </span>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[rgba(232,242,252,0.22)]">
            Premium Vietnamese fan craft experience.
          </p>
        </div>
      </div>
    </footer>
  );
}
