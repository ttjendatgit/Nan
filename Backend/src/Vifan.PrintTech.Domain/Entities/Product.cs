using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

public class Product : BaseEntity
{
    public Guid CategoryId { get; set; }
    public ProductCategory Category { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public int MinQuantity { get; set; } = 1;
    public string? ImageUrl { get; set; }
    public bool IsCustomizable { get; set; }
    public int EstimatedProductionDays { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<ProductOption> Options { get; set; } = [];
    public ICollection<PricingRule> PricingRules { get; set; } = [];
}
