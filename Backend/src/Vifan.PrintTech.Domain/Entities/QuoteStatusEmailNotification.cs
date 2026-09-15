using Vifan.PrintTech.Domain.Common;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Domain.Entities;

/// <summary>
/// Durable audit + idempotency record for a single (QuoteRequest, NotificationType) customer
/// email. At most one row ever exists per (QuoteRequestId, NotificationType) pair -- enforced by
/// a unique index -- so a quote can never receive the same successfully-sent status email twice,
/// even across repeated or concurrent status-update requests.
/// </summary>
public class QuoteStatusEmailNotification : BaseEntity
{
    public Guid QuoteRequestId { get; set; }
    public QuoteRequest? QuoteRequest { get; set; }

    public QuoteEmailNotificationType NotificationType { get; set; }

    /// <summary>
    /// Snapshot of the address the email was (or would have been) sent to -- the quote's own
    /// customer-provided contact email (QuoteRequest.Email). This address is unverified: Nan does
    /// not confirm email ownership at quote submission or anywhere else today. Null when
    /// SkippedNoEmail.
    /// </summary>
    public string? RecipientEmail { get; set; }

    public QuoteEmailDeliveryStatus DeliveryStatus { get; set; } = QuoteEmailDeliveryStatus.Pending;

    public DateTime? SentAt { get; set; }
    public DateTime? FailedAt { get; set; }

    /// <summary>Short, log-safe failure summary. Never shown to Admin verbatim -- provider details stay server-side.</summary>
    public string? FailureReason { get; set; }
}
