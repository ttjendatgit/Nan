using Microsoft.Extensions.Logging.Abstractions;
using Vifan.PrintTech.Application.DTOs.QuoteRequests;
using Vifan.PrintTech.Application.Emails;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Repositories;
using Vifan.PrintTech.Infrastructure.Services;
using Xunit;
using static Vifan.PrintTech.Tests.TestEntityFactory;

namespace Vifan.PrintTech.Tests;

/// <summary>Covers the Quote Status Email Notifications feature: which transitions send an
/// email, durable idempotency, failure handling, and content/recipient safety.</summary>
public class QuoteStatusNotificationTests
{
    private static (QuoteRequestService Service, ApplicationDbContext Db, FakeQuoteEmailNotificationSender Sender) BuildService()
    {
        var db = TestDbContextFactory.Create();
        var sender = new FakeQuoteEmailNotificationSender();
        var pricingService = new PricingService(
            new ProductRepository(db),
            new ProductOptionRepository(db),
            new PricingRuleRepository(db));
        var notificationService = new QuoteStatusNotificationService(
            new Repository<QuoteStatusEmailNotification>(db),
            sender,
            new UnitOfWork(db),
            NullLogger<QuoteStatusNotificationService>.Instance);
        var service = new QuoteRequestService(
            new QuoteRequestRepository(db),
            new ProductRepository(db),
            pricingService,
            notificationService,
            new UnitOfWork(db));
        return (service, db, sender);
    }

    private static async Task<QuoteRequestDto> NewQuoteWithEmail(
        QuoteRequestService service, string email = "khach@example.com") =>
        await service.CreateAsync(new CreateQuoteRequestRequest
        {
            FullName = "Nguyễn Văn An",
            Phone = "0901234567",
            Email = email,
            Quantity = 100
        });

