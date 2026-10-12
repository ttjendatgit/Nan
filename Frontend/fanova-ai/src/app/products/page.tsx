"use client";

import { Suspense, useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import CatalogueList, { CatalogueSkeleton, type CatalogueItem } from "@/components/product/CatalogueList";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { categoryObjects, objectFor, productObjects } from "@/data/productAssets";
import { getProductsByCategory } from "@/lib/api/products";
import { catalogueFacts } from "@/lib/productFacts";
import { getCategories } from "@/lib/api/categories";
import type { Product, ProductCategory } from "@/types/catalog";

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-indigo text-on-indigo">
      <Navbar />
      <main className="flex-1 pt-24">
        {categoryId ? (
          <CategoryProductsView categoryId={categoryId} />
        ) : (
          <CategorySelectionView />
        )}
      </main>
      <Footer />
    </div>
  );
}

// ─── Catalogue rows ───────────────────────────────────────────────────────────

/** A product line as a catalogue row: its A1 asset when one exists, else the admin-uploaded image.
 *  `count`: products in the line (undefined while loading, null if it couldn't be read). */
function categoryToItem(category: ProductCategory, count: number | null | undefined): CatalogueItem {
  const art = objectFor(categoryObjects, category.slug);
  return {
    id: category.id,
    href: `/products?categoryId=${category.id}`,
    name: category.name,
    description: category.description,
    // Same wording as the count on the line's own page.
    summary: count === undefined ? null : count === null ? "" : `${count} sản phẩm`,
    media: art
      ? { src: art.src, alt: art.alt || category.name, ratio: art.ratio, cutout: art.cutout }
      : { src: category.imageUrl, alt: category.name },
  };
}

/** A product as a catalogue row. Facts come from the shared formatter (lib/productFacts), the same
 *  rules and wording as the product detail page, in the same order on every row. */
function productToItem(product: Product): CatalogueItem {
  const art = objectFor(productObjects, product.slug);
  const facts = catalogueFacts(product);
  return {
    id: product.id,
    href: `/products/${product.id}`,
    name: product.name,
    description: product.description,
    facts,
    media: art
      ? { src: art.src, alt: art.alt || product.name, ratio: art.ratio, cutout: art.cutout }
      : { src: product.imageUrl, alt: product.name },
  };
}

// ─── Category Selection View (/products — no categoryId) ──────────────────────

