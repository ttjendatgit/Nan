/**
 * R6 homepage asset slots (R6.1.5 storyboard, section D). Every slot already has its final aspect
 * ratio, crop and role, so the choreography is built around the real geometry. Until a production
 * asset exists `src` stays "" and AssetSlot draws a labelled placeholder in the same box.
 *
 * Replacing an asset = filling `src` (and `alt`). No layout or animation change should be needed.
 * Placeholders are for the R6.2 prototype only: never ship them, and never fill a slot with
 * AI-generated, stock or the two legacy PNGs in public/images (DECISIONS.md §10).
 */

export interface AssetDef {
  /** Asset code from the storyboard shopping list, e.g. "A2-F1". */
  id: string;
  /** What the final photograph shows; printed on the placeholder. */
  subject: string;
  /** CSS aspect-ratio of the final asset, e.g. "4 / 5". */
  ratio: string;
  /** Cut-out on a transparent background (object-contain) rather than a full-bleed photo. */
  cutout?: boolean;
  /** Production URL (Cloudinary or /public). Empty = placeholder. */
  src: string;
  alt: string;
}

// ── A2: one design through production (Process, SM02) ──
// Shot top-down on a locked tripod, same light and table; the fan template sits on the same pixels
// in every frame so the frames register exactly.
export const processFrames: Record<"F1" | "F2" | "F3" | "F4a" | "F4b" | "F5", AssetDef> = {
  F1: { id: "A2-F1", subject: "Khuôn quạt trống trên tờ giấy", ratio: "4 / 5", src: "", alt: "Khuôn quạt trống với đường cắt và nếp gấp in mờ" },
  F2: { id: "A2-F2", subject: "Khuôn đã đặt artwork", ratio: "4 / 5", src: "", alt: "Khuôn quạt đã đặt artwork của khách hàng" },
  F3: { id: "A2-F3", subject: "Bản proof có dấu cắt và ô màu", ratio: "4 / 5", src: "", alt: "Bản proof có dấu cắt, bleed và ô màu kiểm tra" },
  F4a: { id: "A2-F4a", subject: "Tờ in phẳng", ratio: "4 / 5", src: "", alt: "Tờ in phẳng trước khi gấp" },
  F4b: { id: "A2-F4b", subject: "Tờ in đã gấp nếp", ratio: "4 / 5", src: "", alt: "Tờ in đã được gấp nếp" },
  F5: { id: "A2-F5", subject: "Quạt hoàn thiện trên nan tre", ratio: "4 / 5", src: "", alt: "Chiếc quạt hoàn thiện trên nan tre" },
};

// ── A3: materials (Material, SM03). Order matches `materials` in homepageData. ──
export const materialMacros: AssetDef[] = [
  { id: "A3a-01", subject: "Macro giấy Couche", ratio: "1 / 1", src: "", alt: "Cận cảnh bề mặt giấy Couche" },
  { id: "A3a-02", subject: "Macro giấy mỹ thuật", ratio: "1 / 1", src: "", alt: "Cận cảnh thớ giấy mỹ thuật" },
  { id: "A3a-03", subject: "Macro cán mờ", ratio: "1 / 1", src: "", alt: "Cận cảnh bề mặt cán mờ" },
  { id: "A3a-04", subject: "Macro cán bóng", ratio: "1 / 1", src: "", alt: "Cận cảnh bề mặt cán bóng" },
  { id: "A3a-05", subject: "Macro ép kim trên logo", ratio: "1 / 1", src: "", alt: "Cận cảnh logo ép kim" },
  { id: "A3a-06", subject: "Macro tay cầm", ratio: "1 / 1", src: "", alt: "Cận cảnh tay cầm nhựa và gỗ" },
];

export const materialStrips: AssetDef[] = [
  { id: "A3b-01", subject: "Dải mẫu Couche", ratio: "1 / 4", cutout: true, src: "", alt: "" },
  { id: "A3b-02", subject: "Dải mẫu mỹ thuật", ratio: "1 / 4", cutout: true, src: "", alt: "" },
  { id: "A3b-03", subject: "Dải mẫu cán mờ", ratio: "1 / 4", cutout: true, src: "", alt: "" },
  { id: "A3b-04", subject: "Dải mẫu cán bóng", ratio: "1 / 4", cutout: true, src: "", alt: "" },
  { id: "A3b-05", subject: "Dải mẫu ép kim", ratio: "1 / 4", cutout: true, src: "", alt: "" },
  { id: "A3b-06", subject: "Dải mẫu tay cầm", ratio: "1 / 4", cutout: true, src: "", alt: "" },
];

// ── A4: fans in real spaces (UseCase). Order matches `useCases` in homepageData. Portraits and
// landscapes alternate; the first is the large image that overlaps the Material edge. ──
export const useCasePhotos: AssetDef[] = [
  { id: "A4-01", subject: "Quạt tại sự kiện", ratio: "4 / 5", src: "", alt: "Quạt Nan được dùng tại một sự kiện" },
  { id: "A4-02", subject: "Quạt tại resort", ratio: "3 / 2", src: "", alt: "Quạt Nan tại resort" },
  { id: "A4-03", subject: "Quạt tại nhà hàng, café", ratio: "4 / 5", src: "", alt: "Quạt Nan trong nhà hàng" },
  { id: "A4-04", subject: "Quạt làm quà doanh nghiệp", ratio: "3 / 2", src: "", alt: "Quạt Nan làm quà tặng doanh nghiệp" },
  { id: "A4-05", subject: "Quạt cho chiến dịch thương hiệu", ratio: "4 / 5", src: "", alt: "Quạt Nan tại booth thương hiệu" },
];

// ── A5: the craftsperson (BrandStatement, SM01) ──
export const brandPhoto: AssetDef = {
  id: "A5",
  subject: "Bàn tay đang gấp nếp quạt giấy",
  ratio: "4 / 5",
  src: "",
  alt: "Bàn tay nghệ nhân đang gấp nếp một chiếc quạt giấy",
};

// ── A1: fan cut-outs. Square canvas, fan open and front-facing, handle at bottom centre (the
// transform origin used by the ProductType stage). Category images from the API fill these at
// runtime; A1-final is the finished fan of the Process design, for the FinalCTA. ──
export function productCutout(name: string, src = ""): AssetDef {
  return { id: "A1", subject: `Quạt ${name}, cắt nền`, ratio: "1 / 1", cutout: true, src, alt: name };
}

export const finalFan: AssetDef = {
  id: "A1-final",
  subject: "Quạt hoàn thiện (cùng thiết kế với A2-F5), cắt nền",
  ratio: "16 / 9",
  cutout: true,
  src: "",
  alt: "Chiếc quạt Nan hoàn thiện, mở rộng",
};

// ── A6: Nan logo (SVG). Defined for the asset list; Navbar/Footer are outside R6.2. ──
export const nanLogo: AssetDef = { id: "A6", subject: "Logo Nan (SVG)", ratio: "3 / 1", src: "", alt: "Nan" };
