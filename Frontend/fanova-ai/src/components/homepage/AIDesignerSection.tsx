"use client";

// CMS: style options and fan color palette are sourced from aiDesignerConfig.
// Core upload / mockup logic is handled in-component and is connected to the
// upload API separately — only the selectable option lists are CMS-controlled.

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
import { aiDesignerConfig } from "@/data/homepageData";

export default function AIDesignerSection() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(aiDesignerConfig.styles[1]); // default: "Sang trọng"
  const [prompt, setPrompt] = useState("");
  const [selectedColor, setSelectedColor] = useState(aiDesignerConfig.fanColors[0]);
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
      className="relative overflow-hidden bg-[#FFFFFF] px-6 py-20 md:py-28"
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-dots opacity-50" />

      {/* Soft glows */}
      <div className="pointer-events-none absolute left-0 top-20 h-80 w-80 rounded-full bg-[#DCEAF7]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-0 h-80 w-80 rounded-full bg-[#DCEAF7]/18 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#08337D]">
            02 / AI Designer
          </p>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#081426] md:text-5xl lg:max-w-lg">
              Upload hình ảnh.{" "}
              <span className="text-[#08337D]">Xem ngay trên mockup.</span>
            </h2>
            <p className="max-w-sm text-[0.9375rem] leading-7 text-[#4A74A7]">
              Tải logo, artwork hoặc hình ảnh từ máy. Kéo thả, phóng to, thu nhỏ
              và chọn màu nền để xem trước chiếc quạt của riêng bạn.
            </p>
          </div>

          <div className="mt-10 h-px bg-gradient-to-r from-[rgba(8,51,125,0.14)] via-[rgba(8,51,125,0.08)] to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Control panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.10)] bg-[#FFFFFF] p-6 shadow-[0_2px_24px_rgba(8,51,125,0.07)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.20)] to-transparent" />

            <h3 className="font-serif text-xl font-semibold text-[#081426]">
              Tạo mẫu quạt của bạn
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[#4A74A7]">
              Nhập ý tưởng, chọn phong cách, tải ảnh/logo và điều chỉnh trực tiếp trên mockup.
            </p>

            {/* Prompt */}
            <div className="mt-7">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#08337D]">
                Ý tưởng thiết kế
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Tôi muốn tạo quạt cho sự kiện khai trương spa, tone xanh mint, cảm giác sang trọng và nhẹ nhàng."
                className="mt-3 min-h-28 w-full resize-none rounded-xl border border-[rgba(8,51,125,0.12)] bg-[#F7FAFF] p-4 text-sm text-[#081426] placeholder-[rgba(8,20,38,0.28)] outline-none transition focus:border-[#08337D] focus:ring-2 focus:ring-[#4A74A7]/15"
              />
            </div>

            {/* Style selector — CMS: aiDesignerConfig.styles */}
            <div className="mt-6">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#08337D]">
                Phong cách
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {aiDesignerConfig.styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                      selectedStyle === style
                        ? "border-[#08337D] bg-[#DCEAF7] text-[#08337D] shadow-[0_0_0_2px_rgba(8,51,125,0.08)]"
                        : "border-[rgba(8,51,125,0.12)] bg-[#F7FAFF] text-[rgba(8,20,38,0.55)] hover:border-[rgba(8,51,125,0.28)] hover:text-[#08337D]"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector — CMS: aiDesignerConfig.fanColors */}
            <div className="mt-6">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#08337D]">
                <Palette size={12} />
                Màu nền quạt
              </label>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {aiDesignerConfig.fanColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-xl border p-1.5 transition-all duration-200 ${
                      selectedColor.name === color.name
                        ? "border-[#08337D] shadow-[0_0_0_2px_rgba(8,51,125,0.10),0_2px_8px_rgba(8,51,125,0.10)]"
                        : "border-[rgba(8,51,125,0.10)] hover:border-[rgba(8,51,125,0.28)]"
                    }`}
                  >
                    <div className={`h-9 rounded-lg bg-gradient-to-br ${color.className}`} />
                    <p className="mt-1.5 truncate text-[10px] font-medium text-[rgba(8,20,38,0.45)]">
                      {color.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="mt-6">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#08337D]">
                Upload ảnh / logo
              </label>
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(8,51,125,0.18)] bg-[#F7FAFF] px-6 py-7 text-center transition hover:border-[#08337D] hover:bg-[#DCEAF7]/50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(8,51,125,0.14)] bg-[#DCEAF7] text-[#08337D]">
                  <Upload size={18} />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#081426]">Chọn ảnh từ máy</p>
                <p className="mt-1 text-xs text-[rgba(8,20,38,0.40)]">PNG, JPG, JPEG, WEBP</p>
              </label>
            </div>

            {/* Image controls (visible after upload) */}
            {uploadedImage && (
              <div className="mt-5 rounded-xl border border-[rgba(8,51,125,0.12)] bg-[#F7FAFF] p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#08337D]">
                  <Move size={12} />
                  Điều chỉnh ảnh
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-[#4A74A7]">Phóng to / thu nhỏ</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={logoScale}
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    className="mt-2 w-full accent-[#08337D]"
                  />
                </div>
                <button
                  onClick={resetMockup}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,51,125,0.14)] px-4 py-1.5 text-xs font-semibold text-[rgba(8,20,38,0.55)] transition hover:border-[#08337D] hover:text-[#08337D]"
                >
                  <RotateCcw size={11} />
                  Đặt lại vị trí
                </button>
                <p className="mt-2.5 text-[11px] leading-5 text-[rgba(8,20,38,0.40)]">
                  Kéo trực tiếp logo trên mockup để đặt vị trí mong muốn.
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1">
                <Sparkles className="mr-2" size={13} />
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
            className="relative overflow-hidden rounded-2xl border border-[rgba(8,51,125,0.12)] p-8 shadow-[0_2px_28px_rgba(8,51,125,0.08)]"
            style={{
              background: "linear-gradient(135deg, #DCEAF7 0%, #EEF5FC 55%, #F7FAFF 100%)",
            }}
          >
            <div className="absolute inset-x-0 top-0 z-30 h-px bg-gradient-to-r from-transparent via-[rgba(8,51,125,0.25)] to-transparent" />

            {/* Style badge */}
            <div className="absolute right-5 top-5 z-20 rounded-xl border border-[rgba(8,51,125,0.12)] bg-[#FFFFFF] px-4 py-2.5 shadow-[0_2px_12px_rgba(8,51,125,0.07)]">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[rgba(8,20,38,0.40)]">
                Style selected
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#081426]">{selectedStyle}</p>
            </div>

            {/* Preview badge */}
            <div className="absolute bottom-5 left-5 z-20 rounded-xl border border-[rgba(8,51,125,0.14)] bg-[#DCEAF7] px-4 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#08337D]">
                Preview mode
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#08337D]">Live Mockup</p>
            </div>

            <div className="flex min-h-[300px] items-center justify-center sm:min-h-[420px] lg:min-h-[560px]">
              <motion.div
                animate={{ rotate: [0, 1.5, -1.5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className={`relative flex h-60 w-60 shrink-0 items-center justify-center rounded-full bg-gradient-to-br sm:h-96 sm:w-96 lg:h-[430px] lg:w-[430px] ${selectedColor.className} shadow-[0_30px_90px_rgba(8,51,125,0.12)]`}
              >
                {/* Paper texture */}
                <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.96),rgba(255,255,255,0.48)_35%,rgba(220,234,247,0.55)_100%)]" />
                <div className="absolute inset-4 rounded-full opacity-25 [background-image:radial-gradient(rgba(8,20,38,0.10)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />

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
                    dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
                    dragMomentum={false}
                    style={{ x: logoPosition.x, y: logoPosition.y, scale: logoScale }}
                    onDragEnd={(_, info) => {
                      setLogoPosition((prev) => ({
                        x: prev.x + info.offset.x,
                        y: prev.y + info.offset.y,
                      }));
                    }}
                    className="relative z-10 flex h-32 w-32 cursor-grab items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white shadow-xl active:cursor-grabbing sm:h-44 sm:w-44 lg:h-52 lg:w-52"
                  >
                    <img
                      src={uploadedImage}
                      alt="Uploaded fan artwork preview"
                      className="h-full w-full select-none object-cover"
                      draggable={false}
                    />
                  </motion.div>
                ) : (
                  <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-center shadow-xl sm:h-44 sm:w-44 lg:h-52 lg:w-52">
                    <ImagePlus className="text-slate-400" size={22} />
                    <p className="mt-2 max-w-[5.5rem] text-xs font-semibold text-slate-700 sm:mt-3 sm:max-w-32 sm:text-sm">
                      Ảnh của bạn sẽ hiện ở đây
                    </p>
                  </div>
                )}

                {/* Handle */}
                <div className="absolute -bottom-10 left-1/2 h-16 w-5 -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 shadow-xl sm:-bottom-[4.5rem] sm:h-28 sm:w-7 lg:-bottom-28 lg:h-44 lg:w-10" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
