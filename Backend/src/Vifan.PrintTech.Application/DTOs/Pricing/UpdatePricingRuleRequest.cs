namespace Vifan.PrintTech.Application.DTOs.Pricing;

public class UpdatePricingRuleRequest
{
    public string? Material { get; set; }
    public string? Size { get; set; }
    public int MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public string? PrintingSide { get; set; }
    public decimal BaseUnitPrice { get; set; }
    public decimal AdditionalCost { get; set; }
    public decimal DiscountPercent { get; set; }
    public bool IsActive { get; set; }
}
