using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class QuoteRequestConfiguration : IEntityTypeConfiguration<QuoteRequest>
{
    public void Configure(EntityTypeBuilder<QuoteRequest> builder)
    {
        builder.ToTable("QuoteRequests");

        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(200);
        builder.Property(x => x.CompanyName).HasMaxLength(200);
        builder.Property(x => x.ProductNameSnapshot).HasMaxLength(200);
        builder.Property(x => x.CategoryNameSnapshot).HasMaxLength(200);
        builder.Property(x => x.UseCase).HasMaxLength(500);
        builder.Property(x => x.Message).HasMaxLength(2000);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.ProductId);
    }
}
