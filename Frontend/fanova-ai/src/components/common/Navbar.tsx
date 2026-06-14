"use client";

// CMS: announcementBar and navConfig are sourced from the central data file.
// Future: replace the static import with an API call in a server component or
// via React Query / SWR so admins can toggle the bar or edit links without
// a code deploy.

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { announcementBar, navConfig } from "@/data/homepageData";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    setMobileOpen(false);
    router.push("/");
  }

  // Display name: prefer fullName, fall back to email prefix
  const displayName = user?.fullName ?? user?.email?.split("@")[0] ?? "";

  return (
    <header className="fixed left-0 top-0 z-[999] w-full">
      {/* ── Announcement bar ── */}
      {/* CMS: toggle announcementBar.visible or edit .text via admin/settings */}
      {announcementBar.visible && (
        <div
          className="flex items-center justify-center px-4 py-2.5"
          style={{ background: "#081426", borderBottom: "1px solid rgba(220,234,247,0.08)" }}
        >
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#ECCA3E]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(220,234,247,0.65)]">
              {announcementBar.text}
            </span>
            <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#ECCA3E]" />
          </div>
        </div>
      )}

      {/* ── Main nav bar ── */}
      <div
        className="border-b border-[rgba(8,51,125,0.10)] bg-[#FAFAF8]/96 backdrop-blur-xl"
        style={{ boxShadow: "0 1px 0 rgba(8,51,125,0.06), 0 4px 20px rgba(8,20,38,0.04)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center px-6">
          {/* Left: nav links — CMS: edit navConfig.links via admin/settings */}
          <nav className="hidden flex-1 items-center gap-7 md:flex">
            {navConfig.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(8,20,38,0.45)] transition-colors duration-200 hover:text-[#08337D]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Center: brand */}
          <div className="flex flex-1 justify-start md:absolute md:left-1/2 md:flex-none md:-translate-x-1/2">
            <a href="/" className="flex flex-col items-center leading-tight">
              <span className="font-serif text-[21px] font-semibold tracking-wide text-[#081426]">
                Nan
              </span>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.32em] text-[#08337D]">
                Custom Fan Design
              </span>
            </a>
          </div>

          {/* Right: auth-aware CTA */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Desktop auth controls — render only after hydration to avoid flash */}
            {!isLoading && (
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[rgba(8,20,38,0.48)] max-w-[140px] truncate">
                      {displayName}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="px-4 py-2 text-[11px]"
                    >
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" className="px-4 py-2 text-[11px]">
                        Đăng nhập
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button className="px-5 py-2 text-[11px]">
                        Đăng ký
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(8,51,125,0.16)] text-[rgba(8,20,38,0.48)] transition hover:border-[#08337D] hover:text-[#08337D] md:hidden"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-[rgba(8,51,125,0.10)] bg-[#FAFAF8]/97 px-6 py-5 md:hidden">
            <nav className="flex flex-col gap-5">
              {navConfig.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(8,20,38,0.48)] transition hover:text-[#08337D]"
                >
                  {link.label}
                </a>
              ))}

              {/* Mobile auth controls */}
              {!isLoading && (
                isAuthenticated ? (
                  <div className="flex flex-col gap-3 pt-1 border-t border-[rgba(8,51,125,0.08)]">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[rgba(8,20,38,0.40)] pt-1">
                      {displayName}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full py-2.5 text-xs"
                    >
                      Đăng xuất
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pt-1 border-t border-[rgba(8,51,125,0.08)]">
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="mt-1 w-full py-2.5 text-xs">
                        Đăng nhập
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full py-2.5 text-xs">
                        Đăng ký
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
