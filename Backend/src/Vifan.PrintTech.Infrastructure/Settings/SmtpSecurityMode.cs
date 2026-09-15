namespace Vifan.PrintTech.Infrastructure.Settings;

/// <summary>
/// Explicit SMTP transport security, replacing the old ambiguous "UseSsl" boolean (which actually
/// selected STARTTLS, not implicit TLS/SSL-on-connect -- two genuinely different handshakes on
/// different ports). Names match MailKit's <see cref="MailKit.Security.SecureSocketOptions"/> so
/// the mapping in <see cref="SmtpQuoteEmailNotificationSender"/> stays a straight passthrough.
/// </summary>
public enum SmtpSecurityMode
{
    /// <summary>Connect in plaintext, then upgrade via STARTTLS (typically port 587). Current default.</summary>
    StartTls,

    /// <summary>Connect already wrapped in TLS/SSL from the first byte (typically port 465).</summary>
    SslOnConnect,

    /// <summary>No transport encryption. Only for trusted local/dev relays (e.g. MailHog).</summary>
    None,

    /// <summary>Let MailKit infer the right option from the port.</summary>
    Auto
}
