"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronDown, Menu, Search, Tag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { announcementBar } from "@/data/homepageData";
import { useAuth } from "@/contexts/AuthContext";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import type { Product, ProductCategory } from "@/types/catalog";

/** Lowercases and strips diacritics so Vietnamese search matches with or without accents. */
const DIACRITIC_MARKS_RE = /[̀-ͯ]/g;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITIC_MARKS_RE, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

/** True for Manager or Staff — case-insensitive. */
function isAdminUser(roles?: string[]): boolean {
  if (!roles) return false;
  return roles.some((r) => ["manager", "staff"].includes(r.toLowerCase()));
}

const ROLE_LABELS: Record<string, string> = { manager: "System Manager", staff: "Staff" };

/** Human-readable label for the first recognized role, if any. */
function primaryRoleLabel(roles?: string[]): string | null {
  const match = roles?.find((r) => ROLE_LABELS[r.toLowerCase()]);
  return match ? ROLE_LABELS[match.toLowerCase()] : null;
}

/** Closes an open flyout (dropdown/panel) on outside click or Escape. */
function useDismissablePanel(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ref]);
}

const SUGGESTED_SEARCHES = ["Quạt sự kiện", "Quạt thủ công", "Quạt quà tặng", "Quạt thương hiệu"];

/**
 * Suggestions, loading/error/empty states, or matched categories (max 4) and
 * products (max 5) grouped into labeled sections -- shared by the desktop
 * panel and the mobile inline search.
 */
