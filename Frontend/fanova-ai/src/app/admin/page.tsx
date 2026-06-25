"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, FolderOpen, FileText, CircleDollarSign, Palette, Users } from "lucide-react";

interface Module {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const MODULES: Module[] = [
  {
    label: "Sản phẩm",
    description: "Tạo, chỉnh sửa và quản lý danh sách sản phẩm cùng hình ảnh Cloudinary.",
    href: "/admin/products",
    icon: Package,
    available: true,
  },
  {
    label: "Danh mục",
    description: "Quản lý các dòng quạt: quạt giấy, quạt vải, quạt nan tre và các loại khác.",
    href: "/admin/categories",
    icon: FolderOpen,
    available: true,
  },
  {
    label: "Yêu cầu báo giá",
    description: "Xem và xử lý các yêu cầu báo giá từ khách hàng theo trạng thái.",
    href: "/admin/quote-requests",
    icon: FileText,
    available: false,
  },
  {
    label: "Pricing Rules",
    description: "Cấu hình quy tắc giá theo số lượng, chất liệu và tùy chọn sản phẩm.",
    href: "/admin/pricing-rules",
    icon: CircleDollarSign,
    available: false,
  },
  {
    label: "Design Files",
    description: "Quản lý file thiết kế đã tải lên và trạng thái duyệt.",
    href: "/admin/design-files",
    icon: Palette,
    available: false,
  },
  {
    label: "Users",
    description: "Quản lý tài khoản nhân viên và phân quyền Staff / Manager.",
    href: "/admin/users",
    icon: Users,
    available: false,
  },
];

export default function AdminDashboardPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("nan_admin_token");
    if (!token) {
      window.location.replace("/admin/products");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-[100dvh] bg-[#0D131F]" />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Admin Console
        </h1>
        <p className="mt-2 text-sm text-[#B6D6F2]/50 leading-relaxed max-w-[56ch]">
          Quản lý sản phẩm, danh mục, yêu cầu báo giá và dữ liệu vận hành của Nan.
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;

          if (!mod.available) {
            return (
              <div
                key={mod.href}
                className="flex flex-col gap-3 rounded-2xl border border-[#1B1C4A] bg-[#111335]/60 p-5 opacity-45"
                aria-disabled="true"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B1C4A]">
                    <Icon className="h-4 w-4 text-[#B6D6F2]/60" />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#B6D6F2]/40">
                    Sắp triển khai
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{mod.label}</p>
                  <p className="mt-1 text-xs text-[#B6D6F2]/45 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group flex flex-col gap-3 rounded-2xl border border-[#1B1C4A] bg-[#111335] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#273481]/50 hover:shadow-[0_6px_24px_rgba(39,52,129,0.18)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B1C4A] transition-colors group-hover:bg-[#273481]/30">
                  <Icon className="h-4 w-4 text-[#B6D6F2]/70 transition-colors group-hover:text-[#B6D6F2]" />
                </div>
                <span className="text-xs text-[#B6D6F2]/30 transition-colors group-hover:text-[#B6D6F2]/60">
                  Mở &rarr;
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{mod.label}</p>
                <p className="mt-1 text-xs text-[#B6D6F2]/45 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View public site link */}
      <div className="mt-10 pt-6 border-t border-[#1B1C4A]/60">
        <Link
          href="/"
          className="text-xs text-[#B6D6F2]/35 hover:text-[#B6D6F2]/65 transition-colors"
        >
          &larr; Về trang chủ Nan
        </Link>
      </div>
    </div>
  );
}
