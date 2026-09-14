using Vifan.PrintTech.Domain.Common;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Entities;

/// <summary>
/// A centrally-managed, product-independent catalog entry (e.g. "Nan tre", +1.500đ/unit).
/// Admins manage this catalog once; a Product only shows a catalog entry after it is explicitly
/// assigned via a <see cref="ProductOption"/> row. Creating a catalog entry never, by itself,
/// exposes it on any product.
/// </summary>
public class OptionDefinition : BaseEntity
{
    public OptionType OptionType { get; set; }

    /// <summary>Group label shown to the customer, e.g. "Nan".</summary>
    public string OptionName { get; set; } = string.Empty;

    /// <summary>The selectable value itself, e.g. "Nan tre".</summary>
    public string OptionValue { get; set; } = string.Empty;

    public PriceAdjustmentType PriceAdjustmentType { get; set; } = PriceAdjustmentType.FixedPerUnit;

    /// <summary>The price amount, interpreted per <see cref="PriceAdjustmentType"/>. Ignored when type is None.</summary>
    public decimal AdditionalPrice { get; set; }

    /// <summary>Default admin-controlled order within the catalog list. Product-specific display order lives on ProductOption instead.</summary>
    public int SortOrder { get; set; }

    /// <summary>Catalog-level active flag. Inactive: cannot be newly assigned to a product, and does not appear on the public configurator for products it's still assigned to.</summary>
    public bool IsActive { get; set; } = true;

    public ICollection<ProductOption> ProductAssignments { get; set; } = [];
}
