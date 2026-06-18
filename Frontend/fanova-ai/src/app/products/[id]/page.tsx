"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Clock,
  Package,
  Paintbrush,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import QuoteRequestForm from "@/components/quote/QuoteRequestForm";
import {
  getProduct,
  getProductOptions,
  getProductsByCategory,
} from "@/lib/api/products";
import type { Product, ProductOption } from "@/types/catalog";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setProduct(null);
      setOptions([]);
      setRelatedProducts([]);

      let p: Product;
      try {
        p = await getProduct(id);
        if (cancelled) return;
        setProduct(p);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Không tìm thấy sản phẩm"
        );
        setLoading(false);
        return;
      }

      if (cancelled) return;
      setLoading(false);

      // Load optional data without blocking the product render
      const [optData, relatedData] = await Promise.allSettled([
        getProductOptions(p.id),
        p.categoryId
          ? getProductsByCategory(p.categoryId, { pageSize: 5 })
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      if (optData.status === "fulfilled") {
        setOptions(optData.value);
      }
      if (relatedData.status === "fulfilled" && relatedData.value) {
        setRelatedProducts(
          relatedData.value.items.filter((item) => item.id !== p.id)
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Body scroll lock + ESC to close the quote form modal
  useEffect(() => {
    if (!showQuoteForm) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowQuoteForm(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [showQuoteForm]);

  return (
    <div className="min-h-[100dvh] bg-[#0D131F] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        <div className="max-w-6xl mx-auto px-6 py-10">

          {/* Loading skeleton */}
          {loading && <ProductDetailSkeleton />}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center py-24 text-center gap-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1.5">
                  Không thể tải sản phẩm
                </p>
                <p className="text-[#B6D6F2]/40 text-sm max-w-xs">{error}</p>
              </div>
              <Link
                href="/products"
                className="flex items-center gap-2 text-sm text-[#B6D6F2]/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}

          {/* Not found state */}
          {!loading && !error && !product && (
            <div className="flex flex-col items-center py-24 text-center gap-5">
              <div className="w-14 h-14 rounded-full border border-[#1B1C4A] flex items-center justify-center">
                <Package className="h-6 w-6 text-[#273481]/50" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white mb-2">
                  Sản phẩm không tồn tại
                </p>
                <p className="text-[#B6D6F2]/40 text-sm max-w-sm">
                  Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng.
                </p>
              </div>
              <Link
                href="/products"
                className="rounded-full border border-[#273481]/50 px-5 py-2.5 text-sm text-[#B6D6F2] hover:border-[#273481] hover:text-white transition-all"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          )}

          {/* Product content */}
          {product && (
            <>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-[#B6D6F2]/40 mb-8 flex-wrap">
                <Link
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  Trang chủ
                </Link>
                <span className="text-[#B6D6F2]/20">/</span>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors"
                >
                  Sản phẩm
                </Link>
                {product.categoryId && product.categoryName && (
                  <>
                    <span className="text-[#B6D6F2]/20">/</span>
                    <Link
                      href={`/products?categoryId=${product.categoryId}`}
                      className="hover:text-white transition-colors"
                    >
                      {product.categoryName}
                    </Link>
                  </>
                )}
                <span className="text-[#B6D6F2]/20">/</span>
                <span className="text-[#B6D6F2]/70 truncate max-w-[200px]">
                  {product.name}
                </span>
              </nav>

              {/* Hero: image + info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
                {/* Product image */}
                <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#111335] border border-[#1B1C4A]">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1B1C4A] to-[#111335]">
                      <span className="font-serif text-5xl text-[#273481]/20">
                        Nan
                      </span>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-col gap-5">
                  {/* Category eyebrow */}
                  {product.categoryName && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#B6D6F2]/50">
                      {product.categoryName}
                    </p>
                  )}

                  <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight tracking-tight">
                    {product.name}
                  </h1>

                  {product.description && (
                    <p className="text-sm text-[#B6D6F2]/55 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Price block */}
                  <div className="rounded-2xl bg-[#111335] border border-[#1B1C4A] p-5">
                    <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#B6D6F2]/35 mb-2">
                      Giá từ
                    </p>
                    <p className="text-2xl font-semibold text-white">
                      {product.basePrice > 0
                        ? `${product.basePrice.toLocaleString("vi-VN")} ₫`
                        : "Báo giá theo yêu cầu"}
                    </p>
                    {product.minQuantity > 1 && (
                      <p className="text-xs text-[#B6D6F2]/35 mt-1.5">
                        Đặt tối thiểu {product.minQuantity} sản phẩm
                      </p>
                    )}
                  </div>

                  {/* Spec chips */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#111335] border border-[#1B1C4A] p-4 flex items-center gap-3">
                      <Clock className="h-4 w-4 text-[#273481] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#B6D6F2]/35">
                          Thời gian sản xuất
                        </p>
                        <p className="text-sm font-medium text-white">
                          {product.estimatedProductionDays} ngày
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#111335] border border-[#1B1C4A] p-4 flex items-center gap-3">
                      <Package className="h-4 w-4 text-[#273481] flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#B6D6F2]/35">
                          Số lượng tối thiểu
                        </p>
                        <p className="text-sm font-medium text-white">
                          {product.minQuantity} cái
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customizable badge */}
                  {product.isCustomizable && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-[#273481]/10 border border-[#273481]/25 p-4">
                      <Paintbrush className="h-4 w-4 text-[#B6D6F2] flex-shrink-0" />
                      <p className="text-sm text-[#B6D6F2]">
                        Hỗ trợ thiết kế và in ấn theo yêu cầu
                      </p>
                    </div>
                  )}

                  {/* CTA buttons */}
                  <div className="flex flex-col gap-3 mt-1">
                    <Link
                      href="/"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#273481] py-3.5 text-sm font-semibold text-white hover:bg-[#273481]/90 transition-colors"
                    >
                      <Paintbrush className="h-4 w-4" />
                      Bắt đầu thiết kế
                    </Link>
                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="rounded-xl border border-[#273481]/45 py-3.5 text-sm font-medium text-[#B6D6F2] hover:border-[#273481] hover:text-white transition-all active:scale-[0.98]"
                    >
                      Gửi yêu cầu báo giá
                    </button>
                  </div>
                </div>
              </div>

              {/* Below-fold: info sections */}
              <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thong tin san pham */}
                <div className="rounded-2xl border border-[#1B1C4A] bg-[#111335]/50 p-6">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Thông tin sản phẩm
                  </h2>
                  {product.description ? (
                    <p className="text-sm text-[#B6D6F2]/55 leading-relaxed">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-sm text-[#B6D6F2]/30">
                      Thông tin chi tiết sẽ được cập nhật sớm.
                    </p>
                  )}
                </div>

                {/* Chat lieu & hoan thien */}
                <div className="rounded-2xl border border-[#1B1C4A] bg-[#111335]/50 p-6">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Chất liệu &amp; hoàn thiện
                  </h2>
                  <div className="space-y-3">
                    {[
                      { label: "Chất liệu", value: "Giấy thủ công cao cấp" },
                      { label: "Công nghệ in", value: "Offset và kỹ thuật số" },
                      { label: "Bề mặt", value: "Matt hoặc Glossy" },
                      { label: "Xuất xứ", value: "Sản xuất tại Việt Nam" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-baseline gap-4">
                        <span className="text-xs text-[#B6D6F2]/30 w-24 flex-shrink-0">
                          {label}
                        </span>
                        <span className="text-sm text-[#B6D6F2]/65">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* So luong & Thoi gian + Tuy chinh */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* So luong & Thoi gian */}
                <div className="rounded-2xl border border-[#1B1C4A] bg-[#111335]/50 p-6">
                  <h2 className="text-sm font-semibold text-white mb-5">
                    Số lượng &amp; Thời gian sản xuất
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center py-2">
                      <p className="text-3xl font-semibold text-white">
                        {product.minQuantity}
                      </p>
                      <p className="text-xs text-[#B6D6F2]/40 mt-1.5">
                        Số lượng tối thiểu
                      </p>
                    </div>
                    <div className="text-center py-2">
                      <p className="text-3xl font-semibold text-white">
                        {product.estimatedProductionDays}
                      </p>
                      <p className="text-xs text-[#B6D6F2]/40 mt-1.5">
                        Ngày sản xuất
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tuy chinh thiet ke */}
                <div className="rounded-2xl border border-[#1B1C4A] bg-[#111335]/50 p-6">
                  <h2 className="text-sm font-semibold text-white mb-3">
                    Tùy chỉnh thiết kế
                  </h2>
                  {product.isCustomizable ? (
                    <div>
                      <p className="text-sm text-[#B6D6F2]/55 leading-relaxed mb-4">
                        Sản phẩm hỗ trợ tùy chỉnh: in logo, hình ảnh, màu
                        sắc, văn bản và kích thước theo yêu cầu.
                      </p>
                      <Link
                        href="/"
                        className="text-xs text-[#B6D6F2]/60 hover:text-[#B6D6F2] transition-colors"
                      >
                        Thiết kế với AI Designer &rarr;
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-[#B6D6F2]/35">
                      Sản phẩm tiêu chuẩn, không hỗ trợ tùy chỉnh.
                    </p>
                  )}
                </div>
              </div>

              {/* Product options (loaded after product) */}
              {options.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#1B1C4A] bg-[#111335]/50 p-6">
                  <h2 className="text-sm font-semibold text-white mb-5">
                    Tùy chọn sản phẩm
                  </h2>
                  <div className="space-y-5">
                    {options
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map((option) => (
                        <div key={option.id}>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#B6D6F2]/40 mb-2.5">
                            {option.name}
                            {option.isRequired ? " *" : ""}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value) => (
                              <span
                                key={value}
                                className="rounded-full border border-[#1B1C4A] px-3.5 py-1.5 text-xs text-[#B6D6F2]/60"
                              >
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Related products (loaded after product) */}
              {relatedProducts.length > 0 && (
                <div className="mt-14 pt-12 border-t border-[#1B1C4A]/50">
                  <div className="flex items-center justify-between mb-7">
                    <h2 className="text-lg font-semibold text-white">
                      Sản phẩm liên quan
                    </h2>
                    <Link
                      href={product.categoryId ? `/products?categoryId=${product.categoryId}` : "/products"}
                      className="text-xs text-[#B6D6F2]/40 hover:text-[#B6D6F2] transition-colors"
                    >
                      Xem thêm &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {relatedProducts.slice(0, 4).map((p) => (
                      <RelatedProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Quote request modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQuoteForm && product && (
          <motion.div
            key="quote-modal"
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/72 backdrop-blur-sm"
              onClick={() => setShowQuoteForm(false)}
            />
            {/* Panel */}
            <motion.div
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#1B1C4A] bg-[#0D131F] shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <QuoteRequestForm
                productId={product.id}
                productName={product.name}
                categoryName={product.categoryName}
                minQuantity={product.minQuantity}
                onSuccess={() => setShowQuoteForm(false)}
                onCancel={() => setShowQuoteForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Related product card ─────────────────────────────────────────────────────

function RelatedProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-[#111335] border border-[#1B1C4A] hover:border-[#273481]/50 transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-[#1B1C4A]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1B1C4A] to-[#111335]">
            <span className="font-serif text-xl text-[#273481]/25">Nan</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-white line-clamp-2 leading-snug">
          {product.name}
        </p>
        {product.basePrice > 0 && (
          <p className="text-xs text-[#B6D6F2]/40 mt-1">
            {product.basePrice.toLocaleString("vi-VN")} &#8363;
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-3 w-16 bg-[#111335] rounded" />
        <div className="h-3 w-2 bg-[#111335] rounded" />
        <div className="h-3 w-20 bg-[#111335] rounded" />
        <div className="h-3 w-2 bg-[#111335] rounded" />
        <div className="h-3 w-32 bg-[#111335] rounded" />
      </div>

      {/* Hero skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-3xl bg-[#111335]" />
        <div className="space-y-5">
          <div className="h-2.5 w-20 bg-[#111335] rounded" />
          <div className="h-9 w-3/4 bg-[#111335] rounded" />
          <div className="h-4 w-full bg-[#111335] rounded" />
          <div className="h-4 w-5/6 bg-[#111335] rounded" />
          <div className="h-24 bg-[#111335] rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-[#111335] rounded-xl" />
            <div className="h-16 bg-[#111335] rounded-xl" />
          </div>
          <div className="h-12 bg-[#111335] rounded-xl" />
          <div className="h-12 bg-[#111335] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
