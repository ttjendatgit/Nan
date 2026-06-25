namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

/// <summary>
/// Payload for submitting a new quote/inquiry request. No authentication required.
/// If <c>productId</c> is supplied and valid, the product and category names are snapshotted on the record.
/// </summary>
public class CreateQuoteRequestRequest
{
    /// <summary>
    /// Optional ID of the product being enquired about.
    /// If provided, the product must exist — an invalid ID returns a 404 error.
    /// Leave null for a general inquiry not tied to a specific product.
    /// </summary>
    public Guid? ProductId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? CompanyName { get; set; }
    public int Quantity { get; set; }
    public DateTime? NeededDate { get; set; }

    /// <summary>Intended use (e.g. "Sự kiện thương hiệu", "Wedding", "Resort").</summary>
    public string? UseCase { get; set; }

    public string? Message { get; set; }
}
