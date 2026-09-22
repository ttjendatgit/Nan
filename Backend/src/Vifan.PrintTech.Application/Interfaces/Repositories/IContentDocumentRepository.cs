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
}