    // 1. New -> Contacted sends Contacted email once.
    [Fact]
    public async Task NewToContacted_SendsContactedEmail()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service);

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        Assert.Equal("Contacted", result.Notification.NotificationType);
        Assert.Equal("Sent", result.Notification.Outcome);
        Assert.Single(sender.SentMessages);
        Assert.Equal("khach@example.com", sender.SentMessages[0].RecipientEmail);
    }

    // 2. Saving Contacted again does not resend.
    [Fact]
    public async Task SavingContactedAgain_DoesNotResend()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service);
        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        Assert.Equal("NotRequired", result.Notification.Outcome);
        Assert.Single(sender.SentMessages); // still just the first send
    }

    // 3. Contacted -> Quoted sends Quoted email.
    [Fact]
    public async Task ContactedToQuoted_SendsQuotedEmail()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service);
        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Quoted" });

        Assert.Equal("Quoted", result.Notification.NotificationType);
        Assert.Equal("Sent", result.Notification.Outcome);
        Assert.Equal(2, sender.SentMessages.Count);
        Assert.Contains(sender.SentMessages, m => m.Subject == "Nan đã gửi thông tin báo giá cho bạn");
    }

    // 4. Saving Quoted again does not resend.
    [Fact]
    public async Task SavingQuotedAgain_DoesNotResend()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service);
        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Quoted" });

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Quoted" });

        Assert.Equal("NotRequired", result.Notification.Outcome);
        Assert.Single(sender.SentMessages);
    }

    // 5. Returning later to Contacted does not resend if Contacted notification was already sent.
    [Fact]
    public async Task ReturningToContacted_AfterAlreadySent_DoesNotResend()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service);
        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });
        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "New" }); // go backward

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" }); // return

        Assert.Equal("NotRequired", result.Notification.Outcome);
        Assert.Single(sender.SentMessages); // only the original Contacted send
    }

    // 6. Missing email saves status and returns SkippedNoEmail.
    [Fact]
    public async Task MissingEmail_SavesStatus_ReturnsSkippedNoEmail()
    {
        var (service, _, sender) = BuildService();
        var quote = await service.CreateAsync(new CreateQuoteRequestRequest
        {
            FullName = "Trần Thị Bình",
            Phone = "0909999999",
            Quantity = 50
            // no Email
        });

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        Assert.Equal("Contacted", result.Quote.Status);
        Assert.Equal("SkippedNoEmail", result.Notification.Outcome);
        Assert.Empty(sender.SentMessages);
    }

    // 7 & 8. Email provider failure does not rollback saved status, and is recorded/reported.
    [Fact]
    public async Task ProviderFailure_StatusStillSaved_FailureReported()
    {
        var (service, db, sender) = BuildService();
        sender.ThrowOnSend = new InvalidOperationException("SMTP timeout");
        var quote = await NewQuoteWithEmail(service);

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        Assert.Equal("Contacted", result.Quote.Status); // status persisted despite the email failure
        Assert.Equal("Failed", result.Notification.Outcome);

        var refetched = await service.GetByIdAsync(quote.Id);
        Assert.Equal("Contacted", refetched.Status);

        var row = Assert.Single(db.QuoteStatusEmailNotifications);
        Assert.Equal(QuoteEmailDeliveryStatus.Failed, row.DeliveryStatus);
        Assert.NotNull(row.FailureReason);
        Assert.NotNull(row.FailedAt);
    }

    // 9. Notification recipient comes from backend data, never client input.
    // (There is no recipient parameter anywhere on the status-update request DTO to begin with.)
    [Fact]
    public void UpdateQuoteRequestStatusRequest_ExposesNoRecipientOrEmailField()
    {
        var emailLikeProperties = typeof(UpdateQuoteRequestStatusRequest)
            .GetProperties()
            .Where(p => p.Name.Contains("email", StringComparison.OrdinalIgnoreCase)
                     || p.Name.Contains("recipient", StringComparison.OrdinalIgnoreCase));

        Assert.Empty(emailLikeProperties);
    }

    // Recipient is whatever contact email the customer typed into the quote form -- unverified,
    // not a confirmed or account-linked address.
    [Fact]
    public async Task Recipient_IsAlwaysTheQuotesOwnCustomerProvidedEmail()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service, "customer-provided@example.com");

        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        Assert.Equal("customer-provided@example.com", sender.SentMessages[0].RecipientEmail);
    }

    // 10. InternalNote is not included in email.
    [Fact]
    public async Task InternalNote_IsNeverIncludedInEmailContent()
    {
        var (service, _, sender) = BuildService();
        var quote = await NewQuoteWithEmail(service);
        await service.SetFinalQuotedPriceAsync(quote.Id, new SetFinalQuotedPriceRequest
        {
            FinalQuotedPrice = 5_000_000m,
            InternalNote = "sale chốt đơn - khách khó tính, giảm thêm 5%"
        });

        await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        var sent = Assert.Single(sender.SentMessages);
        Assert.DoesNotContain("sale chốt đơn", sent.HtmlBody);
        Assert.DoesNotContain("sale chốt đơn", sent.PlainTextBody);
        Assert.DoesNotContain("khách khó tính", sent.HtmlBody);
    }

    // 11. Contacted and Quoted templates contain the correct business message.
    [Theory]
    [InlineData(QuoteEmailNotificationType.Contacted, "Nan đã liên hệ với bạn về yêu cầu báo giá", "liên hệ với bạn qua Zalo")]
    [InlineData(QuoteEmailNotificationType.Quoted, "Nan đã gửi thông tin báo giá cho bạn", "gửi thông tin báo giá cho yêu cầu của bạn qua Zalo")]
    public void TemplateBuilder_ProducesCorrectSubjectAndBusinessMessage(
        QuoteEmailNotificationType type, string expectedSubject, string expectedPhrase)
    {
        var content = QuoteStatusEmailTemplateBuilder.Build(type, "Nguyễn Văn An");

        Assert.Equal(expectedSubject, content.Subject);
        Assert.Contains(expectedPhrase, content.PlainTextBody);
        Assert.Contains(expectedPhrase, content.HtmlBody);
        Assert.Contains("Zalo", content.PlainTextBody);
        Assert.DoesNotContain("sale chốt đơn", content.PlainTextBody);
    }

    [Fact]
    public void TemplateBuilder_EscapesCustomerNameInHtml()
    {
        var content = QuoteStatusEmailTemplateBuilder.Build(QuoteEmailNotificationType.Contacted, "<script>alert(1)</script>");

        Assert.DoesNotContain("<script>alert(1)</script>", content.HtmlBody);
        Assert.Contains("&lt;script&gt;", content.HtmlBody);
    }

    // 12. Existing Quote snapshot/pricing behavior remains unchanged by a status update.
    [Fact]
    public async Task StatusUpdate_DoesNotAlterPricingSnapshot()
    {
        var (service, db, _) = BuildService();
        var product = NewProduct(basePrice: 9_000m);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var quote = await service.CreateAsync(new CreateQuoteRequestRequest
        {
            ProductId = product.Id,
            FullName = "Nguyễn Văn An",
            Phone = "0901234567",
            Email = "khach@example.com",
            Quantity = 500
        });
        var originalTotal = quote.CalculatedTotalSnapshot;

        var result = await service.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });

        Assert.Equal(originalTotal, result.Quote.CalculatedTotalSnapshot);
    }

    // Concurrency: two near-simultaneous transitions into the same notification type must not
    // both end up "Sent" -- the unique index is the backstop when the in-memory duplicate check
    // itself races.
    [Fact]
    public async Task ConcurrentTransitionsIntoSameType_OnlyOneNotificationEverSent()
    {
        var dbName = Guid.NewGuid().ToString();
        var db1 = TestDbContextFactory.CreateNamed(dbName);
        var db2 = TestDbContextFactory.CreateNamed(dbName);
        var sender1 = new FakeQuoteEmailNotificationSender();
        var sender2 = new FakeQuoteEmailNotificationSender();

        var seedService = BuildServiceOn(db1, sender1);
        var quote = await seedService.CreateAsync(new CreateQuoteRequestRequest
        {
            FullName = "Nguyễn Văn An",
            Phone = "0901234567",
            Email = "khach@example.com",
            Quantity = 10
        });

        var service1 = BuildServiceOn(db1, sender1);
        var service2 = BuildServiceOn(db2, sender2);

        var t1 = service1.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });
        var t2 = service2.UpdateStatusAsync(quote.Id, new UpdateQuoteRequestStatusRequest { Status = "Contacted" });
        await Task.WhenAll(t1, t2);

        var totalSent = sender1.SentMessages.Count + sender2.SentMessages.Count;
        Assert.Equal(1, totalSent);
    }

    private static QuoteRequestService BuildServiceOn(ApplicationDbContext db, FakeQuoteEmailNotificationSender sender)
    {
        var pricingService = new PricingService(
            new ProductRepository(db),
            new ProductOptionRepository(db),
            new PricingRuleRepository(db));
        var notificationService = new QuoteStatusNotificationService(
            new Repository<QuoteStatusEmailNotification>(db),
            sender,
            new UnitOfWork(db),
            NullLogger<QuoteStatusNotificationService>.Instance);
        return new QuoteRequestService(
            new QuoteRequestRepository(db),
            new ProductRepository(db),
            pricingService,
            notificationService,
            new UnitOfWork(db));
    }
}
