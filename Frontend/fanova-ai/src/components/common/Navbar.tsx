"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { announcementBar, navConfig } from "@/data/homepageData";
import { useAuth } from "@/contexts/AuthContext";
import { getCategories } from "@/lib/api/categories";
import type { ProductCategory } from "@/types/catalog";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    setMobileOpen(false);
    router.push("/");
  }

  const displayName = user?.fullName ?? user?.email?.split("@")[0] ?? "";

  useEffect(() => {
    getCategories({ pageSize: 20, activeOnly: true })
      .then((res) => setCategories(res.items))
      .catch(() => setCategories([]));
  }, []);

  return (
    <header className="fixed left-0 top-0 z-[999] w-full">
      {/* ── Announcement bar ── */}
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
          {/* Left: nav links */}
          <nav className="hidden flex-1 items-center gap-7 md:flex">
            {navConfig.links.map((link) =>
              link.label === "Collections" ? (
                <CollectionsDesktopItem key={link.label} categories={categories} />
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(8,20,38,0.45)] transition-colors duration-200 hover:text-[#08337D]"
                >
                  {link.label}
                </a>
              )
            )}
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
              {navConfig.links.map((link) =>
                link.label === "Collections" ? (
                  <CollectionsMobileItem
                    key={link.label}
                    categories={categories}
                    onClose={() => setMobileOpen(false)}
                  />
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(8,20,38,0.48)] transition hover:text-[#08337D]"
                  >
                    {link.label}
                  </a>
                )
              )}

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

// ─── Collections Desktop Dropdown ─────────────────────────────────────────────

function CollectionsDesktopItem({ categories }: { categories: ProductCategory[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href="/products"
        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(8,20,38,0.45)] transition-colors duration-200 hover:text-[#08337D]"
      >
        Collections
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </a>

      {open && (
        <div className="absolute left-0 top-full z-[100] pt-3">
          <div
            className="w-64 overflow-hidden rounded-xl border border-[#1B1C4A] bg-[#0D131F] py-2"
            style={{
              boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(27,28,74,0.35)",
            }}
          >
            {categories.length === 0 ? (
              <div className="px-4 py-3">
                <Link
                  href="/products"
                  className="text-xs text-[#B6D6F2]/50 hover:text-white transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Xem tất cả sản phẩm
                </Link>
              </div>
            ) : (
              <>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?categoryId=${cat.id}`}
                    onClick={() => setOpen(false)}
                    className="group flex flex-col px-4 py-2.5 transition-colors hover:bg-[#1B1C4A]"
                  >
                    <span className="text-[11px] font-medium text-[#B6D6F2] transition-colors group-hover:text-white">
                      {cat.name}
                    </span>
                    {cat.description && (
                      <span className="mt-0.5 line-clamp-1 text-[10px] text-[#B6D6F2]/35 transition-colors group-hover:text-[#B6D6F2]/55">
                        {cat.description}
                      </span>
                    )}
                  </Link>
                ))}
                <div className="mx-4 my-1.5 h-px bg-[#1B1C4A]" />
                <Link
                  href="/products"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#B6D6F2]/40 transition-colors hover:text-[#B6D6F2]"
                >
                  Tất cả dòng quạt
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Collections Mobile Item ──────────────────────────────────────────────────

function CollectionsMobileItem({
  categories,
  onClose,
}: {
  categories: ProductCategory[];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <a
          href="/products"
          onClick={onClose}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(8,20,38,0.48)] transition hover:text-[#08337D]"
        >
          Collections
        </a>
        {categories.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle categories"
            className="p-1 text-[rgba(8,20,38,0.35)] transition-colors hover:text-[#08337D]"
          >
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {expanded && categories.length > 0 && (
        <div className="ml-2 mt-2.5 flex flex-col gap-0.5 border-l border-[rgba(8,51,125,0.12)] pl-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              onClick={onClose}
              className="py-1.5 text-[10px] font-medium text-[rgba(8,20,38,0.55)] transition-colors hover:text-[#08337D]"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
