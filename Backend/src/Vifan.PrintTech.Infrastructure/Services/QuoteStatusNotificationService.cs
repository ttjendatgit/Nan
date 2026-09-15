using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;
using Vifan.PrintTech.Application.Emails;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Application.Interfaces.Services;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Infrastructure.Services;

/// <summary>
/// Decides whether a status transition requires a customer email, and durably records + sends
/// it. This is the sole authority for the "did we already notify this quote?" question -- the
/// frontend, and even QuoteRequestService, never make that call themselves.
/// </summary>
public class QuoteStatusNotificationService : IQuoteStatusNotificationService
{
    private readonly IRepository<QuoteStatusEmailNotification> _notificationRepository;
    private readonly IQuoteEmailNotificationSender _emailSender;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<QuoteStatusNotificationService> _logger;

    public QuoteStatusNotificationService(
        IRepository<QuoteStatusEmailNotification> notificationRepository,
        IQuoteEmailNotificationSender emailSender,
        IUnitOfWork unitOfWork,
        ILogger<QuoteStatusNotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _emailSender = emailSender;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<QuoteStatusNotificationResultDto> NotifyIfApplicableAsync(
        QuoteRequest quote,
        QuoteRequestStatus previousStatus,
        QuoteRequestStatus newStatus,
        CancellationToken cancellationToken = default)
    {
        // Re-saving the same status, or changing unrelated fields (notes/final price), is not a
        // real transition -- callers must only invoke this after confirming the status actually
        // changed, but this check makes the guarantee explicit here too.
        if (previousStatus == newStatus)
            return QuoteStatusNotificationResultDto.NotRequired();

        var notificationType = MapToNotificationType(newStatus);
        if (notificationType is null)
            return QuoteStatusNotificationResultDto.NotRequired();

        var type = notificationType.Value;
        var typeName = type.ToString();

        var existing = await _notificationRepository.FirstOrDefaultAsync(
            n => n.QuoteRequestId == quote.Id && n.NotificationType == type, cancellationToken);

        // Duplicate protection: once a notification of this type has genuinely been sent, it is
        // never sent again for this quote, no matter how many more times the status bounces
        // through New/Contacted/Quoted afterward.
        if (existing is not null && existing.DeliveryStatus == QuoteEmailDeliveryStatus.Sent)
            return QuoteStatusNotificationResultDto.NotRequired(typeName);

        // The quote's own customer-provided contact email -- unverified, since Nan does not
        // confirm email ownership anywhere today (at submission or otherwise). This is the only
        // recipient source: QuoteRequest is not linked to any registered account.
        var recipientEmail = quote.Email?.Trim();

        if (string.IsNullOrEmpty(recipientEmail))
        {
            await UpsertAsync(existing, quote.Id, type, null, QuoteEmailDeliveryStatus.SkippedNoEmail, cancellationToken);
            return QuoteStatusNotificationResultDto.SkippedNoEmail(typeName);
        }

        QuoteStatusEmailNotification row;
        try
        {
            row = await UpsertAsync(existing, quote.Id, type, recipientEmail, QuoteEmailDeliveryStatus.Pending, cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Lost a race to a concurrent request inserting the same (QuoteRequestId, NotificationType)
            // row -- the unique index guarantees only one attempt ever proceeds. Treat as already handled.
            _logger.LogInformation(
                "Quote {QuoteId} {NotificationType} notification lost a concurrent insert race; skipping.",
                quote.Id, typeName);
            return QuoteStatusNotificationResultDto.NotRequired(typeName);
        }

        var content = QuoteStatusEmailTemplateBuilder.Build(type, quote.FullName);

        try
        {
            await _emailSender.SendAsync(new QuoteStatusEmailMessage
            {
                RecipientEmail = recipientEmail,
                Subject = content.Subject,
                HtmlBody = content.HtmlBody,
                PlainTextBody = content.PlainTextBody
            }, cancellationToken);

            row.DeliveryStatus = QuoteEmailDeliveryStatus.Sent;
            row.SentAt = DateTime.UtcNow;
            row.FailedAt = null;
            row.FailureReason = null;
            _notificationRepository.Update(row);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return QuoteStatusNotificationResultDto.Sent(typeName);
        }
        catch (Exception ex)
        {
            // Provider/transport details are logged server-side only -- never returned to Admin.
            _logger.LogError(ex,
                "Failed to send {NotificationType} email for quote {QuoteId}.", typeName, quote.Id);

            row.DeliveryStatus = QuoteEmailDeliveryStatus.Failed;
            row.FailedAt = DateTime.UtcNow;
            row.FailureReason = Truncate(ex.Message, 500);
            _notificationRepository.Update(row);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return QuoteStatusNotificationResultDto.Failed(typeName);
        }
    }

    private async Task<QuoteStatusEmailNotification> UpsertAsync(
        QuoteStatusEmailNotification? existing,
        Guid quoteRequestId,
        QuoteEmailNotificationType type,
        string? recipientEmail,
        QuoteEmailDeliveryStatus status,
        CancellationToken cancellationToken)
    {
        if (existing is not null)
        {
            // Retrying a previous Failed/SkippedNoEmail attempt -- reuse the same row rather than
            // creating a second one (the unique index would reject a second row anyway).
            existing.RecipientEmail = recipientEmail;
            existing.DeliveryStatus = status;
            existing.FailedAt = null;
            existing.FailureReason = null;
            _notificationRepository.Update(existing);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return existing;
        }

        var row = new QuoteStatusEmailNotification
        {
            QuoteRequestId = quoteRequestId,
            NotificationType = type,
            RecipientEmail = recipientEmail,
            DeliveryStatus = status
        };
        await _notificationRepository.AddAsync(row, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return row;
    }

    private static QuoteEmailNotificationType? MapToNotificationType(QuoteRequestStatus status) => status switch
    {
        QuoteRequestStatus.Contacted => QuoteEmailNotificationType.Contacted,
        QuoteRequestStatus.Quoted => QuoteEmailNotificationType.Quoted,
        _ => null
    };

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];
}
