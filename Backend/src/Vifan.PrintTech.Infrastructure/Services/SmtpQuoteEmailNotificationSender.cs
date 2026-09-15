using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Infrastructure.Settings;

namespace Vifan.PrintTech.Infrastructure.Services;

/// <summary>
/// Generic SMTP implementation of <see cref="IQuoteEmailNotificationSender"/> via MailKit (the
/// maintained successor to the obsolete System.Net.Mail.SmtpClient). Works with any SMTP
/// provider -- no vendor-specific API, so the project isn't locked to one SaaS email vendor.
/// </summary>
public class SmtpQuoteEmailNotificationSender : IQuoteEmailNotificationSender
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpQuoteEmailNotificationSender> _logger;

    public SmtpQuoteEmailNotificationSender(
        IOptions<SmtpSettings> settings,
        ILogger<SmtpQuoteEmailNotificationSender> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(QuoteStatusEmailMessage message, CancellationToken cancellationToken = default)
    {
        ValidateSettings();

        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        mime.To.Add(MailboxAddress.Parse(message.RecipientEmail));
        mime.Subject = message.Subject;
        mime.Body = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.PlainTextBody
        }.ToMessageBody();

        using var client = new SmtpClient();
        var socketOptions = ToSecureSocketOptions(_settings.SecurityMode);
        await client.ConnectAsync(_settings.Host, _settings.Port, socketOptions, cancellationToken);

        if (!string.IsNullOrEmpty(_settings.Username))
            await client.AuthenticateAsync(_settings.Username, _settings.Password, cancellationToken);

        await client.SendAsync(mime, cancellationToken);

        // The message has already been accepted by the server at this point. A failure or
        // cancellation while merely closing the connection must not surface as a delivery
        // failure to the caller -- QuoteStatusNotificationService would record the notification
        // as Failed, and a later retry would then re-send an email that already went out.
        try
        {
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "SMTP DisconnectAsync failed after SendAsync already succeeded; ignoring since the message was already delivered.");
        }
    }

    private void ValidateSettings()
    {
        if (string.IsNullOrWhiteSpace(_settings.Host))
            throw new InvalidOperationException("SMTP is not configured (Smtp:Host is empty).");

        if (_settings.Port is <= 0 or > 65535)
        {
            throw new InvalidOperationException(
                $"SMTP is misconfigured: Smtp:Port ({_settings.Port}) is not a valid TCP port.");
        }

        if (string.IsNullOrWhiteSpace(_settings.FromEmail))
            throw new InvalidOperationException("SMTP is misconfigured: Smtp:FromEmail is empty.");

        if (!MailboxAddress.TryParse(_settings.FromEmail, out _))
        {
            throw new InvalidOperationException(
                $"SMTP is misconfigured: Smtp:FromEmail ('{_settings.FromEmail}') is not a valid email address.");
        }

        var hasUsername = !string.IsNullOrEmpty(_settings.Username);
        var hasPassword = !string.IsNullOrEmpty(_settings.Password);
        if (hasUsername != hasPassword)
        {
            throw new InvalidOperationException(
                "SMTP is misconfigured: Smtp:Username and Smtp:Password must either both be set or both be empty.");
        }
    }

    private static SecureSocketOptions ToSecureSocketOptions(SmtpSecurityMode mode) => mode switch
    {
        SmtpSecurityMode.StartTls => SecureSocketOptions.StartTls,
        SmtpSecurityMode.SslOnConnect => SecureSocketOptions.SslOnConnect,
        SmtpSecurityMode.None => SecureSocketOptions.None,
        SmtpSecurityMode.Auto => SecureSocketOptions.Auto,
        _ => throw new InvalidOperationException($"SMTP is misconfigured: unsupported Smtp:SecurityMode '{mode}'.")
    };
}
