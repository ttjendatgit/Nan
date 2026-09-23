using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Common;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class MediaAssetRepository : Repository<MediaAsset>, IMediaAssetRepository
{
    public MediaAssetRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<MediaAsset>> GetPagedAsync(
        string? search,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.OriginalName.ToLower().Contains(term) || x.FileName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<MediaAsset>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
