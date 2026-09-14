namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

/// <summary>
/// Staff-only manual price override for a quote. Additive on top of the system-calculated
/// snapshot — never overwrites CalculatedTotalSnapshot, which remains the historical record of
/// what the pricing engine actually computed at submission time.
/// </summary>
public class SetFinalQuotedPriceRequest
{
    public decimal FinalQuotedPrice { get; set; }
    public decimal? ManualAdjustment { get; set; }
    public string? InternalNote { get; set; }
}
