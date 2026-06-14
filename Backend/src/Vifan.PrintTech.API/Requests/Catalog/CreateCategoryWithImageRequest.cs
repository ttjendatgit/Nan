using Microsoft.AspNetCore.Http;

namespace Vifan.PrintTech.API.Requests.Catalog;

/// <summary>
/// Multipart/form-data request for creating a product category with an optional image upload.
/// The image is uploaded directly to Cloudinary and the returned <c>secureUrl</c> is saved as <c>imageUrl</c>.
/// </summary>
public class CreateCategoryWithImageRequest
{
    /// <summary>Category display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL slug. Auto-generated from <c>Name</c> if omitted.</summary>
    public string? Slug { get; set; }

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Whether the category is publicly visible. Defaults to true.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional image file to upload to Cloudinary (folder: <c>categories</c>).
    /// Accepted types: JPEG, PNG, WebP, AVIF. Maximum size: 10 MB.
    /// If provided, the Cloudinary <c>secureUrl</c> is stored as <c>imageUrl</c>.
    /// </summary>
    public IFormFile? Image { get; set; }
}
