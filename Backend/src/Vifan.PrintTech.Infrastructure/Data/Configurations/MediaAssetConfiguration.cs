using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable("MediaAssets");

        builder.Property(x => x.FileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.OriginalName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Url).HasMaxLength(500).IsRequired();
        builder.Property(x => x.PublicId).HasMaxLength(300).IsRequired();
        builder.Property(x => x.MimeType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Folder).HasMaxLength(200);

        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.Folder);

        // Defensive data-integrity measure beyond what was asked: PublicId is the Cloudinary
        // identity of the asset, so two rows pointing at the same Cloudinary object would be a
        // real data bug, not a legitimate case.
        builder.HasIndex(x => x.PublicId).IsUnique();
    }
}
