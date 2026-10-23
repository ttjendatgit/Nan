/**
 * R6 homepage asset slots (R6.1.5 storyboard, section D). Every slot already has its final aspect
 * ratio, crop and role, so the choreography is built around the real geometry. Until a production
 * asset exists `src` stays "" and AssetSlot draws a labelled placeholder in the same box.
 *
 * Replacing an asset = filling `src` (and `alt`). No layout or animation change should be needed.
 * Never fill a slot with AI-generated, stock or the two legacy PNGs in public/images
 * (DECISIONS.md §10).
 *
 * R10.2: a slot without `src` no longer draws a labelled placeholder (AssetSlot renders a quiet
 * brand surface), and no homepage section renders an empty slot any more. Until the A2-A5 shoots
 * exist, the homepage uses the real catalogue photographs below (uploaded by the admin to
 * Cloudinary; the same files the catalogue shows).
 */

// ── R10.2: real catalogue photographs (Cloudinary, uploaded through the admin) ──
const CLOUDINARY = "https://res.cloudinary.com/dyxojmo2q/image/upload";
export const catalogPhotos = {
  /** Painted bamboo-leaf paper fan on a woven backdrop (category "Quạt giấy"). 736×459. */
  paperFan: `${CLOUDINARY}/v1781416606/nan/categories/5aa02b76185f8ce413b639100bdbbc6c_ommfwx.jpg`,
  /** "Hội chợ mùa thu" event fan, held in hand (category "Quạt nan tre"). 736×552. */
  eventFan: `${CLOUDINARY}/v1781775647/nan/categories/0992b0ca1cc18eefa6b5fe58b789696c_k8sitt.jpg`,
  /** Red branded "Văn Hoá" fan, held in hand over leaves (product "Quạt Kan Hy"). 1200×1200. */
  brandedFan: `${CLOUDINARY}/v1789449166/nan/products/cc24f133fdef9978ee14be30c32e6b3d_fd4ndt.jpg`,
};

export interface AssetDef {
  /** Asset code from the storyboard shopping list, e.g. "A2-F1". */
  id: string;
  /** What the final photograph shows; printed on the placeholder. */
  subject: string;
  /** CSS aspect-ratio of the final asset, e.g. "4 / 5". */
  ratio: string;
  /** Cut-out on a transparent background (object-contain) rather than a full-bleed photo. */
  cutout?: boolean;
  /** Production URL (Cloudinary or /public). Empty = quiet brand surface (AssetSlot). */
  src: string;
  alt: string;
  /** R10.3: optional editorial caption, set under the image where a section shows one. */
  caption?: string;
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
  ratio: "3 / 2",
  // R10.2: the catalogue's painted paper fan until the A5 shoot (the craftsperson's hands) exists
  src: catalogPhotos.paperFan,
  alt: "Quạt giấy vẽ tay hoạ tiết lá tre, nan tre mộc, đặt trước nền mành tre",
};

// ── R10.5-H: the Hero fan. The Hero places its fan by the fan's PIVOT (where the ribs meet), so
// any production asset drops in without a layout change as long as it says where its pivot is:
//   · a PNG/WebP cut-out (alpha, >= 3000px wide, finished Nan fan, front or 3/4, no watermark);
//   · `ratio` = the image's own width / height; `pivot` = the pivot as fractions of the image box.
//   · `extent` = the visible fan (leaf + handle, not the transparent margin) as fractions of the
//     image WIDTH: its total width, how far its top is above the pivot, how far the handle ends
//     below it. R10.6: the Hero sizes the fan from these, so the whole object always fits.
// While `src` is empty the Hero renders the SilkFan vector, whose pivot is (0.5, 0.873) of its
// 1132 × 648.235 viewBox (SilkFan.tsx: cx 500, cy 575); its leaf spans x 77..923, y 139..633. ──
export interface HeroFanAsset extends AssetDef {
  pivot: { x: number; y: number };
  extent: { width: number; above: number; below: number };
}
// The Hero's fan is the SilkFan 3D-style vector (HeroVisualStage → silk-fan/HeroSilkStage →
// silk-fan/SilkFan.tsx): navy folded leaf, gold edge, "NAN" lettering. `src` stays "" on purpose;
// it is the Hero's visual identity, not a slot for photography (R11.1: no catalogue photos).
export const heroFan: HeroFanAsset = {
  id: "A1-hero",
  subject: "Quạt Nan 3D (SilkFan)",
  ratio: "1132 / 648.235",
  cutout: true,
  src: "",
  alt: "",
  pivot: { x: 0.5, y: (575 - 9) / 648.235 },
  extent: { width: 0.747, above: 0.385, below: 0.051 },
};

// ── R10.5: the prepress photograph (Material, "Chuẩn khi in thật"). Interim: the catalogue's
// printed fabric fan on a plain ground (a finished print, colour gradient intact). Replace with a
// production shot of a proof / printed sheet on the check table; the frame owns its ratio. ──
export const prepressPhoto: AssetDef = {
  id: "A3-prepress",
  subject: "Bản in / proof trên bàn kiểm tra",
  ratio: "4 / 3",
  src: `${CLOUDINARY}/v1781415147/nan/categories/630ac547e39e13a35809d1ca91f94ccb_kbwlcs.jpg`,
  alt: "Quạt vải in chuyển màu xanh, nan gỗ, đặt trên nền trơn",
};

// ── R10.2/R10.3: UseCase editorial pair (real photographs of Nan fans in use) ──
// Frames own their aspect ratio (UseCaseSection); `ratio` here only describes the source, so a
// production photograph of any shape drops in with `src` + `alt` and no layout change.
export const useCaseFeature: AssetDef = {
  id: "A4-feature",
  subject: "Quạt in thương hiệu trên tay khách",
  ratio: "1 / 1",
  src: catalogPhotos.brandedFan,
  alt: "Quạt giấy in nhận diện màu đỏ, cầm trên tay trước tán lá xanh",
};
export const useCaseDetail: AssetDef = {
  id: "A4-detail",
  subject: "Quạt sự kiện trên tay khách",
  ratio: "4 / 3",
  src: catalogPhotos.eventFan,
  alt: "Quạt nan tre in cho hội chợ mùa thu, cầm trên tay",
  caption: "Quạt nan tre in cho một hội chợ mùa thu.",
};

/**
 * R10.3/R10.4: one scene per UseCase context (keys = useCases ids in homepageData). `photo` is the
 * context's own production photograph (A4-01..03), null until the shoot: the section then keeps
 * the feature photograph. Filling `photo` makes the main frame cross-fade to it while that context
 * is active; nothing else changes.
 */
export interface UseCaseScene {
  photo: AssetDef | null;
}
export const useCaseScenes: Record<string, UseCaseScene> = {
  events: { photo: null },
  resort: { photo: null },
  restaurant: { photo: null },
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
