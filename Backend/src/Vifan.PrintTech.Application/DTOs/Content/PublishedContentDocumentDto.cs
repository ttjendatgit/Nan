namespace Vifan.PrintTech.Application.DTOs.Content;

/// <summary>
/// Public (anonymous) read model for a Published content document. Deliberately separate from
/// <see cref="ContentDocumentDto"/>, which carries DraftBlocksJson and admin-only fields: this
/// type lists exactly what a public page needs, so draft content can never leak through it by a
/// later field being added to the admin DTO.
/// </summary>
public class PublishedContentDocumentDto
{
    public string Type { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>Fallback for the page title when SeoTitle is empty.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>The published blocks (ContentDocument.BlocksJson) -- never DraftBlocksJson.</summary>
    public string? BlocksJson { get; set; }

    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public string? SeoImageUrl { get; set; }
    public string? CanonicalUrl { get; set; }

    public DateTime UpdatedAt { get; set; }
}

/// <summary>One entry of the public published-documents listing (sitemap source): no content,
/// only what a sitemap &lt;url&gt; needs.</summary>
public class PublishedContentDocumentSummaryDto
{
    public string Slug { get; set; } = string.Empty;

    /// <summary>BaseEntity.UpdatedAt -- set by ApplicationDbContext on every save of the row.</summary>
    public DateTime UpdatedAt { get; set; }
}
