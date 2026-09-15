using Vifan.PrintTech.Application.DTOs.QuoteRequests;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Interfaces.Services;

/// <summary>
/// Decides whether a quote status transition requires a customer notification email, and -- if
/// so -- durably records the attempt and sends it. The quote's own status change must already be
/// persisted before this is called; a delivery failure here must never roll that back.
/// </summary>
public interface IQuoteStatusNotificationService
{
    Task<QuoteStatusNotificationResultDto> NotifyIfApplicableAsync(
        QuoteRequest quote,
        QuoteRequestStatus previousStatus,
        QuoteRequestStatus newStatus,
        CancellationToken cancellationToken = default);
}
