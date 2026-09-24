using Vifan.PrintTech.Application.DTOs.Content;
using Vifan.PrintTech.Application.Exceptions;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;
using Vifan.PrintTech.Infrastructure.Repositories;
using Vifan.PrintTech.Infrastructure.Services;
using Xunit;

namespace Vifan.PrintTech.Tests;

/// <summary>Content Studio B1: public (Published-only) reads and reserved Page slugs.</summary>
public class ContentDocumentServiceTests
{
    private const string PublishedBlocks = """[{"type":"paragraph","text":"published"}]""";
    private const string DraftBlocks = """[{"type":"paragraph","text":"draft"}]""";

    private static (ContentDocumentService Service, ApplicationDbContext Db) BuildService()
    {
        var db = TestDbContextFactory.Create();
        var service = new ContentDocumentService(
            new ContentDocumentRepository(db),
            new ProductRepository(db),
            new UnitOfWork(db));
        return (service, db);
    }

    private static async Task<ContentDocument> SeedAsync(
        ApplicationDbContext db,
        ContentDocumentType type,
        string slug,
        ContentStatus status,
        string? blocks = PublishedBlocks,
        string? draftBlocks = null)
    {
        var document = new ContentDocument
        {
            Type = type,
            Slug = slug,
            Title = $"Title {slug}",
            Status = status,
            BlocksJson = blocks,
            DraftBlocksJson = draftBlocks,
            SeoTitle = "Seo title",
            SeoDescription = "Seo description",
            SeoKeywords = "a, b",
            SeoImageUrl = "https://example.com/og.png",
            CanonicalUrl = "https://example.com/ve-nan"
        };
        db.ContentDocuments.Add(document);
        await db.SaveChangesAsync();
        return document;
    }

    // ── A. Read one published document ─────────────────────────────────────

    [Fact]
    public async Task GetPublishedAsync_PublishedWithPendingDraft_ReturnsPublishedBlocksOnly()
    {
        var (service, db) = BuildService();
        await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published, PublishedBlocks, DraftBlocks);

        var dto = await service.GetPublishedAsync("page", "ve-nan");

