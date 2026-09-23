"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  FileText,
  CircleDollarSign,
  Newspaper,
  Image as ImageIcon,
  Palette,
  Users,
  LogOut,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tổng quan",         href: "/admin",                icon: LayoutDashboard,  available: true  },
  { label: "Sản phẩm",          href: "/admin/products",       icon: Package,          available: true  },
  { label: "Danh mục",          href: "/admin/categories",     icon: FolderOpen,       available: true  },
  { label: "Tùy chọn",          href: "/admin/options",        icon: SlidersHorizontal,available: true  },
  { label: "Yêu cầu báo giá",  href: "/admin/quote-requests", icon: FileText,         available: true  },
  { label: "Quy tắc giá",       href: "/admin/pricing-rules",  icon: CircleDollarSign, available: true  },
  { label: "Nội dung",          href: "/admin/content",        icon: Newspaper,        available: true  },
  { label: "Thư viện Media",    href: "/admin/media",          icon: ImageIcon,        available: true  },
  { label: "Design Files",      href: "/admin/design-files",   icon: Palette,          available: false },
  { label: "Users",             href: "/admin/users",          icon: Users,            available: false },
];

interface AdminSidebarProps {
  onLogout: () => void;
}

export { NAV_ITEMS };

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed top-0 bottom-0 left-0 z-[100] flex w-[220px] flex-col overflow-y-auto border-r"
      style={{ background: "var(--admin-sidebar-bg)", borderColor: "var(--admin-sidebar-border)" }}
    >
      {/* Brand -- fan-rib motif radiates from the top-right corner, an architectural nod to the fan identity rather than a literal icon */}
      <div
        className="admin-fan-motif admin-fan-motif-dark border-b px-5 py-4"
        style={{ borderColor: "var(--admin-sidebar-border)" }}
      >
        <Link href="/admin" className="admin-focus-ring-dark group flex flex-col leading-tight">
          <span className="font-serif text-[18px] font-semibold tracking-wide text-white">
            Nan
          </span>
          <span
            className="font-mono text-[7.5px] uppercase tracking-[0.26em] transition-colors"
            style={{ color: "var(--admin-sidebar-accent)" }}
          >
            Admin Console
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2.5 py-4" aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const active = item.available && isActive(item.href);
          const Icon = item.icon;

          if (!item.available) {
            return (
              <div
                key={item.href}
                className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5"
                aria-disabled="true"
              >
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--admin-sidebar-text-disabled)" }} />
                <span className="flex-1 text-[12.5px]" style={{ color: "var(--admin-sidebar-text-disabled)" }}>{item.label}</span>
                <span
                  className="flex-shrink-0 font-mono text-[8px] uppercase tracking-[0.10em]"
                  style={{ color: "var(--admin-sidebar-text-disabled)" }}
                >
                  Sắp ra mắt
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="admin-focus-ring-dark flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 hover:text-white"
              style={{
                background: active ? "var(--admin-sidebar-active-bg)" : "transparent",
                color: active ? "#FFFFFF" : "var(--admin-sidebar-text)",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--admin-sidebar-hover)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon
                className="h-4 w-4 flex-shrink-0 transition-colors"
                style={{ color: active ? "var(--admin-sidebar-accent)" : "var(--admin-sidebar-text-dim)" }}
              />
              <span className="flex-1 text-[12.5px] font-medium">{item.label}</span>
              {active && (
                <div
                  className="h-3.5 w-[3px] flex-shrink-0 rounded-full"
                  style={{ background: "var(--admin-sidebar-accent)" }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: return to public site + logout */}
      <div className="border-t px-2.5 py-3 space-y-0.5" style={{ borderColor: "var(--admin-sidebar-border)" }}>
        <Link
          href="/"
          className="admin-focus-ring-dark flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 hover:text-white"
          style={{ color: "var(--admin-sidebar-text)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-sidebar-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="text-[12.5px]">Về trang chủ</span>
        </Link>
        <button
          onClick={onLogout}
          className="admin-focus-ring-dark flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 hover:text-white"
          style={{ color: "var(--admin-sidebar-text)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-sidebar-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="text-[12.5px]">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
