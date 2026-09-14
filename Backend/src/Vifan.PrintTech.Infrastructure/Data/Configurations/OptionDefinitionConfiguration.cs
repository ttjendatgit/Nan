using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class OptionDefinitionConfiguration : IEntityTypeConfiguration<OptionDefinition>
{
    public void Configure(EntityTypeBuilder<OptionDefinition> builder)
    {
        builder.ToTable("OptionDefinitions");
        builder.Property(x => x.OptionType).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.OptionName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.OptionValue).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PriceAdjustmentType).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.AdditionalPrice).HasPrecision(18, 2);

        builder.HasIndex(x => new { x.OptionType, x.OptionValue });
    }
}
