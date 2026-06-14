namespace Vifan.PrintTech.Application.DTOs.Catalog;

/// <summary>Read model returned by category endpoints.</summary>
public class ProductCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>
    /// Cloudinary <c>secureUrl</c> for the category banner/thumbnail image.
    /// Set this field by uploading an image via <c>POST /api/Media/upload?folder=products</c>
    /// and storing the returned <c>secureUrl</c>.
    /// </summary>
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
