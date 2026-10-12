"use client";

// R9E Product Navigator: "Sản phẩm" opens a catalogue index instead of navigating. A B2B buyer
// answers "what do you make?" (the product lines, with counts) before "which model?" (the products
// of the chosen line), then goes to the line page, a product page, or the whole catalogue.
//
// Data: the existing catalog API only. Categories once, then for every line one by-category request
// of PRODUCTS_SHOWN items, whose totalCount is the line's count. Cached for the page session, so
// reopening (or switching lines) never refetches. Scales: 10+ lines list in a scrolling column, a
// line with 100 products still shows PRODUCTS_SHOWN and a "Xem tất cả N sản phẩm" link to its page;
// that link appears only when the line has more than PRODUCTS_SHOWN (otherwise every product is
// already listed). "Tất cả sản phẩm" (the whole catalogue) is always there.
//
// Desktop: a panel under the bar (Navbar owns open/close, outside click, Escape and focus return).
// Mobile: a view inside the mobile menu, lines first, then the chosen line's products, with a back
// button at each level. Motion: the panel fades and settles 6px (180ms), product entries 35ms apart;
// reduced motion = instant.

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { getCategories } from "@/lib/api/categories";
import { getProductsByCategory } from "@/lib/api/products";
import { EASE_NAN_UI, INSTANT } from "@/lib/motionTokens";
import { formatProductPrice } from "@/lib/productFacts";
import { cn } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types/catalog";

/** Products listed per line inside the navigator; the rest are one link away. */
export const PRODUCTS_SHOWN = 8;

// ─── Data (module cache: one fetch per page session) ─────────────────────────

interface LineData {
  products: Product[];
  total: number;
}

type NavigatorData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; categories: ProductCategory[]; lines: Record<string, LineData | "loading" | "error"> };

let snapshot: NavigatorData = { status: "loading" };
let started = false;
const listeners = new Set<() => void>();

function emit(next: NavigatorData) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function loadLine(categoryId: string) {
  getProductsByCategory(categoryId, { pageSize: PRODUCTS_SHOWN })
    .then((page) => {
      if (snapshot.status !== "ready") return;
      emit({ ...snapshot, lines: { ...snapshot.lines, [categoryId]: { products: page.items, total: page.totalCount } } });
    })
    .catch(() => {
      if (snapshot.status !== "ready") return;
      emit({ ...snapshot, lines: { ...snapshot.lines, [categoryId]: "error" } });
    });
}

function start() {
  if (started) return;
  started = true;
  getCategories({ pageSize: 50, activeOnly: true })
    .then((res) => {
      emit({ status: "ready", categories: res.items, lines: Object.fromEntries(res.items.map((c) => [c.id, "loading" as const])) });
      res.items.forEach((c) => loadLine(c.id));
    })
    .catch(() => {
      started = false; // allow a retry on the next open
      emit({ status: "error" });
    });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnapshot: NavigatorData = { status: "loading" };

/** Navigator data; starts loading the first time `active` is true. */
function useNavigatorData(active: boolean): NavigatorData {
  useEffect(() => {
    if (active) start();
  }, [active]);
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}


const countLabel = (line: LineData | "loading" | "error" | undefined) =>
  line && typeof line === "object" ? `${line.total} sản phẩm` : "";

// ─── Shared pieces ───────────────────────────────────────────────────────────

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.18em] text-bamboo";
const FOCUS = "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-on-indigo";

/** An explicit text action: label, hairline under it, arrow; 44px tall. */
function ActionLink({ href, onNavigate, children, srSuffix, className }: { href: string; onNavigate: () => void; children: React.ReactNode; srSuffix?: string; className?: string }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn("group/action inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-on-indigo", FOCUS, className)}
    >
      <span className="relative py-0.5">
        {children}
        {srSuffix && <span className="sr-only"> {srSuffix}</span>}
        <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-px bg-bamboo/40" />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) group-hover/action:scale-x-100 group-focus-visible/action:scale-x-100 motion-reduce:transition-none"
        />
      </span>
      <ArrowRight
        size={14}
        strokeWidth={1.5}
        aria-hidden="true"
        className="text-bamboo transition-[translate] duration-(--dur-state) ease-(--ease-nan-ui) group-hover/action:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/action:translate-x-0"
      />
    </Link>
  );
}

/** One product: number, name, one line of description, its price cue, and its explicit action. */
function ProductEntry({ product, index, onNavigate, reduce }: { product: Product; index: number; onNavigate: () => void; reduce: boolean }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? INSTANT : { duration: 0.22, delay: index * 0.035, ease: EASE_NAN_UI }}
      className="flex min-w-0 gap-4 border-b border-line-on-indigo py-4"
    >
      <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 font-serif text-sm tabular-nums text-bamboo">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg font-medium leading-snug text-on-indigo [overflow-wrap:anywhere]">{product.name}</p>
        {product.description?.trim() && (
          <p className="mt-0.5 truncate text-sm text-on-indigo-muted">{product.description.trim()}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4">
          <span className="text-xs text-on-indigo-muted">{formatProductPrice(product.basePrice).value}</span>
          <ActionLink href={`/products/${product.id}`} onNavigate={onNavigate} srSuffix={product.name} className="text-[13px]">
            Xem sản phẩm
          </ActionLink>
        </div>
      </div>
    </motion.li>
  );
}

