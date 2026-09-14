using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class ProductOptionConfiguration : IEntityTypeConfiguration<ProductOption>
{
    public void Configure(EntityTypeBuilder<ProductOption> builder)
    {
        builder.ToTable("ProductOptions");

        // A catalog entry can be assigned to a product at most once.
        builder.HasIndex(x => new { x.ProductId, x.OptionDefinitionId }).IsUnique();

        builder.HasOne(x => x.Product)
            .WithMany(x => x.Options)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict, not Cascade: deleting a catalog entry that still has product assignments
        // must be rejected by the application guard before it ever reaches the database: this
        // FK is the last-resort backstop if that guard is ever bypassed.
        builder.HasOne(x => x.OptionDefinition)
            .WithMany(x => x.ProductAssignments)
            .HasForeignKey(x => x.OptionDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
