using Microsoft.EntityFrameworkCore;
using Vifan.PrintTech.Application.Interfaces.Repositories;
using Vifan.PrintTech.Domain.Entities;
using Vifan.PrintTech.Infrastructure.Data;

namespace Vifan.PrintTech.Infrastructure.Repositories;

public class ProductOptionRepository : Repository<ProductOption>, IProductOptionRepository
{
    public ProductOptionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<ProductOption>> GetByProductIdAsync(
        Guid productId,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().Where(x => x.ProductId == productId);

        if (activeOnly)
            query = query.Where(x => x.IsActive);

        return await query
            .OrderBy(x => x.OptionType)
            .ThenBy(x => x.OptionName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductOption>> GetByIdsForProductAsync(
        Guid productId,
        IEnumerable<Guid> optionIds,
        bool activeOnly,
        CancellationToken cancellationToken = default)
    {
        var ids = optionIds.Distinct().ToList();
        if (ids.Count == 0)
            return [];

        var query = DbSet.Where(x => x.ProductId == productId && ids.Contains(x.Id));

        if (activeOnly)
            query = query.Where(x => x.IsActive);

        return await query.ToListAsync(cancellationToken);
    }
}
