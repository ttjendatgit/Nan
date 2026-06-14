"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type { Product, ProductCategory } from "@/types/catalog";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231B1C4A'/%3E%3Cpath d='M150 180l40-40 30 30 20-20 40 40H150z' fill='%23273481' opacity='.6'/%3E%3Ccircle cx='260' cy='130' r='20' fill='%23273481' opacity='.4'/%3E%3C/svg%3E";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getProducts({ pageSize: 100, activeOnly: true }),
          getCategories({ pageSize: 100, activeOnly: true }),
        ]);
        setProducts(productsResult.items);
        setCategories(categoriesResult.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-[#0D131F] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20">
        {/* Hero */}
        <section className="px-6 py-16 text-center border-b border-[#1B1C4A]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#B6D6F2]/60 mb-4">
            Bộ sưu tập
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Sản phẩm của Nan
          </h1>
          <p className="text-[#B6D6F2]/70 max-w-xl mx-auto text-sm md:text-base">
            Quạt giấy thủ công in logo, thiết kế theo yêu cầu — đậm bản sắc Việt
          </p>
        </section>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#B6D6F2]" />
          </div>
        )}

        {error && (
          <div className="max-w-lg mx-auto px-6 py-12 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Category filter */}
            {categories.length > 0 && (
              <section className="px-6 py-8 border-b border-[#1B1C4A]">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                        selectedCategory === null
                          ? "bg-[#273481] text-white"
                          : "bg-[#111335] border border-[#1B1C4A] text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white"
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === cat.id ? null : cat.id
                          )
                        }
                        className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                          selectedCategory === cat.id
                            ? "bg-[#273481] text-white"
                            : "bg-[#111335] border border-[#1B1C4A] text-[#B6D6F2]/70 hover:border-[#273481] hover:text-white"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Categories showcase (when no filter) */}
            {selectedCategory === null && categories.length > 0 && (
              <section className="px-6 py-12">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Danh mục
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="group text-left rounded-2xl overflow-hidden bg-[#111335] border border-[#1B1C4A] hover:border-[#273481] transition-colors"
                      >
                        <div className="relative aspect-square overflow-hidden bg-[#1B1C4A]">
                          <Image
                            src={cat.imageUrl || PLACEHOLDER_IMAGE}
                            alt={cat.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          />
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-white text-sm truncate">
                            {cat.name}
                          </p>
                          {cat.description && (
                            <p className="text-xs text-[#B6D6F2]/50 truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                          <span className="mt-2 inline-block text-xs text-[#B6D6F2] hover:text-white transition-colors">
                            Xem sản phẩm →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Products grid */}
            <section className="px-6 py-12">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {selectedCategory
                      ? categories.find((c) => c.id === selectedCategory)?.name ?? "Sản phẩm"
                      : "Tất cả sản phẩm"}
                    <span className="ml-2 text-sm font-normal text-[#B6D6F2]/50">
                      ({filteredProducts.length})
                    </span>
                  </h2>
                </div>

                {filteredProducts.length === 0 && (
                  <p className="text-[#B6D6F2]/40 text-sm py-12 text-center">
                    Chưa có sản phẩm nào.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-[#111335] border border-[#1B1C4A] hover:border-[#273481] transition-colors"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1B1C4A]">
        <Image
          src={product.imageUrl || PLACEHOLDER_IMAGE}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        {product.categoryName && (
          <p className="text-xs font-mono text-[#B6D6F2]/50 uppercase tracking-wider">
            {product.categoryName}
          </p>
        )}

        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-[#B6D6F2]/60 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {product.basePrice > 0
              ? `${product.basePrice.toLocaleString("vi-VN")} ₫`
              : "Báo giá theo yêu cầu"}
          </span>
        </div>

        <span className="mt-2 block w-full rounded-lg bg-[#273481] py-2 text-center text-xs font-medium text-white group-hover:opacity-90 transition-opacity">
          Xem chi tiết
        </span>
      </div>
    </Link>
  );
}
