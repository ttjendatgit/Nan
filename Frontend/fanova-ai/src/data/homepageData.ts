// ─────────────────────────────────────────────────────────────────────────────
// Nan — Homepage CMS-ready data layer
//
// This file is the single source of truth for all homepage content.
//
// Future CMS integration:
//   Replace the static exports below with async fetches from the admin API:
//   e.g.  import { getHomepageConfig } from "@/lib/cms"
//         const data = await getHomepageConfig()
//
// Each section is tagged with a suggested CMS admin path for reference.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Base types ──────────────────────────────────────────────────────────────

/**
 * CMS-ready image / video slot.
 *
 * When an admin uploads an asset via the media manager, `src` is replaced
 * with the CDN URL returned by the upload API.
 *
 * `fallback` holds the previous / placeholder URL while the new upload
 * is processing or if the CDN asset is unavailable.
 *
 * `focalPoint` (x/y in 0–1 normalised coordinates) is used to compute
 * CSS `object-position` for responsive crops — mirrors Contentful/Sanity
 * hotspot convention.
 */
export type ImageSlot = {
  src: string;
  alt: string;
  type?: "image" | "video";
  fallback?: string;
  focalPoint?: { x: number; y: number };
};

// ─── Announcement bar ────────────────────────────────────────────────────────
// CMS path: admin/settings > announcement-bar

export const announcementBar = {
  visible: true,
  text: "Miễn phí tư vấn thiết kế cho đơn hàng đầu tiên",
};

// ─── Navigation ──────────────────────────────────────────────────────────────
// CMS path: admin/settings > navigation

export const navConfig = {
  ctaText: "Bắt đầu thiết kế",
  links: [
    { label: "Collections", href: "/products" },
    { label: "Materials",   href: "#materials" },
    { label: "Process",     href: "#process" },
    { label: "Quote",       href: "#quote" },
  ],
};

// ─── Hero section ─────────────────────────────────────────────────────────────
// CMS path: admin/hero

export const heroConfig = {
  // ── Image / video slots ────────────────────────────────────────────────────
  // Future: when src is non-empty, the component renders the asset as a
  // background layer alongside (or instead of) HeroCanvas.
  backgroundImage: {
    src: "",         // CMS: upload a static hero background image
    alt: "Nan fan design hero background",
    fallback: "",
    focalPoint: { x: 0.65, y: 0.42 },
  } as ImageSlot,
  backgroundVideo: {
    src: "",         // CMS: upload an mp4 / webm hero background video
    alt: "",
    type: "video" as const,
    fallback: "",
  } as ImageSlot,
  posterImage: {
    src: "",         // CMS: still frame used as video poster
    alt: "Nan fan design hero",
  } as ImageSlot,

  // ── Text content ───────────────────────────────────────────────────────────
  badge: "Vietnamese Heritage Fan Design",
  headline: "Di sản trong từng nếp quạt.",
  /** R11.1: the same headline as the Hero's collision lines: two on desktop, three on phones/tablets. */
  headlineLines: ["Di sản trong", "từng nếp quạt."],
  headlineParts: ["Di sản", "trong từng", "nếp quạt."],
  /** R11: the Hero's one supporting note (replaces `subheadline` in the Hero). */
  statement: "Bạn đưa ý tưởng. Nan biến nó thành một chiếc quạt mang dấu ấn riêng.",
  /** Hero showcase: the second supporting line, under the subheadline. */
  supportLine: "Từ ý tưởng, chất liệu đến hoàn thiện, Nan biến mỗi chiếc quạt thành một dấu ấn riêng.",
  subheadline:
    "Quạt thủ công cá nhân hóa cho sự kiện, thương hiệu và quà tặng cao cấp.",
  primaryCta:   "Gửi yêu cầu báo giá",
  secondaryCta: "Khám phá dòng quạt",
  proofPoints: [
    "Thiết kế theo yêu cầu",
    "Sản xuất theo số lượng",
    "Tư vấn chất liệu & hoàn thiện",
  ],
};

// ─── Collections (shop by solution) ──────────────────────────────────────────
// CMS path: admin/collections

export type Collection = {
  id: string;
  name: string;
  badge: string;
  description: string;
  /**
   * CMS: collection card image.
   * When image.src is set the component should render <img> over the
   * gradient fallback inside the card visual area.
   */
  image: ImageSlot;
  /** Tailwind gradient classes — visual fallback when image.src is empty */
  gradient: string;
  /** Tailwind class for the fan accent circle while no photo is available */
  accentColor: string;
  cta: string;
};

