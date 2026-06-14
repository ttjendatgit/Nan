"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { Loader2, ArrowLeft, Clock, Package, Paintbrush } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { getProduct } from "@/lib/api/products";
import type { Product } from "@/types/catalog";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%231B1C4A'/%3E%3Cpath d='M280 400l80-80 60 60 40-40 80 80H280z' fill='%23273481' opacity='.6'/%3E%3Ccircle cx='520' cy='240' r='50' fill='%23273481' opacity='.4'/%3E%3C/svg%3E";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then(setProduct)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Không tìm thấy sản phẩm")
      )
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0D131F] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-[#B6D6F2]/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Tất cả sản phẩm
          </Link>

          {loading && (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[#B6D6F2]" />
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <Link
                href="/products"
                className="text-sm text-[#B6D6F2] hover:text-white"
              >
                ← Quay lại
              </Link>
            </div>
          )}

          {product && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Image */}
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#111335] border border-[#1B1C4A]">
                <Image
                  src={product.imageUrl || PLACEHOLDER_IMAGE}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-6">
                {product.categoryName && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#B6D6F2]/60">
                    {product.categoryName}
                  </p>
                )}

                <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
                  {product.name}
                </h1>

                {product.description && (
                  <p className="text-[#B6D6F2]/70 text-sm leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Price */}
                <div className="rounded-2xl bg-[#111335] border border-[#1B1C4A] p-5">
                  <p className="text-xs text-[#B6D6F2]/50 mb-1">Giá từ</p>
                  <p className="text-2xl font-semibold text-white">
                    {product.basePrice > 0
                      ? `${product.basePrice.toLocaleString("vi-VN")} ₫`
                      : "Báo giá theo yêu cầu"}
                  </p>
                  {product.minQuantity > 1 && (
                    <p className="text-xs text-[#B6D6F2]/50 mt-1">
                      Đặt tối thiểu {product.minQuantity} sản phẩm
                    </p>
                  )}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#111335] border border-[#1B1C4A] p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[#273481] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[#B6D6F2]/50">Sản xuất</p>
                      <p className="text-sm font-medium text-white">
                        {product.estimatedProductionDays} ngày
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#111335] border border-[#1B1C4A] p-4 flex items-center gap-3">
                    <Package className="h-5 w-5 text-[#273481] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-[#B6D6F2]/50">Số lượng tối thiểu</p>
                      <p className="text-sm font-medium text-white">
                        {product.minQuantity} cái
                      </p>
                    </div>
                  </div>
                  {product.isCustomizable && (
                    <div className="col-span-2 rounded-xl bg-[#273481]/10 border border-[#273481]/30 p-4 flex items-center gap-3">
                      <Paintbrush className="h-5 w-5 text-[#B6D6F2] flex-shrink-0" />
                      <p className="text-sm text-[#B6D6F2]">
                        Sản phẩm này hỗ trợ thiết kế theo yêu cầu
                      </p>
                    </div>
                  )}
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3 mt-2">
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#273481] py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <Paintbrush className="h-4 w-4" />
                    Tạo mockup
                  </Link>
                  <button className="rounded-xl border border-[#273481] py-3.5 text-sm font-medium text-[#B6D6F2] hover:bg-[#273481]/20 transition-colors">
                    Gửi yêu cầu báo giá
                  </button>
                  <button className="rounded-xl border border-[#1B1C4A] py-3.5 text-sm font-medium text-[#B6D6F2]/60 hover:border-[#273481] hover:text-white transition-colors">
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