function ProductsOfLine({
  line,
  category,
  onNavigate,
  reduce,
  columns,
}: {
  line: LineData | "loading" | "error" | undefined;
  category: ProductCategory;
  onNavigate: () => void;
  reduce: boolean;
  columns: boolean;
}) {
  if (!line || line === "loading") {
    return (
      <div aria-hidden="true" className="animate-pulse space-y-4 py-4 motion-reduce:animate-none">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 bg-indigo-raised" />
        ))}
      </div>
    );
  }
  if (line === "error") {
    return (
      <p className="py-6 text-sm text-on-indigo-muted">
        Không thể tải sản phẩm.{" "}
        <ActionLink href={`/products?categoryId=${category.id}`} onNavigate={onNavigate}>
          Mở trang {category.name}
        </ActionLink>
      </p>
    );
  }
  if (line.products.length === 0) {
    return <p className="py-6 text-sm text-on-indigo-muted">Hiện chưa có sản phẩm trong dòng này</p>;
  }
  return (
    <ul className={cn("grid", columns && "lg:grid-cols-2 lg:gap-x-10")} key={category.id}>
      {line.products.map((p, i) => (
        <ProductEntry key={p.id} product={p} index={i} onNavigate={onNavigate} reduce={reduce} />
      ))}
    </ul>
  );
}

// ─── Desktop panel ───────────────────────────────────────────────────────────

/**
 * Desktop index (md+): lines on the left (buttons; choosing one swaps the right column in place),
 * the chosen line's products on the right. Each column is capped at min(62vh, 520px) and scrolls
 * on its own (overscroll contained), so the page never has to scroll to operate the menu.
 */
