"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Package, RefreshCw } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getProducts, getProductsByCategory } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type { Product, ProductCategory } from "@/types/catalog";

// Wrap the page in Suspense so useSearchParams works correctly with Next.js SSR
export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const urlCategoryId = searchParams.get("categoryId");
  const urlCategoryIdRef = useRef(urlCategoryId);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategoryId);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getProducts({ pageSize: 100, activeOnly: true }),
        getCategories({ pageSize: 100, activeOnly: true }),
      ]);
      const allProds = productsResult.items;
      setAllProducts(allProds);
      setCategories(categoriesResult.items);

      // Apply initial category filter from URL param (?categoryId=...)
      const catId = urlCategoryIdRef.current;
      if (catId) {
        try {
          const catResult = await getProductsByCategory(catId, { pageSize: 100 });
          setDisplayedProducts(catResult.items);
        } catch {
          setDisplayedProducts(allProds.filter((p) => p.categoryId === catId));
        }
        setSelectedCategory(catId);
      } else {
        setDisplayedProducts(allProds);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu sản phẩm"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  async function handleCategorySelect(categoryId: string | null) {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      setDisplayedProducts(allProducts);
      return;
    }
    setFilterLoading(true);
    try {
      const result = await getProductsByCategory(categoryId, { pageSize: 100 });
      setDisplayedProducts(result.items);
    } catch {
      // graceful fallback to client-side filter from already-loaded products
      setDisplayedProducts(
        allProducts.filter((p) => p.categoryId === categoryId)
      );
    } finally {
      setFilterLoading(false);
    }
  }

  const selectedCategoryName = selectedCategory
    ? (categories.find((c) => c.id === selectedCategory)?.name ?? "Sản phẩm")
    : null;

  return (
    <div className="min-h-[100dvh] bg-[#0D131F] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Page header */}
        <section className="px-6 py-14 text-center border-b border-[#1B1C4A]/60">
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-3">
            Sản phẩm của Nan
          </h1>
          <p className="text-[#B6D6F2]/55 text-sm md:text-base max-w-md mx-auto">
            Quạt giấy thủ công in logo, thiết kế theo yêu cầu
          </p>
        </section>

        {/* Category filter pills */}
        {!loading && !error && categories.length > 0 && (
          <section className="px-6 py-5 border-b border-[#1B1C4A]/60 bg-[#0D131F]">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => handleCategorySelect(null)}
                  className={`flex-shrink-0 rounded-full px-5 py-2 text-xs font-medium transition-all duration-200 ${
                    selectedCategory === null
                      ? "bg-[#273481] text-white"
                      : "border border-[#1B1C4A] text-[#B6D6F2]/55 hover:border-[#273481]/60 hover:text-[#B6D6F2]"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex-shrink-0 rounded-full px-5 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? "bg-[#273481] text-white"
                        : "border border-[#1B1C4A] text-[#B6D6F2]/55 hover:border-[#273481]/60 hover:text-[#B6D6F2]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Content area */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          {/* Initial loading skeleton */}
          {loading && <SkeletonGrid />}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center py-20 text-center gap-5">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-medium mb-1.5">
                  Không thể tải sản phẩm
                </p>
                <p className="text-[#B6D6F2]/40 text-sm max-w-xs">{error}</p>
              </div>
              <button
                onClick={loadInitial}
                className="flex items-center gap-2 rounded-full border border-[#273481]/50 px-5 py-2.5 text-sm text-[#B6D6F2] hover:border-[#273481] hover:text-white transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Thử lại
              </button>
            </div>
          )}

          {/* Products */}
          {!loading && !error && (
            <>
              {/* Section label + count */}
              <div className="flex items-center justify-between mb-7">
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedCategoryName ?? "Tất cả sản phẩm"}
                  </p>
                  {!filterLoading && (
                    <p className="text-xs text-[#B6D6F2]/35 mt-0.5">
                      {displayedProducts.length} sản phẩm
                    </p>
                  )}
                </div>
              </div>

              {/* Grid with filter-loading overlay */}
              <div
                className={`transition-opacity duration-200 ${
                  filterLoading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {!filterLoading && displayedProducts.length === 0 ? (
                  <EmptyState
                    categorySelected={!!selectedCategory}
                    onClearFilter={() => handleCategorySelect(null)}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {displayedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-[#111335] border border-[#1B1C4A] hover:border-[#273481]/50 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(39,52,129,0.18)]"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1B1C4A]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1B1C4A] to-[#111335]">
            <span className="font-serif text-3xl text-[#273481]/25">Nan</span>
          </div>
        )}
        {product.isCustomizable && (
          <div className="absolute top-2.5 right-2.5 rounded-full bg-[#273481]/80 backdrop-blur-sm px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.14em] text-[#B6D6F2]">
            Tùy chỉnh
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {product.categoryName && (
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#B6D6F2]/45">
            {product.categoryName}
          </span>
        )}

        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-[#B6D6F2]/45 line-clamp-2 flex-1 leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-[#1B1C4A] flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {product.basePrice > 0
              ? `${product.basePrice.toLocaleString("vi-VN")} ₫`
              : "Báo giá theo yêu cầu"}
          </span>
          <span className="text-xs text-[#B6D6F2]/45 group-hover:text-[#B6D6F2] transition-colors">
            Xem &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden bg-[#111335] border border-[#1B1C4A] animate-pulse"
        >
          <div className="aspect-[4/3] bg-[#1B1C4A]" />
          <div className="p-4 space-y-2.5">
            <div className="h-2 w-14 bg-[#1B1C4A] rounded" />
            <div className="h-4 w-4/5 bg-[#1B1C4A] rounded" />
            <div className="h-3 w-full bg-[#1B1C4A] rounded" />
            <div className="h-3 w-2/3 bg-[#1B1C4A] rounded" />
            <div className="pt-2 border-t border-[#1B1C4A] flex justify-between items-center">
              <div className="h-4 w-20 bg-[#1B1C4A] rounded" />
              <div className="h-3 w-8 bg-[#1B1C4A] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  categorySelected,
  onClearFilter,
}: {
  categorySelected: boolean;
  onClearFilter: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center gap-5">
      <div className="w-14 h-14 rounded-full border border-[#1B1C4A] flex items-center justify-center">
        <Package className="h-6 w-6 text-[#273481]/60" />
      </div>
      <div>
        <p className="text-white font-medium mb-1.5">
          {categorySelected
            ? "Chưa có sản phẩm trong danh mục này"
            : "Chưa có sản phẩm nào"}
        </p>
        <p className="text-[#B6D6F2]/35 text-sm">
          Sản phẩm sẽ sớm được cập nhật
        </p>
      </div>
      {categorySelected && (
        <button
          onClick={onClearFilter}
          className="text-sm text-[#B6D6F2]/55 hover:text-white transition-colors underline underline-offset-4"
        >
          Xem tất cả sản phẩm
        </button>
      )}
    </div>
  );
}
