using Vifan.PrintTech.Domain.Common;

namespace Vifan.PrintTech.Domain.Entities;

/// <summary>
/// Immutable, structured snapshot of one selected option at the moment a QuoteRequest was
/// submitted. <see cref="OptionDefinitionId"/> is a soft reference only (SetNull on delete) —
/// every other field here is authoritative for this quote's history and must never be
/// recomputed from the live catalog entry, which may later be renamed, repriced, deactivated,
/// or deleted.
///
/// This points at the catalog entry (OptionDefinition), not the per-product assignment row
/// (ProductOption): unassigning an option from a product is a routine, frequent action and must
/// never affect this deep-link. Only deleting the catalog entry itself -- a rare, heavily
/// guarded action -- nulls it.
/// </summary>
public class QuoteRequestOption : BaseEntity
{
    public Guid QuoteRequestId { get; set; }
    public QuoteRequest QuoteRequest { get; set; } = null!;

    /// <summary>Soft reference to the source catalog entry, for admin deep-links only. Null if the catalog entry was later deleted.</summary>
    public Guid? OptionDefinitionId { get; set; }
    public OptionDefinition? OptionDefinition { get; set; }

    public string OptionTypeSnapshot { get; set; } = string.Empty;
    public string OptionNameSnapshot { get; set; } = string.Empty;
    public string OptionValueSnapshot { get; set; } = string.Empty;
    public string PriceAdjustmentTypeSnapshot { get; set; } = string.Empty;

    /// <summary>The raw per-unit or per-order adjustment amount at submission time.</summary>
    public decimal PriceAdjustmentSnapshot { get; set; }

    /// <summary>The actual amount this option contributed to the quote total (Amount * Quantity for FixedPerUnit, Amount for FixedPerOrder, 0 for None).</summary>
    public decimal CalculatedAmountSnapshot { get; set; }
}