        Assert.Equal(PublishedBlocks, dto.BlocksJson);
        Assert.Equal("Page", dto.Type);
        Assert.Equal("ve-nan", dto.Slug);
        Assert.Equal("Title ve-nan", dto.Title);
        Assert.Equal("Seo title", dto.SeoTitle);
        Assert.Equal("Seo description", dto.SeoDescription);
        Assert.Equal("a, b", dto.SeoKeywords);
        Assert.Equal("https://example.com/og.png", dto.SeoImageUrl);
        Assert.Equal("https://example.com/ve-nan", dto.CanonicalUrl);
    }

    [Fact]
    public async Task GetPublishedAsync_EmptyPublishedBlocks_DoesNotFallBackToDraft()
    {
        var (service, db) = BuildService();
        await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published, blocks: null, draftBlocks: DraftBlocks);

        var dto = await service.GetPublishedAsync("Page", "ve-nan");

        Assert.Null(dto.BlocksJson);
    }

    [Fact]
    public void PublishedContentDocumentDto_HasNoDraftOrInternalFields()
    {
        var names = typeof(PublishedContentDocumentDto).GetProperties().Select(p => p.Name).ToHashSet();

        Assert.DoesNotContain(nameof(ContentDocument.DraftBlocksJson), names);
        Assert.DoesNotContain(nameof(ContentDocument.Id), names);
        Assert.DoesNotContain(nameof(ContentDocument.Status), names);
        Assert.DoesNotContain(nameof(ContentDocument.ProductId), names);
        Assert.DoesNotContain(nameof(ContentDocument.Product), names);
    }

    [Theory]
    [InlineData(ContentStatus.Draft)]
    [InlineData(ContentStatus.Archived)]
    public async Task GetPublishedAsync_NotPublished_ThrowsNotFound(ContentStatus status)
    {
        var (service, db) = BuildService();
        await SeedAsync(db, ContentDocumentType.Page, "ve-nan", status);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublishedAsync("Page", "ve-nan"));
    }

    [Fact]
    public async Task GetPublishedAsync_UnknownSlug_ThrowsNotFound()
    {
        var (service, db) = BuildService();
        await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublishedAsync("Page", "khong-ton-tai"));
    }

    [Fact]
    public async Task GetPublishedAsync_WrongType_ThrowsNotFound()
    {
        var (service, db) = BuildService();
        await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublishedAsync("BlogPost", "ve-nan"));
    }

    // ── B. Sitemap listing ─────────────────────────────────────────────────

    [Fact]
    public async Task GetPublishedSummariesAsync_OnlyPublishedOfRequestedType()
    {
        var (service, db) = BuildService();
        var published = await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published);
        await SeedAsync(db, ContentDocumentType.Page, "a-published", ContentStatus.Published);
        await SeedAsync(db, ContentDocumentType.Page, "nhap", ContentStatus.Draft);
        await SeedAsync(db, ContentDocumentType.Page, "cu", ContentStatus.Archived);
        await SeedAsync(db, ContentDocumentType.BlogPost, "bai-viet", ContentStatus.Published);

        var items = await service.GetPublishedSummariesAsync("page");

        Assert.Equal(["a-published", "ve-nan"], items.Select(x => x.Slug));
        Assert.Equal(published.UpdatedAt, items.Single(x => x.Slug == "ve-nan").UpdatedAt);
        Assert.NotEqual(default, items[0].UpdatedAt);
    }

    [Fact]
    public async Task GetPublishedSummariesAsync_ReturnsEveryDocument_NoImplicitPageSize()
    {
        var (service, db) = BuildService();
        for (var i = 0; i < 120; i++)
            await SeedAsync(db, ContentDocumentType.Page, $"page-{i:D3}", ContentStatus.Published);

        var items = await service.GetPublishedSummariesAsync("Page");

        Assert.Equal(120, items.Count);
    }

    [Fact]
    public async Task GetPublishedAsync_InvalidType_ThrowsValidation()
    {
        var (service, _) = BuildService();

        await Assert.ThrowsAsync<ValidationException>(() => service.GetPublishedAsync("NotAType", "ve-nan"));
    }

    // ── B1 fix: Save Draft on a Published document ─────────────────────────
    // Mirrors ContentStudio's exact payloads: Save Draft sends the document's current status plus
    // the unchanged published BlocksJson and the editor content as DraftBlocksJson; Publish sends
    // "Published" with the editor content as BlocksJson and DraftBlocksJson = null.

    private static UpdateContentDocumentRequest SaveDraftRequest(string status, string? publishedBlocks, string draftBlocks) =>
        new() { Title = "Trang", Slug = "ve-nan", Status = status, BlocksJson = publishedBlocks, DraftBlocksJson = draftBlocks };

    private static UpdateContentDocumentRequest PublishRequest(string blocks) =>
        new() { Title = "Trang", Slug = "ve-nan", Status = "Published", BlocksJson = blocks, DraftBlocksJson = null };

    [Fact]
    public async Task SaveDraftThenPublish_OnPublishedDocument_KeepsV1PublicUntilPublish()
    {
        const string v1 = """[{"type":"paragraph","text":"B1_PUBLISHED_V1"}]""";
        const string v2 = """[{"type":"paragraph","text":"B1_DRAFT_V2"}]""";
        var (service, db) = BuildService();
        var document = await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published, v1);

        var afterDraft = await service.UpdateAsync(document.Id, SaveDraftRequest("Published", v1, v2));

        Assert.Equal("Published", afterDraft.Status);
        Assert.Equal(v1, afterDraft.BlocksJson);
        Assert.Equal(v2, afterDraft.DraftBlocksJson);
        Assert.Equal(v1, (await service.GetPublishedAsync("Page", "ve-nan")).BlocksJson);
        // What the editor reloads from (draft-preferred) is still V2.
        Assert.Equal(v2, (await service.GetByIdAsync(document.Id)).DraftBlocksJson);

        await service.UpdateAsync(document.Id, PublishRequest(v2));

        Assert.Equal(v2, (await service.GetPublishedAsync("Page", "ve-nan")).BlocksJson);
    }

    [Fact]
    public async Task SaveDraft_OnNeverPublishedDocument_StaysDraftAndNotPublic()
    {
        var (service, db) = BuildService();
        var document = await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Draft, blocks: null);

        var saved = await service.UpdateAsync(document.Id, SaveDraftRequest("Draft", null, DraftBlocks));

        Assert.Equal("Draft", saved.Status);
        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublishedAsync("Page", "ve-nan"));
    }

    [Fact]
    public async Task Update_ExplicitDraftStatus_StillUnpublishes()
    {
        // The backend honors an explicit status -- it does not force Published -- so an intentional
        // unpublish via the API keeps working.
        var (service, db) = BuildService();
        var document = await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Published);

        await service.UpdateAsync(document.Id, SaveDraftRequest("Draft", PublishedBlocks, DraftBlocks));

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetPublishedAsync("Page", "ve-nan"));
    }

    // ── D. Reserved Page slugs ─────────────────────────────────────────────

    [Theory]
    [InlineData("admin")]
    [InlineData("Admin")]
    [InlineData(" API ")]
    [InlineData("PRODUCTS")]
    [InlineData("auth")]
    [InlineData("dev")]
    public async Task CreateAsync_PageWithReservedSlug_IsRejected(string slug)
    {
        var (service, db) = BuildService();

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateContentDocumentRequest
        {
            Type = "Page",
            Title = "Trang",
            Slug = slug,
            Status = "Draft"
        }));
        Assert.Empty(db.ContentDocuments);
    }

    [Fact]
    public async Task CreateAsync_PageWithoutSlug_TitleNormalizingToReserved_IsRejected()
    {
        var (service, _) = BuildService();

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateContentDocumentRequest
        {
            Type = "Page",
            Title = "Products",
            Status = "Draft"
        }));
    }

    [Fact]
    public async Task UpdateAsync_PageToReservedSlug_IsRejected_AndSlugUnchanged()
    {
        var (service, db) = BuildService();
        var document = await SeedAsync(db, ContentDocumentType.Page, "ve-nan", ContentStatus.Draft);

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(document.Id, new UpdateContentDocumentRequest
        {
            Title = "Trang",
            Slug = "Admin",
            Status = "Draft"
        }));

        await db.Entry(document).ReloadAsync();
        Assert.Equal("ve-nan", document.Slug);
    }

    [Fact]
    public async Task CreateAsync_BlogPostWithReservedWord_IsAllowed()
    {
        var (service, _) = BuildService();

        var dto = await service.CreateAsync(new CreateContentDocumentRequest
        {
            Type = "BlogPost",
            Title = "Bai viet",
            Slug = "admin",
            Status = "Draft"
        });

        Assert.Equal("admin", dto.Slug);
    }

    [Fact]
    public async Task CreateAsync_PageWithOrdinarySlug_StillWorks()
    {
        var (service, _) = BuildService();

        var dto = await service.CreateAsync(new CreateContentDocumentRequest
        {
            Type = "Page",
            Title = "Về Nan",
            Status = "Published"
        });

        Assert.Equal("ve-nan", dto.Slug);
    }
}
