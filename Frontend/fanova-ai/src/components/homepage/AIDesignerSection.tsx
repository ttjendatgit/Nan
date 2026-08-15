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
import EditorialGrid from "./EditorialGrid";

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
      className="relative overflow-hidden px-6 py-20 md:py-28"
      style={{ background: "#F1F0EA" }}
    >
      <EditorialGrid />

      <div className="relative mx-auto max-w-7xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mb-14"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-serif text-4xl font-semibold tracking-tight text-[#0F1320] md:text-5xl lg:max-w-lg">
              Thiết kế chiếc quạt{" "}
              <span className="text-[#192B88]">trong chính không gian của bạn.</span>
            </h2>
            <p className="max-w-sm text-[0.9375rem] leading-7 text-[rgba(15,19,32,0.62)]">
              Tải logo, artwork hoặc hình ảnh từ máy. Kéo thả, phóng to, thu nhỏ
              và chọn màu nền để xem trước chiếc quạt của riêng bạn.
            </p>
          </div>

          <div className="mt-10 h-px bg-[rgba(15,19,32,0.12)]" />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Control panel */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-lg border border-[rgba(15,19,32,0.12)] bg-[#FBFAF6] p-6"
          >
            <h3 className="font-serif text-xl font-semibold text-[#0F1320]">
              Tạo mẫu quạt của bạn
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[rgba(15,19,32,0.62)]">
              Nhập ý tưởng, chọn phong cách, tải ảnh/logo và điều chỉnh trực tiếp trên mockup.
            </p>

            {/* Prompt */}
            <div className="mt-7">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#192B88]">
                Ý tưởng thiết kế
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Tôi muốn tạo quạt cho sự kiện khai trương spa, tone xanh mint, cảm giác sang trọng và nhẹ nhàng."
                className="mt-3 min-h-28 w-full resize-none rounded-lg border border-[rgba(15,19,32,0.14)] bg-[#F1F0EA] p-4 text-sm text-[#0F1320] placeholder-[rgba(15,19,32,0.32)] outline-none transition focus:border-[#192B88] focus:ring-2 focus:ring-[#192B88]/15"
              />
            </div>

            {/* Style selector — CMS: aiDesignerConfig.styles */}
            <div className="mt-6">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#192B88]">
                Phong cách
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {aiDesignerConfig.styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                      selectedStyle === style
                        ? "border-[#192B88] bg-[#192B88]/10 text-[#192B88]"
                        : "border-[rgba(15,19,32,0.14)] bg-[#F1F0EA] text-[rgba(15,19,32,0.55)] hover:border-[rgba(15,19,32,0.30)] hover:text-[#192B88]"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector — CMS: aiDesignerConfig.fanColors */}
            <div className="mt-6">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#192B88]">
                <Palette size={12} />
                Màu nền quạt
              </label>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {aiDesignerConfig.fanColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-lg border p-1.5 transition-all duration-200 ${
                      selectedColor.name === color.name
                        ? "border-[#192B88] shadow-[0_0_0_2px_rgba(25,43,136,0.12)]"
                        : "border-[rgba(15,19,32,0.12)] hover:border-[rgba(15,19,32,0.30)]"
                    }`}
                  >
                    <div className={`h-9 rounded-md bg-gradient-to-br ${color.className}`} />
                    <p className="mt-1.5 truncate text-[10px] font-medium text-[rgba(15,19,32,0.50)]">
                      {color.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="mt-6">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#192B88]">
                Upload ảnh / logo
              </label>
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(15,19,32,0.20)] bg-[#F1F0EA] px-6 py-7 text-center transition hover:border-[#192B88] hover:bg-[#192B88]/[0.05]">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[rgba(15,19,32,0.14)] bg-[#192B88]/10 text-[#192B88]">
                  <Upload size={18} />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#0F1320]">Chọn ảnh từ máy</p>
                <p className="mt-1 text-xs text-[rgba(15,19,32,0.42)]">PNG, JPG, JPEG, WEBP</p>
              </label>
            </div>

            {/* Image controls (visible after upload) */}
            {uploadedImage && (
              <div className="mt-5 rounded-lg border border-[rgba(15,19,32,0.14)] bg-[#F1F0EA] p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#192B88]">
                  <Move size={12} />
                  Điều chỉnh ảnh
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-[rgba(15,19,32,0.55)]">Phóng to / thu nhỏ</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={logoScale}
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    className="mt-2 w-full accent-[#192B88]"
                  />
                </div>
                <button
                  onClick={resetMockup}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(15,19,32,0.16)] px-4 py-1.5 text-xs font-semibold text-[rgba(15,19,32,0.55)] transition hover:border-[#192B88] hover:text-[#192B88]"
                >
                  <RotateCcw size={11} />
                  Đặt lại vị trí
                </button>
                <p className="mt-2.5 text-[11px] leading-5 text-[rgba(15,19,32,0.42)]">
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
            className="relative overflow-hidden rounded-lg border border-[rgba(15,19,32,0.14)] bg-[#EDEBE1] p-8"
          >
            {/* Style badge */}
            <div className="absolute right-5 top-5 z-20 rounded-lg border border-[rgba(15,19,32,0.14)] bg-[#F1F0EA] px-4 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[rgba(15,19,32,0.42)]">
                Style selected
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#0F1320]">{selectedStyle}</p>
            </div>

            {/* Preview badge */}
            <div className="absolute bottom-5 left-5 z-20 rounded-lg border border-[#192B88]/25 bg-[#192B88]/10 px-4 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#192B88]">
                Preview mode
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#192B88]">Live Mockup</p>
            </div>

            <div className="flex min-h-[300px] items-center justify-center sm:min-h-[420px] lg:min-h-[560px]">
              <motion.div
                animate={{ rotate: [0, 1.5, -1.5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className={`relative flex h-60 w-60 shrink-0 items-center justify-center rounded-full bg-gradient-to-br sm:h-96 sm:w-96 lg:h-[430px] lg:w-[430px] ${selectedColor.className} shadow-[0_30px_90px_rgba(15,19,32,0.14)]`}
              >
                {/* Paper texture */}
                <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.96),rgba(255,255,255,0.48)_35%,rgba(169,171,165,0.30)_100%)]" />
                <div className="absolute inset-4 rounded-full opacity-25 [background-image:radial-gradient(rgba(15,19,32,0.10)_0.7px,transparent_0.7px)] [background-size:10px_10px]" />

                {/* Fan ribs */}
                <div className="absolute h-[82%] w-px bg-[rgba(15,19,32,0.20)]" />
                <div className="absolute h-[82%] w-px rotate-30 bg-[rgba(15,19,32,0.20)]" />
                <div className="absolute h-[82%] w-px -rotate-30 bg-[rgba(15,19,32,0.20)]" />
                <div className="absolute h-[82%] w-px rotate-60 bg-[rgba(15,19,32,0.20)]" />
                <div className="absolute h-[82%] w-px -rotate-60 bg-[rgba(15,19,32,0.20)]" />

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
                  <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-dashed border-[rgba(15,19,32,0.28)] bg-white text-center shadow-xl sm:h-44 sm:w-44 lg:h-52 lg:w-52">
                    <ImagePlus className="text-[rgba(15,19,32,0.35)]" size={22} />
                    <p className="mt-2 max-w-[5.5rem] text-xs font-semibold text-[#0F1320] sm:mt-3 sm:max-w-32 sm:text-sm">
                      Ảnh của bạn sẽ hiện ở đây
                    </p>
                  </div>
                )}

                {/* Handle */}
                <div className="absolute -bottom-10 left-1/2 h-16 w-5 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#B6A17B]/70 to-[#B6A17B] shadow-xl sm:-bottom-[4.5rem] sm:h-28 sm:w-7 lg:-bottom-28 lg:h-44 lg:w-10" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