function CategorySelectionView() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  // Products per line (same request as the line's own page, one item, read totalCount): undefined
  // while loading, null if it failed. Never blocks the rows; their slot keeps its height.
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCategories({ pageSize: 50, activeOnly: true })
      .then((res) => {
        if (cancelled) return;
        setCategories(res.items);
        res.items.forEach((cat) => {
          getProductsByCategory(cat.id, { pageSize: 1 })
            .then((page) => {
              if (!cancelled) setCounts((c) => ({ ...c, [cat.id]: page.totalCount }));
            })
            .catch(() => {
              if (!cancelled) setCounts((c) => ({ ...c, [cat.id]: null }));
            });
        });
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Không thể tải danh mục");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return (
    <div>
      {/* Opening: page label, the existing title and line; tight enough that the first product
          line starts inside the first screen. */}
      <section className="px-6 pb-8 pt-10 md:pb-10 md:pt-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bamboo">Sản phẩm</p>
          <Reveal>
            <h1 className="mt-3 max-w-[18ch] font-serif text-4xl font-medium leading-[1.1] tracking-tight text-on-indigo md:text-6xl">
              Chọn dòng sản phẩm phù hợp
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 max-w-[52ch] text-[0.9375rem] leading-7 text-on-indigo-muted">
              Mỗi chất liệu và cấu trúc quạt tạo nên trải nghiệm thị giác riêng biệt. Chọn dòng quạt phù hợp với không gian và thương hiệu của bạn.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-label="Dòng sản phẩm" className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          {loading && <CatalogueSkeleton density="category" />}

          {!loading && error && (
            <GalleryMessage
              title="Không thể tải danh mục"
              detail={error}
              action={<RetryButton onClick={() => setRetryKey((k) => k + 1)} />}
            />
          )}

          {!loading && !error && categories.length === 0 && (
            <GalleryMessage title="Chưa có danh mục sản phẩm" detail="Sản phẩm sẽ sớm được cập nhật" />
          )}

          {!loading && !error && categories.length > 0 && (
            <CatalogueList
              items={categories.map((cat) => categoryToItem(cat, counts[cat.id]))}
              density="category"
              ctaLabel="Xem dòng quạt"
              priorityFirst
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Category Products View (/products?categoryId=...) ────────────────────────

function CategoryProductsView({ categoryId }: { categoryId: string }) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProducts([]);

    Promise.all([
      getCategories({ pageSize: 50, activeOnly: true }),
      getProductsByCategory(categoryId, { pageSize: 100 }),
    ])
      .then(([catsRes, prodsRes]) => {
        if (cancelled) return;
        setCategories(catsRes.items);
        setProducts(prodsRes.items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, retryKey]);

  return (
    <div>
      {/* Category header: the line's name and description, then the line switcher. Tight, so the
          first product row starts inside the first screen. */}
      <section className="px-6 pt-12 md:pt-16">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div aria-hidden="true" className="animate-pulse space-y-4 motion-reduce:animate-none">
              <div className="h-12 w-72 max-w-full bg-indigo-raised" />
              <div className="h-4 w-96 max-w-full bg-indigo-raised" />
            </div>
          ) : selectedCategory ? (
            <>
              <h1 className="max-w-[18ch] font-serif text-4xl font-medium leading-[1.1] tracking-tight text-on-indigo md:text-6xl">
                {selectedCategory.name}
              </h1>
              {selectedCategory.description && (
                <p className="mt-5 max-w-[56ch] text-[0.9375rem] leading-7 text-on-indigo-muted">
                  {selectedCategory.description}
                </p>
              )}
            </>
          ) : !error ? (
            <h1 className="font-serif text-4xl font-medium tracking-tight text-on-indigo md:text-6xl">Sản phẩm</h1>
          ) : null}

          {/* Line switcher: plain text links on one hairline; the current line carries a bamboo rule
              and aria-current. No pills; wraps instead of scrolling sideways. "Tất cả" returns to
              the product lines (it replaces the old separate back link). */}
          {!loading && !error && categories.length > 0 && (
            <nav aria-label="Dòng quạt" className="mt-10 flex flex-wrap items-end justify-between gap-x-8 border-b border-line-on-indigo">
              <ul className="flex flex-wrap gap-x-6 sm:gap-x-8">
                <li>
                  <SwitcherLink href="/products" active={false}>
                    Tất cả
                  </SwitcherLink>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <SwitcherLink href={`/products?categoryId=${cat.id}`} active={cat.id === categoryId}>
                      {cat.name}
                    </SwitcherLink>
                  </li>
                ))}
              </ul>
              {products.length > 0 && (
                <p className="flex min-h-11 items-center text-xs text-on-indigo-muted">{products.length} sản phẩm</p>
              )}
            </nav>
          )}
        </div>
      </section>

      <section aria-label="Sản phẩm" className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          {loading && <CatalogueSkeleton density="product" rows={3} ruleTop={false} />}

          {!loading && error && (
            <GalleryMessage
              title="Không thể tải sản phẩm"
              detail={error}
              action={<RetryButton onClick={() => setRetryKey((k) => k + 1)} />}
            />
          )}

          {!loading && !error && products.length === 0 && (
            <GalleryMessage
              title="Hiện chưa có sản phẩm trong dòng này"
              detail="Sản phẩm sẽ sớm được cập nhật"
              action={
                <Button href="/products" tone="indigo" variant="secondary">
                  Chọn dòng khác
                </Button>
              }
            />
          )}

          {!loading && !error && products.length > 0 && (
            <CatalogueList
              items={products.map(productToItem)}
              density="product"
              ctaLabel="Xem chi tiết"
              priorityFirst
              ruleTop={false}
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function SwitcherLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px flex min-h-11 items-center border-b text-sm transition-colors duration-(--dur-state) focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-on-indigo motion-reduce:transition-none ${
        active ? "border-bamboo text-on-indigo" : "border-transparent text-on-indigo-muted hover:text-on-indigo"
      }`}
    >
      {children}
    </Link>
  );
}

/** Error / empty state in the gallery's voice: a hairline, a serif line, a muted detail, one action. */
function GalleryMessage({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-start gap-4 py-24">
      <span aria-hidden="true" className="mb-6 block h-px w-24 bg-bamboo" />
      <p className="font-serif text-3xl font-medium text-on-indigo">{title}</p>
      {detail && <p className="max-w-sm text-sm text-on-indigo-muted">{detail}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" tone="indigo" variant="secondary" onClick={onClick}>
      <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
      Thử lại
    </Button>
  );
}
