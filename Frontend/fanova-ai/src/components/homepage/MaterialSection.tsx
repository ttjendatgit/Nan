"use client";

import { motion } from "motion/react";
import { Layers, Sparkles } from "lucide-react";
import { materials } from "@/data/homepageData";

export default function MaterialSection() {
  return (
    <section className="relative overflow-hidden bg-[#151C28] px-6 py-20 md:py-28">
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-dots opacity-60" />

      {/* Glow accents */}
      <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-[#539AD3]/10 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[#2A5A84]/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"
        >
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#2F3542] bg-[#0D131F] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
              <Layers size={13} />
              Materials &amp; Texture
            </div>

            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#FBFBFF] md:text-6xl">
              Cảm giác cao cấp{" "}
              <span className="block bg-linear-to-r from-[#9ECBFB] via-[#C6E2FF] to-[#539AD3] bg-clip-text text-transparent">
                bắt đầu từ chất liệu.
              </span>
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#8D9197] lg:ml-auto">
            Một chiếc quạt đẹp không chỉ nằm ở thiết kế. Chất liệu giấy, bề
            mặt hoàn thiện, tay cầm và hiệu ứng sau in quyết định cảm giác thật
            khi khách hàng cầm trên tay.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.06 }}
              className="group relative overflow-hidden rounded-3xl border border-[#2F3542] bg-[#0D131F] p-6 shadow-xl shadow-black/30 transition hover:-translate-y-2 hover:border-[#539AD3]/35 hover:shadow-2xl hover:shadow-black/40"
            >
              <div
                className={`relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br ${item.gradient}`}
              >
                {/* Dot texture */}
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(198,226,255,0.3)_0.7px,transparent_0.7px)] [background-size:9px_9px]" />

                {/* Shine sweep */}
                <div className="absolute -left-10 top-0 h-full w-20 rotate-12 bg-white/10 blur-xl transition duration-700 group-hover:left-full" />

                {/* Material sample */}
                <div className="relative h-32 w-48 rotate-[-8deg] rounded-2xl border border-[#2F3542]/60 bg-[#151C28]/80 p-3 shadow-2xl backdrop-blur">
                  <div className="h-full rounded-xl border border-[#2F3542]/40 bg-[radial-gradient(circle_at_30%_25%,rgba(83,154,211,0.15),rgba(13,19,31,0.8)_100%)]" />
                </div>

                <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#2F3542] bg-[#0D131F]/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#539AD3] backdrop-blur">
                  <Sparkles size={10} />
                  {item.tag}
                </div>
              </div>

              <div className="pt-5">
                <h3 className="font-serif text-xl font-semibold text-[#FBFBFF]">
                  {item.name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#8D9197]">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Print quality callout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-12 overflow-hidden rounded-3xl border border-[#2F3542] bg-[#0D131F] p-8 shadow-2xl shadow-black/30 md:p-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(42,90,132,0.2) 0%, #0D131F 55%)",
          }}
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#539AD3]">
                Print-ready quality
              </p>

              <h3 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#FBFBFF] md:text-5xl">
                Thiết kế đẹp trên màn hình. Chuẩn khi in thật.
              </h3>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#8D9197]">
                File thiết kế có thể được kiểm tra về kích thước, độ phân giải,
                vùng an toàn, bleed và màu sắc trước khi chuyển sang sản xuất.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "File check", sub: "Kiểm tra trước in" },
                { label: "Color care", sub: "Tối ưu màu sắc" },
                { label: "Safe margin", sub: "Canh vùng an toàn" },
                { label: "Production", sub: "Sẵn sàng sản xuất" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-[#2F3542] bg-[#151C28] p-4 transition hover:border-[#539AD3]/40"
                >
                  <p className="font-semibold text-[#C3C7CD]">{card.label}</p>
                  <p className="mt-1 text-xs text-[#8D9197]">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