export const collections: Collection[] = [
  {
    id: "wedding-fans",
    name: "Wedding Fans",
    badge: "For special moments",
    description:
      "Quạt giấy tinh tế cho tiệc cưới, lễ ngoài trời và welcome gift. Thiết kế cá nhân hóa từng chi tiết.",
    image: {
      src: "",  // CMS: no collection photo yet; the card shows FanMockupFallback
      alt: "Wedding fans custom paper fan design",
      fallback: "",
    },
    gradient: "from-rose-50 to-pink-50",
    accentColor: "bg-rose-200",
    cta: "Xem mẫu",
  },
  {
    id: "resort-hospitality",
    name: "Resort & Hospitality",
    badge: "Premium experience",
    description:
      "Biến quạt giấy thành vật phẩm trải nghiệm cao cấp cho resort, khách sạn và beach club.",
    image: {
      src: "",  // CMS: no collection photo yet; the card shows FanMockupFallback
      alt: "Resort and hospitality custom fan design",
      fallback: "",
    },
    gradient: "from-sky-50 to-[#DCEAF7]",
    accentColor: "bg-sky-200",
    cta: "Xem mẫu",
  },
  {
    id: "restaurant-cafe",
    name: "Restaurant / Café",
    badge: "F&B branding",
    description:
      "Vật phẩm nhỏ, cảm nhận lớn. Phù hợp nhà hàng, quán café, rooftop bar và không gian mùa hè.",
    image: {
      src: "",  // CMS: no collection photo yet; the card shows FanMockupFallback
      alt: "Restaurant and cafe custom fan design",
      fallback: "",
    },
    gradient: "from-amber-50 to-orange-50",
    accentColor: "bg-amber-200",
    cta: "Xem mẫu",
  },
  {
    id: "brand-campaign",
    name: "Brand Campaign",
    badge: "Marketing & activation",
    description:
      "Kết nối thương hiệu với khách hàng qua booth activation, sampling và chiến dịch quảng bá.",
    image: {
      src: "",  // CMS: no collection photo yet; the card shows FanMockupFallback
      alt: "Brand campaign custom fan design",
      fallback: "",
    },
    gradient: "from-violet-50 to-[#DCEAF7]",
    accentColor: "bg-violet-200",
    cta: "Xem sản phẩm",
  },
  {
    id: "event-activation",
    name: "Event & Activation",
    badge: "Mass production",
    description:
      "Nhẹ, đẹp, dễ lan tỏa. Sản xuất số lượng lớn cho hội chợ, khai trương và sự kiện ngoài trời.",
    image: {
      src: "",  // CMS: no collection photo yet; the card shows FanMockupFallback
      alt: "Event and activation custom fan design",
      fallback: "",
    },
    gradient: "from-blue-50 to-[#DCEAF7]",
    accentColor: "bg-blue-200",
    cta: "Xem sản phẩm",
  },
  {
    id: "premium-gift",
    name: "Premium Gift",
    badge: "Corporate gifting",
    description:
      "Quà tặng mang dấu ấn thương hiệu: dành cho đối tác, khách VIP và bộ sưu tập giới hạn.",
    image: {
      src: "",  // CMS: no collection photo yet; the card shows FanMockupFallback
      alt: "Premium gift custom fan design",
      fallback: "",
    },
    gradient: "from-yellow-50 to-amber-50",
    accentColor: "bg-[#ECCA3E]/30",
    cta: "Xem sản phẩm",
  },
];

// ─── Materials ────────────────────────────────────────────────────────────────
// CMS path: admin/materials

export type Material = {
  name: string;
  description: string;
  /** R10.5: what the surface is / does (the first half of `description`, nothing added). */
  surface: string;
  /** R10.5: when to choose it (the "phù hợp" half of `description`, nothing added). */
  bestFor: string;
  tag: string;
  /** Tailwind gradient classes — visual fallback when image.src is empty */
  gradient: string;
  /**
   * CMS: material texture / preview photo.
   * When image.src is set the component should render <img> inside the
   * card visual area over the gradient.
   */
  image: ImageSlot;
};

