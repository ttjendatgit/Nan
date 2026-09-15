using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class QuoteStatusEmailNotificationConfiguration : IEntityTypeConfiguration<QuoteStatusEmailNotification>
{
    public void Configure(EntityTypeBuilder<QuoteStatusEmailNotification> builder)
    {
        builder.ToTable("QuoteStatusEmailNotifications");

        builder.Property(x => x.RecipientEmail).HasMaxLength(200);
        builder.Property(x => x.FailureReason).HasMaxLength(500);

        builder.Property(x => x.NotificationType).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.DeliveryStatus).HasConversion<string>().HasMaxLength(30).IsRequired();

        // Cascade: this table is purely an audit/idempotency trail for a QuoteRequest's emails --
        // it has no meaning once the quote itself is gone (Manager-only hard delete), so there is
        // no orphan-preservation reason to keep it around, unlike the quote's own pricing snapshot.
        builder.HasOne(x => x.QuoteRequest)
            .WithMany()
            .HasForeignKey(x => x.QuoteRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        // The durable idempotency guarantee: at most one row per (quote, notification type) can
        // ever exist, so two concurrent status updates can never both succeed in creating a
        // second "Sent" record for the same email.
        builder.HasIndex(x => new { x.QuoteRequestId, x.NotificationType }).IsUnique();
    }
}
