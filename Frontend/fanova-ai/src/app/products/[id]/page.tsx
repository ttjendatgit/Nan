"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { NanFanMark } from "@/components/product/CatalogueList";
import ContentBlocksRenderer from "@/components/product/ContentBlocksRenderer";
import ProductFacts from "@/components/product/ProductFacts";
import ProductOptionSelector from "@/components/product/ProductOptionSelector";
import Button from "@/components/ui/Button";
import { getProduct, getProductsByCategory } from "@/lib/api/products";
import { detailFacts, formatProductPrice } from "@/lib/productFacts";
import type { Product } from "@/types/catalog";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [pendingQuote, setPendingQuote] = useState<{ selectedOptionIds: string[]; quantity: number } | null>(null);

  function openPlainQuoteForm() {
    setPendingQuote(null);
    setShowQuoteForm(true);
  }

  function closeQuoteForm() {
    setShowQuoteForm(false);
    setPendingQuote(null);
  }

  function handleOptionSelectorQuote(selectedOptionIds: string[], quantity: number) {
    setPendingQuote({ selectedOptionIds, quantity });
    setShowQuoteForm(true);
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setProduct(null);
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

      // Load related products without blocking the product render. Option data is
      // fetched separately by ProductOptionSelector, which also owns pricing.
      if (!p.categoryId) return;
      const relatedData = await getProductsByCategory(p.categoryId, { pageSize: 5 }).catch(() => null);
      if (cancelled || !relatedData) return;
      setRelatedProducts(relatedData.items.filter((item) => item.id !== p.id));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-indigo text-on-indigo">
      <Navbar />

      <main className="flex-1 pt-24">

        {/* Loading skeleton */}
        {loading && (
          <div className="mx-auto max-w-7xl px-6 py-10">
            <ProductDetailSkeleton />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <DetailMessage
            title="Không thể tải sản phẩm"
            detail={error}
          />
        )}

        {/* Not found state */}
        {!loading && !error && !product && (
          <DetailMessage
            title="Sản phẩm không tồn tại"
            detail="Sản phẩm này có thể đã bị xóa hoặc không còn khả dụng."
          />
        )}

        {/* Product content */}
        {product && (
          <>
            {/* ── PART A: Product intro. R9D: a B2B specification read top to bottom (category, name,
                description, commercial facts, CTA), the full product image beside it. Every value
                goes through lib/productFacts, the same rules and wording as the catalogue. ── */}
            <div className="mx-auto max-w-7xl px-6 pb-16 pt-4 md:pb-20">
              <nav aria-label="Đường dẫn" className="mb-6 text-xs text-on-indigo-muted">
                <ol className="flex flex-wrap items-center gap-x-2">
                  <li>
                    <Link href="/" className="inline-flex min-h-11 items-center transition-colors hover:text-on-indigo focus-visible:outline-1 focus-visible:outline-on-indigo">
                      Trang chủ
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href="/products" className="inline-flex min-h-11 items-center transition-colors hover:text-on-indigo focus-visible:outline-1 focus-visible:outline-on-indigo">
                      Sản phẩm
                    </Link>
                  </li>
                  {product.categoryId && product.categoryName && (
                    <>
                      <li aria-hidden="true">/</li>
                      <li>
                        <Link
                          href={`/products?categoryId=${product.categoryId}`}
                          className="inline-flex min-h-11 items-center transition-colors hover:text-on-indigo focus-visible:outline-1 focus-visible:outline-on-indigo"
                        >
                          {product.categoryName}
                        </Link>
                      </li>
                    </>
                  )}
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="max-w-[16rem] truncate text-on-indigo">
                    {product.name}
                  </li>
                </ol>
              </nav>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start md:gap-x-10 lg:gap-x-16">
                {/* Product information */}
                <div className="min-w-0 md:col-span-6 md:pt-4">
                  {product.categoryName && (
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bamboo">
                      {product.categoryName}
                    </p>
                  )}

                  <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-on-indigo [overflow-wrap:anywhere] md:text-[2.5rem] lg:text-5xl">
                    {product.name}
                  </h1>

                  {product.description?.trim() && (
                    <p className="mt-5 max-w-[56ch] whitespace-pre-line text-[0.9375rem] leading-7 text-on-indigo-muted [overflow-wrap:anywhere]">
                      {product.description.trim()}
                    </p>
                  )}

                  <ProductFacts facts={detailFacts(product)} layout="grid" className="mt-8" />

                  <div className="mt-8">
                    <Button type="button" tone="indigo" onClick={openPlainQuoteForm} className="group">
                      Nhận báo giá
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="ml-2 transition-[translate] duration-(--dur-state) ease-(--ease-nan-ui) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      />
                    </Button>
                  </div>

                  {product.isCustomizable && (
                    <p className="mt-4 text-xs leading-relaxed text-on-indigo-muted">
                      Sản phẩm hỗ trợ thiết kế và in ấn theo yêu cầu.
                    </p>
                  )}
                </div>

                {/* Product media: the whole product, contained in a 4:3 frame (fans are wide; never cropped); no
                    box or background, the page is the plinth. */}
                <div className="md:col-span-6">
                  <div className="relative aspect-[4/3] w-full">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain object-top"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                        <NanFanMark />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── PART B: Configurator (light) ──
                No overflow-hidden here: it would become the containing block
                for the sticky summary card below and break position:sticky
                entirely (the summary would scroll off-screen instead of
                pinning under the Navbar). ── */}
            <div className="relative bg-paper px-6 py-16 md:py-20">
              <div className="relative max-w-7xl mx-auto">
                <ProductOptionSelector product={product} onRequestQuote={handleOptionSelectorQuote} />
              </div>
            </div>

            {/* ── PART C: Below-fold (dark) -- long-form content, related
                products. The interactive configurator above (backed by the
                same live per-product option data) already covers what a
                read-only options listing here would have duplicated. ── */}
            <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">

              {/* Nội dung chi tiết sản phẩm */}
              {product.contentBlocks && product.contentBlocks.length > 0 && (
                <div className="mt-14 border-t border-line-on-indigo pt-10">
                  <div className="mb-6">
                    <h2 className="font-serif text-2xl font-medium tracking-tight text-on-indigo md:text-3xl">
                      Nội dung chi tiết sản phẩm
                    </h2>
                    <p className="mt-1.5 text-sm text-on-indigo-muted">
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
                <div className="mt-14 border-t border-line-on-indigo pt-10">
                  <div className="mb-7 flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-medium text-on-indigo">
                      Sản phẩm liên quan
                    </h2>
                    <Link
                      href={product.categoryId ? `/products?categoryId=${product.categoryId}` : "/products"}
                      className="inline-flex min-h-11 items-center text-xs text-on-indigo-muted transition-colors hover:text-on-indigo focus-visible:outline-1 focus-visible:outline-on-indigo"
                    >
                      Xem thêm &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
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
      {product && (
        <QuoteRequestModal
          open={showQuoteForm}
          onClose={closeQuoteForm}
          productId={product.id}
          productName={product.name}
          categoryName={product.categoryName}
          minQuantity={product.minQuantity}
          initialQuantity={pendingQuote?.quantity}
          selectedOptionIds={pendingQuote?.selectedOptionIds}
        />
      )}
    </div>
  );
}

// ─── Error / not-found message ────────────────────────────────────────────────

function DetailMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div role="status" className="flex flex-col items-start gap-4 py-24">
        <span aria-hidden="true" className="mb-6 block h-px w-24 bg-bamboo" />
        <p className="font-serif text-3xl font-medium text-on-indigo">{title}</p>
        <p className="max-w-sm text-sm text-on-indigo-muted">{detail}</p>
        <Link
          href="/products"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-on-indigo transition-colors hover:text-bamboo focus-visible:outline-1 focus-visible:outline-on-indigo"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}

// ─── Related product card ─────────────────────────────────────────────────────

function RelatedProductCard({ product }: { product: Product }) {
  const price = formatProductPrice(product.basePrice);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-on-indigo"
    >
      <div className="relative aspect-square">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain transition-[scale] duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
            <NanFanMark />
          </div>
        )}
      </div>
      <div className="border-t border-line-on-indigo pt-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-on-indigo">{product.name}</p>
        <p className="mt-1 text-xs text-on-indigo-muted">{price.value}</p>
      </div>
    </Link>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-8 flex items-center gap-2">
        <div className="h-3 w-16 bg-indigo-raised" />
        <div className="h-3 w-20 bg-indigo-raised" />
        <div className="h-3 w-32 bg-indigo-raised" />
      </div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-5">
          <div className="h-3 w-20 bg-indigo-raised" />
          <div className="h-12 w-3/4 bg-indigo-raised" />
          <div className="h-4 w-full bg-indigo-raised" />
          <div className="h-4 w-5/6 bg-indigo-raised" />
          <div className="h-36 bg-indigo-raised" />
          <div className="h-11 w-44 rounded-full bg-indigo-raised" />
        </div>
        <div className="aspect-[4/3] bg-indigo-raised/70" />
      </div>
    </div>
  );
}
