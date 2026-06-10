namespace Vifan.PrintTech.Application.DTOs.Catalog;

public class UpdateProductRequest
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int MinQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsCustomizable { get; set; }
    public int EstimatedProductionDays { get; set; }
    public bool IsActive { get; set; }
}
