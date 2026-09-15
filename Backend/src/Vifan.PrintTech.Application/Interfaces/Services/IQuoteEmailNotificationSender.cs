namespace Vifan.PrintTech.Application.Interfaces.Services;

/// <summary>A single outbound quote-status email, fully composed server-side. The sender never
/// receives a client-supplied recipient, subject, or body -- only the finished message built by
/// <see cref="Vifan.PrintTech.Application.Emails.QuoteStatusEmailTemplateBuilder"/>.</summary>
public class QuoteStatusEmailMessage
{
    /// <summary>The quote's own customer-provided contact email. Unverified -- Nan does not
    /// confirm email ownership at submission or elsewhere, so this is best-effort delivery to
    /// whatever address the customer typed in, not a confirmed or account-linked address.</summary>
    public string RecipientEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string PlainTextBody { get; set; } = string.Empty;
}

/// <summary>
/// Small, feature-specific abstraction over whatever transport actually delivers quote-status
/// emails (SMTP today). Deliberately narrow -- this is not a general notification/event bus.
/// </summary>
public interface IQuoteEmailNotificationSender
{
    /// <summary>Sends the message. Throws on delivery failure; callers decide how to record that.</summary>
    Task SendAsync(QuoteStatusEmailMessage message, CancellationToken cancellationToken = default);
}
