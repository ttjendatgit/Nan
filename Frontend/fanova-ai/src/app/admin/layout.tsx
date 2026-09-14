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
    return <div className="min-h-[100dvh]" style={{ background: "var(--admin-canvas)" }} aria-hidden="true" />;
  }

  // No session — render children bare so each admin page shows its own login form
  if (!token) {
    return (
      <div className="min-h-[100dvh]" style={{ background: "var(--admin-canvas)" }}>
        {children}
      </div>
    );
  }

  // Authenticated — full admin shell
  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--admin-canvas)", color: "var(--admin-text)" }}>
      {/* Desktop sidebar (lg+) */}
      <div className="hidden lg:block">
        <AdminSidebar onLogout={handleLogout} />
      </div>

      {/* Mobile top bar (< lg) — stays dark to match sidebar brand */}
      <header
        className="sticky top-0 z-[99] flex items-center justify-between border-b px-4 py-3 lg:hidden"
        style={{ background: "var(--admin-sidebar-bg)", borderColor: "var(--admin-sidebar-border)" }}
      >
        <Link href="/admin" className="admin-focus-ring-dark flex flex-col leading-tight">
          <span className="font-serif text-[16px] font-semibold tracking-wide text-white">Nan</span>
          <span className="font-mono text-[7px] uppercase tracking-[0.24em]" style={{ color: "var(--admin-sidebar-accent)" }}>Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={mobileOpen}
          className="admin-focus-ring-dark flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--admin-sidebar-text-dim)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--admin-sidebar-hover)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--admin-sidebar-text-dim)"; }}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile nav overlay — dark, matching sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[98] lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-[52px] left-0 right-0 border-b px-3 py-3"
            style={{ background: "var(--admin-sidebar-bg)", borderColor: "var(--admin-sidebar-border)" }}
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
            className="admin-focus-ring-dark flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all"
            style={{
              background: active ? "var(--admin-sidebar-active-bg)" : "transparent",
              color: active ? "#FFFFFF" : "var(--admin-sidebar-text)",
            }}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-[13px] font-medium">{item.label}</span>
          </Link>
        );
      })}
      <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--admin-sidebar-border)" }}>
        <button
          onClick={onLogout}
          className="admin-focus-ring-dark flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
          style={{ color: "var(--admin-sidebar-text)" }}
        >
          <span className="text-[13px]">Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
}
