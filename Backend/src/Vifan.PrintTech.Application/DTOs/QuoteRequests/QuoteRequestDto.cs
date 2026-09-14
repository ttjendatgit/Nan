namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

/// <summary>Read model returned by quote request endpoints.</summary>
public class QuoteRequestDto
{
    public Guid Id { get; set; }

    /// <summary>ID of the product this inquiry is about. Null for general inquiries.</summary>
    public Guid? ProductId { get; set; }

    /// <summary>Product name captured at submission time. Preserved even if the product is later renamed or deleted.</summary>
    public string? ProductNameSnapshot { get; set; }

    /// <summary>Category name captured at submission time.</summary>
    public string? CategoryNameSnapshot { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public int Quantity { get; set; }
    public DateOnly? NeededDate { get; set; }
    public string? UseCase { get; set; }
    public string? Message { get; set; }

    /// <summary>Current status. One of: New, Contacted, Quoted, Closed, Cancelled.</summary>
    public string Status { get; set; } = string.Empty;

    // ── Pricing snapshot (null for general inquiries or pre-migration quotes) ──
    public decimal? BaseUnitPriceSnapshot { get; set; }
    public decimal? CalculatedUnitPriceSnapshot { get; set; }
    public decimal? CalculatedSubtotalSnapshot { get; set; }
    public decimal? AdditionalFeesSnapshot { get; set; }
    public decimal? DiscountAmountSnapshot { get; set; }
    public decimal? CalculatedTotalSnapshot { get; set; }
    public Guid? AppliedPricingRuleIdSnapshot { get; set; }
    public string Currency { get; set; } = "VND";

    // ── Manual staff override ──────────────────────────────────────────────
    public decimal? ManualAdjustment { get; set; }
    public decimal? FinalQuotedPrice { get; set; }
    public string? InternalNote { get; set; }

    /// <summary>Structured snapshot of the options selected at submission time. Empty for general inquiries.</summary>
    public IReadOnlyList<QuoteRequestOptionDto> Options { get; set; } = [];

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class QuoteRequestOptionDto
{
    public Guid Id { get; set; }

    /// <summary>Soft reference to the live catalog entry (OptionDefinition), for admin deep-links only. Null if later deleted.</summary>
    public Guid? OptionDefinitionId { get; set; }

    public string OptionTypeSnapshot { get; set; } = string.Empty;
    public string OptionNameSnapshot { get; set; } = string.Empty;
    public string OptionValueSnapshot { get; set; } = string.Empty;
    public string PriceAdjustmentTypeSnapshot { get; set; } = string.Empty;
    public decimal PriceAdjustmentSnapshot { get; set; }
    public decimal CalculatedAmountSnapshot { get; set; }
}
