"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Upload,
  Sparkles,
  ImagePlus,
  RotateCcw,
  Palette,
  Move,
} from "lucide-react";
import Button from "@/components/ui/Button";

const styles = [
  "Tối giản",
  "Sang trọng",
  "Wedding",
  "Resort",
  "Sự kiện",
  "Trẻ trung",
];

const fanColors = [
  {
    name: "Ivory",
    className: "from-orange-100 via-white to-blue-100",
  },
  {
    name: "Mint",
    className: "from-emerald-100 via-white to-cyan-100",
  },
  {
    name: "Rose",
    className: "from-rose-100 via-white to-orange-100",
  },
  {
    name: "Lavender",
    className: "from-purple-100 via-white to-blue-100",
  },
  {
    name: "Sky",
    className: "from-sky-100 via-white to-indigo-100",
  },
];

export default function AIDesignerSection() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("Sang trọng");
  const [prompt, setPrompt] = useState("");
  const [selectedColor, setSelectedColor] = useState(fanColors[0]);

  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });
  const [logoScale, setLogoScale] = useState(1);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setLogoPosition({ x: 0, y: 0 });
    setLogoScale(1);
  }

  function resetMockup() {
    setLogoPosition({ x: 0, y: 0 });
    setLogoScale(1);
  }

  return (
    <section
      id="ai-designer"
      className="relative overflow-hidden bg-[#0D131F] px-6 py-20 md:py-28"
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-dots" />

      {/* Glow accents */}
      <div className="absolute left-0 top-20 h-80 w-80 rounded-full bg-[#2A5A84]/15 blur-3xl" />
      <div className="absolute bottom-20 right-0 h-80 w-80 rounded-full bg-[#539AD3]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#2F3542] bg-[#151C28] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#539AD3]">
            <Sparkles size={13} />
            AI Fan Designer
          </div>

          <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#FBFBFF] md:text-6xl">
            Upload hình ảnh.{" "}
            <span className="block bg-linear-to-r from-[#9ECBFB] via-[#C6E2FF] to-[#539AD3] bg-clip-text text-transparent">
              Tự chỉnh ngay trên mockup.
            </span>
          </h2>

          <p className="mt-6 text-base leading-8 text-[#8D9197]">
            Tải logo, artwork hoặc hình ảnh từ máy. Kéo thả, phóng to, thu nhỏ
            và chọn màu nền để xem trước chiếc quạt của riêng bạn.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Control panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-[#2F3542] bg-[#151C28] p-6 shadow-2xl shadow-black/30"
          >
            <h3 className="font-serif text-2xl font-semibold text-[#FBFBFF]">
              Tạo mẫu quạt của bạn
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#8D9197]">
              Nhập ý tưởng, chọn phong cách, tải ảnh/logo và điều chỉnh trực
              tiếp trên mockup quạt.
            </p>

            <div className="mt-8">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#539AD3]">
                Ý tưởng thiết kế
              </label>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ví dụ: Tôi muốn tạo quạt cho sự kiện khai trương spa, tone xanh mint, cảm giác sang trọng và nhẹ nhàng."
                className="mt-3 min-h-32 w-full resize-none rounded-2xl border border-[#2F3542] bg-[#0D131F] p-4 text-sm text-[#C3C7CD] placeholder-[#8D9197]/60 outline-none transition focus:border-[#539AD3] focus:ring-2 focus:ring-[#539AD3]/20"
              />
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#539AD3]">
                Phong cách
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                      selectedStyle === style
                        ? "border-[#539AD3] bg-[#2A5A84]/30 text-[#C6E2FF]"
                        : "border-[#2F3542] bg-[#0D131F] text-[#8D9197] hover:border-[#539AD3]/50 hover:text-[#C3C7CD]"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#539AD3]">
                <Palette size={13} />
                Màu nền quạt
              </label>

              <div className="mt-3 grid grid-cols-5 gap-2">
                {fanColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-xl border p-1.5 transition ${
                      selectedColor.name === color.name
                        ? "border-[#539AD3] shadow-md shadow-[#539AD3]/20"
                        : "border-[#2F3542] hover:border-[#539AD3]/40"
                    }`}
                  >
                    <div
                      className={`h-10 rounded-lg bg-linear-to-br ${color.className}`}
                    />
                    <p className="mt-1.5 text-[10px] font-medium text-[#8D9197]">
                      {color.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#539AD3]">
                Upload ảnh/logo
              </label>

              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#2F3542] bg-[#0D131F] px-6 py-8 text-center transition hover:border-[#539AD3] hover:bg-[#151C28]">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2F3542] bg-[#151C28] text-[#539AD3]">
                  <Upload size={20} />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#C3C7CD]">
                  Chọn ảnh từ máy
                </p>
                <p className="mt-1 text-xs text-[#8D9197]">
                  Hỗ trợ PNG, JPG, JPEG, WEBP
                </p>
              </label>
            </div>

            {uploadedImage && (
              <div className="mt-6 rounded-2xl border border-[#2F3542] bg-[#0D131F] p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#539AD3]">
                  <Move size={13} />
                  Điều chỉnh ảnh trên quạt
                </div>

                <div className="mt-5">
                  <label className="text-xs font-medium text-[#8D9197]">
                    Phóng to / thu nhỏ
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={logoScale}
                    onChange={(event) =>
                      setLogoScale(Number(event.target.value))
                    }
                    className="mt-2 w-full accent-[#539AD3]"
                  />
                </div>

                <button
                  onClick={resetMockup}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2F3542] px-4 py-2 text-xs font-semibold text-[#8D9197] transition hover:border-[#539AD3] hover:text-[#C3C7CD]"
                >
                  <RotateCcw size={13} />
                  Đặt lại vị trí
                </button>

                <p className="mt-3 text-xs leading-5 text-[#8D9197]">
                  Gợi ý: kéo trực tiếp logo trên mockup để đặt vị trí mong muốn.
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1">
                <Sparkles className="mr-2" size={14} />
                Tạo mẫu thử
              </Button>

              <Button variant="secondary" className="flex-1">
                Gửi báo giá
              </Button>
            </div>
          </motion.div>

          {/* Mockup preview */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-[#2F3542] bg-[#151C28] p-8 shadow-2xl shadow-black/30"
            style={{
              background:
                "linear-gradient(135deg, rgba(42,90,132,0.12) 0%, #151C28 60%)",
            }}
          >
            {/* Status badge top-right */}
            <div className="absolute right-6 top-6 z-20 rounded-xl border border-[#2F3542] bg-[#0D131F]/90 px-4 py-3 backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8D9197]">
                Style selected
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#C6E2FF]">
                {selectedStyle}
              </p>
            </div>

            {/* Status badge bottom-left */}
            <div className="absolute bottom-6 left-6 z-20 rounded-xl border border-[#539AD3]/30 bg-[#2A5A84]/25 px-4 py-3 backdrop-blur">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#539AD3]">
                Preview mode
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#C6E2FF]">
                Live Mockup
              </p>
            </div>

            <div className="flex min-h-140 items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 1.5, -1.5, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`relative flex h-107.5 w-107.5 items-center justify-center rounded-full bg-linear-to-br ${selectedColor.className} shadow-[0_30px_90px_rgba(0,0,0,0.5)]`}
              >
                {/* Fan paper texture */}
                <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.96),rgba(255,255,255,0.48)_35%,rgba(226,232,240,0.55)_100%)]" />

                {/* Paper grain */}
                <div className="absolute inset-4 rounded-full opacity-30 [background-image:radial-gradient(rgba(15,23,42,0.12)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />

                {/* Fan ribs */}
                <div className="absolute h-[82%] w-px bg-slate-200/70" />
                <div className="absolute h-[82%] w-px rotate-30 bg-slate-200/70" />
                <div className="absolute h-[82%] w-px -rotate-30 bg-slate-200/70" />
                <div className="absolute h-[82%] w-px rotate-60 bg-slate-200/70" />
                <div className="absolute h-[82%] w-px -rotate-60 bg-slate-200/70" />

                {/* Uploaded image/logo */}
                {uploadedImage ? (
                  <motion.div
                    drag
                    dragConstraints={{
                      left: -120,
                      right: 120,
                      top: -120,
                      bottom: 120,
                    }}
                    dragMomentum={false}
                    style={{
                      x: logoPosition.x,
                      y: logoPosition.y,
                      scale: logoScale,
                    }}
                    onDragEnd={(_, info) => {
                      setLogoPosition((prev) => ({
                        x: prev.x + info.offset.x,
                        y: prev.y + info.offset.y,
                      }));
                    }}
                    className="relative z-10 flex h-52 w-52 cursor-grab items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white shadow-xl active:cursor-grabbing"
                  >
                    <img
                      src={uploadedImage}
                      alt="Uploaded fan artwork preview"
                      className="h-full w-full select-none object-cover"
                      draggable={false}
                    />
                  </motion.div>
                ) : (
                  <div className="relative z-10 flex h-52 w-52 flex-col items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-center shadow-xl">
                    <ImagePlus className="text-slate-400" size={34} />
                    <p className="mt-3 max-w-32 text-sm font-semibold text-slate-700">
                      Ảnh của bạn sẽ hiện ở đây
                    </p>
                  </div>
                )}

                {/* Handle */}
                <div className="absolute -bottom-28 left-1/2 h-44 w-10 -translate-x-1/2 rounded-full bg-linear-to-b from-slate-200 to-slate-400 shadow-xl" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
