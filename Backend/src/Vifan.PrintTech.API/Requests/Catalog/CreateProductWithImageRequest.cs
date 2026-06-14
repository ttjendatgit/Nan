using Microsoft.AspNetCore.Http;

namespace Vifan.PrintTech.API.Requests.Catalog;

/// <summary>
/// Multipart/form-data request for creating a product with an optional image upload.
/// The image is uploaded directly to Cloudinary and the returned <c>secureUrl</c> is saved as <c>imageUrl</c>.
/// </summary>
public class CreateProductWithImageRequest
{
    /// <summary>The category this product belongs to.</summary>
    public Guid CategoryId { get; set; }

    /// <summary>Product display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL slug. Auto-generated from <c>Name</c> if omitted.</summary>
    public string? Slug { get; set; }

    /// <summary>Optional product description.</summary>
    public string? Description { get; set; }

    /// <summary>Base price in VND. Use 0 for quote-on-request products.</summary>
    public decimal BasePrice { get; set; }

    /// <summary>Minimum order quantity. Defaults to 1.</summary>
    public int MinQuantity { get; set; } = 1;

    /// <summary>Whether the product supports custom design.</summary>
    public bool IsCustomizable { get; set; }

    /// <summary>Estimated production time in days.</summary>
    public int EstimatedProductionDays { get; set; }

    /// <summary>Whether the product is publicly visible. Defaults to true.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional image file to upload to Cloudinary (folder: <c>products</c>).
    /// Accepted types: JPEG, PNG, WebP, AVIF. Maximum size: 10 MB.
    /// If provided, the Cloudinary <c>secureUrl</c> is stored as <c>imageUrl</c>.
    /// </summary>
    public IFormFile? Image { get; set; }
}