export const materials: Material[] = [
  {
    name: "Giấy Couche",
    description:
      "Bề mặt mịn, màu sắc in rõ, phù hợp quạt sự kiện, quảng cáo và số lượng lớn.",
    surface: "Bề mặt mịn, màu sắc in rõ.",
    bestFor: "Quạt sự kiện, quảng cáo, đơn số lượng lớn.",
    tag: "Popular",
    gradient: "from-blue-50 to-[#F5F8FF]",
    image: {
      src: "",  // CMS: no material photo yet; the card shows the paper-deep surface
      alt: "Giấy Couche paper material texture",
      fallback: "",
    },
  },
  {
    name: "Giấy mỹ thuật",
    description:
      "Texture sang hơn, phù hợp wedding, resort, thương hiệu lifestyle và quà tặng cao cấp.",
    surface: "Bề mặt có vân giấy, cảm giác sang hơn khi cầm.",
    bestFor: "Tiệc cưới, resort, thương hiệu lifestyle, quà tặng cao cấp.",
    tag: "Premium",
    gradient: "from-amber-50 to-[#F5F8FF]",
    image: {
      src: "",  // CMS: no material photo yet; the card shows the paper-deep surface
      alt: "Giấy mỹ thuật art paper texture",
      fallback: "",
    },
  },
  {
    name: "Cán mờ",
    description:
      "Tạo cảm giác mềm, tinh tế, hạn chế phản sáng và giúp thiết kế nhìn cao cấp hơn.",
    surface: "Lớp phủ mờ, cảm giác mềm, hạn chế phản sáng.",
    bestFor: "Thiết kế cần vẻ nhã nhặn, cao cấp.",
    tag: "Elegant",
    gradient: "from-slate-100 to-[#F5F8FF]",
    image: {
      src: "",  // CMS: no material photo yet; the card shows the paper-deep surface
      alt: "Cán mờ matte lamination texture",
      fallback: "",
    },
  },
  {
    name: "Cán bóng",
    description:
      "Làm màu sắc nổi bật hơn, phù hợp thiết kế rực rỡ, sự kiện ngoài trời và quảng cáo.",
    surface: "Lớp phủ bóng, làm màu sắc nổi bật hơn.",
    bestFor: "Thiết kế rực rỡ, sự kiện ngoài trời, quảng cáo.",
    tag: "Vibrant",
    gradient: "from-violet-50 to-[#F5F8FF]",
    image: {
      src: "",  // CMS: no material photo yet; the card shows the paper-deep surface
      alt: "Cán bóng gloss lamination texture",
      fallback: "",
    },
  },
  {
    name: "Ép kim",
    description:
      "Điểm nhấn ánh kim cho logo, tên thương hiệu hoặc chi tiết trang trí đặc biệt.",
    surface: "Điểm nhấn ánh kim trên bề mặt in.",
    bestFor: "Logo, tên thương hiệu, chi tiết trang trí đặc biệt.",
    tag: "Luxury",
    gradient: "from-yellow-50 to-[#F5F8FF]",
    image: {
      src: "",  // CMS: no material photo yet; the card shows the paper-deep surface
      alt: "Ép kim foil stamping texture",
      fallback: "",
    },
  },
  {
    name: "Tay cầm",
    description:
      "Có thể chọn cán nhựa, cán gỗ hoặc kiểu dáng phù hợp với mục đích sử dụng.",
    surface: "Cán nhựa, cán gỗ hoặc kiểu dáng khác.",
    bestFor: "Chọn theo mục đích sử dụng của quạt.",
    tag: "Custom",
    gradient: "from-emerald-50 to-[#F5F8FF]",
    image: {
      src: "",  // CMS: no material photo yet; the card shows the paper-deep surface
      alt: "Fan handles and sticks material options",
      fallback: "",
    },
  },
];

// ─── Prepress check (R10.5) ───────────────────────────────────────────────────
// What is checked before printing: the same four checks the site already states (Material,
// R10.4), as a list, plus the mockup approval step that Process and the FAQ describe.

export const prepress = {
  /** Two sentences, one line each from md (never "màn / hình" split across lines). */
  title: ["Thiết kế đẹp trên màn hình.", "Chuẩn khi in thật."],
  lead: "Trước khi in, file được kiểm tra:",
  checks: ["Kích thước và độ phân giải", "Vùng an toàn và bleed", "Màu sắc khi in"],
  approval: "Bạn duyệt mockup trước khi đơn hàng được đưa vào sản xuất.",
};

// ─── Process steps ────────────────────────────────────────────────────────────
// CMS path: admin/process

