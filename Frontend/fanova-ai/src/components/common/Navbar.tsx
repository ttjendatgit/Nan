"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight, ChevronDown, Menu, Search, Tag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ProductNavigatorMobile, ProductNavigatorPanel } from "@/components/common/ProductNavigator";
import QuoteRequestModal from "@/components/quote/QuoteRequestModal";
import { announcementBar } from "@/data/homepageData";
import { useAuth } from "@/contexts/AuthContext";
import { getProducts } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { EASE_NAN, INSTANT, PLEAT_FINE } from "@/lib/motionTokens";
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

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The full-panel mobile menu covers the page, so while it is open it behaves like a dialog over it:
 * body scroll is locked, focus moves to the first menu link, Tab / Shift+Tab stay inside the header
 * (bar + panel), and Escape closes it and returns focus to the menu button. Widening the viewport
 * past the md breakpoint (where the panel is hidden) closes it too, so the scroll lock never lingers.
 */
function useMobileMenu(
  open: boolean,
  close: () => void,
  headerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  buttonRef: RefObject<HTMLButtonElement | null>,
) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeRef.current();
        buttonRef.current?.focus({ preventScroll: true });
        return;
      }
      const header = headerRef.current;
      if (e.key !== "Tab" || !header) return;
      const items = [...header.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && header.contains(active);
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 768px)");
    function handleBreakpoint() {
      if (desktop.matches) closeRef.current();
    }
    document.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleBreakpoint);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleBreakpoint);
    };
  }, [open, headerRef, panelRef, buttonRef]);
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
// Public-facing nav. "Ứng dụng" and "Về Nan" open their own Content Studio pages (Page documents
// served by app/[slug]); "Liên hệ" navigates to the homepage's id="quote" contact section
// (FinalCTASection). The quote CTA is not a link: it opens the generic QuoteRequestModal.

const NAV_ITEMS = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Ứng dụng", href: "/ung-dung" },
  { label: "Về Nan", href: "/ve-nan" },
  { label: "Liên hệ", href: "/#quote" },
] as const;

/** Route-based active state; nested routes (/products/[id]) keep their group active. Hash-anchor
 * items are never active: knowing which section is in view would need a scroll-spy observer. */
function isRouteActive(href: string, pathname: string): boolean {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Mobile menu choreography: the panel settles (160ms), the links follow one fine pleat apart, then
// the divider, search and account, and the quote CTA last. Reduced motion: everything at once.
const MENU_PANEL = 0.16;
const MENU_CTA_STEP = NAV_ITEMS.length + 3;

function menuPanelVariants(reduce: boolean) {
  return {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: reduce ? INSTANT : { duration: MENU_PANEL, ease: EASE_NAN } },
  };
}

function menuItemVariants(reduce: boolean) {
  return {
    hidden: { opacity: 0, y: 8 },
    visible: (step: number) => ({
      opacity: 1,
      y: 0,
      transition: reduce ? INSTANT : { duration: 0.32, delay: MENU_PANEL * 0.5 + step * PLEAT_FINE, ease: EASE_NAN },
    }),
  };
}

