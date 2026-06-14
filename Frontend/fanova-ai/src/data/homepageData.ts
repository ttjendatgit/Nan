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
    { label: "Collections", href: "#products" },
    { label: "AI Designer", href: "#ai-designer" },
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
  subheadline:
    "Thiết kế quạt giấy cá nhân hóa cho sự kiện, resort, nhà hàng và chiến dịch thương hiệu — xem mockup trực tiếp trước khi đặt in.",
  primaryCta:   "Bắt đầu thiết kế",
  secondaryCta: "Khám phá bộ sưu tập",
  proofPoints: [
    "Thiết kế cá nhân hóa",
    "Xem mockup trực tiếp",
    "Chất liệu cao cấp",
    "Báo giá minh bạch",
    "In theo yêu cầu",
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
      src: "/images/collections/wedding-fans.jpg",
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
      src: "/images/collections/resort-hospitality.jpg",
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
      src: "/images/collections/restaurant-cafe.jpg",
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
      src: "/images/collections/brand-campaign.jpg",
      alt: "Brand campaign custom fan design",
      fallback: "",
    },
    gradient: "from-violet-50 to-[#DCEAF7]",
    accentColor: "bg-violet-200",
    cta: "Bắt đầu thiết kế",
  },
  {
    id: "event-activation",
    name: "Event & Activation",
    badge: "Mass production",
    description:
      "Nhẹ, đẹp, dễ lan tỏa. Sản xuất số lượng lớn cho hội chợ, khai trương và sự kiện ngoài trời.",
    image: {
      src: "/images/collections/event-activation.jpg",
      alt: "Event and activation custom fan design",
      fallback: "",
    },
    gradient: "from-blue-50 to-[#DCEAF7]",
    accentColor: "bg-blue-200",
    cta: "Bắt đầu thiết kế",
  },
  {
    id: "premium-gift",
    name: "Premium Gift",
    badge: "Corporate gifting",
    description:
      "Quà tặng mang dấu ấn thương hiệu: dành cho đối tác, khách VIP và bộ sưu tập giới hạn.",
    image: {
      src: "/images/collections/premium-gift.jpg",
      alt: "Premium gift custom fan design",
      fallback: "",
    },
    gradient: "from-yellow-50 to-amber-50",
    accentColor: "bg-[#ECCA3E]/30",
    cta: "Bắt đầu thiết kế",
  },
];

// ─── AI Designer ──────────────────────────────────────────────────────────────
// CMS path: admin/ai-designer
// Note: core upload / mockup logic lives in AIDesignerSection and is handled
// by the separate upload API — only the option lists are CMS-controlled here.

export const aiDesignerConfig = {
  styles: ["Tối giản", "Sang trọng", "Wedding", "Resort", "Sự kiện", "Trẻ trung"],
  fanColors: [
    { name: "Ivory",    className: "from-orange-100 via-white to-blue-100" },
    { name: "Mint",     className: "from-emerald-100 via-white to-cyan-100" },
    { name: "Rose",     className: "from-rose-100 via-white to-orange-100" },
    { name: "Lavender", className: "from-purple-100 via-white to-blue-100" },
    { name: "Sky",      className: "from-sky-100 via-white to-indigo-100" },
  ],
};

// ─── Materials ────────────────────────────────────────────────────────────────
// CMS path: admin/materials

export type Material = {
  name: string;
  description: string;
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
    tag: "Popular",
    gradient: "from-blue-50 to-[#F5F8FF]",
    image: {
      src: "/images/materials/couche.jpg",
      alt: "Giấy Couche paper material texture",
      fallback: "",
    },
  },
  {
    name: "Giấy mỹ thuật",
    description:
      "Texture sang hơn, phù hợp wedding, resort, thương hiệu lifestyle và quà tặng cao cấp.",
    tag: "Premium",
    gradient: "from-amber-50 to-[#F5F8FF]",
    image: {
      src: "/images/materials/art-paper.jpg",
      alt: "Giấy mỹ thuật art paper texture",
      fallback: "",
    },
  },
  {
    name: "Cán mờ",
    description:
      "Tạo cảm giác mềm, tinh tế, hạn chế phản sáng và giúp thiết kế nhìn cao cấp hơn.",
    tag: "Elegant",
    gradient: "from-slate-100 to-[#F5F8FF]",
    image: {
      src: "/images/materials/matte-lamination.jpg",
      alt: "Cán mờ matte lamination texture",
      fallback: "",
    },
  },
  {
    name: "Cán bóng",
    description:
      "Làm màu sắc nổi bật hơn, phù hợp thiết kế rực rỡ, sự kiện ngoài trời và quảng cáo.",
    tag: "Vibrant",
    gradient: "from-violet-50 to-[#F5F8FF]",
    image: {
      src: "/images/materials/gloss-lamination.jpg",
      alt: "Cán bóng gloss lamination texture",
      fallback: "",
    },
  },
  {
    name: "Ép kim",
    description:
      "Điểm nhấn ánh kim cho logo, tên thương hiệu hoặc chi tiết trang trí đặc biệt.",
    tag: "Luxury",
    gradient: "from-yellow-50 to-[#F5F8FF]",
    image: {
      src: "/images/materials/foil-stamping.jpg",
      alt: "Ép kim foil stamping texture",
      fallback: "",
    },
  },
  {
    name: "Tay cầm",
    description:
      "Có thể chọn cán nhựa, cán gỗ hoặc kiểu dáng phù hợp với mục đích sử dụng.",
    tag: "Custom",
    gradient: "from-emerald-50 to-[#F5F8FF]",
    image: {
      src: "/images/materials/handles.jpg",
      alt: "Fan handles and sticks material options",
      fallback: "",
    },
  },
];

