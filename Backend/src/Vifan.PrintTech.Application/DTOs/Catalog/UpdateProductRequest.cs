namespace Vifan.PrintTech.Application.DTOs.Catalog;

/// <summary>Request body for updating an existing product.</summary>
public class UpdateProductRequest
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int MinQuantity { get; set; }
    /// <summary>
    /// Cloudinary <c>secureUrl</c> for the product's main image.
    /// Obtain this value by calling <c>POST /api/Media/upload?folder=products</c> first,
    /// then pass the returned <c>secureUrl</c> here.
    /// Pass <c>null</c> to clear the image.
    /// </summary>
    /// <remarks>
    /// TODO: When the old image is replaced, delete the orphaned Cloudinary asset using
    /// <c>DELETE /api/Media/{publicId}</c> to avoid storage waste.
    /// This requires storing <c>publicId</c> alongside <c>imageUrl</c> in a future migration.
    /// </remarks>
    public string? ImageUrl { get; set; }
    public bool IsCustomizable { get; set; }
    public int EstimatedProductionDays { get; set; }
    public bool IsActive { get; set; }
}
