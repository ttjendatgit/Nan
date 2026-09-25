import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import EditorialGrid from "@/components/homepage/EditorialGrid";
import PageArticle from "@/components/content/PageArticle";
import { getPublishedPage } from "@/lib/api/publicContent";
import { parseBlocksJson } from "@/types/contentBlocks";

/**
 * Public Content Studio page (B2): a Published ContentDocument of Type Page, served at /{slug}.
 * Server Component, rendered per request -- getPublishedPage fetches with cache: "no-store", so a
 * newly published page (or a newly published edit) shows up on the next request with no rebuild,
 * and any slug created after the build is served too. Static routes (/admin, /auth, /products,
 * /dev) take precedence over this dynamic segment, and B1 rejects those names as Page slugs.
 */

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  // The page itself calls notFound() for this case -- no metadata of its own to add here.
  if (!page) return {};

  // The root layout's title is a plain string, not a template, so this is the full <title>
  // (no brand suffix appended). SEO URL fields are validated as absolute URLs on save (B1
  // validators), so they need no metadataBase; the root layout sets no canonical, so pages
  // without a canonicalUrl simply have none rather than inheriting the homepage's.
  const title = page.seoTitle?.trim() || page.title;
  const description = page.seoDescription?.trim() || undefined;
  const keywords = page.seoKeywords?.trim() || undefined;
  const image = page.seoImageUrl?.trim() || undefined;
  const canonical = page.canonicalUrl?.trim() || undefined;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: canonical ? { canonical } : undefined,
  };
}

export default async function PublicContentPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();

  // Same parse/coerce (and sanitization) the editor uses. An unreadable BlocksJson degrades to an
  // empty body under the title rather than an error page.
  const { blocks } = parseBlocksJson(page.blocksJson);

  return (
    // Same dark shell as /products: the fixed Navbar is transparent at the top of the page with
    // light text, so the band it sits on (padding-top = its measured height, see Navbar's
    // --nav-height) stays dark and the header looks exactly as it does everywhere else.
    <div className="flex min-h-[100dvh] flex-col bg-[#0D131F] pt-[var(--nav-height,112.5px)] text-white">
      <Navbar />
      {/* Everything between header and footer is one seamless full-width --nan-light surface with
          the homepage's light-section grid (FAQSection/ProblemSection use the same pair). */}
      {/* color: the light section's own dark text, so nothing inside ever inherits the dark
          shell's text-white. */}
      <main
        className="relative flex-1 overflow-hidden px-6 py-16 md:py-24"
        style={{ background: "var(--nan-light)", color: "var(--nan-dark)" }}
      >
        <EditorialGrid />
        <div className="relative mx-auto max-w-3xl">
          <PageArticle title={page.title} blocks={blocks} hideEmpty />
        </div>
      </main>
      <Footer />
    </div>
  );
}
