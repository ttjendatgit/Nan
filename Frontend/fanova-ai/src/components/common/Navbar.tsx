"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, ChevronDown, Menu, Search, Tag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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

/** Closes on Escape only -- used for the full-panel mobile menu, which has no "outside" to click. */
function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
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
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
          Gợi ý tìm kiếm
        </p>
        <div className="flex flex-wrap gap-2 px-1">
          {SUGGESTED_SEARCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="rounded-full border border-white/[0.12] px-3 py-1.5 text-xs text-[#A9ABA5] transition hover:border-[#B6A17B]/50 hover:text-[#F1F0EA]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="px-1 py-6 text-center text-sm text-[#A9ABA5]">Đang tìm kiếm...</p>;
  }

  if (error) {
    return <p className="px-1 py-6 text-center text-sm text-[#A9ABA5]">{error}</p>;
  }

  if (categories.length === 0 && products.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-[#A9ABA5]">
        Không tìm thấy sản phẩm hoặc danh mục phù hợp.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 0 && (
        <div>
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
            Danh mục
          </p>
          <ul className="flex flex-col gap-1">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/products?categoryId=${c.id}`}
                  onClick={onSelectResult}
                  className="flex items-center gap-3 rounded-md p-2 transition hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-white/[0.05]">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Tag size={15} strokeWidth={1.5} className="text-[#A9ABA5]" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#F1F0EA]">{c.name}</span>
                    {c.description && (
                      <span className="block truncate text-xs text-[#A9ABA5]">{c.description}</span>
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
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
            Sản phẩm
          </p>
          <ul className="flex flex-col gap-1">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  onClick={onSelectResult}
                  className="flex items-center gap-3 rounded-md p-2 transition hover:bg-white/[0.05]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden bg-white/[0.05]">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-sm text-[#A9ABA5]">Nan</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#F1F0EA]">{p.name}</span>
                    <span className="block truncate text-xs text-[#A9ABA5]">
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
// Public-facing nav. Hash targets point at existing homepage sections
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

const mobilePanelVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
};

const mobileItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

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
  useEscapeToClose(mobileOpen, () => setMobileOpen(false));

  // Hero-integrated (transparent) near the top, stable dark surface once the
  // user scrolls -- a single threshold crossing, not continuous scroll-position
  // tracking, so this stays cheap and only re-renders when the boolean flips.
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        <div
          className="flex items-center justify-center px-4 py-[7px] transition-[background-color] duration-300"
          style={{ background: scrolled ? "var(--nan-dark)" : "rgba(15,19,32,0.35)" }}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#B6A17B]/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#F1F0EA]/45">
              {announcementBar.text}
            </span>
            <span aria-hidden="true" className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#B6A17B]/60" />
          </div>
        </div>
      )}

      {/* ── Main nav bar: transparent over the Hero, stable ink surface once scrolled ── */}
      <div
        className="border-b transition-[background-color,border-color,backdrop-filter] duration-300"
        style={{
          background: scrolled ? "rgba(15,19,32,0.94)" : "transparent",
          borderColor: scrolled ? "rgba(241,240,234,0.10)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        }}
      >
        <div className="mx-auto grid h-[84px] max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6 lg:px-10">
          {/* Left: wordmark -- generous breathing room, no badge/card */}
          <Link href="/" className="flex shrink-0 items-center gap-3 justify-self-start">
            <span className="font-serif text-[24px] font-medium leading-none tracking-tight text-[#F1F0EA]">
              Nan
            </span>
            <span aria-hidden="true" className="hidden h-5 w-px bg-white/15 sm:block" />
            <span className="hidden font-mono text-[9px] font-medium uppercase leading-[1.4] tracking-[0.26em] text-[#A9ABA5] sm:block">
              Custom
              <br />
              Fan Design
            </span>
          </Link>

          {/* Center: editorial nav -- plain links, thin underline indicator, no pill container */}
          <nav
            onMouseLeave={() => setHovered(null)}
            className="hidden items-center gap-9 justify-self-center md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(item.href, pathname);
              const highlighted = hovered ? hovered === item.href : active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHovered(item.href)}
                  className="relative py-2 text-[13px] font-medium transition-colors duration-300"
                  style={{ color: highlighted ? "#F1F0EA" : "rgba(241,240,234,0.55)" }}
                >
                  {item.label}
                  {highlighted && (
                    <motion.span
                      layoutId="navbar-active-underline"
                      className="absolute -bottom-0.5 left-0 right-0 h-px"
                      style={{ background: "#F1F0EA" }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: icon actions + editorial CTA */}
          <div className="flex items-center justify-self-end gap-5">
            <div className="hidden items-center gap-4 md:flex">
              {/* Search */}
              <div ref={searchWrapRef} className="relative">
                <button
                  onClick={openSearch}
                  aria-label="Tìm sản phẩm"
                  title="Tìm sản phẩm"
                  aria-expanded={searchOpen}
                  className="flex h-9 w-9 items-center justify-center text-[rgba(241,240,234,0.65)] transition-colors duration-300 hover:text-[#F1F0EA]"
                >
                  <Search size={17} strokeWidth={1.5} />
                </button>

                {searchOpen && (
                  <motion.div
                    role="search"
                    aria-label="Tìm kiếm sản phẩm"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-[calc(100%+14px)] z-20 w-[380px] border border-white/[0.10] p-4"
                    style={{ background: "var(--nan-dark)", boxShadow: "0 24px 48px -16px rgba(0,0,0,0.6)" }}
                  >
                    <h2 className="text-sm font-medium text-[#F1F0EA]">Tìm kiếm sản phẩm</h2>
                    <div className="relative mt-3">
                      <Search
                        size={15}
                        strokeWidth={1.5}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A9ABA5]"
                      />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm quạt, danh mục, ứng dụng..."
                        className="w-full border border-white/[0.12] bg-transparent py-2.5 pl-9 pr-3 text-sm text-[#F1F0EA] placeholder:text-[#A9ABA5]/70 outline-none transition focus:border-[#B6A17B]/50"
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
                      className="flex h-9 items-center gap-2 text-[rgba(241,240,234,0.65)] transition-colors duration-300 hover:text-[#F1F0EA]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-[11px] font-medium text-[#F1F0EA]">
                        {(displayName || "?").charAt(0).toUpperCase()}
                      </span>
                      <ChevronDown
                        size={13}
                        strokeWidth={1.5}
                        className={`transition-transform duration-300 ${accountOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={openAccount}
                      aria-expanded={accountOpen}
                      aria-haspopup="menu"
                      aria-controls="navbar-account-menu"
                      aria-label="Tài khoản"
                      className="flex h-9 w-9 items-center justify-center text-[rgba(241,240,234,0.65)] transition-colors duration-300 hover:text-[#F1F0EA]"
                    >
                      <User size={17} strokeWidth={1.5} />
                    </button>
                  )}

                  {accountOpen && (
                    <motion.div
                      id="navbar-account-menu"
                      role="menu"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-[calc(100%+14px)] z-20 w-60 border border-white/[0.10] p-1.5"
                      style={{ background: "var(--nan-dark)", boxShadow: "0 24px 48px -16px rgba(0,0,0,0.6)" }}
                    >
                      {isAuthenticated ? (
                        <>
                          <div className="px-3 pb-2 pt-1.5">
                            <p className="truncate text-sm font-medium text-[#F1F0EA]">
                              {displayName || user?.email}
                            </p>
                            {roleLabel && (
                              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
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
                              className="mt-1 block px-3 py-2 text-sm text-[#A9ABA5] transition hover:bg-white/[0.05] hover:text-[#F1F0EA]"
                            >
                              Dashboard
                            </Link>
                          )}
                          <button
                            role="menuitem"
                            onClick={handleLogout}
                            className="block w-full px-3 py-2 text-left text-sm text-[#A9ABA5] transition hover:bg-white/[0.05] hover:text-[#F1F0EA]"
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
                            className="block px-3 py-2 text-sm text-[#A9ABA5] transition hover:bg-white/[0.05] hover:text-[#F1F0EA]"
                          >
                            Đăng nhập
                          </Link>
                          <Link
                            href="/auth/register"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                            className="block px-3 py-2 text-sm text-[#A9ABA5] transition hover:bg-white/[0.05] hover:text-[#F1F0EA]"
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

            {/* Editorial CTA: text + arrow, thin underline -- not a filled pill */}
            <Link
              href={QUOTE_HREF}
              className="hidden items-center gap-1.5 border-b border-[#B6A17B]/40 pb-0.5 text-[13px] font-medium text-[#F1F0EA] transition-all duration-300 hover:gap-2.5 hover:border-[#B6A17B] sm:inline-flex"
            >
              Yêu cầu báo giá
              <ArrowUpRight size={14} strokeWidth={1.5} className="text-[#B6A17B]" />
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 items-center justify-center text-[#F1F0EA] transition hover:opacity-70 md:hidden"
            >
              {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu: full-panel below the bar, oversized labels, staggered reveal ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={reduceMotion ? undefined : mobilePanelVariants}
            initial={reduceMotion ? { opacity: 0 } : "hidden"}
            animate={reduceMotion ? { opacity: 1 } : "visible"}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            className="fixed inset-x-0 bottom-0 top-[84px] overflow-y-auto md:hidden"
            style={{ background: "var(--nan-dark)" }}
          >
            <nav className="flex flex-col gap-1 px-6 py-8">
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(item.href, pathname);
                return (
                  <motion.div key={item.href} variants={reduceMotion ? undefined : mobileItemVariants}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block py-3 font-serif text-[28px] font-medium leading-tight transition-colors ${
                        active ? "text-[#F1F0EA]" : "text-[#A9ABA5]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile search -- inline, shares state with the desktop panel */}
              <motion.div variants={reduceMotion ? undefined : mobileItemVariants} className="mt-6 border-t border-white/10 pt-6">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
                  Tìm sản phẩm
                </p>
                <div className="relative">
                  <Search
                    size={15}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A9ABA5]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm quạt, danh mục, ứng dụng..."
                    className="w-full border border-white/[0.12] bg-transparent py-2.5 pl-9 pr-3 text-sm text-[#F1F0EA] placeholder:text-[#A9ABA5]/70 outline-none transition focus:border-[#B6A17B]/50"
                  />
                </div>
                {trimmedQuery !== "" && (
                  <div className="nan-scrollbar mt-2 max-h-72 overflow-y-auto border border-white/[0.10] p-1.5">
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
              </motion.div>

              <motion.div variants={reduceMotion ? undefined : mobileItemVariants}>
                <Link
                  href={QUOTE_HREF}
                  onClick={() => setMobileOpen(false)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-[#B6A17B] py-3.5 text-sm font-medium text-[#F1F0EA] transition active:scale-[0.98]"
                >
                  Yêu cầu báo giá
                  <ArrowUpRight size={15} strokeWidth={1.5} className="text-[#B6A17B]" />
                </Link>
              </motion.div>

              {/* Mobile account section -- grouped, not a crowded single row */}
              {!isLoading && (
                <motion.div variants={reduceMotion ? undefined : mobileItemVariants} className="mt-6 border-t border-white/10 pt-6">
                  <p className="pb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
                    Tài khoản
                  </p>
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="pb-2">
                        <p className="truncate text-sm font-medium text-[#F1F0EA]">{displayName || user?.email}</p>
                        {roleLabel && <p className="mt-0.5 text-[11px] text-[#A9ABA5]">{roleLabel}</p>}
                      </div>
                      {admin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="py-2 text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="py-2 text-left text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6 text-sm">
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileOpen(false)}
                        className="text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setMobileOpen(false)}
                        className="text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .nan-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(241, 240, 234, 0.18) transparent;
        }
        .nan-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .nan-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .nan-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(241, 240, 234, 0.18);
          border-radius: 9999px;
        }
        .nan-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(241, 240, 234, 0.28);
        }
      `}</style>
    </header>
  );
}