export const processSteps = [
  {
    step: "01",
    title: "Chọn kiểu quạt",
    description:
      "Xem các dòng quạt và chọn kiểu gần với nhu cầu của bạn. Nếu chưa chắc, Nan sẽ gợi ý ở bước tư vấn.",
  },
  {
    step: "02",
    title: "Gửi yêu cầu báo giá",
    description:
      "Cho Nan biết số lượng, ngày cần hàng và mục đích sử dụng. Báo giá dựa trên kiểu quạt, chất liệu, số lượng và yêu cầu hoàn thiện.",
  },
  {
    step: "03",
    title: "Tư vấn thiết kế",
    description:
      "Nan tư vấn chất liệu, kiểu in và hoàn thiện, nhận logo hoặc artwork của bạn, rồi gửi mockup để bạn duyệt.",
  },
  {
    step: "04",
    title: "Sản xuất",
    description:
      "Khi bạn đã duyệt mockup và xác nhận báo giá, file được kiểm tra trước khi in rồi đưa vào sản xuất.",
  },
  {
    step: "05",
    title: "Giao hàng",
    description:
      "Quạt được kiểm tra trước khi đóng gói. Thời gian và cách giao hàng được thống nhất khi xác nhận đơn.",
  },
];

// ─── Comparison table ─────────────────────────────────────────────────────────
// CMS path: admin/comparison
// Admin can toggle row visibility, edit feature labels, or change true/partial/false.

export type CellValue = boolean | "partial";

export type ComparisonRow = {
  feature: string;
  nan: CellValue;
  trad: CellValue;
};

export const comparisonRows: ComparisonRow[] = [
  { feature: "Xem trước thiết kế",           nan: true, trad: false     },
  { feature: "Cá nhân hóa nhanh",            nan: true, trad: false     },
  { feature: "Báo giá rõ ràng",              nan: true, trad: "partial" },
  { feature: "Phù hợp số lượng nhỏ",         nan: true, trad: "partial" },
  { feature: "Hỗ trợ thương hiệu / sự kiện", nan: true, trad: false     },
  { feature: "Upload logo trực tiếp",         nan: true, trad: false     },
];

// ─── Final CTA ────────────────────────────────────────────────────────────────
// CMS path: admin/final-cta

