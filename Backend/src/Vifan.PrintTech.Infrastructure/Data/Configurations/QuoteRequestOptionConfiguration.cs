using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class QuoteRequestOptionConfiguration : IEntityTypeConfiguration<QuoteRequestOption>
{
    public void Configure(EntityTypeBuilder<QuoteRequestOption> builder)
    {
        builder.ToTable("QuoteRequestOptions");

        builder.Property(x => x.OptionTypeSnapshot).HasMaxLength(50).IsRequired();
        builder.Property(x => x.OptionNameSnapshot).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OptionValueSnapshot).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PriceAdjustmentTypeSnapshot).HasMaxLength(20).IsRequired();
        builder.Property(x => x.PriceAdjustmentSnapshot).HasPrecision(18, 2);
        builder.Property(x => x.CalculatedAmountSnapshot).HasPrecision(18, 2);

        builder.HasIndex(x => x.QuoteRequestId);

        // Snapshot rows belong to their quote: deleting a quote deletes its snapshot rows.
        builder.HasOne(x => x.QuoteRequest)
            .WithMany(x => x.Options)
            .HasForeignKey(x => x.QuoteRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft reference only: deleting an OptionDefinition must NEVER touch quote history.
        builder.HasOne(x => x.OptionDefinition)
            .WithMany()
            .HasForeignKey(x => x.OptionDefinitionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
