using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vifan.PrintTech.Domain.Entities;

namespace Vifan.PrintTech.Infrastructure.Data.Configurations;

public class ContentDocumentConfiguration : IEntityTypeConfiguration<ContentDocument>
{
    public void Configure(EntityTypeBuilder<ContentDocument> builder)
    {
        builder.ToTable("ContentDocuments");

        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();

        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30).IsRequired();

        // Plain "text" columns, matching Product.ContentBlocksJson exactly -- no jsonb anywhere
        // in this codebase yet, so introducing it here for a foundation-only entity would be a
        // new pattern, not a followed one. Block validation/parsing stays app-level (as it is for
        // Product today), not DB-enforced.
        builder.Property(x => x.BlocksJson).HasColumnType("text");
        builder.Property(x => x.DraftBlocksJson).HasColumnType("text");

        builder.Property(x => x.SeoTitle).HasMaxLength(200);
        builder.Property(x => x.SeoDescription).HasMaxLength(500);
        builder.Property(x => x.SeoKeywords).HasMaxLength(500);
        builder.Property(x => x.SeoImageUrl).HasMaxLength(500);
        builder.Property(x => x.CanonicalUrl).HasMaxLength(500);

        // A document can never share a slug with another document of the same Type (e.g. two
        // blog posts), but a Page and a BlogPost may coincidentally share one -- they live in
        // separate URL namespaces once routed, so that's not a real collision.
        builder.HasIndex(x => new { x.Type, x.Slug }).IsUnique();
        builder.HasIndex(x => x.Type);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ProductId);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
