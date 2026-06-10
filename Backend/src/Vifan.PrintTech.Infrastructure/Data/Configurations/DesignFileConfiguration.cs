using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class DesignFileConfiguration : IEntityTypeConfiguration<DesignFile>
{
    public void Configure(EntityTypeBuilder<DesignFile> builder)
    {
        builder.ToTable("DesignFiles");
        builder.Property(x => x.FileName).HasMaxLength(260).IsRequired();
        builder.Property(x => x.FileUrl).HasMaxLength(500).IsRequired();
        builder.Property(x => x.FileType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ReviewStatus).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.ReviewNote).HasMaxLength(2000);
        builder.HasIndex(x => x.CustomerId);
        builder.HasIndex(x => x.ReviewStatus);

        builder.HasOne(x => x.Customer)
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Staff)
            .WithMany()
            .HasForeignKey(x => x.StaffId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
