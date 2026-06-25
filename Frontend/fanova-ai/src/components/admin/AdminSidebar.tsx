"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  FileText,
  CircleDollarSign,
  Palette,
  Users,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tổng quan",          href: "/admin",                icon: LayoutDashboard,  available: true  },
  { label: "Sản phẩm",           href: "/admin/products",       icon: Package,          available: true  },
  { label: "Danh mục",           href: "/admin/categories",     icon: FolderOpen,       available: true  },
  { label: "Yêu cầu báo giá",   href: "/admin/quote-requests", icon: FileText,         available: false },
  { label: "Pricing Rules",      href: "/admin/pricing-rules",  icon: CircleDollarSign, available: false },
  { label: "Design Files",       href: "/admin/design-files",   icon: Palette,          available: false },
  { label: "Users",              href: "/admin/users",          icon: Users,            available: false },
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
    <aside className="fixed top-0 bottom-0 left-0 z-[100] flex w-[220px] flex-col overflow-y-auto border-r border-[#1B1C4A] bg-[#080C15]">
      {/* Brand */}
      <div className="border-b border-[#1B1C4A] px-5 py-4">
        <Link href="/admin" className="group flex flex-col leading-tight">
          <span className="font-serif text-[18px] font-semibold tracking-wide text-white">
            Nan
          </span>
          <span className="font-mono text-[7.5px] uppercase tracking-[0.26em] text-[#273481] transition-colors group-hover:text-[#B6D6F2]/50">
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
                className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 opacity-30"
                aria-disabled="true"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-[#B6D6F2]" />
                <span className="flex-1 text-[12.5px] text-[#B6D6F2]">{item.label}</span>
                <span className="flex-shrink-0 font-mono text-[8.5px] uppercase tracking-[0.10em] text-[#B6D6F2]">
                  Sắp ra mắt
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${
                active
                  ? "bg-[#273481]/22 text-white"
                  : "text-[#B6D6F2]/55 hover:bg-[#1B1C4A] hover:text-[#B6D6F2]"
              }`}
            >
              <Icon
                className={`h-4 w-4 flex-shrink-0 transition-colors ${
                  active ? "text-[#B6D6F2]" : "text-[#B6D6F2]/45"
                }`}
              />
              <span className="flex-1 text-[12.5px] font-medium">{item.label}</span>
              {active && (
                <div className="h-3.5 w-[3px] flex-shrink-0 rounded-full bg-[#273481]" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-[#1B1C4A] px-2.5 py-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[#B6D6F2]/40 transition-all duration-150 hover:bg-[#1B1C4A] hover:text-[#B6D6F2]"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="text-[12.5px]">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
