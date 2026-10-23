"use client";

// R6 "Phòng mẫu", R10.2 cut: a product editorial spread. From 1024px the category names sit on the
// left and one large photograph of the active line fills the right (7 of 12 columns, 4:3): pointing
// at, focusing or scrolling to a name brings its photo onto the stage with a short cross-fade. The
// difference between the lines comes from the product itself, not from background geometry (the
// R10.1 super-scale fan behind the showroom is gone). Every name stays a real link to its category.
// Below 1024px the photos sit in a native horizontal rail (84vw, snap, the next one peeking).
// Category images come from the API; a line without one shows AssetSlot's quiet brand surface.
// R10.4: if the API fails or returns nothing, the section says so and links to the catalogue; it
// no longer shows stand-in "collections" that are not real product lines.

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import AssetSlot from "@/components/ui/AssetSlot";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import type { AssetDef } from "@/data/homepageAssets";
import { EASE_NAN, INSTANT, PLEAT } from "@/lib/motionTokens";
import { getCategories } from "@/lib/api/categories";
import type { ProductCategory } from "@/types/catalog";

gsap.registerPlugin(ScrollTrigger);

interface ShowroomItem {
  key: string;
  name: string;
  description: string;
  href: string;
  imageUrl?: string;
}

/** The line's photograph, cropped to the stage (catalogue photos are full-bleed shots, not cut-outs). */
function linePhoto(item: ShowroomItem): AssetDef {
  return { id: "A1", subject: `Quạt ${item.name}`, ratio: "4 / 3", src: item.imageUrl ?? "", alt: item.name };
}

