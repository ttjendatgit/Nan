namespace Vifan.PrintTech.Domain.Enums;

/// <summary>Delivery outcome of a single QuoteStatusEmailNotification attempt.</summary>
public enum QuoteEmailDeliveryStatus
{
    /// <summary>Row created for an in-flight send attempt; should never be the resting state for long.</summary>
    Pending = 0,
    Sent = 1,
    Failed = 2,
    /// <summary>The quote has no usable customer email -- no send was attempted.</summary>
    SkippedNoEmail = 3
}
