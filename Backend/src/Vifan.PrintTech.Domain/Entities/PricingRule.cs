using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

public class PricingRule : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string? Material { get; set; }
    public string? Size { get; set; }
    public int MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public string? PrintingSide { get; set; }
    public decimal BaseUnitPrice { get; set; }
    public decimal AdditionalCost { get; set; }
    public decimal DiscountPercent { get; set; }
    public bool IsActive { get; set; } = true;
}
