using Vifan.PrintTech.Domain.Common;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Entities;

/// <summary>
/// Reusable content document foundation: one row can eventually back a product's extended
/// content, a static page, or a blog post, distinguished by <see cref="Type"/>. Phase 1.1
/// foundation only -- no repository/service/API exists yet, nothing writes to this table, and
/// <see cref="Product.ContentBlocksJson"/> remains the live storage for product content until a
/// later phase migrates it here.
/// </summary>
public class ContentDocument : BaseEntity
{
    public ContentDocumentType Type { get; set; }

    /// <summary>The Product this document is about -- required when Type is ProductContent,
    /// always null for Page/BlogPost. A real FK (cascade): unlike QuoteRequest's snapshot
    /// fields, a product-content document has no meaning once its product is gone.</summary>
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }

    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public ContentStatus Status { get; set; } = ContentStatus.Draft;

    /// <summary>Published content blocks, JSON array -- same shape/format as
    /// Product.ContentBlocksJson today. Null/empty until content is authored or published.</summary>
    public string? BlocksJson { get; set; }

    /// <summary>Unpublished in-progress edits. Null when there is no pending draft, i.e. the
    /// document's live content is exactly BlocksJson.</summary>
    public string? DraftBlocksJson { get; set; }

    // ── SEO metadata (Phase 1.9) ──────────────────────────────────────────
    // Plain optional fields on the document itself, not a separate SEO entity/table -- there is
    // no independent lifecycle here (an SEO row can't exist without its document, isn't queried
    // on its own, and has no service of its own). Foundation only: no sitemap/robots/OpenGraph
    // rendering/JSON-LD/analytics consumes these yet.

    /// <summary>Overrides Title in the page's &lt;title&gt; / search-result headline when set.</summary>
    public string? SeoTitle { get; set; }

    /// <summary>Search-result snippet / meta description.</summary>
    public string? SeoDescription { get; set; }

    /// <summary>Free-text keywords, comma-separated by convention (not parsed/validated as a list).</summary>
    public string? SeoKeywords { get; set; }

    /// <summary>Social/share preview image URL. Free-text URL today, same as ImageBlock.Url --
    /// no Cloudinary/upload coupling.</summary>
    public string? SeoImageUrl { get; set; }

    /// <summary>Canonical URL override for duplicate-content signalling.</summary>
    public string? CanonicalUrl { get; set; }
}