export function ProductNavigatorPanel({
  id,
  onNavigate,
  focusOnOpen,
  initialLineId,
  currentProductId,
}: {
  id: string;
  onNavigate: () => void;
  focusOnOpen: boolean;
  /** The line to show first (the one in the URL when the reader is inside it); else the first line. */
  initialLineId: string | null;
  /** On a product page: open on the line that lists this product. */
  currentProductId?: string | null;
}) {
  const reduce = Boolean(useReducedMotion());
  const data = useNavigatorData(true);
  const [selected, setSelected] = useState<string | null>(null);
  const firstLineRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  const categories = data.status === "ready" ? data.categories : [];
  const productLine =
    data.status === "ready" && currentProductId
      ? categories.find((c) => {
          const l = data.lines[c.id];
          return typeof l === "object" && l.products.some((p) => p.id === currentProductId);
        })?.id
      : undefined;
  const current = categories.find((c) => c.id === (selected ?? initialLineId ?? productLine)) ?? categories[0];
  const line = data.status === "ready" && current ? data.lines[current.id] : undefined;

  // Keyboard users land on the selected line once the index is there.
  useEffect(() => {
    if (focusOnOpen && data.status === "ready") firstLineRef.current?.focus({ preventScroll: true });
  }, [focusOnOpen, data.status]);

  return (
    <motion.div
      id={id}
      role="region"
      aria-labelledby={headingId}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: reduce ? INSTANT : { duration: 0.12 } }}
      transition={reduce ? INSTANT : { duration: 0.18, ease: EASE_NAN_UI }}
      className="absolute inset-x-0 top-full z-10 hidden border-b border-line-on-indigo md:block"
      style={{ background: "var(--nan-dark)" }}
    >
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-6 lg:px-10">
        <div className="flex items-end justify-between gap-6 border-b border-line-on-indigo pb-4">
          <h2 id={headingId} className={LABEL}>Sản phẩm</h2>
          <ActionLink href="/products" onNavigate={onNavigate}>Tất cả sản phẩm</ActionLink>
        </div>

        {data.status === "error" && (
          <p className="py-8 text-sm text-on-indigo-muted">Không thể tải danh mục sản phẩm.</p>
        )}

        {data.status !== "error" && (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)]">
            {/* Lines */}
            <div className="max-h-[min(62vh,520px)] overflow-y-auto overscroll-contain border-r border-line-on-indigo py-4 pr-6">
              <p className={cn(LABEL, "mb-2 text-on-indigo-muted")}>Dòng sản phẩm</p>
              {data.status === "loading" ? (
                <div aria-hidden="true" className="animate-pulse space-y-3 motion-reduce:animate-none">
                  {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-indigo-raised" />)}
                </div>
              ) : (
                <ul>
                  {categories.map((c) => {
                    const isCurrent = c.id === current?.id;
                    return (
                      <li key={c.id}>
                        <button
                          ref={isCurrent ? firstLineRef : undefined}
                          type="button"
                          aria-pressed={isCurrent}
                          aria-controls={`${id}-products`}
                          onClick={() => setSelected(c.id)}
                          className={cn(
                            "group/line relative flex min-h-14 w-full flex-col justify-center py-2 pl-4 text-left transition-colors duration-(--dur-state) motion-reduce:transition-none",
                            FOCUS,
                            isCurrent ? "text-on-indigo" : "text-on-indigo-muted hover:text-on-indigo",
                          )}
                        >
                          {/* Current line: a bamboo hairline drawn down its left edge (not colour alone) */}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute inset-y-2 left-0 w-px origin-top bg-bamboo transition-[scale] duration-(--dur-state) ease-(--ease-nan-ui) motion-reduce:transition-none",
                              isCurrent ? "scale-y-100" : "scale-y-0",
                            )}
                          />
                          <span className="font-serif text-xl font-medium leading-tight">{c.name}</span>
                          <span className="mt-0.5 min-h-4 text-xs text-on-indigo-muted">
                            {data.status === "ready" ? countLabel(data.lines[c.id]) : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Products of the chosen line */}
            <div id={`${id}-products`} aria-live="polite" className="max-h-[min(62vh,520px)] overflow-y-auto overscroll-contain py-4 pl-6 lg:pl-10">
              {current && (
                <>
                  <div className="mb-1 flex min-h-11 flex-wrap items-center justify-between gap-x-6">
                    <p className={cn(LABEL, "text-on-indigo-muted")}>
                      <span className="sr-only">Sản phẩm của dòng </span>
                      {current.name}
                    </p>
                    {line && typeof line === "object" && line.total > PRODUCTS_SHOWN && (
                      <ActionLink href={`/products?categoryId=${current.id}`} onNavigate={onNavigate} className="text-[13px]">
                        {`Xem tất cả ${line.total} sản phẩm`}
                      </ActionLink>
                    )}
                  </div>
                  <ProductsOfLine line={line} category={current} onNavigate={onNavigate} reduce={reduce} columns />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mobile view ─────────────────────────────────────────────────────────────

/**
 * Mobile (inside the mobile menu): level 1 lists the lines (large targets), level 2 the chosen
 * line's products. Each level has a back button at the top; focus moves to it on entry.
 */
export function ProductNavigatorMobile({ onBack, onNavigate }: { onBack: () => void; onNavigate: () => void }) {
  const reduce = Boolean(useReducedMotion());
  const data = useNavigatorData(true);
  const [lineId, setLineId] = useState<string | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, [lineId]);

  const categories = data.status === "ready" ? data.categories : [];
  const current = categories.find((c) => c.id === lineId) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduce ? INSTANT : { duration: 0.18, ease: EASE_NAN_UI }}
      key={lineId ?? "lines"}
      className="flex flex-col px-6 pb-10 pt-4"
    >
      <button
        ref={backRef}
        type="button"
        onClick={() => (current ? setLineId(null) : onBack())}
        className={cn("-ml-1 inline-flex min-h-11 items-center gap-2 self-start px-1 text-sm text-on-indigo-muted", FOCUS)}
      >
        <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
        {current ? "Dòng sản phẩm" : "Menu"}
      </button>

      <h2 className="mt-4 font-serif text-[28px] font-medium leading-tight text-on-indigo">
        {current ? current.name : "Sản phẩm"}
      </h2>

      {!current && (
        <>
          <ActionLink href="/products" onNavigate={onNavigate} className="mt-2 self-start">Tất cả sản phẩm</ActionLink>
          <p className={cn(LABEL, "mt-8 text-on-indigo-muted")}>Dòng sản phẩm</p>
          {data.status === "error" && <p className="py-6 text-sm text-on-indigo-muted">Không thể tải danh mục sản phẩm.</p>}
          {data.status === "loading" && (
            <div aria-hidden="true" className="mt-3 animate-pulse space-y-3 motion-reduce:animate-none">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-indigo-raised" />)}
            </div>
          )}
          {data.status === "ready" && (
            <ul className="mt-2 border-t border-line-on-indigo">
              {categories.map((c) => (
                <li key={c.id} className="border-b border-line-on-indigo">
                  <button
                    type="button"
                    onClick={() => setLineId(c.id)}
                    className={cn("flex min-h-16 w-full items-center justify-between gap-4 py-3 text-left", FOCUS)}
                  >
                    <span>
                      <span className="block font-serif text-xl font-medium text-on-indigo">{c.name}</span>
                      <span className="mt-0.5 block min-h-4 text-xs text-on-indigo-muted">{countLabel(data.lines[c.id])}</span>
                    </span>
                    <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-bamboo" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {current && data.status === "ready" && (
        <>
          {(() => {
            const line = data.lines[current.id];
            return (
              <>
                {line && typeof line === "object" && line.total > PRODUCTS_SHOWN && (
                  <ActionLink href={`/products?categoryId=${current.id}`} onNavigate={onNavigate} className="mt-2 self-start">
                    {`Xem tất cả ${line.total} sản phẩm`}
                  </ActionLink>
                )}
                <div className="mt-4 border-t border-line-on-indigo">
                  <ProductsOfLine line={line} category={current} onNavigate={onNavigate} reduce={reduce} columns={false} />
                </div>
              </>
            );
          })()}
        </>
      )}
    </motion.div>
  );
}
