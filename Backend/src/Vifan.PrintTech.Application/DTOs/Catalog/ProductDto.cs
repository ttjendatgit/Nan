namespace Vifan.PrintTech.Application.DTOs.Catalog;

/// <summary>Read model returned by product endpoints.</summary>
public class ProductDto
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int MinQuantity { get; set; }
    /// <summary>
    /// Cloudinary <c>secureUrl</c> for the product's main image.
    /// Set this field by uploading an image via <c>POST /api/Media/upload?folder=products</c>
    /// and storing the returned <c>secureUrl</c>.
    /// </summary>
    // TODO (admin CMS — gallery phase): replace with MainImageUrl + GalleryImages[] once
    //   the ProductImage entity, EF migration, and gallery APIs are added.
    //   Each gallery item will expose: id, productId, imageUrl, publicId, altText, sortOrder, isPrimary.
    //   Also add publicId column to Products table so stale Cloudinary assets can be cleaned up on image replace.
    public string? ImageUrl { get; set; }
    public bool IsCustomizable { get; set; }
    public int EstimatedProductionDays { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
