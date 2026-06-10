using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class ProductOptionConfiguration : IEntityTypeConfiguration<ProductOption>
{
    public void Configure(EntityTypeBuilder<ProductOption> builder)
    {
        builder.ToTable("ProductOptions");
        builder.Property(x => x.OptionType).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.OptionName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OptionValue).HasMaxLength(200).IsRequired();
        builder.Property(x => x.AdditionalPrice).HasPrecision(18, 2);
        builder.HasIndex(x => new { x.ProductId, x.OptionType, x.OptionValue });

        builder.HasOne(x => x.Product)
            .WithMany(x => x.Options)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
