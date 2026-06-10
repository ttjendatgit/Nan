"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

const productTypes = [
  {
    name: "Quạt giấy tròn",
    tag: "Best for events",
    description:
      "Kiểu quạt phổ biến cho sự kiện, activation, nhà hàng và chiến dịch mùa hè.",
    gradient: "from-blue-900/30 via-[#151C28] to-sky-900/20",
    fanGradient: "from-blue-100 via-white to-cyan-100",
    price: "Từ 2.500đ/quạt",
  },
  {
    name: "Quạt giấy gấp",
    tag: "Premium choice",
    description:
      "Tạo cảm giác tinh tế, phù hợp wedding, resort, quà tặng thương hiệu.",
    gradient: "from-rose-900/25 via-[#151C28] to-orange-900/20",
    fanGradient: "from-orange-100 via-white to-rose-100",
    price: "Từ 4.500đ/quạt",
  },
  {
    name: "Quạt cán nhựa",
    tag: "Mass production",
    description:
      "Bền, nhẹ, dễ sản xuất số lượng lớn cho quảng cáo và phát sampling.",
    gradient: "from-violet-900/25 via-[#151C28] to-blue-900/20",
    fanGradient: "from-purple-100 via-white to-blue-100",
    price: "Từ 3.200đ/quạt",
  },
  {
    name: "Quạt cán gỗ",
    tag: "Natural look",
    description:
      "Phù hợp thương hiệu lifestyle, spa, wedding và concept thiên nhiên.",
    gradient: "from-amber-900/25 via-[#151C28] to-lime-900/15",
    fanGradient: "from-amber-100 via-white to-lime-100",
    price: "Từ 5.000đ/quạt",
  },
  {
    name: "Quạt wedding",
    tag: "For special moments",
    description:
      "Thiết kế nhẹ nhàng, tinh tế cho tiệc cưới, lễ ngoài trời và welcome gift.",
    gradient: "from-pink-900/25 via-[#151C28] to-rose-900/15",
    fanGradient: "from-pink-100 via-white to-orange-100",
    price: "Báo giá theo mẫu",
  },
  {
    name: "Quạt resort",
    tag: "Hospitality",
    description:
      "Biến quạt giấy thành vật phẩm trải nghiệm cho khách sạn, resort, beach club.",
    gradient: "from-sky-900/30 via-[#151C28] to-emerald-900/20",
    fanGradient: "from-sky-100 via-white to-emerald-100",
    price: "Báo giá theo số lượng",
  },
];

const duplicatedProducts = [...productTypes, ...productTypes];

export default function ProductTypeSection() {
  return (
    <section
      id="products"
      className="relative overflow-hidden bg-[#151C28] px-6 py-20 md:py-28"
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-dots opacity-60" />

      {/* Glow */}
      <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-[#2A5A84]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#2F3542] bg-[#0D131F] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
              Product Collection
            </div>

            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#FBFBFF] md:text-6xl">
              Chọn kiểu quạt{" "}
              <span className="block bg-linear-to-r from-[#9ECBFB] via-[#C6E2FF] to-[#539AD3] bg-clip-text text-transparent">
                phù hợp với câu chuyện của bạn.
              </span>
            </h2>
          </div>

          <div className="max-w-2xl lg:ml-auto">
            <p className="text-base leading-8 text-[#8D9197]">
              Mỗi kiểu quạt mang một cảm giác khác nhau: từ sự kiện đông người,
              quà tặng thương hiệu, wedding tinh tế đến trải nghiệm cao cấp cho
              resort và nhà hàng.
            </p>

            <div className="mt-6">
              <Button variant="secondary">
                Xem tất cả sản phẩm
                <ArrowRight className="ml-2" size={15} />
              </Button>
            </div>
          </div>
        </div>

        {/* Auto motion gallery */}
        <div className="mt-16 overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex w-max gap-5"
          >
            {duplicatedProducts.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                className="group w-72 shrink-0 overflow-hidden rounded-3xl border border-[#2F3542] bg-[#0D131F] shadow-xl shadow-black/30 transition hover:-translate-y-2 hover:border-[#539AD3]/40 hover:shadow-2xl hover:shadow-black/40 md:w-80"
              >
                {/* Card visual */}
                <div
                  className={`relative flex h-64 items-center justify-center bg-linear-to-br ${product.gradient}`}
                >
                  {/* Subtle shimmer */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(198,226,255,0.07),transparent_60%)]" />

                  {/* Fan mockup */}
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-2xl">
                    <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.96),rgba(226,232,240,0.5)_100%)]" />

                    <div className="absolute h-[80%] w-px bg-slate-200/70" />
                    <div className="absolute h-[80%] w-px rotate-30 bg-slate-200/70" />
                    <div className="absolute h-[80%] w-px -rotate-30 bg-slate-200/70" />
                    <div className="absolute h-[80%] w-px rotate-60 bg-slate-200/70" />
                    <div className="absolute h-[80%] w-px -rotate-60 bg-slate-200/70" />

                    <div
                      className={`relative z-10 h-16 w-16 rounded-full bg-linear-to-br ${product.fanGradient} shadow-lg`}
                    />
                    <div className="absolute -bottom-14 left-1/2 h-20 w-5 -translate-x-1/2 rounded-full bg-slate-300 shadow-lg" />
                  </div>

                  <div className="absolute left-4 top-4 rounded-full border border-[#2F3542] bg-[#0D131F]/80 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#539AD3] backdrop-blur">
                    {product.tag}
                  </div>
                </div>

                <div className="p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#539AD3]">
                    {product.price}
                  </p>

                  <h3 className="mt-3 font-serif text-xl font-semibold text-[#FBFBFF]">
                    {product.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#8D9197]">
                    {product.description}
                  </p>

                  <button className="mt-5 inline-flex items-center text-xs font-semibold text-[#9ECBFB] transition group-hover:translate-x-1">
                    Tùy chỉnh mẫu này
                    <ArrowRight className="ml-1.5" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
