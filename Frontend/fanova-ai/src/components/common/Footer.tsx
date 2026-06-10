export default function Footer() {
  return (
    <footer className="border-t border-[#2F3542]/60 bg-[#080E1A] px-6 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-[22px] font-semibold text-[#FBFBFF]">
              Nhã Phong
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#539AD3]">
              Custom Paper Fans
            </span>
          </div>

          <p className="mt-5 max-w-md text-sm leading-6 text-[#8D9197]">
            Nền tảng thiết kế và đặt in quạt giấy theo yêu cầu, kết hợp mockup
            trực quan, cá nhân hóa bằng AI và quy trình báo giá nhanh.
          </p>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
            Sản phẩm
          </h4>
          <div className="mt-4 space-y-3 text-sm text-[#8D9197]">
            <p className="cursor-pointer transition hover:text-[#C3C7CD]">Quạt giấy tròn</p>
            <p className="cursor-pointer transition hover:text-[#C3C7CD]">Quạt giấy gấp</p>
            <p className="cursor-pointer transition hover:text-[#C3C7CD]">Quạt wedding</p>
            <p className="cursor-pointer transition hover:text-[#C3C7CD]">Quạt sự kiện</p>
          </div>
        </div>

        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
            Liên hệ
          </h4>
          <div className="mt-4 space-y-3 text-sm text-[#8D9197]">
            <p>Email: hello@nhaphong.vn</p>
            <p>Hotline: 0900 000 000</p>
            <p>Hỗ trợ báo giá nhanh</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-[#2F3542]/60 pt-6 md:flex-row">
        <p className="font-mono text-[10px] text-[#8D9197]">
          © 2026 Nhã Phong. All rights reserved.
        </p>
        <p className="font-mono text-[10px] text-[#8D9197]">
          Premium Vietnamese fan craft experience.
        </p>
      </div>
    </footer>
  );
}
