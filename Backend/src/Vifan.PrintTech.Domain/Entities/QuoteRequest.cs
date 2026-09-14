using Vifan.PrintTech.Domain.Common;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Entities;

public class QuoteRequest : BaseEntity
{
    /// <summary>Optional reference to the product this quote is about. Nullable for general inquiries.</summary>
    public Guid? ProductId { get; set; }

    /// <summary>Snapshot of the product name at submission time, preserved even if the product is later edited.</summary>
    public string? ProductNameSnapshot { get; set; }

    /// <summary>Snapshot of the category name at submission time.</summary>
    public string? CategoryNameSnapshot { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public int Quantity { get; set; }
    public DateOnly? NeededDate { get; set; }
    public string? UseCase { get; set; }
    public string? Message { get; set; }
    public QuoteRequestStatus Status { get; set; } = QuoteRequestStatus.New;

    // ── Pricing snapshot ──────────────────────────────────────────────────
    // Populated server-side (from PricingService) at submission time and never
    // recomputed afterward. Null when ProductId is null (general inquiry) or
    // for quotes created before this snapshot existed.

    /// <summary>Base unit price at submission time (from the matched PricingRule, or Product.BasePrice).</summary>
    public decimal? BaseUnitPriceSnapshot { get; set; }

    /// <summary>Base unit price plus all FixedPerUnit option adjustments.</summary>
    public decimal? CalculatedUnitPriceSnapshot { get; set; }

    /// <summary>CalculatedUnitPriceSnapshot * Quantity.</summary>
    public decimal? CalculatedSubtotalSnapshot { get; set; }

    /// <summary>Sum of FixedPerOrder option adjustments plus the matched PricingRule's AdditionalCost.</summary>
    public decimal? AdditionalFeesSnapshot { get; set; }

    /// <summary>Discount amount applied by the matched PricingRule, if any.</summary>
    public decimal? DiscountAmountSnapshot { get; set; }

    /// <summary>Final system-calculated total: Subtotal + AdditionalFees - Discount.</summary>
    public decimal? CalculatedTotalSnapshot { get; set; }

    /// <summary>PricingRule matched at submission time, kept for traceability only (not a real FK — never re-resolved).</summary>
    public Guid? AppliedPricingRuleIdSnapshot { get; set; }

    public string Currency { get; set; } = "VND";

    // ── Manual staff override (section 22) ────────────────────────────────
    // Never overwrites the calculated snapshot above — this is an additive,
    // optional correction staff can apply while working a quote.

    /// <summary>Optional staff adjustment (positive or negative) applied on top of CalculatedTotalSnapshot.</summary>
    public decimal? ManualAdjustment { get; set; }

    /// <summary>The price actually communicated to the customer. Set explicitly by staff; never auto-derived.</summary>
    public decimal? FinalQuotedPrice { get; set; }

    /// <summary>Staff-only note, distinct from the customer-supplied Message.</summary>
    public string? InternalNote { get; set; }

    /// <summary>Structured snapshot of the options selected at submission time. See QuoteRequestOption.</summary>
    public ICollection<QuoteRequestOption> Options { get; set; } = [];
}
