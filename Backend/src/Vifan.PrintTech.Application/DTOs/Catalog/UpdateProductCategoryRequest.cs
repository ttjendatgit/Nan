namespace Vifan.PrintTech.Application.DTOs.Catalog;

/// <summary>Request body for updating an existing product category.</summary>
public class UpdateProductCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    /// <summary>
    /// Cloudinary <c>secureUrl</c> for the category banner/thumbnail image.
    /// Obtain this value by calling <c>POST /api/Media/upload?folder=products</c> first,
    /// then pass the returned <c>secureUrl</c> here.
    /// Pass <c>null</c> to clear the image.
    /// </summary>
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
}
