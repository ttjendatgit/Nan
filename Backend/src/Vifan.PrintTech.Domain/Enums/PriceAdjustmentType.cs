namespace Vifan.PrintTech.Domain.Enums;

/// <summary>How a ProductOption's price contributes to a pricing calculation.</summary>
public enum PriceAdjustmentType
{
    /// <summary>No price effect.</summary>
    None = 0,

    /// <summary>Added to the unit price, multiplied by quantity.</summary>
    FixedPerUnit = 1,

    /// <summary>Added once to the order total, regardless of quantity.</summary>
    FixedPerOrder = 2
}
