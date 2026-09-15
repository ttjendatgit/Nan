using Vifan.PrintTech.Application.Interfaces.Services;

namespace Vifan.PrintTech.Tests;

/// <summary>
/// Hand-rolled test double for <see cref="IQuoteEmailNotificationSender"/> -- this project has no
/// mocking framework, and a real SMTP call obviously can't run in tests. Records every message it
/// was asked to send and can be told to fail on demand, to exercise the failure/idempotency paths.
/// </summary>
public class FakeQuoteEmailNotificationSender : IQuoteEmailNotificationSender
{
    public List<QuoteStatusEmailMessage> SentMessages { get; } = [];
    public int CallCount { get; private set; }

    /// <summary>When set, every SendAsync call throws this instead of "succeeding".</summary>
    public Exception? ThrowOnSend { get; set; }

    public Task SendAsync(QuoteStatusEmailMessage message, CancellationToken cancellationToken = default)
    {
        CallCount++;

        if (ThrowOnSend is not null)
            throw ThrowOnSend;

        SentMessages.Add(message);
        return Task.CompletedTask;
    }
}
