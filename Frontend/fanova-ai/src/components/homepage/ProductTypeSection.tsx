"use client";

// R6 "Phòng mẫu": the categories as a sample room. From 1024px a list of names on the left and a
// sticky stage on the right; pointing at (or focusing) a name brings that fan onto the stage: the
// previous fan steps back and is cut away, the new one slides in from the right edge, turns upright
// around its handle and settles. Every name stays a real link to its category. Below 1024px the
// fans sit in a native horizontal rail (82vw, snap, next one peeking). Category images come from
// the API; without one, the A1 slot shows its placeholder (data/homepageAssets.ts).

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import AssetSlot from "@/components/ui/AssetSlot";
import Rule from "@/components/ui/Rule";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";
import { collections } from "@/data/homepageData";
import { productCutout } from "@/data/homepageAssets";
import { CLIP_FROM, CLIP_OPEN, EASE_NAN, EASE_NAN_STATE, EASE_NAN_UI, INSTANT, PLEAT } from "@/lib/motionTokens";
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

/** The stage swap; the new fan turns upright around its handle (bottom centre of the slot). */
const STAGE_SWAP = 0.42;

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

  // A GSAP ScrollTrigger below this section would measure its start/end on mount, while the
  // skeleton is still here; the real list or the fallback then changes the page height, and
  // ScrollTrigger only re-measures by itself on resize and window load. Since R6 none sits below
  // (the old narrative motif is gone; the R6 scroll stories use Motion's useScroll, which measures
  // as it goes), so this one refresh is a cheap safeguard. Runs once, after data and fonts.
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
          description: cat.description || "Khám phá bộ sưu tập quạt giấy theo nhu cầu của bạn.",
          href: `/products?categoryId=${cat.id}`,
          imageUrl: cat.imageUrl,
        }))
      : collections.map((c) => ({ key: c.id, name: c.name, description: c.description, href: "/products" }));
  const current = items[Math.min(active, items.length - 1)];

  return (
    <Section tone="paper" id="products">

      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={reduce ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true }}
        transition={reduce ? INSTANT : { duration: 0.65 }}
        className="mb-14"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            tone="paper"
            className="lg:max-w-xl"
            titleClassName="leading-tight tracking-tight"
            title={
              <>
                Chọn quạt theo{" "}
                <span className="text-navy">nhu cầu của bạn.</span>
              </>
            }
          />

          <div className="lg:max-w-sm">
            <p className="text-[0.9375rem] leading-7 text-ink-muted">
              Mỗi giải pháp được thiết kế riêng cho một ngữ cảnh cụ thể: từ sự kiện đến thương hiệu, từ số lượng nhỏ đến đại trà.
            </p>
            <div className="mt-5">
              <Button href="/products" tone="paper" variant="secondary">
                Xem tất cả
                <ArrowRight className="ml-2" size={14} />
              </Button>
            </div>
          </div>
        </div>

        <Rule tone="paper" className="mt-10" />
      </motion.div>

      {loading && <ShowroomSkeleton />}

      {!loading && current && (
        <>
          {/* ── 1024px and up: names + sticky stage ── */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-12">
            <ul className="border-t border-line-on-paper lg:col-span-5">
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
                      className={`pointer-events-none absolute -top-px left-0 h-px w-6 origin-left bg-navy transition-[scale] duration-(--dur-state) ease-(--ease-nan-state) motion-reduce:transition-none ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                    <Link
                      href={item.href}
                      onFocus={() => setActive(i)}
                      onPointerEnter={(e) => {
                        if (e.pointerType === "mouse") setActive(i);
                      }}
                      className="group block rounded-sm py-6 outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                    >
                      <span
                        className={`block font-serif text-[2rem] font-semibold leading-tight transition-colors duration-(--dur-state) motion-reduce:transition-none ${
                          isActive ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="mt-2 block max-w-sm text-sm leading-6 text-ink-muted line-clamp-2">
                        {item.description}
                      </span>
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

            {/* The stage. Decorative: each name beside it is the real link. */}
            <div aria-hidden="true" className="lg:col-span-7">
              <motion.div
                className="sticky top-[calc(var(--nav-height,112px)+4vh)] ml-auto aspect-[4/5] w-full max-w-[calc(70vh*0.8)] overflow-hidden bg-paper-deep"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                animate={reduce ? { opacity: 1, y: 0 } : undefined}
                viewport={{ once: true, margin: "0px 0px -40% 0px" }}
                transition={reduce ? INSTANT : { duration: 0.7, ease: EASE_NAN }}
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={current.key}
                    className="absolute inset-x-[6%] top-[12%] aspect-square"
                    style={{ originX: 0.5, originY: 0.92 }}
                    initial={{ x: "40%", scale: 0.94, rotate: -6, y: -4, zIndex: 2, clipPath: CLIP_OPEN }}
                    animate={{ x: "0%", scale: 1, rotate: 0, y: 0, zIndex: 2, clipPath: CLIP_OPEN }}
                    exit={{ x: "-12%", scale: 0.92, zIndex: 1, clipPath: CLIP_FROM.left }}
                    transition={
                      reduce
                        ? INSTANT
                        : {
                            default: { duration: STAGE_SWAP, ease: EASE_NAN_STATE },
                            // "Place": once upright, the fan settles the last 4px
                            y: { duration: 0.16, delay: STAGE_SWAP, ease: EASE_NAN_UI },
                          }
                    }
                  >
                    <AssetSlot asset={productCutout(current.name, current.imageUrl)} tone="paper" fill sizes="40vw" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* ── Below 1024px: a native horizontal rail ── */}
          <ul className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <motion.li
                key={item.key}
                className="w-[82vw] shrink-0 snap-start md:w-[46vw]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                animate={reduce ? { opacity: 1, y: 0 } : undefined}
                viewport={{ once: true }}
                transition={reduce ? INSTANT : { duration: 0.6, ease: EASE_NAN }}
              >
                <Link
                  href={item.href}
                  className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
                >
                  <div className="relative aspect-square bg-paper-deep">
                    <div className="absolute inset-[6%]">
                      <AssetSlot asset={productCutout(item.name, item.imageUrl)} tone="paper" fill sizes="82vw" />
                    </div>
                  </div>
                  <span className="mt-4 block font-serif text-2xl font-semibold">{item.name}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink-muted line-clamp-2">{item.description}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy">
                    Khám phá
                    <ArrowRight size={12} />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

// ─── Loading skeleton: the showroom's own shape ──────────────────────────────

function ShowroomSkeleton() {
  return (
    <div className="grid animate-pulse gap-12 motion-reduce:animate-none lg:grid-cols-12">
      <div className="space-y-6 border-t border-line-on-paper pt-6 lg:col-span-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 border-b border-line-on-paper pb-6">
            <div className="h-7 w-2/3 rounded bg-paper-deep" />
            <div className="h-4 w-4/5 rounded bg-paper-deep" />
          </div>
        ))}
      </div>
      <div className="hidden aspect-[4/5] bg-paper-deep lg:col-span-7 lg:block" />
    </div>
  );
}
