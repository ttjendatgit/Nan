using Microsoft.AspNetCore.Http;

namespace Vifan.PrintTech.API.Requests.Catalog;

/// <summary>
/// Multipart/form-data request for updating a product category with an optional image replacement.
/// If <c>Image</c> is provided, it is uploaded to Cloudinary and replaces the existing <c>imageUrl</c>.
/// If <c>Image</c> is omitted, the existing <c>imageUrl</c> is preserved unchanged.
/// </summary>
public class UpdateCategoryWithImageRequest
{
    /// <summary>Category display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL slug. Auto-generated from <c>Name</c> if omitted.</summary>
    public string? Slug { get; set; }

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Whether the category is publicly visible.</summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Optional replacement image file (folder: <c>categories</c>).
    /// Accepted types: JPEG, PNG, WebP, AVIF. Maximum size: 10 MB.
    /// Omit to keep the existing image.
    /// </summary>
    public IFormFile? Image { get; set; }
}