export default function ProductTypeSection() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [categories, setCategories] = useState<ProductCategory[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories({ pageSize: 8, activeOnly: true })
      .then((res) => {
        setCategories(res.items.length > 0 ? res.items : null);
      })
      .catch(() => setCategories(null))
      .finally(() => setLoading(false));
  }, []);

  // The Hero's GSAP ScrollTriggers measured the page while this section was still a skeleton; the
  // real list changes the page height, and ScrollTrigger only re-measures by itself on resize and
  // window load. One refresh after data and fonts is a cheap safeguard.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    const fontsReady = "fonts" in document ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [loading]);

  const showRealData = !loading && categories !== null && categories.length > 0;
  const items: ShowroomItem[] = loading
    ? []
    : showRealData
      ? categories!.map((cat) => ({
          key: cat.id,
          name: cat.name,
          // A description that only repeats the name (admin data) adds nothing: show none.
          description:
            cat.description && cat.description.trim().toLowerCase() !== cat.name.trim().toLowerCase()
              ? cat.description.trim()
              : "",
          href: `/products?categoryId=${cat.id}`,
          imageUrl: cat.imageUrl,
        }))
      : []; // R10.4: no stand-in lines (the old English "collections" were not real products)
  const current = items[Math.min(active, items.length - 1)];

  // The line the reader has reached (lg): the reading line crossing the list picks the active
  // line, so the photo follows scroll as well as pointer / focus. Changes only at a boundary.
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 65%", "end 45%"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (reduce || items.length === 0 || p <= 0 || p >= 1) return;
    const next = Math.min(items.length - 1, Math.floor(p * items.length));
    if (next !== active) setActive(next);
  });

  return (
    <Section
      tone="paper"
      id="products"
      material="quiet"
      atmosphere={{ x: "24%", y: "18%" }}
      className="overflow-x-clip md:pt-24"
    >
      {/* Section header: one stacked message, no split header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={reduce ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.7, ease: EASE_NAN }}
        className="mb-10 md:mb-12"
      >
        <SectionTitle
          tone="paper"
          title="Chọn quạt theo nhu cầu của bạn."
          description="Chọn dòng quạt gần với nhu cầu của bạn. Kiểu dáng, chất liệu và in ấn được tư vấn theo từng đơn hàng."
        />
      </motion.div>

      <div ref={listRef}>
        {loading && <ShowroomSkeleton />}

        {/* R10.4 error/empty state: say so plainly and keep the way to the catalogue */}
        {!loading && !current && (
          <div className="border-t border-line-on-paper pt-8">
            <p className="max-w-md text-[0.9375rem] leading-7 text-ink-muted">
              Chưa tải được danh sách dòng quạt. Bạn vẫn có thể xem toàn bộ sản phẩm trong catalogue.
            </p>
            <div className="mt-6">
              <Button href="/products" tone="paper" variant="secondary">
                Xem tất cả
                <ArrowRight className="ml-2" size={14} />
              </Button>
            </div>
          </div>
        )}

        {!loading && current && (
          <>
            {/* ── 1024px and up: names + the large photograph ── */}
            <div className="relative hidden lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
              <div className="lg:col-span-4">
                <ul className="border-t border-line-on-paper">
                  {items.map((item, i) => {
                    const isActive = item.key === current.key;
                    return (
                      <motion.li
                        key={item.key}
                        className="relative border-b border-line-on-paper"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        animate={reduce ? { opacity: 1 } : undefined}
                        viewport={{ once: true }}
                        transition={reduce ? INSTANT : { duration: 0.5, delay: i * PLEAT }}
                      >
                        {/* Active marker on the row's top rule: navy, as on paper */}
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute -top-px left-0 h-px w-10 origin-left bg-navy transition-[scale] duration-(--dur-state) ease-(--ease-nan-state) motion-reduce:transition-none ${
                            isActive ? "scale-x-100" : "scale-x-0"
                          }`}
                        />
                        <Link
                          href={item.href}
                          onFocus={() => setActive(i)}
                          onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") setActive(i);
                          }}
                          className="group block rounded-sm py-7 outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                        >
                          <span
                            className={`block font-serif text-[1.875rem] font-medium leading-tight transition-colors duration-(--dur-state) motion-reduce:transition-none ${
                              isActive ? "text-ink" : "text-ink-muted"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="mt-2 block text-[0.9375rem] leading-7 text-ink-muted line-clamp-2">
                              {item.description}
                            </span>
                          )}
                          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                            Khám phá
                            <ArrowRight
                              size={12}
                              className="transition-transform duration-(--dur-ui) group-hover:translate-x-1 motion-reduce:transition-none"
                            />
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
                <div className="mt-10">
                  <Button href="/products" tone="paper" variant="secondary">
                    Xem tất cả
                    <ArrowRight className="ml-2" size={14} />
                  </Button>
                </div>
              </div>

              {/* The stage. Decorative: each name beside it is the real link. */}
              <div aria-hidden="true" className="lg:col-span-7 lg:col-start-6">
                <motion.div
                  className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  animate={reduce ? { opacity: 1, y: 0 } : undefined}
                  viewport={{ once: true, margin: "0px 0px -30% 0px" }}
                  transition={reduce ? INSTANT : { duration: 0.8, ease: EASE_NAN }}
                >
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={current.key}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={reduce ? INSTANT : { duration: 0.6, ease: EASE_NAN }}
                    >
                      <AssetSlot asset={linePhoto(current)} tone="paper" fill sizes="(min-width: 1280px) 720px, 56vw" />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            {/* ── Below 1024px: a native horizontal rail of large photos ── */}
            <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
              {items.map((item) => (
                <motion.li
                  key={item.key}
                  className="w-[84vw] shrink-0 snap-start md:w-[58vw]"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  animate={reduce ? { opacity: 1, y: 0 } : undefined}
                  viewport={{ once: true }}
                  transition={reduce ? INSTANT : { duration: 0.6, ease: EASE_NAN }}
                >
                  <Link
                    href={item.href}
                    className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                  >
                    <AssetSlot asset={linePhoto(item)} tone="paper" sizes="(min-width: 768px) 58vw, 84vw" />
                    <span className="mt-5 block font-serif text-2xl font-medium">{item.name}</span>
                    {item.description && (
                      <span className="mt-1.5 block text-[0.9375rem] leading-7 text-ink-muted line-clamp-2">{item.description}</span>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                      Khám phá
                      <ArrowRight size={12} />
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-8 lg:hidden">
              <Button href="/products" tone="paper" variant="secondary">
                Xem tất cả
                <ArrowRight className="ml-2" size={14} />
              </Button>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}

// ─── Loading skeleton: the showroom's own shape ──────────────────────────────

function ShowroomSkeleton() {
  return (
    <div className="grid animate-pulse gap-12 motion-reduce:animate-none lg:grid-cols-12 lg:items-center">
      <div className="space-y-6 border-t border-line-on-paper pt-7 lg:col-span-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 border-b border-line-on-paper pb-7">
            <div className="h-7 w-2/3 rounded bg-paper-deep" />
            <div className="h-4 w-4/5 rounded bg-paper-deep" />
          </div>
        ))}
      </div>
      <div className="aspect-[4/3] bg-paper-deep lg:col-span-7 lg:col-start-6" />
    </div>
  );
}
