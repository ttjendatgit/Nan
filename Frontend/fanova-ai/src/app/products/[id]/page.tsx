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
import ContentBlocksRenderer from "@/components/product/ContentBlocksRenderer";
import ProductOptionSelector from "@/components/product/ProductOptionSelector";
import EditorialGrid from "@/components/homepage/EditorialGrid";
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
  const [pendingQuote, setPendingQuote] = useState<{ message: string; quantity: number } | null>(null);
  const prefersReducedMotion = useReducedMotion();

  function openPlainQuoteForm() {
    setPendingQuote(null);
    setShowQuoteForm(true);
  }

  function closeQuoteForm() {
    setShowQuoteForm(false);
    setPendingQuote(null);
  }

  function handleOptionSelectorQuote(summaryText: string, quantity: number) {
    setPendingQuote({ message: summaryText, quantity });
    setShowQuoteForm(true);
  }

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
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#0F1320" }}>
      <Navbar />

      <main className="flex-1 pt-24">

        {/* Loading skeleton */}
        {loading && (
          <div className="max-w-7xl mx-auto px-6 py-10">
            <ProductDetailSkeleton />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col items-center py-24 text-center gap-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-[#F1F0EA] font-medium mb-1.5">
                  Không thể tải sản phẩm
                </p>
                <p className="text-[rgba(241,240,234,0.45)] text-sm max-w-xs">{error}</p>
              </div>
              <Link
                href="/products"
                className="flex items-center gap-2 text-sm text-[rgba(241,240,234,0.60)] hover:text-[#F1F0EA] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Xem tất cả sản phẩm
              </Link>
            </div>
          </div>
        )}

        {/* Not found state */}
        {!loading && !error && !product && (
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col items-center py-24 text-center gap-5">
              <div className="w-14 h-14 rounded-full border border-[#192B88]/40 flex items-center justify-center">
                <Package className="h-6 w-6 text-[#192B88]" />
              </div>
              <div>
                <p className="text-xl font-semibold text-[#F1F0EA] mb-2">
                  Sản phẩm không tồn tại
                </p>
                <p className="text-[rgba(241,240,234,0.45)] text-sm max-w-sm">
                  Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng.
                </p>
              </div>
              <Link
                href="/products"
                className="rounded-full border border-[#192B88]/50 px-5 py-2.5 text-sm text-[rgba(241,240,234,0.70)] hover:border-[#192B88] hover:text-[#F1F0EA] transition-all"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          </div>
        )}

        {/* Product content */}
        {product && (
          <>
            {/* ── PART A: Product intro (dark) ── */}
            <div className="max-w-7xl mx-auto px-6 pb-16 pt-2 md:pb-20">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-[rgba(241,240,234,0.40)] mb-8 flex-wrap">
                <Link href="/" className="hover:text-[#F1F0EA] transition-colors">
                  Trang chủ
                </Link>
                <span className="text-[rgba(241,240,234,0.20)]">/</span>
                <Link href="/products" className="hover:text-[#F1F0EA] transition-colors">
                  Sản phẩm
                </Link>
                {product.categoryId && product.categoryName && (
                  <>
                    <span className="text-[rgba(241,240,234,0.20)]">/</span>
                    <Link
                      href={`/products?categoryId=${product.categoryId}`}
                      className="hover:text-[#F1F0EA] transition-colors"
                    >
                      {product.categoryName}
                    </Link>
                  </>
                )}
                <span className="text-[rgba(241,240,234,0.20)]">/</span>
                <span className="text-[rgba(241,240,234,0.75)] truncate max-w-[200px]">
                  {product.name}
                </span>
              </nav>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-14 lg:gap-20">
                {/* Product media */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#161B2C]">
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
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-serif text-5xl text-[#192B88]/30">Nan</span>
                    </div>
                  )}
                </div>

                {/* Product information */}
                <div className="flex flex-col">
                  {product.categoryName && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#192B88]">
                      {product.categoryName}
                    </p>
                  )}

                  <h1 className="mt-3 font-serif text-3xl md:text-4xl font-semibold text-[#F1F0EA] leading-tight tracking-tight">
                    {product.name}
                  </h1>

                  {product.description && (
                    <p className="mt-4 text-sm text-[rgba(241,240,234,0.62)] leading-relaxed max-w-[52ch]">
                      {product.description}
                    </p>
                  )}

                  {/* Metadata row -- typography + dividers, not boxed cards */}
                  <div className="mt-8 grid grid-cols-3 gap-6 border-y border-white/10 py-6">
                    <MetaStat label="Giá từ" value={
                      product.basePrice > 0
                        ? `${product.basePrice.toLocaleString("vi-VN")} đ`
                        : "Liên hệ"
                    } />
                    <MetaStat label="SL tối thiểu" value={`${product.minQuantity} cái`} icon={Package} />
                    <MetaStat label="Sản xuất" value={`${product.estimatedProductionDays} ngày`} icon={Clock} />
                  </div>

                  {/* CTAs */}
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/"
                      className="flex items-center justify-center gap-2 rounded-full bg-[#192B88] py-3.5 px-6 text-sm font-semibold text-[#F1F0EA] hover:bg-[#F1F0EA] hover:text-[#0F1320] transition-colors"
                    >
                      <Paintbrush className="h-4 w-4" />
                      Bắt đầu thiết kế
                    </Link>
                    <button
                      onClick={openPlainQuoteForm}
                      className="rounded-full border border-white/20 py-3.5 px-6 text-sm font-medium text-[rgba(241,240,234,0.75)] hover:border-white/40 hover:text-[#F1F0EA] transition-all active:scale-[0.98]"
                    >
                      Gửi yêu cầu báo giá
                    </button>
                  </div>

                  {product.isCustomizable && (
                    <p className="mt-4 text-xs leading-relaxed text-[rgba(241,240,234,0.40)]">
                      Sản phẩm hỗ trợ thiết kế và in ấn theo yêu cầu. AI Designer trên trang chủ giúp bạn xem trước
                      logo và artwork trên mockup trước khi gửi yêu cầu báo giá.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── PART B: Configurator (light, editorial grid) ──
                No overflow-hidden here: it would become the containing block
                for the sticky summary card below and break position:sticky
                entirely (the summary would scroll off-screen instead of
                pinning under the Navbar). EditorialGrid is already bounded to
                this section's own size, so nothing needs clipping. ── */}
            <div className="relative px-6 py-16 md:py-20" style={{ background: "#F1F0EA" }}>
              <EditorialGrid />
              <div className="relative max-w-7xl mx-auto">
                <ProductOptionSelector product={product} onRequestQuote={handleOptionSelectorQuote} />
              </div>
            </div>

            {/* ── PART C: Below-fold (dark) -- real API options, long-form
                content, related products. Below sections that duplicated the
                intro's already-shown price/min-qty/production-time metadata
                were removed rather than repeated a third time. ── */}
            <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">

              {/* Real per-product options from the backend (read-only display,
                  distinct from the interactive configurator above). */}
              {options.length > 0 && (
                <div className="border-t border-white/10 pt-10">
                  <h2 className="font-serif text-xl font-semibold text-[#F1F0EA] mb-6">
                    Tùy chọn sản phẩm
                  </h2>
                  <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
                    {options
                      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                      .map((option) => (
                        <div key={option.id}>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[rgba(241,240,234,0.40)] mb-2.5">
                            {option.name}
                            {option.isRequired ? " *" : ""}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-[rgba(241,240,234,0.65)]">
                            {option.values.map((value, i) => (
                              <span key={value}>
                                {value}
                                {i < option.values.length - 1 && <span className="text-white/20">,</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Nội dung chi tiết sản phẩm */}
              {product.contentBlocks && product.contentBlocks.length > 0 && (
                <div className="mt-14 border-t border-white/10 pt-10">
                  <div className="mb-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-[#F1F0EA] tracking-tight">
                      Nội dung chi tiết sản phẩm
                    </h2>
                    <p className="text-sm text-[rgba(241,240,234,0.40)] mt-1.5">
                      Thông tin mở rộng, hình ảnh và ghi chú chi tiết về sản phẩm.
                    </p>
                  </div>
                  <div className="max-w-3xl">
                    <ContentBlocksRenderer blocks={product.contentBlocks} />
                  </div>
                </div>
              )}

              {/* Related products */}
              {relatedProducts.length > 0 && (
                <div className="mt-14 pt-10 border-t border-white/10">
                  <div className="flex items-center justify-between mb-7">
                    <h2 className="text-lg font-semibold text-[#F1F0EA]">
                      Sản phẩm liên quan
                    </h2>
                    <Link
                      href={product.categoryId ? `/products?categoryId=${product.categoryId}` : "/products"}
                      className="text-xs text-[rgba(241,240,234,0.40)] hover:text-[#F1F0EA] transition-colors"
                    >
                      Xem thêm &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                    {relatedProducts.slice(0, 4).map((p) => (
                      <RelatedProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
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
              onClick={closeQuoteForm}
            />
            {/* Panel */}
            <motion.div
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-[#192B88]/25 bg-[#0F1320] shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
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
                initialQuantity={pendingQuote?.quantity}
                initialMessage={pendingQuote?.message}
                onSuccess={closeQuoteForm}
                onCancel={closeQuoteForm}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Metadata stat (typography, not a card) ──────────────────────────────────

function MetaStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Clock;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-[rgba(241,240,234,0.40)]">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1.5 text-base font-semibold text-[#F1F0EA]">{value}</p>
    </div>
  );
}

// ─── Related product card ─────────────────────────────────────────────────────

function RelatedProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-white/10 hover:border-[#192B88]/50 transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-[#161B2C]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-xl text-[#192B88]/30">Nan</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-[#F1F0EA] line-clamp-2 leading-snug">
          {product.name}
        </p>
        {product.basePrice > 0 && (
          <p className="text-xs text-[rgba(241,240,234,0.40)] mt-1">
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
        <div className="h-3 w-16 bg-white/5 rounded" />
        <div className="h-3 w-2 bg-white/5 rounded" />
        <div className="h-3 w-20 bg-white/5 rounded" />
        <div className="h-3 w-2 bg-white/5 rounded" />
        <div className="h-3 w-32 bg-white/5 rounded" />
      </div>

      {/* Intro skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-[4/5] rounded-lg bg-white/5" />
        <div className="space-y-5">
          <div className="h-2.5 w-20 bg-white/5 rounded" />
          <div className="h-9 w-3/4 bg-white/5 rounded" />
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-5/6 bg-white/5 rounded" />
          <div className="h-20 bg-white/5 rounded" />
          <div className="h-12 bg-white/5 rounded-full" />
          <div className="h-12 bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
