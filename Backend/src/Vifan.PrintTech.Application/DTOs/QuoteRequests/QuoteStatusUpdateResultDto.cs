namespace Vifan.PrintTech.Application.DTOs.QuoteRequests;

/// <summary>Response payload for PUT /api/QuoteRequests/{id}/status -- the saved quote plus an
/// explicit notification outcome, so the Admin UI never has to infer email behavior from the
/// status value itself.</summary>
public class QuoteStatusUpdateResultDto
{
    public QuoteRequestDto Quote { get; set; } = null!;
    public QuoteStatusNotificationResultDto Notification { get; set; } = null!;
}

/// <summary>
/// Outcome of the (possible) customer notification email triggered by a status update.
/// <c>NotificationType</c> is null when the new status has no associated email (e.g. New, Closed,
/// Cancelled) or when the status didn't actually change.
/// </summary>
public class QuoteStatusNotificationResultDto
{
    /// <summary>"Contacted" | "Quoted" | null.</summary>
    public string? NotificationType { get; set; }

    /// <summary>"Sent" | "Failed" | "SkippedNoEmail" | "NotRequired".</summary>
    public string Outcome { get; set; } = string.Empty;

    public static QuoteStatusNotificationResultDto NotRequired(string? notificationType = null) => new()
    {
        NotificationType = notificationType,
        Outcome = "NotRequired"
    };

    public static QuoteStatusNotificationResultDto Sent(string notificationType) => new()
    {
        NotificationType = notificationType,
        Outcome = "Sent"
    };

    public static QuoteStatusNotificationResultDto Failed(string notificationType) => new()
    {
        NotificationType = notificationType,
        Outcome = "Failed"
    };

    public static QuoteStatusNotificationResultDto SkippedNoEmail(string notificationType) => new()
    {
        NotificationType = notificationType,
        Outcome = "SkippedNoEmail"
    };
}
