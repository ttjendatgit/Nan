using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

/// <summary>
/// One row per file uploaded through the Media Library (Content Studio image blocks, SEO images,
/// and -- eventually -- product/banner assets). The actual bytes live on Cloudinary; this is the
/// local index that makes "browse everything that's been uploaded" possible, which Cloudinary's
/// own Admin API doesn't conveniently give this app for free. No user/author ownership field --
/// there is no such convention anywhere else in this codebase yet (see PricingRule, QuoteRequest,
/// ContentDocument -- none of them record who created/changed a row either).
/// </summary>
public class MediaAsset : BaseEntity
{
    /// <summary>The stored asset's own file name (derived from Cloudinary's PublicId + format),
    /// not necessarily the same as OriginalName once Cloudinary de-duplicates it.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>The file name exactly as the admin's browser reported it at upload time.</summary>
    public string OriginalName { get; set; } = string.Empty;

    /// <summary>Cloudinary's secureUrl -- ready to use directly in an &lt;img&gt;/&lt;a&gt;.</summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>Cloudinary's own asset identifier. Required to delete the asset from Cloudinary
    /// itself, not just this index row.</summary>
    public string PublicId { get; set; } = string.Empty;

    public string MimeType { get; set; } = string.Empty;

    /// <summary>File size in bytes.</summary>
    public long Size { get; set; }

    /// <summary>Null for non-image assets (Cloudinary doesn't report dimensions for those).</summary>
    public int? Width { get; set; }
    public int? Height { get; set; }

    /// <summary>Cloudinary folder the asset was uploaded into (e.g. "nan/content"). Null when
    /// uploaded with no folder specified.</summary>
    public string? Folder { get; set; }
}
