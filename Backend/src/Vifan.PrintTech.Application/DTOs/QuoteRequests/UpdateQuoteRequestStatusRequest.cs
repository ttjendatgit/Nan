namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

/// <summary>Payload for updating the status of a quote request. Staff or Manager only.</summary>
public class UpdateQuoteRequestStatusRequest
{
    /// <summary>
    /// New status value. Accepted values: <c>New</c>, <c>Contacted</c>, <c>Quoted</c>, <c>Closed</c>, <c>Cancelled</c>.
    /// </summary>
    public string Status { get; set; } = string.Empty;
}
