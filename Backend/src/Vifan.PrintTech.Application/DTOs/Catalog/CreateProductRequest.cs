namespace Vifan.PrintTech.Application.DTOs.Catalog;

/// <summary>Request body for creating a new product.</summary>
public class CreateProductRequest
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int MinQuantity { get; set; } = 1;
    /// <summary>
    /// Cloudinary <c>secureUrl</c> for the product's main image.
    /// Obtain this value by calling <c>POST /api/Media/upload?folder=products</c> first,
    /// then pass the returned <c>secureUrl</c> here.
    /// </summary>
    public string? ImageUrl { get; set; }
    public bool IsCustomizable { get; set; }
    public int EstimatedProductionDays { get; set; }
    public bool IsActive { get; set; } = true;
}