// ─── Process steps ────────────────────────────────────────────────────────────
// CMS path: admin/process

export const processSteps = [
  {
    step: "001",
    title: "Chọn kiểu quạt",
    description:
      "Bắt đầu với kiểu quạt phù hợp: quạt tròn, quạt gấp, quạt cán nhựa, quạt wedding hoặc quạt sự kiện.",
  },
  {
    step: "002",
    title: "Upload logo hoặc nhập ý tưởng",
    description:
      "Tải hình ảnh từ máy hoặc mô tả concept bạn muốn để hệ thống gợi ý hướng thiết kế phù hợp.",
  },
  {
    step: "003",
    title: "Xem mockup trực quan",
    description:
      "Kéo thả, phóng to, thu nhỏ và chọn màu nền để xem thiết kế của bạn hiển thị trên quạt.",
  },
  {
    step: "004",
    title: "Gửi yêu cầu báo giá",
    description:
      "Chọn chất liệu, số lượng, thời gian sản xuất và gửi yêu cầu để nhận báo giá chi tiết.",
  },
  {
    step: "005",
    title: "Sản xuất & giao hàng",
    description:
      "Sau khi file được kiểm tra và xác nhận, đơn hàng sẽ được sản xuất, kiểm tra chất lượng và giao đến bạn.",
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
    "Bắt đầu từ một ý tưởng, một logo hoặc một câu chuyện thương hiệu. Hệ thống sẽ giúp bạn xem trước mẫu quạt, tùy chỉnh thiết kế và gửi yêu cầu báo giá nhanh chóng.",
  primaryButton:   "Bắt đầu thiết kế",
  secondaryButton: "Gửi yêu cầu báo giá",
  /**
   * CMS: background image layered behind the gradient in the CTA card.
   * Keep src empty to use the pure-gradient look; set src for a photo overlay.
   */
  backgroundImage: {
    src: "",         // CMS: upload a final-CTA section background image
    alt: "Final CTA premium fan design background",
    fallback: "",
  } as ImageSlot,
  stats: [
    { num: "5+",   label: "Kiểu quạt" },
    { num: "48h",  label: "Xem mockup" },
    { num: "100%", label: "Cá nhân hóa" },
    { num: "∞",    label: "Số lượng linh hoạt" },
  ],
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────
// CMS path: admin/faq

export const faqItems = [
  {
    q: "Tôi có thể upload logo riêng không?",
    a: "Hoàn toàn có. Bạn có thể tải lên logo, artwork hoặc hình ảnh bất kỳ ở định dạng PNG, JPG, JPEG hoặc WEBP. Hệ thống sẽ hiển thị ngay trên mockup quạt để bạn xem trước.",
  },
  {
    q: "Có thể xem mockup trước khi in không?",
    a: "Có. AI Designer cho phép bạn xem trực tiếp thiết kế trên mockup quạt với các tùy chọn màu nền, phong cách và vị trí logo — tất cả trước khi gửi yêu cầu sản xuất.",
  },
  {
    q: "Có hỗ trợ thiết kế không?",
    a: "Có. Ngoài tính năng tự thiết kế, Nan cung cấp dịch vụ tư vấn và hỗ trợ thiết kế. Đơn hàng đầu tiên được tư vấn thiết kế miễn phí.",
  },
  {
    q: "Thời gian sản xuất bao lâu?",
    a: "Thông thường 5–10 ngày làm việc sau khi xác nhận file. Đối với đơn số lượng lớn hoặc yêu cầu đặc biệt, thời gian có thể thay đổi — chúng tôi sẽ xác nhận cụ thể khi báo giá.",
  },
  {
    q: "Có nhận số lượng ít không?",
    a: "Có. Nan nhận đơn từ số lượng nhỏ cho đến sản xuất đại trà. Báo giá được tính theo số lượng và chất liệu, minh bạch và rõ ràng.",
  },
];
