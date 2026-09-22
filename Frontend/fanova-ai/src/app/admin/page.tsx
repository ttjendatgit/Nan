"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, FolderOpen, FileText, CircleDollarSign, Newspaper, Palette, Users } from "lucide-react";

interface Module {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
    available: true,
  },
  {
    label: "Quy tắc giá",
    description: "Cấu hình quy tắc giá theo số lượng, chất liệu và tùy chọn sản phẩm.",
    href: "/admin/pricing-rules",
    icon: CircleDollarSign,
    available: true,
  },
  {
    label: "Nội dung",
    description: "Quản lý nội dung mở rộng cho sản phẩm, trang tĩnh và bài viết blog.",
    href: "/admin/content",
    icon: Newspaper,
    available: true,
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
    return (
      <div className="min-h-[100dvh]" style={{ background: "var(--admin-canvas)" }} aria-hidden="true">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-10 h-[124px] rounded-2xl admin-skeleton" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[142px] rounded-2xl admin-skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Page header -- fan-rib motif radiates from the top-right corner, a restrained nod to the fan identity */}
      <div
        className="admin-fan-motif mb-10 overflow-hidden rounded-2xl px-7 py-6"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          boxShadow: "0 1px 4px rgba(8, 51, 125, 0.05)",
        }}
      >
        <div className="mb-3 h-[2px] w-9 rounded-full" style={{ background: "var(--admin-accent)" }} aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--admin-text)" }}>
          Admin Console
        </h1>
        <p className="mt-2 text-sm leading-relaxed max-w-[56ch]" style={{ color: "var(--admin-text-subtle)" }}>
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
                className="flex flex-col gap-3 rounded-2xl p-5 opacity-50"
                style={{
                  background: "var(--admin-surface-muted)",
                  border: "1px solid var(--admin-border)",
                }}
                aria-disabled="true"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: "var(--admin-info-soft)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "var(--admin-text-subtle)" }} />
                  </div>
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: "var(--admin-text-subtle)" }}
                  >
                    Sắp triển khai
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{mod.label}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--admin-text-subtle)" }}>
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
              className="admin-focus-ring group flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
                boxShadow: "0 1px 4px rgba(8, 51, 125, 0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 6px 20px rgba(8, 51, 125, 0.12)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(8, 51, 125, 0.28)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 1px 4px rgba(8, 51, 125, 0.06)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(8, 51, 125, 0.12)";
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
                  style={{ background: "var(--admin-info-soft)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "var(--admin-primary)" }} />
                </div>
                <span
                  className="text-xs transition-colors"
                  style={{ color: "var(--admin-text-subtle)" }}
                >
                  Mở →
                </span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>{mod.label}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--admin-text-subtle)" }}>
                  {mod.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View public site link */}
      <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--admin-border)" }}>
        <Link
          href="/"
          className="admin-focus-ring text-xs transition-colors hover:underline"
          style={{ color: "var(--admin-text-subtle)" }}
        >
          ← Về trang chủ Nan
        </Link>
      </div>
    </div>
  );
}