export const finalCta = {
  badge: "Premium custom fan design",
  title: "Biến mỗi chiếc quạt thành một điểm chạm thương hiệu.",
  description:
    "Bạn gửi ý tưởng hoặc logo. Nan tư vấn kiểu quạt, chất liệu và hoàn thiện, rồi báo giá theo số lượng.",
  primaryButton:   "Gửi yêu cầu báo giá",
  secondaryButton: "Khám phá sản phẩm",
  /**
   * CMS: background image layered behind the gradient in the CTA card.
   * Keep src empty to use the pure-gradient look; set src for a photo overlay.
   */
  backgroundImage: {
    src: "",         // CMS: upload a final-CTA section background image
    alt: "Final CTA premium fan design background",
    fallback: "",
  } as ImageSlot,
  // R10.4: the old stats row ("5+", "48h xem mockup", "100%", "∞") was never confirmed business
  // data, so it is gone. Add figures here only when they are real and documented.
  stats: [] as { num: string; label: string }[],
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────
// CMS path: admin/faq

export const faqItems = [
  {
    q: "Tôi có thể dùng logo riêng không?",
    a: "Có. Sau khi bạn gửi yêu cầu báo giá, Nan liên hệ để nhận logo hoặc artwork và dựng mockup để bạn duyệt.",
  },
  {
    q: "Có thể xem mockup trước khi sản xuất không?",
    a: "Có. Trước khi sản xuất, Nan gửi mockup để bạn duyệt màu sắc, bố cục và vị trí logo.",
  },
  {
    q: "Có hỗ trợ thiết kế không?",
    a: "Có. Nan tư vấn và hỗ trợ thiết kế, từ chọn kiểu quạt, chất liệu đến bố cục in. Đơn hàng đầu tiên được tư vấn thiết kế miễn phí.",
  },
  {
    q: "Thời gian sản xuất phụ thuộc vào yếu tố nào?",
    a: "Vào kiểu quạt, chất liệu, số lượng và yêu cầu hoàn thiện. Nan xác nhận thời gian cụ thể khi báo giá, trước khi bạn đặt hàng.",
  },
  {
    q: "Có nhận số lượng ít không?",
    a: "Có. Nan nhận cả đơn nhỏ lẫn đơn số lượng lớn. Báo giá được tính theo số lượng, chất liệu và yêu cầu hoàn thiện.",
  },
];

// ─── Brand Statement ──────────────────────────────────────────────────────────
// CMS path: admin/brand-statement

export const brandStatement = {
  headlineA: "Nan không chỉ sản xuất quạt.",
  headlineB: "Mỗi chiếc quạt được thiết kế theo thương hiệu, sự kiện và không gian sẽ dùng nó.",
  body: "Nan thiết kế và sản xuất quạt cầm tay thủ công: từ chọn kiểu quạt, chất liệu, in ấn đến hoàn thiện. Bạn đưa ý tưởng, Nan lo phần còn lại.",
};

// ─── Problem Section ──────────────────────────────────────────────────────────
// CMS path: admin/problem

export const problemSection = {
  headline: "Quà tặng đại trà không kể được câu chuyện của bạn.",
  body: "Sản phẩm in sẵn, thiếu cá tính, dễ bị quên lãng sau sự kiện. Không kết nối với thương hiệu, không tạo được ấn tượng.",
  points: [
    "Thiết kế không phản ánh nhận diện thương hiệu",
    "Chất liệu không phù hợp với ngữ cảnh sử dụng",
    "Quy trình đặt hàng phức tạp, thiếu minh bạch",
  ],
};

// ─── Solution Section ─────────────────────────────────────────────────────────
// CMS path: admin/solution

export const solutionSection = {
  headline: "Nan được xây dựng khác đi.",
  pillars: [
    {
      title: "Thiết kế theo ngữ cảnh",
      description:
        "Mỗi mẫu được thiết kế theo thương hiệu, sự kiện hoặc kênh phân phối của bạn, không in sẵn hàng loạt.",
      icon: "Palette",
    },
    {
      title: "Chất liệu theo mục đích",
      description:
        "Giấy couche, giấy mỹ thuật, cán mờ, ép kim: chọn theo cách quạt sẽ được dùng, không chỉ theo giá.",
      icon: "Layers",
    },
    {
      title: "Sản xuất linh hoạt",
      description:
        "Từ số lượng nhỏ cho một sự kiện đến số lượng lớn cho chiến dịch thương hiệu.",
      icon: "Package",
    },
    {
      title: "Báo giá trước sản xuất",
      description:
        "Bạn nhận báo giá chi tiết và xác nhận trước khi sản xuất bắt đầu.",
      icon: "FileText",
    },
  ],
};

// ─── Use Cases ────────────────────────────────────────────────────────────────
// CMS path: admin/use-cases

export type UseCase = {
  id: string;
  title: string;
  description: string;
  icon: string;
  examples: string[];
};

export const useCases: UseCase[] = [
  {
    id: "events",
    title: "Sự kiện",
    description:
      "Quạt nhẹ, đẹp, dễ phân phát tại lễ khai trương, hội thảo, tiệc ngoài trời và các sự kiện thương hiệu.",
    icon: "Sparkles",
    examples: ["Khai trương", "Hội nghị", "Tiệc cưới"],
  },
  {
    id: "resort",
    title: "Resort & Khách sạn",
    description:
      "Vật phẩm cho khách lưu trú, hồ bơi, beach club và không gian nghỉ dưỡng.",
    icon: "Sun",
    examples: ["Beach club", "Spa resort", "Boutique hotel"],
  },
  {
    id: "restaurant",
    title: "Nhà hàng & Quán cà phê",
    description:
      "Quạt mang nhận diện của quán cho khu ngồi ngoài trời, rooftop bar và những ngày hè.",
    icon: "Coffee",
    examples: ["Rooftop bar", "Garden café", "Fine dining"],
  },
  {
    id: "corporate",
    title: "Quà tặng doanh nghiệp",
    description:
      "Quà tặng mang dấu ấn thương hiệu cho đối tác chiến lược, khách VIP và bộ sưu tập giới hạn.",
    icon: "Briefcase",
    examples: ["Đối tác chiến lược", "Khách VIP", "Limited edition"],
  },
  {
    id: "brand",
    title: "Brand Activation",
    description:
      "Kết nối thương hiệu với khách hàng qua booth activation, sampling campaign và pop-up event.",
    icon: "Megaphone",
    examples: ["Sampling campaign", "Pop-up booth", "Trade show"],
  },
];
