namespace Vifan.PrintTech.Application.DTOs.Options;

/// <summary>
/// Read model for a Product's assigned option, flattened for the public/admin consumer: the
/// pricing/label fields are sourced live from the assigned OptionDefinition (Id here is the
/// ASSIGNMENT id, i.e. what SelectedOptionIds must contain), while SortOrder/IsActive are the
/// per-product assignment values. Shape is unchanged from before the catalog split so existing
/// frontend consumers (the public configurator) need no changes.
/// </summary>
public class ProductOptionDto
{
    /// <summary>The assignment (ProductOption) ID -- this is what CalculatePriceRequest.SelectedOptionIds expects.</summary>
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }

    /// <summary>The catalog entry this assignment points to.</summary>
    public Guid OptionDefinitionId { get; set; }

    public string OptionType { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
    public string OptionValue { get; set; } = string.Empty;
    public string PriceAdjustmentType { get; set; } = string.Empty;
    public decimal AdditionalPrice { get; set; }

    /// <summary>Per-product display order (independent of the catalog's own SortOrder).</summary>
    public int SortOrder { get; set; }

    /// <summary>Per-product assignment active flag (independent of the catalog entry's own IsActive).</summary>
    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
