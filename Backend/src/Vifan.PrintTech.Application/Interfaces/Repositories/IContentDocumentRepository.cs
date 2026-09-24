using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;

namespace Vifan.PrintTech.Application.Interfaces.Repositories;

public interface IContentDocumentRepository : IRepository<ContentDocument>
{
    Task<PagedResult<ContentDocument>> GetPagedAsync(
        ContentDocumentType? type,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>Slug uniqueness is scoped per Type (matches the (Type, Slug) unique index), not
    /// global -- a Page and a BlogPost may share a slug without colliding.</summary>
    Task<bool> SlugExistsAsync(
        ContentDocumentType type,
        string slug,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    /// <summary>The Published document with this exact (Type, Slug), or null -- Draft/Archived
    /// rows are never returned. Read-only (no tracking).</summary>
    Task<ContentDocument?> GetPublishedBySlugAsync(
        ContentDocumentType type,
        string slug,
        CancellationToken cancellationToken = default);

    /// <summary>Slug + UpdatedAt of every Published document of this Type, ordered by Slug.
    /// Unpaged on purpose (sitemap source -- must not silently drop documents); projects only
    /// those two columns, never block content.</summary>
    Task<IReadOnlyList<(string Slug, DateTime UpdatedAt)>> GetPublishedSummariesAsync(
        ContentDocumentType type,
        CancellationToken cancellationToken = default);
}
