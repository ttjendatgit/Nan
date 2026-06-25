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
    step: "01",
    title: "Chọn kiểu quạt",
    description:
      "Bắt đầu với kiểu quạt phù hợp: quạt tròn, quạt gấp, quạt cán nhựa, quạt wedding hoặc quạt sự kiện.",
  },
  {
    step: "02",
    title: "Gửi yêu cầu báo giá",
    description:
      "Điền thông tin về số lượng, chất liệu và thời gian cần thiết. Chúng tôi phản hồi trong 24 giờ làm việc.",
  },
  {
    step: "03",
    title: "Tư vấn thiết kế",
    description:
      "Đội ngũ tư vấn giúp bạn lựa chọn chất liệu, kiểu in và hoàn thiện phù hợp với ngữ cảnh sử dụng.",
  },
  {
    step: "04",
    title: "Sản xuất",
    description:
      "Sau khi xác nhận file thiết kế, đơn hàng được sản xuất theo tiêu chuẩn in ấn chuyên nghiệp.",
  },
  {
    step: "05",
    title: "Giao hàng",
    description:
      "Kiểm tra chất lượng toàn bộ trước khi đóng gói và giao đến địa chỉ của bạn đúng tiến độ.",
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

// ─── Brand Statement ──────────────────────────────────────────────────────────
// CMS path: admin/brand-statement

export const brandStatement = {
  headlineA: "Nan không chỉ sản xuất quạt.",
  headlineB: "Nan biến một vật dụng cầm tay thành điểm chạm thương hiệu cao cấp.",
  body: "Được tạo ra từ nghề thủ công Việt Nam, Nan kết hợp tay nghề tinh xảo với quy trình thiết kế hiện đại. Mỗi chiếc quạt là một câu chuyện đáng được kể.",
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
        "Mỗi mẫu được thiết kế riêng cho từng thương hiệu, sự kiện hoặc kênh phân phối. Không có mẫu chung.",
      icon: "Palette",
    },
    {
      title: "Chất liệu theo mục đích",
      description:
        "Giấy couche, mỹ thuật, cán mờ, ép kim. Được lựa chọn dựa trên nhu cầu thực tế, không phải chi phí thấp nhất.",
      icon: "Layers",
    },
    {
      title: "Sản xuất linh hoạt",
      description:
        "Từ số lượng nhỏ cho sự kiện đến đại trà cho chiến dịch thương hiệu. Quy mô phù hợp với ngân sách của bạn.",
      icon: "Package",
    },
    {
      title: "Báo giá trước sản xuất",
      description:
        "Gửi yêu cầu, nhận báo giá chi tiết, xác nhận trước khi bắt đầu. Không phát sinh chi phí bất ngờ.",
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
      "Vật phẩm trải nghiệm cao cấp cho resort, beach club và không gian nghỉ dưỡng phong cách.",
    icon: "Sun",
    examples: ["Beach club", "Spa resort", "Boutique hotel"],
  },
  {
    id: "restaurant",
    title: "Nhà hàng & Quán cà phê",
    description:
      "Branded touchpoint tinh tế cho không gian ẩm thực mùa hè, outdoor seating và rooftop bar.",
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
