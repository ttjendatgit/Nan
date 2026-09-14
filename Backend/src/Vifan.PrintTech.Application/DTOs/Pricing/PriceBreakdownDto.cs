namespace Vifan.PrintTech.Application.DTOs.Pricing;

public class PriceBreakdownDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }

    /// <summary>Base unit price from the matched PricingRule, or Product.BasePrice if no rule matched.</summary>
    public decimal BaseUnitPrice { get; set; }

    /// <summary>Selected options whose PriceAdjustmentType is FixedPerUnit.</summary>
    public IReadOnlyList<PriceAdjustmentLineDto> UnitAdjustments { get; set; } = [];

    /// <summary>Selected options whose PriceAdjustmentType is FixedPerOrder.</summary>
    public IReadOnlyList<PriceAdjustmentLineDto> OrderAdjustments { get; set; } = [];

    /// <summary>Sum of UnitAdjustments amounts. Kept alongside UnitAdjustments for simple callers.</summary>
    public decimal OptionsAdditionalPerUnit { get; set; }

    /// <summary>BaseUnitPrice + OptionsAdditionalPerUnit.</summary>
    public decimal UnitPrice { get; set; }

    /// <summary>UnitPrice * Quantity.</summary>
    public decimal Subtotal { get; set; }

    /// <summary>Flat additional cost from the matched PricingRule (independent of selected options).</summary>
    public decimal AdditionalCost { get; set; }

    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }

    /// <summary>Sum of OrderAdjustments amounts.</summary>
    public decimal OrderAdjustmentsTotal { get; set; }

    /// <summary>Subtotal + AdditionalCost - DiscountAmount + OrderAdjustmentsTotal.</summary>
    public decimal EstimatedPrice { get; set; }

    /// <summary>Alias of EstimatedPrice using the newer naming convention. Same value, added for callers that prefer it.</summary>
    public decimal CalculatedTotal { get; set; }

    public string Currency { get; set; } = "VND";

    public Guid? AppliedPricingRuleId { get; set; }
    public IReadOnlyList<PriceBreakdownOptionDto> SelectedOptions { get; set; } = [];
}

public class PriceAdjustmentLineDto
{
    public Guid OptionId { get; set; }
    public string OptionType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;

    /// <summary>The raw per-unit or per-order amount (not multiplied by quantity).</summary>
    public decimal Amount { get; set; }

    /// <summary>Amount * Quantity for a unit adjustment; equal to Amount for an order adjustment.</summary>
    public decimal Total { get; set; }
}

public class PriceBreakdownOptionDto
{
    /// <summary>The ProductOption assignment id (product-scoped) -- what SelectedOptionIds contains.</summary>
    public Guid OptionId { get; set; }

    /// <summary>The catalog (OptionDefinition) id this assignment points to -- what a QuoteRequestOption snapshot's soft reference should store.</summary>
    public Guid OptionDefinitionId { get; set; }

    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;
    public string PriceAdjustmentType { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }
}
