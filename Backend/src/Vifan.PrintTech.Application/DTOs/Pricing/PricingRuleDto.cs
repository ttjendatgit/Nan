namespace Vifan.PrintTech.Application.DTOs.Pricing;

public class PricingRuleDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? Material { get; set; }
    public string? Size { get; set; }
    public int MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public string? PrintingSide { get; set; }
    public decimal BaseUnitPrice { get; set; }
    public decimal AdditionalCost { get; set; }
    public decimal DiscountPercent { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
