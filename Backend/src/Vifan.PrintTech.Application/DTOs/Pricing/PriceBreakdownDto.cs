namespace Vifan.PrintTech.Application.DTOs.Pricing;

public class PriceBreakdownDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal BaseUnitPrice { get; set; }
    public decimal OptionsAdditionalPerUnit { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public decimal AdditionalCost { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal UrgentDeliveryCost { get; set; }
    public decimal EstimatedPrice { get; set; }
    public Guid? AppliedPricingRuleId { get; set; }
    public IReadOnlyList<PriceBreakdownOptionDto> SelectedOptions { get; set; } = [];
}

public class PriceBreakdownOptionDto
{
    public Guid OptionId { get; set; }
    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
}