function menuRuleVariants(reduce: boolean) {
  return {
    hidden: { scaleX: 0 },
    visible: (step: number) => ({
      scaleX: 1,
      transition: reduce ? INSTANT : { duration: 0.42, delay: MENU_PANEL * 0.5 + step * PLEAT_FINE, ease: EASE_NAN },
    }),
  };
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Generic quote inquiry (no productId), same modal as Process / FinalCTA.
  const [quoteOpen, setQuoteOpen] = useState(false);
  // R9E Product Navigator: "Sản phẩm" opens a catalogue index (desktop panel / mobile view)
  // instead of navigating straight to /products.
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsByKeyboard, setProductsByKeyboard] = useState(false);
  const [productsLine, setProductsLine] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"main" | "products">("main");
  const productsTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileProductsTriggerRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = Boolean(useReducedMotion());
  const panelVariants = menuPanelVariants(reduceMotion);
  const itemVariants = menuItemVariants(reduceMotion);
  const ruleVariants = menuRuleVariants(reduceMotion);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productPool, setProductPool] = useState<Product[] | null>(null);
  const [categoryPool, setCategoryPool] = useState<ProductCategory[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchFetchingRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

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
    setProductsOpen(false);
  }

  function openSearch() {
    setSearchOpen((v) => !v);
    setAccountOpen(false);
    setProductsOpen(false);
  }

  function toggleProducts(e: React.MouseEvent) {
    // detail 0 = activated from the keyboard (Enter / Space): move focus into the index.
    setProductsByKeyboard(e.detail === 0);
    // Read here (an event, not render): inside a line, the index opens on that line.
    setProductsLine(new URLSearchParams(window.location.search).get("categoryId"));
    setProductsOpen((v) => !v);
    setSearchOpen(false);
    setAccountOpen(false);
  }

  function closeProducts(returnFocus: boolean) {
    setProductsOpen(false);
    if (returnFocus) productsTriggerRef.current?.focus({ preventScroll: true });
  }

  function openMobileMenu() {
    setMobileView("main");
    setMobileOpen(true);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
    setMobileView("main");
  }

  function backToMobileMenu() {
    setMobileView("main");
    // After the main list re-renders, return focus to its "Sản phẩm" entry.
    requestAnimationFrame(() => mobileProductsTriggerRef.current?.focus({ preventScroll: true }));
  }

  function openQuoteFromMenu() {
    // The menu (and this button) unmounts; park focus on the menu button so the modal returns it
    // there on close.
    menuButtonRef.current?.focus({ preventScroll: true });
    setMobileOpen(false);
    setQuoteOpen(true);
  }

  useDismissablePanel(accountOpen, accountRef, () => setAccountOpen(false));
  useDismissablePanel(searchOpen, searchWrapRef, () => setSearchOpen(false));
  useMobileMenu(mobileOpen, closeMobileMenu, headerRef, mobilePanelRef, menuButtonRef);

  // Product Navigator (desktop): closes on a pointer down outside the header, on Escape (focus back
  // to the trigger), when focus leaves the header, and when the viewport drops below md.
  useEffect(() => {
    if (!productsOpen) return;
    const header = headerRef.current;
    function onPointerDown(e: PointerEvent) {
      if (header && !header.contains(e.target as Node)) setProductsOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProductsOpen(false);
        productsTriggerRef.current?.focus({ preventScroll: true });
      }
    }
    function onFocusIn(e: FocusEvent) {
      if (header && !header.contains(e.target as Node)) setProductsOpen(false);
    }
    const mobile = window.matchMedia("(max-width: 767px)");
    function onBreakpoint() {
      if (mobile.matches) setProductsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    mobile.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      mobile.removeEventListener("change", onBreakpoint);
    };
  }, [productsOpen]);

  // Hero-integrated (transparent) near the top, a settled ink surface with a bamboo hairline once
  // the user scrolls (or opens the mobile menu) -- a single threshold crossing, not continuous
  // scroll-position tracking, so this only re-renders when the boolean flips.
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Publishes the fixed header's real rendered height as --nav-height on <html>, so content that
  // has to clear it (HeroSection's mobile fan block) can use the actual value instead of a guess.
  // The height isn't a constant: the announcement bar's text wraps to two lines on narrow phones
  // (126px total at 375px wide vs 112.5px at 440px, measured).
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty("--nav-height", `${header.getBoundingClientRect().height}px`);
    });
    observer.observe(header);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--nav-height");
    };
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

  const solid = scrolled || mobileOpen || productsOpen;

  return (
    <>
    <header ref={headerRef} className="fixed left-0 top-0 z-[999] w-full">
      {/* ── Announcement bar (R10.2): a quiet line, no dots, no mono. Collapses once the page
          scrolls, so the reading-state header is a single 64px bar. ── */}
      {announcementBar.visible && (
        <div
          className="grid transition-[grid-template-rows,background-color] duration-(--dur-state) ease-(--ease-nan-ui) motion-reduce:transition-none"
          style={{
            gridTemplateRows: scrolled ? "0fr" : "1fr",
            background: solid ? "var(--nan-dark)" : "transparent",
          }}
          aria-hidden={scrolled || undefined}
        >
          <div className="min-h-0 overflow-hidden">
            <p className="px-4 pt-2.5 text-center text-[10px] uppercase leading-none tracking-[0.16em] text-[#F1F0EA]/45 max-[400px]:tracking-[0.08em]">
              {announcementBar.text}
            </p>
          </div>
        </div>
      )}

      {/* ── Main nav bar: transparent over the Hero; once scrolled it settles onto a solid ink
          surface with one bamboo hairline (no blur, no shadow, same height) ── */}
      <div
        className="border-b transition-[background-color,border-color] duration-(--dur-state) ease-(--ease-nan-ui) motion-reduce:transition-none"
        style={{
          background: solid ? "var(--nan-dark)" : "transparent",
          borderColor: solid ? "var(--color-line-on-indigo)" : "transparent",
        }}
      >
        {/* md (768-1023): a single justified row, so the three groups share the width instead of
            the centred grid squeezing the right group. lg+: logo | centred nav | actions. */}
        <div className="mx-auto flex h-16 max-w-[83rem] items-center justify-between gap-6 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* Left: wordmark -- generous breathing room, no badge/card. The tagline steps aside at md,
              where the nav needs its width. */}
          <Link
            href="/"
            className="flex h-11 shrink-0 items-center gap-3 justify-self-start focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-on-indigo"
          >
            <span className="font-serif text-[22px] font-medium leading-none tracking-tight text-[#F1F0EA]">
              Nan
            </span>
            <span aria-hidden="true" className="hidden h-5 w-px bg-white/15 sm:block md:hidden lg:block" />
            <span className="hidden whitespace-nowrap text-[9px] font-medium uppercase leading-[1.45] tracking-[0.2em] text-[#A9ABA5] sm:block md:hidden lg:block">
              Custom
              <br />
              Fan Design
            </span>
          </Link>

          {/* Center: editorial nav -- plain links, no pill. Active: full ink + a bamboo hairline drawn
              open from the left. Hover: the colour lifts and a quiet hairline reveals under the
              label; nothing moves or changes size. */}
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 justify-self-center md:flex lg:gap-8 xl:gap-9">
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(item.href, pathname);
              if (item.href === "/products") {
                // Disclosure, not a link: opens the Product Navigator. Still marked active (bamboo
                // rule) anywhere in /products; a small chevron turns when the index is open.
                return (
                  <button
                    key={item.href}
                    ref={productsTriggerRef}
                    type="button"
                    onClick={toggleProducts}
                    aria-expanded={productsOpen}
                    aria-controls="navbar-product-navigator"
                    className={`group flex h-11 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium transition-colors duration-(--dur-state) ease-(--ease-nan-ui) focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo motion-reduce:transition-none ${
                      active || productsOpen ? "text-[#F1F0EA]" : "text-[rgba(241,240,234,0.58)] hover:text-[#F1F0EA]"
                    }`}
                  >
                    <span className="relative py-1">
                      {item.label}
                      {active ? (
                        <span aria-hidden="true" className="nav-rule-open absolute inset-x-0 -bottom-px h-px bg-bamboo" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className={`absolute inset-x-0 -bottom-px h-px origin-left bg-[#F1F0EA]/35 transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) group-hover:scale-x-100 motion-reduce:transition-none ${productsOpen ? "scale-x-100" : "scale-x-0"}`}
                        />
                      )}
                    </span>
                    <ChevronDown
                      size={12}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={`text-bamboo transition-[rotate] duration-(--dur-state) ease-(--ease-nan-ui) motion-reduce:transition-none ${productsOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex h-11 items-center whitespace-nowrap text-[13px] font-medium transition-colors duration-(--dur-state) ease-(--ease-nan-ui) focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo motion-reduce:transition-none ${
                    active ? "text-[#F1F0EA]" : "text-[rgba(241,240,234,0.58)] hover:text-[#F1F0EA]"
                  }`}
                >
                  <span className="relative py-1">
                    {item.label}
                    {active ? (
                      <span aria-hidden="true" className="nav-rule-open absolute inset-x-0 -bottom-px h-px bg-bamboo" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-[#F1F0EA]/35 transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) group-hover:scale-x-100 motion-reduce:transition-none"
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right: icon actions + editorial CTA */}
          <div className="col-start-3 flex shrink-0 items-center justify-self-end gap-3 lg:gap-5">
            <div className="hidden items-center gap-1 md:flex">
              {/* Search */}
              <div ref={searchWrapRef} className="relative">
                <button
                  onClick={openSearch}
                  aria-label="Tìm sản phẩm"
                  title="Tìm sản phẩm"
                  aria-expanded={searchOpen}
                  aria-controls="navbar-search-panel"
                  className="flex h-11 w-11 items-center justify-center text-[rgba(241,240,234,0.65)] transition-colors duration-(--dur-state) hover:text-[#F1F0EA] focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-on-indigo"
                >
                  <Search size={17} strokeWidth={1.5} />
                </button>

                {searchOpen && (
                  <motion.div
                    id="navbar-search-panel"
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
                      className="flex h-11 items-center gap-2 px-1.5 text-[rgba(241,240,234,0.65)] transition-colors duration-(--dur-state) hover:text-[#F1F0EA] focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-on-indigo"
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
                      className="flex h-11 w-11 items-center justify-center text-[rgba(241,240,234,0.65)] transition-colors duration-(--dur-state) hover:text-[#F1F0EA] focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-on-indigo"
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

            {/* Editorial CTA: opens the generic quote modal (a button, not a link). A resting bamboo
                hairline under the label; on hover a full-strength hairline draws over it and the
                arrow steps 4px forward. The label itself never moves. 44px tall hit area. */}
            <button
              type="button"
              onClick={() => setQuoteOpen(true)}
              className="group hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap text-[13px] font-medium text-[#F1F0EA] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo sm:inline-flex"
            >
              <span className="relative py-1">
                Yêu cầu báo giá
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-bamboo/40" />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
                />
              </span>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                aria-hidden="true"
                className="text-bamboo transition-[translate] duration-(--dur-state) ease-(--ease-nan-ui) group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              />
            </button>

            {/* Mobile menu trigger */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => (mobileOpen ? closeMobileMenu() : openMobileMenu())}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
              aria-controls="navbar-mobile-menu"
              className="-mr-2 flex h-11 w-11 items-center justify-center text-[#F1F0EA] transition-opacity duration-(--dur-ui) hover:opacity-70 focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-on-indigo motion-reduce:transition-none md:hidden"
            >
              {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Product Navigator (md+): index panel under the bar, a quiet scrim over the page behind it
          (click it to close; no blur) ── */}
      <AnimatePresence>
        {productsOpen && (
          <motion.div
            key="products-scrim"
            aria-hidden="true"
            onClick={() => closeProducts(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? INSTANT : { duration: 0.18 }}
            className="absolute inset-x-0 top-full hidden h-[100dvh] bg-indigo-deep/70 md:block"
          />
        )}
        {productsOpen && (
          <ProductNavigatorPanel
            key="products-panel"
            id="navbar-product-navigator"
            onNavigate={() => closeProducts(false)}
            focusOnOpen={productsByKeyboard}
            initialLineId={productsLine}
            currentProductId={pathname.startsWith("/products/") ? pathname.split("/")[2] : null}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile menu: full panel under the real header height (--nav-height, published above),
          oversized serif labels, a short pleated reveal; the quote CTA arrives last ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobilePanelRef}
            id="navbar-mobile-menu"
            data-mobile-menu
            variants={panelVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            exit={{ opacity: 0, transition: reduceMotion ? INSTANT : { duration: 0.14 } }}
            className="fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain md:hidden"
            style={{ top: "var(--nav-height, 113px)", background: "var(--nan-dark)" }}
          >
            {mobileView === "products" ? (
              <ProductNavigatorMobile onBack={backToMobileMenu} onNavigate={closeMobileMenu} />
            ) : (
            <nav aria-label="Menu chính" className="flex flex-col px-6 pb-10 pt-6">
              {NAV_ITEMS.map((item, i) => {
                const active = isRouteActive(item.href, pathname);
                if (item.href === "/products") {
                  return (
                    <motion.div key={item.href} variants={itemVariants} custom={i}>
                      <button
                        ref={mobileProductsTriggerRef}
                        type="button"
                        onClick={() => setMobileView("products")}
                        aria-current={active ? "page" : undefined}
                        className={`flex w-full items-center gap-4 py-3 text-left font-serif text-[28px] font-medium leading-tight transition-colors duration-(--dur-ui) focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo ${
                          active ? "text-[#F1F0EA]" : "text-[#A9ABA5] active:text-[#F1F0EA]"
                        }`}
                      >
                        {item.label}
                        {active && <span aria-hidden="true" className="h-px w-8 bg-bamboo" />}
                        <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" className="ml-auto text-bamboo" />
                      </button>
                    </motion.div>
                  );
                }
                return (
                  <motion.div key={item.href} variants={itemVariants} custom={i}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-4 py-3 font-serif text-[28px] font-medium leading-tight transition-colors duration-(--dur-ui) focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo ${
                        active ? "text-[#F1F0EA]" : "text-[#A9ABA5] active:text-[#F1F0EA]"
                      }`}
                    >
                      {item.label}
                      {/* Active: a bamboo hairline after the label (state is not colour alone) */}
                      {active && <span aria-hidden="true" className="h-px w-8 bg-bamboo" />}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Divider drawn open after the links */}
              <motion.span
                aria-hidden="true"
                variants={ruleVariants}
                custom={NAV_ITEMS.length}
                className="mt-6 block h-px origin-left bg-line-on-indigo"
              />

              {/* Mobile search -- inline, shares state with the desktop panel */}
              <motion.div variants={itemVariants} custom={NAV_ITEMS.length + 1} className="pt-6">
                <label
                  htmlFor="navbar-mobile-search"
                  className="mb-3 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]"
                >
                  Tìm sản phẩm
                </label>
                <div className="relative">
                  <Search
                    size={15}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A9ABA5]"
                  />
                  <input
                    id="navbar-mobile-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm quạt, danh mục, ứng dụng..."
                    className="h-11 w-full border border-white/[0.12] bg-transparent pl-9 pr-3 text-sm text-[#F1F0EA] placeholder:text-[#A9ABA5]/70 outline-none transition focus:border-[#B6A17B]/50"
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

              {/* Quote CTA -- last in the choreography; opens the generic quote modal */}
              <motion.div variants={itemVariants} custom={MENU_CTA_STEP}>
                <button
                  type="button"
                  onClick={openQuoteFromMenu}
                  className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 border border-bamboo text-sm font-medium text-[#F1F0EA] transition-colors duration-(--dur-ui) active:bg-on-indigo/5 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo"
                >
                  Yêu cầu báo giá
                  <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" className="text-bamboo" />
                </button>
              </motion.div>

              {/* Mobile account section -- grouped, not a crowded single row */}
              {!isLoading && (
                <motion.div
                  variants={itemVariants}
                  custom={NAV_ITEMS.length + 2}
                  className="mt-6 border-t border-line-on-indigo pt-6"
                >
                  <p className="pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#A9ABA5]">
                    Tài khoản
                  </p>
                  {isAuthenticated ? (
                    <div className="flex flex-col text-sm">
                      <div className="py-2">
                        <p className="truncate text-sm font-medium text-[#F1F0EA]">{displayName || user?.email}</p>
                        {roleLabel && <p className="mt-0.5 text-[11px] text-[#A9ABA5]">{roleLabel}</p>}
                      </div>
                      {admin && (
                        <Link
                          href="/admin"
                          onClick={closeMobileMenu}
                          className="flex h-11 items-center text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-11 items-center text-left text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6 text-sm">
                      <Link
                        href="/auth/login"
                        onClick={closeMobileMenu}
                        className="flex h-11 items-center text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={closeMobileMenu}
                        className="flex h-11 items-center text-[#A9ABA5] transition hover:text-[#F1F0EA]"
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </nav>
            )}
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

    {/* Outside the fixed header: the modal is its own top-level layer (z-1000) above it. */}
    <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}
