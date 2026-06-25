"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import AdminSidebar, { NAV_ITEMS } from "@/components/admin/AdminSidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setToken(sessionStorage.getItem("nan_admin_token"));
    setMounted(true);

    function onAuthChange() {
      setToken(sessionStorage.getItem("nan_admin_token"));
    }
    window.addEventListener("nan-admin-auth-change", onAuthChange);
    return () => window.removeEventListener("nan-admin-auth-change", onAuthChange);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    sessionStorage.removeItem("nan_admin_token");
    // Also clear the public auth tokens so the Navbar reflects the logged-out state.
    localStorage.removeItem("nan_access_token");
    localStorage.removeItem("nan_refresh_token");
    setToken(null);
    window.location.replace("/");
  }

  // Avoid hydration flash — render nothing until mounted
  if (!mounted) {
    return <div className="min-h-[100dvh] bg-[#080C15]" aria-hidden="true" />;
  }

  // No session — render children bare so each admin page shows its own login form
  if (!token) {
    return (
      <div className="min-h-[100dvh] bg-[#0D131F]">
        {children}
      </div>
    );
  }

  // Authenticated — full admin shell
  return (
    <div className="min-h-[100dvh] bg-[#0D131F] text-white">
      {/* Desktop sidebar (lg+) */}
      <div className="hidden lg:block">
        <AdminSidebar onLogout={handleLogout} />
      </div>

      {/* Mobile top bar (< lg) */}
      <header className="sticky top-0 z-[99] flex items-center justify-between border-b border-[#1B1C4A] bg-[#080C15] px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex flex-col leading-tight">
          <span className="font-serif text-[16px] font-semibold tracking-wide text-white">Nan</span>
          <span className="font-mono text-[7px] uppercase tracking-[0.24em] text-[#273481]">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="rounded-lg p-1.5 text-[#B6D6F2]/50 transition-colors hover:bg-[#1B1C4A] hover:text-white"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[98] lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-[52px] left-0 right-0 border-b border-[#1B1C4A] bg-[#080C15] px-3 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <MobileNav currentPath={pathname} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content — offset left by sidebar width on desktop */}
      <main className="min-h-[100dvh] lg:pl-[220px]">
        {children}
      </main>
    </div>
  );
}

// ─── Mobile nav ───────────────────────────────────────────────────────────────

function MobileNav({
  currentPath,
  onLogout,
}: {
  currentPath: string;
  onLogout: () => void;
}) {
  function isActive(href: string) {
    if (href === "/admin") return currentPath === "/admin";
    return currentPath.startsWith(href);
  }

  return (
    <nav className="space-y-0.5" aria-label="Mobile admin navigation">
      {NAV_ITEMS.filter((item) => item.available).map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
              active
                ? "bg-[#273481]/22 text-white"
                : "text-[#B6D6F2]/55 hover:bg-[#1B1C4A] hover:text-[#B6D6F2]"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-[13px] font-medium">{item.label}</span>
          </Link>
        );
      })}
      <div className="mt-2 border-t border-[#1B1C4A] pt-2">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[#B6D6F2]/40 transition-colors hover:bg-[#1B1C4A] hover:text-[#B6D6F2]"
        >
          <span className="text-[13px]">Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}
