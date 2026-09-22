using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Domain.Enums;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class ContentDocumentRepository : Repository<ContentDocument>, IContentDocumentRepository
{
    public ContentDocumentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<ContentDocument>> GetPagedAsync(
        ContentDocumentType? type,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().AsQueryable();

        if (type.HasValue)
            query = query.Where(x => x.Type == type.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.Title)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ContentDocument>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<bool> SlugExistsAsync(
        ContentDocumentType type,
        string slug,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(x => x.Type == type && x.Slug == slug);
        if (excludeId.HasValue)
            query = query.Where(x => x.Id != excludeId.Value);

        return await query.AnyAsync(cancellationToken);
    }
}