function SearchResultsPanel({
  query,
  loading,
  error,
  categories,
  products,
  onSuggestionClick,
  onSelectResult,
}: {
  query: string;
  loading: boolean;
  error: string | null;
  categories: ProductCategory[];
  products: Product[];
  onSuggestionClick: (value: string) => void;
  onSelectResult: () => void;
}) {
  if (query === "") {
    return (
      <div>
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
          Gợi ý tìm kiếm
        </p>
        <div className="flex flex-wrap gap-2 px-1">
          {SUGGESTED_SEARCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="rounded-full border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="px-1 py-6 text-center text-sm text-white/50">Đang tìm kiếm...</p>;
  }

  if (error) {
    return <p className="px-1 py-6 text-center text-sm text-white/50">{error}</p>;
  }

  if (categories.length === 0 && products.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-white/50">
        Không tìm thấy sản phẩm hoặc danh mục phù hợp.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 0 && (
        <div>
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
            Danh mục
          </p>
          <ul className="flex flex-col gap-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/products?categoryId=${c.id}`}
                  onClick={onSelectResult}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.06]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06]">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Tag size={15} className="text-white/30" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{c.name}</span>
                    {c.description && (
                      <span className="block truncate text-xs text-white/45">{c.description}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {products.length > 0 && (
        <div>
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
            Sản phẩm
          </p>
          <ul className="flex flex-col gap-1">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  onClick={onSelectResult}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.06]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06]">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-sm text-white/25">Nan</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                    <span className="block truncate text-xs text-white/45">
                      {p.categoryName || p.description || ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Nav content ────────────────────────────────────────────────────────────
// Public-facing pill nav. Hash targets point at existing homepage sections
// (id="about" on BrandStatementSection, id="applications" on UseCaseSection,
// id="quote" on FinalCTASection) rather than pages that don't exist yet.

const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Ứng dụng", href: "/#applications" },
  { label: "Về Nan", href: "/#about" },
  { label: "Liên hệ", href: "/#quote" },
] as const;

const QUOTE_HREF = "/#quote";

/** Route-based active state. Hash-anchor items only ever highlight on hover
 * (see spec: "hash links can highlight on hover only if active detection is
 * not simple") since there's no reliable way to know which section is in
 * view without a scroll-spy observer, which is out of scope here. */
function isRouteActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/products") return pathname === "/products" || pathname.startsWith("/products/");
  return false;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productPool, setProductPool] = useState<Product[] | null>(null);
  const [categoryPool, setCategoryPool] = useState<ProductCategory[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFetchingRef = useRef(false);

  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    setAccountOpen(false);
    logout();
    setMobileOpen(false);
    router.push("/");
  }

  const displayName = user?.fullName ?? user?.email?.split("@")[0] ?? "";
  const admin = isAdminUser(user?.roles);
  const roleLabel = admin ? primaryRoleLabel(user?.roles) : null;

  function openAccount() {
    setAccountOpen((v) => !v);
    setSearchOpen(false);
  }

  function openSearch() {
    setSearchOpen((v) => !v);
    setAccountOpen(false);
  }

  useDismissablePanel(accountOpen, accountRef, () => setAccountOpen(false));
  useDismissablePanel(searchOpen, searchWrapRef, () => setSearchOpen(false));

  // Load the searchable product + category pool once, the first time search
  // is opened from either the desktop panel or the mobile menu.
  //
  // searchLoading is intentionally NOT a dependency here: setting it inside
  // this effect used to also list it as a dependency, so the state update
  // re-ran the effect, whose cleanup flipped `cancelled` to true on the
  // in-flight request before it resolved -- orphaning setSearchLoading(false)
  // and leaving the panel stuck on "Đang tìm kiếm..." forever. searchFetchingRef
  // (a ref, not state) now guards against starting a second fetch instead.
  useEffect(() => {
    if (!searchOpen && !mobileOpen) return;
    if (productPool !== null || searchFetchingRef.current) return;
    searchFetchingRef.current = true;
    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    Promise.all([
      getProducts({ pageSize: 100, activeOnly: true }),
      getCategories({ pageSize: 50, activeOnly: true }),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (cancelled) return;
        setProductPool(productsRes.items);
        setCategoryPool(categoriesRes.items);
      })
      .catch((err) => {
        if (cancelled) return;
        if (process.env.NODE_ENV !== "production") {
          console.warn("Navbar search: failed to load products/categories", err);
        }
        setSearchError("Không thể tải dữ liệu tìm kiếm. Vui lòng thử lại.");
      })
      .finally(() => {
        searchFetchingRef.current = false;
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchOpen, mobileOpen, productPool]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const trimmedQuery = searchQuery.trim();
  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const matchedCategories = normalizedQuery && categoryPool
    ? categoryPool
        .filter((c) => normalizeSearchText(`${c.name} ${c.description ?? ""}`).includes(normalizedQuery))
        .slice(0, 4)
    : [];
  const matchedProducts = normalizedQuery && productPool
    ? productPool
        .filter((p) =>
          normalizeSearchText(`${p.name} ${p.description ?? ""} ${p.categoryName ?? ""}`).includes(normalizedQuery),
        )
        .slice(0, 5)
    : [];

  return (
    <header className="fixed left-0 top-0 z-[999] w-full">
      {/* ── Announcement bar ── */}
      {announcementBar.visible && (
        <div className="flex items-center justify-center bg-[#020724] px-4 py-[7px]">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#FFD014]/55" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
              {announcementBar.text}
            </span>
            <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#FFD014]/55" />
          </div>
        </div>
      )}

      {/* ── Main nav bar ── */}
      <div
        className="border-b border-white/10 backdrop-blur-xl"
        style={{
          background: "rgba(6,16,71,0.96)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -20px rgba(2,7,36,0.65)",
        }}
      >
        <div className="mx-auto grid h-[68px] max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6">
          {/* Left: wordmark */}
          <Link href="/" className="flex shrink-0 items-center gap-3 justify-self-start">
            <span className="font-serif text-[26px] font-semibold leading-none tracking-tight text-white">
              Nan
            </span>
            <span aria-hidden="true" className="hidden h-6 w-px bg-white/15 sm:block" />
            <span className="hidden font-mono text-[9px] font-medium uppercase leading-[1.4] tracking-[0.26em] text-white/50 sm:block">
              Custom
              <br />
              Fan Design
            </span>
          </Link>

          {/* Center: sliding pill nav */}
          <nav
            onMouseLeave={() => setHovered(null)}
            className="hidden items-center gap-0.5 justify-self-center rounded-full border border-white/[0.14] bg-white/[0.06] p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(item.href, pathname);
              const isHovered = hovered === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHovered(item.href)}
                  className="relative rounded-full px-4 py-[7px] text-[13px] font-medium tracking-tight transition-colors duration-200"
                  style={{ color: active ? "#02167F" : isHovered ? "#FFFFFF" : "rgba(255,255,255,0.72)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 rounded-full bg-[#FAF8F0]"
                      style={{ boxShadow: "0 2px 10px rgba(2,7,36,0.35)" }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  {!active && isHovered && (
                    <span className="absolute inset-0 rounded-full bg-white/10" />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: icon actions + CTA */}
          <div className="flex items-center justify-self-end gap-2.5">
            <div className="hidden items-center gap-2 md:flex">
              {/* Search */}
              <div ref={searchWrapRef} className="relative">
                <button
                  onClick={openSearch}
                  aria-label="Tìm sản phẩm"
                  title="Tìm sản phẩm"
                  aria-expanded={searchOpen}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                >
                  <Search size={16} />
                </button>

                {searchOpen && (
                  <motion.div
                    role="search"
                    aria-label="Tìm kiếm sản phẩm"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-[calc(100%+10px)] z-20 w-[380px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#020724] p-4"
                    style={{ boxShadow: "0 24px 48px -16px rgba(2,7,36,0.7)" }}
                  >
                    <h2 className="text-sm font-semibold text-white">Tìm kiếm sản phẩm</h2>
                    <div className="relative mt-3">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                      />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm quạt, danh mục, ứng dụng..."
                        className="w-full rounded-full border border-white/[0.14] bg-white/[0.05] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/30"
                      />
                    </div>
                    <div className="nan-scrollbar mt-4 max-h-[420px] overflow-y-auto">
                      <SearchResultsPanel
                        query={trimmedQuery}
                        loading={searchLoading}
                        error={searchError}
                        categories={matchedCategories}
                        products={matchedProducts}
                        onSuggestionClick={(s) => setSearchQuery(s)}
                        onSelectResult={() => setSearchOpen(false)}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Account */}
              {!isLoading && (
                <div ref={accountRef} className="relative">
                  {isAuthenticated ? (
                    <button
                      onClick={openAccount}
                      aria-expanded={accountOpen}
                      aria-haspopup="menu"
                      aria-controls="navbar-account-menu"
                      aria-label="Tài khoản"
                      className="flex h-9 items-center gap-1 rounded-full border border-white/[0.14] bg-white/[0.04] pl-1 pr-2 text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white">
                        {(displayName || "?").charAt(0).toUpperCase()}
                      </span>
                      <ChevronDown
                        size={13}
                        className={`text-white/50 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={openAccount}
                      aria-expanded={accountOpen}
                      aria-haspopup="menu"
                      aria-controls="navbar-account-menu"
                      aria-label="Tài khoản"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                    >
                      <User size={16} />
                    </button>
                  )}

                  {accountOpen && (
                    <motion.div
                      id="navbar-account-menu"
                      role="menu"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-[calc(100%+10px)] z-20 w-60 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#020724] p-1.5"
                      style={{ boxShadow: "0 24px 48px -16px rgba(2,7,36,0.7)" }}
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-3 pb-2 pt-1.5">
                            <p className="truncate text-sm font-medium text-white">{displayName || user?.email}</p>
                            {roleLabel && (
                              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
                                {roleLabel}
                              </p>
                            )}
                          </div>
                          <div className="mx-1 h-px bg-white/10" />
                          {admin && (
                            <Link
                              href="/admin"
                              role="menuitem"
                              onClick={() => setAccountOpen(false)}
                              className="mt-1 block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                            >
                              Dashboard
                            </Link>
                          )}
                          <button
                            role="menuitem"
                            onClick={handleLogout}
                            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            Đăng xuất
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/auth/login"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                            className="block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            Đăng nhập
                          </Link>
                          <Link
                            href="/auth/register"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                            className="block rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            Đăng ký
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <Link
              href={QUOTE_HREF}
              className="hidden items-center justify-center rounded-full bg-[#FFD014] px-5 py-2 text-[13px] font-semibold text-[#061047] transition-all duration-200 hover:-translate-y-px hover:bg-[#F2C500] active:translate-y-0 active:scale-[0.98] sm:inline-flex"
              style={{ boxShadow: "0 1px 2px rgba(2,7,36,0.30), 0 10px 26px -10px rgba(255,208,20,0.45)" }}
            >
              Yêu cầu báo giá
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/40 hover:bg-white/10 md:hidden"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10 bg-[#061047] md:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-5">
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#FAF8F0] text-[#02167F]"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile search -- inline, shares state with the desktop panel */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
                  Tìm sản phẩm
                </p>
                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm quạt, danh mục, ứng dụng..."
                    className="w-full rounded-full border border-white/[0.14] bg-white/[0.05] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/30"
                  />
                </div>
                {trimmedQuery !== "" && (
                  <div className="nan-scrollbar mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/[0.10] bg-white/[0.03] p-1.5">
                    <SearchResultsPanel
                      query={trimmedQuery}
                      loading={searchLoading}
                      error={searchError}
                      categories={matchedCategories}
                      products={matchedProducts}
                      onSuggestionClick={(s) => setSearchQuery(s)}
                      onSelectResult={() => {
                        setSearchQuery("");
                        setMobileOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <Link
                href={QUOTE_HREF}
                onClick={() => setMobileOpen(false)}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-[#FFD014] px-5 py-3 text-sm font-semibold text-[#061047] active:scale-[0.98]"
                style={{ boxShadow: "0 1px 2px rgba(2,7,36,0.30), 0 10px 26px -10px rgba(255,208,20,0.45)" }}
              >
                Yêu cầu báo giá
              </Link>

              {/* Mobile account section -- grouped, not a crowded single row */}
              {!isLoading && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="px-1 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
                    Tài khoản
                  </p>
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="px-1 pb-1">
                        <p className="truncate text-sm font-medium text-white/90">{displayName || user?.email}</p>
                        {roleLabel && <p className="mt-0.5 text-[11px] text-white/40">{roleLabel}</p>}
                      </div>
                      {admin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-xl px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="rounded-xl px-3 py-2 text-left text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-full border border-white/[0.14] bg-white/[0.06] px-4 py-2.5 text-center text-white/[0.76] transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-full border border-white/[0.14] bg-white/[0.06] px-4 py-2.5 text-center text-white/[0.76] transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .nan-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }
        .nan-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .nan-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .nan-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
        }
        .nan-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.28);
        }
      `}</style>
    </header>
  );
}
