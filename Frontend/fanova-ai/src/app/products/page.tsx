"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Package, RefreshCw, ArrowRight } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getProductsByCategory } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type { Product, ProductCategory } from "@/types/catalog";

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  return (
    <div className="min-h-[100dvh] bg-[#0D131F] text-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        {categoryId ? (
          <CategoryProductsView categoryId={categoryId} />
        ) : (
          <CategorySelectionView />
        )}
      </main>
      <Footer />
    </div>
  );
}

// ─── Category Selection View (/products — no categoryId) ──────────────────────

function CategorySelectionView() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCategories({ pageSize: 50, activeOnly: true })
      .then((res) => {
        if (!cancelled) setCategories(res.items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Không thể tải danh mục");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[#1B1C4A]/60 px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight leading-tight max-w-[22ch]">
            Chọn dòng sản phẩm phù hợp
          </h1>
          <p className="mt-4 text-[#B6D6F2]/55 text-sm md:text-base leading-relaxed max-w-[52ch]">
            Mỗi chất liệu và cấu trúc quạt tạo nên trải nghiệm thị giác riêng biệt. Chọn dòng quạt phù hợp với không gian và thương hiệu của bạn.
          </p>
        </div>
      </section>

      {/* Category grid */}
      <section className="max-w-7xl mx-auto px-6 py-10 pb-20">
        {loading && <CategorySkeletonGrid />}

        {!loading && error && (
          <div className="flex flex-col items-center py-20 text-center gap-5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1.5">Không thể tải danh mục</p>
              <p className="text-[#B6D6F2]/40 text-sm max-w-xs">{error}</p>
            </div>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="flex items-center gap-2 rounded-full border border-[#273481]/50 px-5 py-2.5 text-sm text-[#B6D6F2] transition-all hover:border-[#273481] hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center gap-5">
            <div className="w-14 h-14 rounded-full border border-[#1B1C4A] flex items-center justify-center">
              <Package className="h-6 w-6 text-[#273481]/60" />
            </div>
            <div>
              <p className="text-white font-medium mb-1.5">Chưa có danh mục sản phẩm</p>
              <p className="text-[#B6D6F2]/35 text-sm">Sản phẩm sẽ sớm được cập nhật</p>
            </div>
          </div>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, index) => (
              <CategoryDiscoveryCard key={cat.id} category={cat} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Category Products View (/products?categoryId=...) ────────────────────────

function CategoryProductsView({ categoryId }: { categoryId: string }) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProducts([]);

    Promise.all([
      getCategories({ pageSize: 50, activeOnly: true }),
      getProductsByCategory(categoryId, { pageSize: 100 }),
    ])
      .then(([catsRes, prodsRes]) => {
        if (cancelled) return;
        setCategories(catsRes.items);
        setProducts(prodsRes.items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, retryKey]);

  return (
    <div>
      {/* Category header */}
      <section className="border-b border-[#1B1C4A]/60 px-6 py-10">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-[#B6D6F2]/45 transition-colors hover:text-[#B6D6F2]"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="h-3 w-3">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Tất cả dòng quạt
          </Link>

          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 w-52 rounded bg-[#1B1C4A]" />
              <div className="h-4 w-80 rounded bg-[#1B1C4A]" />
            </div>
          ) : selectedCategory ? (
            <>
              <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
                {selectedCategory.name}
              </h1>
              {selectedCategory.description && (
                <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-[#B6D6F2]/55">
                  {selectedCategory.description}
                </p>
              )}
            </>
          ) : !error ? (
            <h1 className="text-3xl font-semibold text-white">Sản phẩm</h1>
          ) : null}
        </div>
      </section>

      {/* Category switcher pills */}
      {!loading && !error && categories.length > 0 && (
        <section className="border-b border-[#1B1C4A]/60 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href="/products"
                className="flex-shrink-0 rounded-full border border-[#1B1C4A] px-4 py-1.5 text-xs font-medium text-[#B6D6F2]/50 transition-all duration-200 hover:border-[#273481]/60 hover:text-[#B6D6F2]"
              >
                Tất cả dòng quạt
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?categoryId=${cat.id}`}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                    cat.id === categoryId
                      ? "bg-[#273481] text-white"
                      : "border border-[#1B1C4A] text-[#B6D6F2]/50 hover:border-[#273481]/60 hover:text-[#B6D6F2]"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product grid */}
      <section className="max-w-7xl mx-auto px-6 py-10 pb-20">
        {loading && <SkeletonProductGrid />}

        {!loading && error && (
          <div className="flex flex-col items-center py-20 text-center gap-5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1.5">Không thể tải sản phẩm</p>
              <p className="text-[#B6D6F2]/40 text-sm max-w-xs">{error}</p>
            </div>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="flex items-center gap-2 rounded-full border border-[#273481]/50 px-5 py-2.5 text-sm text-[#B6D6F2] transition-all hover:border-[#273481] hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center gap-5">
            <div className="w-14 h-14 rounded-full border border-[#1B1C4A] flex items-center justify-center">
              <Package className="h-6 w-6 text-[#273481]/60" />
            </div>
            <div>
              <p className="text-white font-medium mb-1.5">
                Hiện chưa có sản phẩm trong dòng này
              </p>
              <p className="text-[#B6D6F2]/35 text-sm">Sản phẩm sẽ sớm được cập nhật</p>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-[#273481]/50 px-5 py-2.5 text-sm text-[#B6D6F2] transition-all hover:border-[#273481] hover:text-white"
            >
              Chọn dòng khác
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="mb-6 text-xs text-[#B6D6F2]/35">
              {products.length} sản phẩm
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Category Discovery Card ──────────────────────────────────────────────────

function CategoryDiscoveryCard({
  category,
  index,
}: {
  category: ProductCategory;
  index: number;
}) {
  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#1B1C4A] bg-[#111335] transition-all duration-300 hover:-translate-y-1 hover:border-[#273481]/50 hover:shadow-[0_8px_32px_rgba(39,52,129,0.20)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1B1C4A]">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 3}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1B1C4A] to-[#111335]">
            <NanFanFallback />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-semibold leading-snug text-white">
          {category.name}
        </h3>

        {category.description && (
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-[#B6D6F2]/50">
            {category.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] font-medium text-[#B6D6F2]/55 transition-colors group-hover:text-[#B6D6F2]">
          Xem mẫu quạt
          <ArrowRight
            size={11}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}

// ─── Nan fan fallback visual ──────────────────────────────────────────────────

function NanFanFallback() {
  return (
    <div className="flex select-none flex-col items-center justify-center gap-2">
      <svg
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
        className="h-16 w-16 opacity-[0.18]"
      >
        <line x1="40" y1="70" x2="40" y2="10" stroke="#B6D6F2" strokeWidth="1" strokeLinecap="round" />
        <line x1="40" y1="70" x2="12" y2="28" stroke="#B6D6F2" strokeWidth="1" strokeLinecap="round" />
        <line x1="40" y1="70" x2="68" y2="28" stroke="#B6D6F2" strokeWidth="1" strokeLinecap="round" />
        <line x1="40" y1="70" x2="23" y2="13" stroke="#B6D6F2" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="40" y1="70" x2="57" y2="13" stroke="#B6D6F2" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M12,28 A32,32 0 0,1 68,28" stroke="#B6D6F2" strokeWidth="0.8" fill="none" />
        <path d="M20,14 A28,28 0 0,1 60,14" stroke="#B6D6F2" strokeWidth="0.5" fill="none" />
        <circle cx="40" cy="70" r="3" stroke="#ECCA3E" strokeWidth="0.8" fill="none" opacity="0.55" />
      </svg>
      <span className="font-serif text-xl text-[#273481]/25">Nan</span>
    </div>
  );
}

// ─── Category skeleton grid ───────────────────────────────────────────────────

function CategorySkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-[#1B1C4A] bg-[#111335]"
        >
          <div className="aspect-[4/3] bg-[#1B1C4A]" />
          <div className="space-y-2.5 p-5">
            <div className="h-4 w-3/5 rounded bg-[#1B1C4A]" />
            <div className="h-3 w-full rounded bg-[#1B1C4A]" />
            <div className="h-3 w-4/5 rounded bg-[#1B1C4A]" />
            <div className="h-3 w-20 rounded bg-[#1B1C4A] pt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#1B1C4A] bg-[#111335] transition-all duration-300 hover:border-[#273481]/50 hover:shadow-[0_8px_32px_rgba(39,52,129,0.18)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1B1C4A]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1B1C4A] to-[#111335]">
            <span className="font-serif text-3xl text-[#273481]/25">Nan</span>
          </div>
        )}
        {product.isCustomizable && (
          <div className="absolute right-2.5 top-2.5 rounded-full bg-[#273481]/80 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.14em] text-[#B6D6F2] backdrop-blur-sm">
            Tùy chỉnh
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categoryName && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#B6D6F2]/45">
            {product.categoryName}
          </span>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {product.name}
        </h3>

        {product.description && (
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-[#B6D6F2]/45">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[#1B1C4A] pt-3">
          <span className="text-sm font-semibold text-white">
            {product.basePrice > 0
              ? `${product.basePrice.toLocaleString("vi-VN")} ₫`
              : "Báo giá theo yêu cầu"}
          </span>
          <span className="text-xs text-[#B6D6F2]/45 transition-colors group-hover:text-[#B6D6F2]">
            Xem &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton product grid ────────────────────────────────────────────────────

function SkeletonProductGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-[#1B1C4A] bg-[#111335]"
        >
          <div className="aspect-[4/3] bg-[#1B1C4A]" />
          <div className="space-y-2.5 p-4">
            <div className="h-2 w-14 rounded bg-[#1B1C4A]" />
            <div className="h-4 w-4/5 rounded bg-[#1B1C4A]" />
            <div className="h-3 w-full rounded bg-[#1B1C4A]" />
            <div className="h-3 w-2/3 rounded bg-[#1B1C4A]" />
            <div className="flex items-center justify-between border-t border-[#1B1C4A] pt-2">
              <div className="h-4 w-20 rounded bg-[#1B1C4A]" />
              <div className="h-3 w-8 rounded bg-[#1B1C4A]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
