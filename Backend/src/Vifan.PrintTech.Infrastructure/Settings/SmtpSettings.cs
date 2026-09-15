namespace Vifan.PrintTech.Infrastructure.Settings;

/// <summary>
/// Generic SMTP configuration for outbound quote-status emails. No vendor lock-in: any SMTP
/// provider (a real mailbox, SendGrid/Mailgun/SES SMTP relay, a dev-only catcher like MailHog)
/// works as long as these values point at it. All real values belong in user-secrets or
/// environment variables -- never committed.
/// </summary>
public class SmtpSettings
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;

    /// <summary>Explicit transport security. Defaults to STARTTLS on port 587, matching the
    /// behavior of the old "UseSsl: true" setting this replaces.</summary>
    public SmtpSecurityMode SecurityMode { get; set; } = SmtpSecurityMode.StartTls;

    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "Nan";
}
